import { redirect } from "next/navigation";
import { getAccount } from "@/lib/auth";
import { getProducts } from "@/lib/data";
import CheckoutForm from "@/components/checkout-form";
export const metadata = { title: "Checkout" };
export default async function Checkout() {
  const { user } = await getAccount();
  if (!user) redirect("/login?next=/checkout");
  return (
    <div className="container page-space">
      <p className="eyebrow">ONE LAST LITTLE STEP</p>
      <h1 className="page-title">Make it yours.</h1>
      <CheckoutForm products={await getProducts()} email={user.email} />
    </div>
  );
}
