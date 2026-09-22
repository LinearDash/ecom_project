// Parameterized SQL shared by the server and database integration tests.
// The database connection stays on the server; never import db.js into a Client Component.
export function createStore(query) {
  return {
    query,
    products: () =>
      query(
        "select * from public.products where active order by created_at,id",
      ),
    async product(id) {
      return (
        await query("select * from public.products where id=$1 and active", [
          id,
        ])
      )[0];
    },
    async account(tokenHash) {
      return (
        await query(
          "select id,email,role from public.users where id=public.session_user_id($1)",
          [tokenHash],
        )
      )[0];
    },
    async orders(tokenHash, ownOnly = false) {
      const rows = await query(
        `select o.*, coalesce((select jsonb_agg(i order by i.id) from public.order_items i where i.order_id=o.id),'[]'::jsonb) as order_items
        from public.visible_orders($1) o where (not $2::boolean or o.user_id=public.session_user_id($1)) order by o.created_at desc`,
        [tokenHash, ownOnly],
      );
      return rows.map((o) => ({ ...o, total: Number(o.total) }));
    },
    async placeOrder(tokenHash, items, name, requestId) {
      return (
        await query(
          "select public.place_order($1,$2::jsonb,$3,$4::uuid) as id",
          [tokenHash, JSON.stringify(items), name, requestId],
        )
      )[0].id;
    },
    async setStatus(tokenHash, id, status) {
      await query("select public.set_order_status($1,$2::uuid,$3)", [
        tokenHash,
        id,
        status,
      ]);
    },
    async saveProduct(tokenHash, p, id) {
      const values = [
        tokenHash,
        p.name,
        p.description,
        p.category,
        p.price,
        p.stock,
        p.image_url,
      ];
      const rows = id
        ? await query(
            `update public.products set name=$2,description=$3,category=$4,price=$5,stock=$6,image_url=$7
        where id=$8::uuid and active and public.is_admin($1) returning id`,
            [...values, id],
          )
        : await query(
            `insert into public.products(name,description,category,price,stock,image_url)
        select $2,$3,$4,$5,$6,$7 where public.is_admin($1) returning id`,
            values,
          );
      if (!rows.length)
        throw new Error("Product unavailable or admin access required.");
      return rows[0];
    },
    async archiveProduct(tokenHash, id) {
      const rows = await query(
        "update public.products set active=false where id=$2::uuid and public.is_admin($1) returning id",
        [tokenHash, id],
      );
      if (!rows.length)
        throw new Error("Product unavailable or admin access required.");
    },
  };
}
