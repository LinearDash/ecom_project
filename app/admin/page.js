import { getStore } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAccount, getSessionHash } from "@/lib/auth";
import AdminDashboard from "@/components/admin-dashboard";
export const metadata = { title: "Admin" };
export default async function Admin() {
  const { user, admin } = await getAccount();
  if (!user) redirect("/login?next=/admin");
  if (!admin)
    return (
      <div className="container empty page-space">
        <h1>Admin access required.</h1>
        <p>This account is a customer account.</p>
        <Link href="/" className="button">
          Return to the store
        </Link>
      </div>
    );
  const store = getStore();
  const [products, orders] = await Promise.all([
    store.products(),
    store.orders(await getSessionHash()),
  ]);
  return (
    <div className="container page-space">
      <p className="eyebrow">BEHIND THE COUNTER</p>
      <h1 className="page-title">A well-kept little shop.</h1>
      <AdminDashboard products={products} orders={orders} />
    </div>
  );
}
