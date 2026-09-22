import { redirect } from "next/navigation";
import { getAccount, isConfigured } from "@/lib/auth";
import AuthForm from "@/components/auth-form";
export const metadata = { title: "Sign in" };
export default async function Login({ searchParams }) {
  const query = await searchParams;
  const next = ["/checkout", "/orders", "/admin"].includes(query.next)
    ? query.next
    : "/";
  const { user } = await getAccount();
  if (user) redirect(next);
  return (
    <div className="container auth-layout">
      <div className="auth-story">
        <p className="eyebrow">A SPACE FOR YOUR EVERYDAY</p>
        <h1>
          Good things
          <br />
          start with
          <br />
          <em>a fresh page.</em>
        </h1>
        <p>
          Sign in to keep track of your orders
          <br />
          and bring a little joy to your desk.
        </p>
        <img
          src="/products/pocket.svg"
          alt="Three colorful pocket notebooks"
          width="320"
          height="260"
        />
      </div>
      <AuthForm next={next} configured={isConfigured()} />
    </div>
  );
}
