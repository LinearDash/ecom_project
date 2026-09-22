import { money } from "@/lib/catalog";
export default function OrderList({ orders, renderActions }) {
  return (
    <div className="orders-list">
      {orders.map((order) => (
        <article className="order-card" key={order.id}>
          <div className="order-heading">
            <div>
              <span className="eyebrow">
                ORDER #{order.id.slice(0, 8).toUpperCase()}
              </span>
              <p>
                {new Date(order.created_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  timeZone: "Asia/Kathmandu",
                })}
              </p>
            </div>
            <span className={`status ${order.status}`}>{order.status}</span>
          </div>
          {renderActions && (
            <p className="order-customer">
              {order.customer_name} · {order.email}
            </p>
          )}
          <div className="order-items">
            {order.order_items.map((item) => (
              <div key={item.id} className="summary-line">
                <span>
                  {item.product_name}{" "}
                  <span className="muted">× {item.quantity}</span>
                </span>
                <span>{money(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="order-bottom">
            <span>
              Total <strong>{money(order.total)}</strong>
            </span>
            {renderActions?.(order)}
          </div>
        </article>
      ))}
    </div>
  );
}
