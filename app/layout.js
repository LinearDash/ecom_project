import "./globals.css";
import Link from "next/link";
import { CartProvider } from "@/components/cart-provider";
import Header from "@/components/header";
import { getAccount, isConfigured } from "@/lib/auth";
export const metadata = {
  title: {
    default: "Paper & Pen — Little things, big ideas.",
    template: "%s | Paper & Pen",
  },
  description:
    "Thoughtfully chosen stationery for the note-takers, list-makers, and everyday creatives.",
};
export const dynamic = "force-dynamic";
export default async function RootLayout({ children }) {
  const { user, admin } = await getAccount();
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <a className="skip-link" href="#main">
            Skip to content
          </a>
          <Header user={Boolean(user)} admin={admin} />
          {!isConfigured() && (
            <div className="setup-notice">
              Store preview · Connect Neon to enable accounts and orders.{" "}
              <Link href="/setup">Setup guide →</Link>
            </div>
          )}
          <main id="main">{children}</main>
          <footer className="footer container">
            <div>
              <Link href="/" className="footer-brand">
                paper <i>&</i> pen
              </Link>
              <p>A little space for your next big idea.</p>
            </div>
            <div>
              <Link href="/#collection">Explore the collection ↗</Link>
              <span>
                Made for the everyday. © {new Date().getFullYear()} Paper & Pen.
              </span>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
