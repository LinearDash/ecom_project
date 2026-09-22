export default function CartLoading() {
  return (
    <div
      className="container page-space bag-loading"
      role="status"
      aria-label="Loading shopping bag"
    >
      <span className="sr-only">Loading your bag…</span>
      <div className="skeleton bag-loading-kicker" />
      <div className="skeleton bag-loading-title" />
      <div className="bag-loading-layout">
        <div className="bag-loading-items">
          {[1, 2, 3].map((item) => (
            <div className="bag-loading-item" key={item}>
              <div className="skeleton bag-loading-thumb" />
              <div className="bag-loading-item-copy">
                <div className="skeleton bag-loading-line" />
                <div className="skeleton bag-loading-line short" />
                <div className="skeleton bag-loading-remove" />
              </div>
              <div className="skeleton bag-loading-amount" />
            </div>
          ))}
        </div>
        <div className="skeleton bag-loading-summary" />
      </div>
    </div>
  );
}
