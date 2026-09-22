import { getStore } from "@/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAccount, getSessionHash } from "@/lib/auth";
import OrderList from "@/components/order-list";
export const metadata = { title: "My orders" };
export default async function Orders({ searchParams }) {
  const { user } = await getAccount();
  if (!user) redirect("/login?next=/orders");
  const orders = await getStore().orders(await getSessionHash(), true);
  const { placed } = await searchParams;
  return (
    <div className="container page-space narrow">
      <p className="eyebrow">YOUR PAPER TRAIL</p>
      <h1 className="page-title">My orders.</h1>
      {placed && orders.some((o) => o.id === placed) && (
        <div className="message success" role="status">
          <strong>Your order is placed. Thank you!</strong>
          <br />
          Your demo order is saved and stock has been updated. No payment was
          collected.
        </div>
      )}
      {orders.length ? (
        <OrderList orders={orders} />
      ) : (
        <div className="empty">
          <h2>Your story starts here.</h2>
          <p>You haven’t placed any orders yet.</p>
          <Link className="button" href="/#collection">
            Explore the collection
          </Link>
        </div>
      )}
    </div>
  );
}
