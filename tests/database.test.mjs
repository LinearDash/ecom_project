import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { createStore } from "../lib/store.js";
import { authenticateAccount } from "../lib/accounts.js";
import { hashToken, hashPassword, verifyPassword } from "../lib/passwords.js";
const db = new PGlite();
const store = createStore(
  async (text, values = []) => (await db.query(text, values)).rows,
);
const customer = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
const admin = "33333333-3333-4333-8333-333333333333";
const product = "00000000-0000-4000-8000-000000000001";
const second = "00000000-0000-4000-8000-000000000002";
const requestId = "44444444-4444-4444-8444-444444444444";
const token = "customer-session-hash",
  adminToken = "admin-session-hash",
  otherToken = "other-session-hash";
const order = (
  items = [{ id: product, quantity: 2 }],
  key = requestId,
  session = token,
) => store.placeOrder(session, items, "Test Customer", key);
async function scalar(sql, args = []) {
  return (await store.query(sql, args))[0];
}
before(async () => {
  await db.exec(
    await readFile(new URL("../database/schema.sql", import.meta.url), "utf8"),
  );
  await db.query(
    "insert into public.users(id,email,password_hash,role) values($1,'customer@example.com','test','customer'),($2,'other@example.com','test','customer'),($3,'admin@example.com','test','admin')",
    [customer, other, admin],
  );
});
beforeEach(async () => {
  await db.exec(
    "truncate public.order_items,public.orders,public.products,public.sessions,public.login_attempts cascade;",
  );
  await db.exec(
    await readFile(new URL("../database/seed.sql", import.meta.url), "utf8"),
  );
  await db.query(
    "insert into public.sessions(token_hash,user_id,expires_at) values($1,$2,now()+interval '1 day'),($3,$4,now()+interval '1 day'),($5,$6,now()+interval '1 day')",
    [token, customer, adminToken, admin, otherToken, other],
  );
});
after(() => db.close());
test("password hashes are salted, verify correctly and reject wrong passwords", async () => {
  const a = await hashPassword("GoodPassword123"),
    b = await hashPassword("GoodPassword123");
  assert.notEqual(a, b);
  assert.equal(await verifyPassword("GoodPassword123", a), true);
  assert.equal(await verifyPassword("wrong", a), false);
  assert.equal(await verifyPassword("wrong", "invalid"), false);
});
test("signup normalizes email, creates a customer, hashes password and stores only the token hash", async () => {
  const result = await authenticateAccount(store, {
    email: " New@Example.com ",
    password: "Password123",
    signup: true,
  });
  assert.ok(result.token);
  const user = await store.account(hashToken(result.token));
  assert.equal(user.email, "new@example.com");
  assert.equal(user.role, "customer");
  assert.equal(
    (
      await store.query("select * from public.sessions where token_hash=$1", [
        result.token,
      ])
    ).length,
    0,
  );
  const saved = await scalar(
    "select password_hash from public.users where id=$1",
    [user.id],
  );
  assert.notEqual(saved.password_hash, "Password123");
  const duplicate = await authenticateAccount(store, {
    email: "NEW@example.com",
    password: "Password123",
    signup: true,
  });
  assert.match(duplicate.error, /already exists/);
  const login = await authenticateAccount(store, {
    email: "new@example.com",
    password: "Password123",
    signup: false,
  });
  assert.ok(login.token);
  assert.notEqual(login.token, result.token);
  const bad = await authenticateAccount(store, {
    email: "new@example.com",
    password: "WrongPass123",
    signup: false,
  });
  assert.match(bad.error, /incorrect/);
});
test("invalid credentials and repeated login attempts are rejected", async () => {
  assert.match(
    (
      await authenticateAccount(store, {
        email: "invalid",
        password: "short",
        signup: true,
      })
    ).error,
    /valid email/,
  );
  for (let i = 0; i < 10; i++)
    assert.match(
      (
        await authenticateAccount(store, {
          email: "missing@example.com",
          password: "Password123",
          signup: false,
        })
      ).error,
      /incorrect/,
    );
  assert.match(
    (
      await authenticateAccount(store, {
        email: "missing@example.com",
        password: "Password123",
        signup: false,
      })
    ).error,
    /Too many attempts/,
  );
});
test("expired, revoked and forged sessions cannot load accounts or place orders", async () => {
  await store.query(
    "update public.sessions set expires_at=now()-interval '1 second' where token_hash=$1",
    [token],
  );
  assert.equal(await store.account(token), undefined);
  await assert.rejects(order(), /Sign in/);
  await store.query("delete from public.sessions where token_hash=$1", [
    otherToken,
  ]);
  assert.equal(await store.account(otherToken), undefined);
  assert.equal(await store.account("forged"), undefined);
  await assert.rejects(order(undefined, requestId, "forged"), /Sign in/);
});
test("places an order using database prices and reduces stock", async () => {
  const id = await order([{ id: product, quantity: 2, price: 1 }]);
  assert.equal(
    Number(
      (await scalar("select total from public.orders where id=$1", [id])).total,
    ),
    760,
  );
  assert.equal((await store.product(product)).stock, 22);
  assert.equal(
    (
      await scalar("select price from public.order_items where order_id=$1", [
        id,
      ])
    ).price,
    380,
  );
});
test("idempotent retries do not duplicate orders or stock changes", async () => {
  const id = await order();
  assert.equal(await order(), id);
  assert.equal((await store.orders(token)).length, 1);
  assert.equal((await store.product(product)).stock, 22);
});
test("insufficient stock rolls back the entire order and earlier deductions", async () => {
  await assert.rejects(
    order([
      { id: product, quantity: 2 },
      { id: second, quantity: 999 },
    ]),
    /Not enough stock/,
  );
  assert.equal((await store.product(product)).stock, 24);
  assert.equal((await store.orders(token)).length, 0);
});
test("a later buyer cannot buy stock already sold", async () => {
  await order([{ id: product, quantity: 24 }]);
  await assert.rejects(
    order([{ id: product, quantity: 1 }], requestId, otherToken),
    /Not enough stock/,
  );
});
test("rejects zero, negative, fractional and duplicate quantities", async () => {
  for (const quantity of [0, -1, 1.5, 1000])
    await assert.rejects(
      order([{ id: product, quantity }]),
      /Invalid product quantity/,
    );
  await assert.rejects(
    order([
      { id: product, quantity: 1 },
      { id: product, quantity: 1 },
    ]),
    /Duplicate products/,
  );
});
test("customer order reads are isolated; admins can see all orders or only their own", async () => {
  await order();
  const own = await store.orders(token, true);
  assert.equal(own.length, 1);
  assert.equal(own[0].order_items.length, 1);
  assert.equal(own[0].total, 760);
  assert.equal((await store.orders(otherToken)).length, 0);
  assert.equal((await store.orders(null)).length, 0);
  assert.equal((await store.orders(adminToken)).length, 1);
  assert.equal((await store.orders(adminToken, true)).length, 0);
});
test("customers cannot create/edit/archive products or change statuses", async () => {
  const id = await order(),
    p = await store.product(product);
  await assert.rejects(store.saveProduct(token, p), /admin access/);
  await assert.rejects(
    store.saveProduct(token, { ...p, stock: 100 }, product),
    /admin access/,
  );
  await assert.rejects(store.archiveProduct(token, product), /admin access/);
  await assert.rejects(store.setStatus(token, id, "completed"), /Admin access/);
  assert.equal((await store.product(product)).stock, 22);
});
test("admin can create, edit and archive products", async () => {
  const p = await store.product(product);
  const created = await store.saveProduct(adminToken, {
    ...p,
    name: "New notebook",
  });
  await store.saveProduct(adminToken, { ...p, stock: 3 }, created.id);
  assert.equal((await store.product(created.id)).stock, 3);
  await store.archiveProduct(adminToken, created.id);
  assert.equal(await store.product(created.id), undefined);
});
test("cancellation restores stock once and cannot be reopened", async () => {
  const id = await order();
  await store.setStatus(adminToken, id, "cancelled");
  await store.setStatus(adminToken, id, "cancelled");
  assert.equal((await store.product(product)).stock, 24);
  await assert.rejects(
    store.setStatus(adminToken, id, "completed"),
    /Only pending orders/,
  );
});
test("completed orders retain stock deduction and cannot be cancelled", async () => {
  const id = await order();
  await store.setStatus(adminToken, id, "completed");
  assert.equal((await store.product(product)).stock, 22);
  await assert.rejects(
    store.setStatus(adminToken, id, "cancelled"),
    /Only pending orders/,
  );
});
test("archiving preserves history and supports cancellation stock restoration", async () => {
  const id = await order();
  await store.archiveProduct(adminToken, product);
  await store.setStatus(adminToken, id, "cancelled");
  assert.equal(
    (await scalar("select stock from public.products where id=$1", [product]))
      .stock,
    24,
  );
  assert.equal(
    (await store.orders(token))[0].order_items[0].product_name,
    "The everyday notebook",
  );
  await assert.rejects(
    order(
      [{ id: product, quantity: 1 }],
      "55555555-5555-4555-8555-555555555555",
    ),
    /no longer available/,
  );
});
