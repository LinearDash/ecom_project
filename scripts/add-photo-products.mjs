import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";
try {
  const products = JSON.parse(
    await readFile(
      new URL("../database/photo-products.json", import.meta.url),
      "utf8",
    ),
  );
  for (const product of products) {
    const response = await fetch(product.image_url, {
      signal: AbortSignal.timeout(20000),
    });
    if (
      !response.ok ||
      !response.headers.get("content-type")?.startsWith("image/")
    )
      throw new Error("IMAGE_UNAVAILABLE");
    await response.arrayBuffer();
  }
  const sql = neon(process.env.DATABASE_URL);
  const results = await sql.transaction(
    products.map((p) =>
      sql.query(
        "insert into public.products(id,name,category,price,stock,description,image_url) values($1,$2,$3,$4,$5,$6,$7) on conflict(id) do nothing returning id",
        [
          p.id,
          p.name,
          p.category,
          p.price,
          p.stock,
          p.description,
          p.image_url,
        ],
      ),
    ),
  );
  console.log(
    JSON.stringify({
      imagesVerified: products.length,
      productsAdded: results.reduce((sum, r) => sum + r.length, 0),
    }),
  );
} catch (error) {
  console.error(
    "Could not add products:",
    error.code || "NETWORK_OR_IMAGE_ERROR",
  );
  process.exitCode = 1;
}
