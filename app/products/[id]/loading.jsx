export default function ProductLoading() {
  return (
    <div
      className="container product-loading page-space"
      role="status"
      aria-label="Loading product"
    >
      <span className="sr-only">Loading product details…</span>
      <div className="skeleton product-loading-back" />
      <div className="product-loading-layout">
        <div className="skeleton product-loading-image" />
        <div className="product-loading-copy">
          <div className="skeleton product-loading-category" />
          <div className="skeleton product-loading-title" />
          <div className="skeleton product-loading-title short" />
          <div className="skeleton product-loading-price" />
          <div className="skeleton product-loading-description" />
          <div className="skeleton product-loading-description short" />
          <div className="skeleton product-loading-stock" />
          <div className="product-loading-purchase">
            <div className="skeleton product-loading-quantity" />
            <div className="skeleton product-loading-button" />
          </div>
          <div className="skeleton product-loading-note" />
        </div>
      </div>
    </div>
  );
}
