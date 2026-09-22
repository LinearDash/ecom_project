export default function AdminLoading() {
  return (
    <div
      className="container page-space admin-loading"
      role="status"
      aria-label="Loading admin dashboard"
    >
      <span className="sr-only">Loading admin dashboard…</span>
      <div className="skeleton admin-loading-kicker" />
      <div className="skeleton admin-loading-title" />
      <div className="admin-loading-stats">
        {[1, 2, 3, 4].map((item) => (
          <div className="skeleton admin-loading-stat" key={item} />
        ))}
      </div>
      <div className="admin-loading-toolbar">
        <div className="skeleton admin-loading-tabs" />
        <div className="skeleton admin-loading-add" />
      </div>
      <div className="skeleton admin-loading-table" />
    </div>
  );
}
