"use client";
import { useState } from "react";
import { Plus, Check, ShoppingBag } from "lucide-react";
import { useCart } from "./cart-provider";
export default function AddToCart({ product, compact = false }) {
  const { items, add, ready } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const inBag = items.find((i) => i.id === product.id)?.quantity || 0;
  const remaining = Math.max(0, Math.min(product.stock, 999) - inBag);
  function handleAdd() {
    add(product.id, Math.min(quantity, remaining), product.stock);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }
  if (compact)
    return (
      <button
        className="quick-add"
        onClick={handleAdd}
        disabled={!ready || !remaining}
        aria-label={
          remaining
            ? `Add ${product.name} to bag`
            : `${product.name}: ${product.stock ? "maximum quantity in bag" : "out of stock"}`
        }
        title={
          remaining
            ? "Add to bag"
            : product.stock
              ? "All available stock is in your bag"
              : "Out of stock"
        }
      >
        {added ? <Check size={18} /> : <Plus size={18} />}
      </button>
    );
  return (
    <div className="purchase-controls">
      <label>
        Quantity
        <input
          type="number"
          min="1"
          max={Math.max(1, remaining)}
          value={quantity}
          disabled={!remaining}
          onChange={(e) =>
            setQuantity(
              Math.max(1, Math.min(Number(e.target.value) || 1, remaining)),
            )
          }
        />
      </label>
      <button
        className="button"
        disabled={!ready || !remaining}
        onClick={handleAdd}
      >
        {added ? <Check size={18} /> : <ShoppingBag size={18} />}{" "}
        {added
          ? "Added to bag"
          : !product.stock
            ? "Out of stock"
            : !remaining
              ? "All available stock in bag"
              : "Add to bag"}
      </button>
      <span aria-live="polite" className="sr-only">
        {added ? "Product added to your bag." : ""}
      </span>
    </div>
  );
}
