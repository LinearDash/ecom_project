import { getProducts } from "@/lib/data";
import CartPage from "@/components/cart-page";
export const metadata = { title: "Your bag" };
export default async function Cart() {
  return (
    <div className="container page-space">
      <p className="eyebrow">YOUR EVERYDAY ESSENTIALS</p>
      <h1 className="page-title">A bag of good things.</h1>
      <CartPage products={await getProducts()} />
    </div>
  );
}
