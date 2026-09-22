import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { getProduct } from "@/lib/data";
import { money } from "@/lib/catalog";
import ProductImage from "@/components/product-image";
import AddToCart from "@/components/add-to-cart";
export default async function ProductPage({ params }) {
  const { id } = await params;
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  )
    notFound();
  const product = await getProduct(id);
  if (!product) notFound();
  return (
    <div className="container page-space">
      <Link className="back-link" href="/#collection">
        <ArrowLeft size={16} /> Back to the collection
      </Link>
      <div className="product-detail">
        <div className="detail-art">
          <ProductImage
            src={product.image_url}
            alt={product.name}
            width="600"
            height="600"
          />
        </div>
        <div className="detail-copy">
          <p className="eyebrow">{product.category}</p>
          <h1>{product.name}</h1>
          <p className="detail-price">{money(product.price)}</p>
          <p className="detail-description">{product.description}</p>
          <p className={`availability ${product.stock ? "" : "unavailable"}`}>
            <Check size={16} />
            {product.stock
              ? `${product.stock} in stock, ready for your desk`
              : "Currently out of stock"}
          </p>
          <AddToCart product={product} />
          <div className="detail-note">
            A small addition to your everyday ritual.
            <br />
            Prices in Nepalese rupees. Demo checkout, no payment required.
          </div>
        </div>
      </div>
    </div>
  );
}
