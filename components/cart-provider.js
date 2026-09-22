"use client";
import { createContext, useContext, useEffect, useState } from "react";
const CartContext = createContext(null);
const KEY = "paper-pen-bag-v1";
export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);
  // Read browser storage only after hydration, keeping server and first client render identical.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(KEY) || "[]");
      if (Array.isArray(stored))
        setItems(
          stored
            .filter(
              (i) =>
                typeof i.id === "string" &&
                Number.isInteger(i.quantity) &&
                i.quantity > 0 &&
                i.quantity <= 999,
            )
            .map(({ id, quantity }) => ({ id, quantity }))
            .slice(0, 100),
        );
    } catch {
      /* An invalid saved bag starts empty. */
    }
    setReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem(KEY, JSON.stringify(items));
      } catch {
        /* Bag still works when storage is disabled. */
      }
    }
  }, [items, ready]);
  function add(id, quantity, stock) {
    setItems((current) => {
      const existing = current.find((i) => i.id === id);
      return existing
        ? current.map((i) =>
            i.id === id
              ? { ...i, quantity: Math.min(i.quantity + quantity, stock, 999) }
              : i,
          )
        : [...current, { id, quantity: Math.min(quantity, stock, 999) }];
    });
  }
  function update(id, quantity) {
    setItems((current) =>
      quantity <= 0
        ? current.filter((i) => i.id !== id)
        : current.map((i) => (i.id === id ? { ...i, quantity } : i)),
    );
  }
  return (
    <CartContext.Provider
      value={{
        items,
        ready,
        add,
        update,
        clear: () => setItems([]),
        count: items.reduce((sum, i) => sum + i.quantity, 0),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
export const useCart = () => useContext(CartContext);
