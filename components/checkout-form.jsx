"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "./cart-provider";
import { money } from "@/lib/catalog";
import { placeOrder } from "@/app/actions";
import { ArrowRight } from "lucide-react";
export default function CheckoutForm({ products, email }) {
  const { items, ready, clear } = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const request = useRef(null);
  const router = useRouter();
  if (!ready) return <p role="status">Opening your bag…</p>;
  if (!items.length)
    return (
      <div className="empty">
        <h2>Your bag is empty.</h2>
        <Link className="button" href="/#collection">
          Explore the collection
        </Link>
      </div>
    );
  const total = items.reduce(
    (sum, i) =>
      sum + (products.find((p) => p.id === i.id)?.price || 0) * i.quantity,
    0,
  );
  const invalid = items.some(
    (i) => !products.some((p) => p.id === i.id && p.stock >= i.quantity),
  );
  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const name = new FormData(e.currentTarget).get("name");
    const fingerprint = JSON.stringify(items);
    if (request.current?.fingerprint !== fingerprint)
      request.current = { fingerprint, id: crypto.randomUUID() };
    try {
      const result = await placeOrder({
        items,
        name,
        requestId: request.current.id,
      });
      if (result.error) {
        setError(result.error);
        router.refresh();
        setBusy(false);
        return;
      }
      clear();
      router.push(`/orders?placed=${result.id}`);
      router.refresh();
    } catch {
      setError(
        "Could not confirm your order. Try again; this checkout reference prevents duplicates.",
      );
      setBusy(false);
    }
  }
  return (
    <div className="cart-layout">
      <form onSubmit={submit} className="checkout-card form-stack">
        <p className="eyebrow">JUST A FEW DETAILS</p>
        <h2>Who’s this little parcel for?</h2>
        <label>
          Full name
          <input
            name="name"
            autoComplete="name"
            placeholder="Your full name"
            minLength="2"
            maxLength="100"
            required
          />
        </label>
        <label>
          Account email
          <input value={email} readOnly type="email" />
        </label>
        <p className="message">
          This is a demo checkout. No payment is collected and no products will
          be shipped.
        </p>
        {invalid && (
          <p className="message error">
            Your bag has unavailable items.{" "}
            <Link href="/cart">Update your bag</Link> before placing an order.
          </p>
        )}
        {error && (
          <p role="alert" className="message error">
            {error}
          </p>
        )}
        <button className="button" disabled={busy || invalid}>
          {busy ? "Placing your order…" : "Place demo order"}
          <ArrowRight size={16} />
        </button>
      </form>
      <aside className="summary">
        <h2>Your order</h2>
        {items.map((i) => {
          const p = products.find((p) => p.id === i.id);
          return (
            <div className="summary-line" key={i.id}>
              <span>
                {p?.name || "Unavailable product"} × {i.quantity}
              </span>
              <span>{money((p?.price || 0) * i.quantity)}</span>
            </div>
          );
        })}
        <div className="summary-total">
          <span>Total</span>
          <strong>{money(total)}</strong>
        </div>
        <p className="fine-print">
          Prices in NPR. No delivery fees or taxes.
          <br />
          Availability and prices are checked when you place the order.
        </p>
        <Link className="back-link" href="/cart">
          ← Edit your bag
        </Link>
      </aside>
    </div>
  );
}
