"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, ArrowUpRight, PenLine } from "lucide-react";
import { useCart } from "./cart-provider";
import { signOut } from "@/app/actions";
export default function Header({ user, admin }) {
  const { count } = useCart();
  const path = usePathname();
  return (
    <>
      <div className="announcement">
        A little stationery. A lot of possibility.{" "}
        <span>Thoughtfully picked, for your everyday.</span>
      </div>
      <header className="header">
        <div className="header-inner">
          <Link href="/" className="brand" aria-label="Paper and Pen home">
            <PenLine size={28} strokeWidth={1.3} />
            <span>
              paper <i>&</i> pen
              <span className="brand-caption">
                THE EVERYDAY STATIONERY STORE
              </span>
            </span>
          </Link>
          <nav aria-label="Main navigation">
            <Link href="/#collection" className={path === "/" ? "active" : ""}>
              The collection
            </Link>
            {user && (
              <Link
                href="/orders"
                className={path === "/orders" ? "active" : ""}
              >
                My orders
              </Link>
            )}
            {admin && (
              <Link href="/admin" className={path === "/admin" ? "active" : ""}>
                Admin
              </Link>
            )}
          </nav>
          <div className="header-actions">
            {user ? (
              <form action={signOut}>
                <button className="text-button">Sign out</button>
              </form>
            ) : (
              <Link href="/login" className="login-link">
                Sign in <ArrowUpRight size={14} />
              </Link>
            )}
            <Link
              href="/cart"
              className="bag-link"
              aria-label={`Shopping bag, ${count} items`}
            >
              <ShoppingBag size={19} />
              <span className="bag-label">Bag</span>
              <span className="bag-count">{count}</span>
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
