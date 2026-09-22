"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { categories, money } from "@/lib/catalog";
import { saveProduct, deleteProduct, updateOrderStatus } from "@/app/actions";
import ProductImage from "./product-image";
import OrderList from "./order-list";
export default function AdminDashboard({ products, orders }) {
  const [tab, setTab] = useState("products");
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const router = useRouter();
  async function run(action, success) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await action();
      if (result.error) {
        setError(result.error);
        return false;
      }
      setNotice(success);
      router.refresh();
      return true;
    } catch {
      setError("Could not save your change. Please try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function submit(e) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    if (await run(() => saveProduct(data), "Product saved.")) setEditing(null);
  }
  return (
    <>
      <div className="stat-grid">
        <div>
          <span>Active products</span>
          <strong>{products.length}</strong>
        </div>
        <div>
          <span>Units in stock</span>
          <strong>{products.reduce((s, p) => s + p.stock, 0)}</strong>
        </div>
        <div>
          <span>Pending orders</span>
          <strong>{orders.filter((o) => o.status === "pending").length}</strong>
        </div>
        <div>
          <span>Completed sales · demo</span>
          <strong>
            {money(
              orders
                .filter((o) => o.status === "completed")
                .reduce((s, o) => s + o.total, 0),
            )}
          </strong>
        </div>
      </div>
      <div className="admin-toolbar">
        <div className="categories">
          <button
            className={tab === "products" ? "selected" : ""}
            aria-pressed={tab === "products"}
            onClick={() => {
              setTab("products");
              setEditing(null);
            }}
          >
            Products & inventory
          </button>
          <button
            className={tab === "orders" ? "selected" : ""}
            aria-pressed={tab === "orders"}
            onClick={() => {
              setTab("orders");
              setEditing(null);
            }}
          >
            Orders ({orders.length})
          </button>
        </div>
        {tab === "products" && (
          <button
            className="button small"
            onClick={() => {
              setEditing({});
              setError("");
            }}
          >
            <Plus size={16} /> Add product
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="message error">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="message success">
          {notice}
        </p>
      )}
      {editing && (
        <section className="editor" aria-labelledby="editor-title">
          <div className="section-heading">
            <h2 id="editor-title">
              {editing.id ? "Edit product" : "A new little essential."}
            </h2>
            <button
              className="icon-button"
              aria-label="Close product form"
              onClick={() => setEditing(null)}
              disabled={busy}
            >
              <X />
            </button>
          </div>
          <form
            onSubmit={submit}
            className="form-stack"
            key={editing.id || "new"}
          >
            <input type="hidden" name="id" value={editing.id || ""} />
            <div className="form-grid">
              <label>
                Product name
                <input
                  name="name"
                  defaultValue={editing.name}
                  required
                  maxLength="100"
                />
              </label>
              <label>
                Category
                <select
                  name="category"
                  defaultValue={editing.category || categories[0]}
                >
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label>
                Price (whole NPR)
                <input
                  name="price"
                  type="number"
                  min="1"
                  max="1000000"
                  step="1"
                  defaultValue={editing.price}
                  required
                />
              </label>
              <label>
                Stock quantity
                <input
                  name="stock"
                  type="number"
                  min="0"
                  max="1000000"
                  step="1"
                  defaultValue={editing.stock ?? 0}
                  required
                />
              </label>
            </div>
            <label>
              Image URL
              <input
                name="image_url"
                defaultValue={editing.image_url || "/products/notebook.svg"}
                required
                placeholder="https://…"
              />
            </label>
            <label>
              Description
              <textarea
                name="description"
                defaultValue={editing.description}
                required
                maxLength="2000"
                rows="3"
              />
            </label>
            <button className="button" disabled={busy}>
              {busy ? "Saving…" : "Save product"}
            </button>
          </form>
        </section>
      )}
      {tab === "products" ? (
        <div className="table-scroll">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="table-product">
                      <ProductImage
                        src={p.image_url}
                        alt=""
                        width="48"
                        height="48"
                      />
                      <strong>{p.name}</strong>
                    </div>
                  </td>
                  <td>{p.category}</td>
                  <td>{money(p.price)}</td>
                  <td>
                    <span
                      className={`stock-number ${p.stock === 0 ? "out" : p.stock <= 5 ? "low" : ""}`}
                    >
                      {p.stock}
                      {p.stock === 0
                        ? " · Out of stock"
                        : p.stock <= 5
                          ? " · Low stock"
                          : ""}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        disabled={busy}
                        className="icon-button"
                        aria-label={`Edit ${p.name}`}
                        onClick={() => {
                          setEditing(p);
                          setError("");
                          window.scrollTo({ top: 250, behavior: "smooth" });
                        }}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        disabled={busy}
                        className="icon-button danger"
                        aria-label={`Delete ${p.name}`}
                        onClick={() => {
                          if (
                            window.confirm(
                              `Remove “${p.name}” from the store? Past orders will be preserved.`,
                            )
                          )
                            run(
                              () => deleteProduct(p.id),
                              "Product removed from the store.",
                            );
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!products.length && (
            <p className="empty">
              Add your first product to open the collection.
            </p>
          )}
        </div>
      ) : orders.length ? (
        <OrderList
          orders={orders}
          renderActions={(order) =>
            order.status === "pending" ? (
              <div className="row-actions">
                <button
                  className="button small secondary"
                  disabled={busy}
                  onClick={() =>
                    run(
                      () => updateOrderStatus(order.id, "completed"),
                      "Order marked completed.",
                    )
                  }
                >
                  Complete
                </button>
                <button
                  className="text-button danger"
                  disabled={busy}
                  onClick={() => {
                    if (
                      window.confirm("Cancel this order and restore its stock?")
                    )
                      run(
                        () => updateOrderStatus(order.id, "cancelled"),
                        "Order cancelled and stock restored.",
                      );
                  }}
                >
                  Cancel order
                </button>
              </div>
            ) : null
          }
        />
      ) : (
        <div className="empty">
          <h2>No orders yet.</h2>
          <p>Customer orders will appear here.</p>
        </div>
      )}
    </>
  );
}
