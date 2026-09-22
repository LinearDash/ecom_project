"use client";
import Link from "next/link";
import { useCart } from "./cart-provider";
import { money } from "@/lib/catalog";
import ProductImage from "./product-image";
import { ArrowRight, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
export default function CartPage({ products }) {
  const { items, ready, update } = useCart();
  if (!ready) return <p role="status">Opening your bag…</p>;
  if (!items.length)
    return (
      <div className="empty">
        <ShoppingBag size={38} strokeWidth={1} />
        <h2>A little room for inspiration.</h2>
        <p>Your bag is empty. Let’s find something for your desk.</p>
        <Link className="button" href="/#collection">
          Explore the collection <ArrowRight size={16} />
        </Link>
      </div>
    );
  const total = items.reduce(
    (sum, i) =>
      sum + (products.find((p) => p.id === i.id)?.price || 0) * i.quantity,
    0,
  );
  const invalid = items.some((i) => {
    const p = products.find((p) => p.id === i.id);
    return !p || i.quantity > p.stock;
  });
  return (
    <div className="cart-layout">
      <div className="cart-items">
        {items.map((i) => {
          const p = products.find((p) => p.id === i.id);
          return (
            <article className="cart-item" key={i.id}>
              {p && (
                <Link href={`/products/${p.id}`}>
                  <ProductImage
                    src={p.image_url}
                    alt={p.name}
                    width="120"
                    height="120"
                  />
                </Link>
              )}
              <div className="cart-item-info">
                <span className="eyebrow">{p?.category || "UNAVAILABLE"}</span>
                <h3>
                  {p ? (
                    <Link href={`/products/${p.id}`}>{p.name}</Link>
                  ) : (
                    "This product is no longer available"
                  )}
                </h3>
                <p>{p && money(p.price)}</p>
                {p && i.quantity > p.stock && (
                  <p className="error-text">
                    Only {p.stock} available. Reduce the quantity or remove this
                    item.
                  </p>
                )}
                <button
                  className="remove-button"
                  onClick={() => update(i.id, 0)}
                >
                  <Trash2 size={13} /> Remove
                </button>
              </div>
              <div className="cart-item-side">
                {p && (
                  <>
                    <strong>{money(p.price * i.quantity)}</strong>
                    <div className="quantity-control">
                      <button
                        aria-label={`Decrease ${p.name} quantity`}
                        onClick={() => update(i.id, i.quantity - 1)}
                      >
                        <Minus size={14} />
                      </button>
                      <span aria-label="Quantity">{i.quantity}</span>
                      <button
                        aria-label={`Increase ${p.name} quantity`}
                        disabled={i.quantity >= Math.min(p.stock, 999)}
                        onClick={() => update(i.id, i.quantity + 1)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>
      <aside className="summary">
        <p className="eyebrow">THE GOOD THINGS ADD UP</p>
        <h2>Your bag, summed up.</h2>
        <div className="summary-line">
          <span>Subtotal</span>
          <span>{money(total)}</span>
        </div>
        <div className="summary-line">
          <span>Delivery & taxes</span>
          <span>Not applicable</span>
        </div>
        <div className="summary-total">
          <span>Total</span>
          <strong>{money(total)}</strong>
        </div>
        {invalid ? (
          <p className="message error" role="alert">
            Update unavailable items before checking out.
          </p>
        ) : (
          <Link className="button full" href="/checkout">
            Continue to checkout <ArrowRight size={16} />
          </Link>
        )}
        <p className="fine-print">
          You’ll sign in before placing your order.
          <br />
          Demo store · No payment collected.
        </p>
      </aside>
    </div>
  );
}
