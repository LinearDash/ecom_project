import { test, expect } from "@playwright/test";
import { neon } from "@neondatabase/serverless";
import { randomUUID, randomBytes } from "node:crypto";

test("live Neon signup, login, admin products, checkout, history and cancellation", async ({
  browser,
}) => {
  test.skip(
    !process.env.DATABASE_URL,
    "A configured Neon project is required.",
  );
  const sql = neon(process.env.DATABASE_URL);
  const suffix = randomUUID();
  const customerEmail = `paperpen-customer-${suffix}@example.com`;
  const adminEmail = `paperpen-admin-${suffix}@example.com`;
  const password = randomBytes(24).toString("hex");
  const productName = `Connection check ${suffix}`;
  const customerContext = await browser.newContext();
  const adminContext = await browser.newContext();
  const customer = await customerContext.newPage();
  const admin = await adminContext.newPage();
  const origin = "http://127.0.0.1:3000";
  async function signup(page, email) {
    await page.goto(`${origin}/login`);
    await page
      .getByRole("button", { name: "Create account", exact: true })
      .first()
      .click();
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page
      .locator("form")
      .getByRole("button", { name: "Create account", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Sign out", exact: true }),
    ).toBeVisible({ timeout: 20000 });
  }
  try {
    await signup(customer, customerEmail);
    await signup(admin, adminEmail);
    await sql.query("update public.users set role='admin' where email=$1", [
      adminEmail,
    ]);
    await admin.goto(`${origin}/admin`);
    await expect(
      admin.getByRole("heading", { name: "A well-kept little shop." }),
    ).toBeVisible();
    await admin
      .getByRole("button", { name: "Add product", exact: true })
      .click();
    await admin.getByLabel("Product name", { exact: true }).fill(productName);
    await admin.getByLabel("Price (whole NPR)", { exact: true }).fill("123");
    await admin.getByLabel("Stock quantity", { exact: true }).fill("5");
    await admin
      .getByLabel("Description", { exact: true })
      .fill("Temporary connection verification product.");
    await admin
      .getByRole("button", { name: "Save product", exact: true })
      .click();
    await expect(
      admin.getByText("Product saved.", { exact: true }),
    ).toBeVisible({ timeout: 15000 });
    const [product] = await sql.query(
      "select id,stock from public.products where name=$1",
      [productName],
    );
    expect(product.stock).toBe(5);
    await customer.goto(`${origin}/products/${product.id}`);
    await customer.getByRole("spinbutton", { name: "Quantity" }).fill("2");
    await customer
      .getByRole("button", { name: "Add to bag", exact: true })
      .click();
    await customer.getByRole("link", { name: "Shopping bag, 2 items" }).click();
    await customer.getByRole("link", { name: "Continue to checkout" }).click();
    await customer
      .getByLabel("Full name", { exact: true })
      .fill("Connection Test");
    await customer.getByRole("button", { name: "Place demo order" }).click();
    await expect(
      customer.getByText("Your order is placed. Thank you!", { exact: true }),
    ).toBeVisible({ timeout: 20000 });
    await expect(customer.locator(".order-card")).toHaveCount(1);
    const [order] = await sql.query(
      "select o.id,o.total from public.orders o join public.users u on u.id=o.user_id where u.email=$1",
      [customerEmail],
    );
    expect(Number(order.total)).toBe(246);
    expect(
      (
        await sql.query("select stock from public.products where id=$1", [
          product.id,
        ])
      )[0].stock,
    ).toBe(3);
    await admin.reload();
    await admin.getByRole("button", { name: /^Orders \(/ }).click();
    admin.on("dialog", (dialog) => dialog.accept());
    const orderCard = admin
      .locator(".order-card")
      .filter({ hasText: customerEmail });
    await orderCard
      .getByRole("button", { name: "Cancel order", exact: true })
      .click();
    await expect(orderCard.locator(".status")).toHaveText("cancelled", {
      timeout: 15000,
    });
    expect(
      (
        await sql.query("select stock from public.products where id=$1", [
          product.id,
        ])
      )[0].stock,
    ).toBe(5);
    await customer.reload();
    await expect(customer.locator(".status")).toHaveText("cancelled");
    await customer
      .getByRole("button", { name: "Sign out", exact: true })
      .click();
    await customer.goto(`${origin}/orders`);
    await expect(customer).toHaveURL(/\/login\?next=\/orders/);
    await customer.getByLabel("Email address").fill(customerEmail);
    await customer.getByLabel("Password", { exact: true }).fill(password);
    await customer
      .locator("form")
      .getByRole("button", { name: "Sign in", exact: true })
      .click();
    await expect(
      customer.getByRole("heading", { name: "My orders." }),
    ).toBeVisible({ timeout: 15000 });
  } finally {
    await customerContext.close();
    await adminContext.close();
    // Delete only records created by this unique test run; real store data is preserved.
    await sql.transaction([
      sql.query(
        "delete from public.orders where user_id in (select id from public.users where email=any($1::text[]))",
        [[customerEmail, adminEmail]],
      ),
      sql.query("delete from public.products where name=$1", [productName]),
      sql.query("delete from public.users where email=any($1::text[])", [
        [customerEmail, adminEmail],
      ]),
      sql.query(
        "delete from public.login_attempts where email=any($1::text[])",
        [[customerEmail, adminEmail]],
      ),
    ]);
  }
});
