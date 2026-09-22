"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ArrowUpRight, SlidersHorizontal } from "lucide-react";
import { categories, money } from "@/lib/catalog";
import ProductImage from "./product-image";
import AddToCart from "./add-to-cart";
export default function Catalog({ products }) {
  const [category, setCategory] = useState("All essentials");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("featured");
  const visible = useMemo(() => {
    const result = products.filter(
      (p) =>
        (category === "All essentials" || p.category === category) &&
        p.name.toLowerCase().includes(query.trim().toLowerCase()),
    );
    if (sort === "low") result.sort((a, b) => a.price - b.price);
    if (sort === "high") result.sort((a, b) => b.price - a.price);
    if (sort === "name") result.sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [products, category, query, sort]);
  return (
    <section id="collection" className="collection container">
      <div className="section-heading">
        <div>
          <p className="eyebrow">GOOD TOOLS. FRESH IDEAS.</p>
          <h2>
            Your desk deserves
            <br className="mobile-break" /> a little love.
          </h2>
        </div>
        <p>
          For the note-takers, list-makers,
          <br />
          and just-one-more-notebook people.
        </p>
      </div>
      <div className="catalog-controls">
        <div className="categories" aria-label="Product categories">
          {["All essentials", ...categories].map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={category === c ? "selected" : ""}
              aria-pressed={category === c}
            >
              {c}
            </button>
          ))}
        </div>
        <label className="search">
          <Search size={17} />
          <input
            aria-label="Search products"
            placeholder="Find your next favorite…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      <div className="result-row">
        <span aria-live="polite">
          {visible.length} little{" "}
          {visible.length === 1 ? "essential" : "essentials"}
        </span>
        <label className="sort">
          <SlidersHorizontal size={14} />
          <span className="sr-only">Sort products</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="featured">Featured</option>
            <option value="name">Name: A to Z</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
          </select>
        </label>
      </div>
      <div className="product-grid">
        {visible.map((p) => (
          <article className="product-card" key={p.id}>
            <div className="product-art">
              <Link href={`/products/${p.id}`} aria-label={`View ${p.name}`}>
                <ProductImage
                  src={p.image_url}
                  alt={p.name}
                  loading="lazy"
                  width="600"
                  height="600"
                />
              </Link>
              {!p.stock && <span className="stock-tag">Out of stock</span>}
              <AddToCart product={p} compact />
            </div>
            <p className="product-category">{p.category}</p>
            <Link href={`/products/${p.id}`} className="product-name">
              {p.name}
              <ArrowUpRight size={15} />
            </Link>
            <p className="product-price">{money(p.price)}</p>
          </article>
        ))}
      </div>
      {!visible.length && (
        <div className="empty">
          <h3>No matches, just yet.</h3>
          <p>Try a different name or explore another category.</p>
          <button
            className="button secondary"
            onClick={() => {
              setQuery("");
              setCategory("All essentials");
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </section>
  );
}
