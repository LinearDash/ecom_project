import Link from "next/link";
export default function NotFound() {
  return (
    <div className="container empty page-space">
      <p className="eyebrow">A PAGE OUT OF PLACE</p>
      <h1>Nothing on this page.</h1>
      <p>This product or page may no longer be available.</p>
      <Link href="/#collection" className="button">
        Back to the collection
      </Link>
    </div>
  );
}
