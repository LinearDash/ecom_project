import Link from "next/link";
import { ArrowRight, PenLine } from "lucide-react";
import Catalog from "@/components/catalog";
import { getProducts } from "@/lib/data";
export default async function Home() {
  const products = await getProducts();
  return (
    <>
      <section className="hero container">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="tiny-line" /> FOR THE LOVE OF PUTTING PEN TO PAPER
          </p>
          <h1>
            Little things.
            <br />
            <em>Big ideas.</em>
          </h1>
          <p className="hero-description">
            A fresh page. A favorite pen. A moment to yourself.
            <br className="desktop-break" /> Find everyday stationery that makes
            it all feel a little better.
          </p>
          <Link href="#collection" className="button">
            Find your everyday essentials <ArrowRight size={17} />
          </Link>
        </div>
        <div className="hero-art">
          <img
            src="/hero.svg"
            alt="A forest green notebook, brass pen, pencil, and a small handwritten note arranged on a cream desk"
            width="760"
            height="650"
            fetchPriority="high"
          />
          <span className="hero-art-caption">
            THE EVERYDAY EDIT — PAPER & PEN
          </span>
          <span className="round-label">
            a fresh
            <br />
            <em>start.</em>
            <span>✳</span>
          </span>
        </div>
      </section>
      <Catalog products={products} />
      <section className="closing-note container">
        <span className="eyebrow">LESS SCROLLING. MORE SCRIBBLING.</span>
        <h2>
          Your next idea starts
          <br />
          with a blank page.
        </h2>
        <Link href="/#collection">
          Make room for it <ArrowRight size={17} />
        </Link>
        <PenLine className="closing-pen" strokeWidth={0.6} />
      </section>
    </>
  );
}
