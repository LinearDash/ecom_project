export default function OrdersLoading() {
  return (
    <div
      className="container page-space narrow orders-loading"
      role="status"
      aria-label="Loading orders"
    >
      <span className="sr-only">Loading your orders…</span>
      <div className="skeleton orders-loading-kicker" />
      <div className="skeleton orders-loading-title" />
      <div className="orders-loading-list">
        {[1, 2].map((item) => (
          <div className="orders-loading-card" key={item}>
            <div className="orders-loading-heading">
              <div className="skeleton orders-loading-id" />
              <div className="skeleton orders-loading-status" />
            </div>
            <div className="skeleton orders-loading-date" />
            <div className="skeleton orders-loading-order-line" />
            <div className="skeleton orders-loading-order-line short" />
            <div className="orders-loading-total">
              <div className="skeleton orders-loading-total-line" />
              <div className="skeleton orders-loading-total-price" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
