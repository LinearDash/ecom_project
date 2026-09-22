export default function Loading() {
  return (
    <div className="loading-shell container" role="status" aria-label="Loading">
      <span className="sr-only">Loading products…</span>
      <div className="loading-hero">
        <div className="loading-copy">
          <div className="skeleton skeleton-kicker" />
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-title short" />
          <div className="skeleton skeleton-text" />
          <div className="skeleton skeleton-text narrow" />
          <div className="skeleton skeleton-button" />
        </div>
        <div className="skeleton loading-art" />
      </div>
      <div className="loading-collection">
        <div className="skeleton skeleton-kicker" />
        <div className="skeleton skeleton-section-title" />
        <div className="loading-grid">
          {[1, 2, 3, 4].map((item) => (
            <div className="loading-card" key={item}>
              <div className="skeleton loading-product-art" />
              <div className="skeleton loading-product-line" />
              <div className="skeleton loading-price" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
