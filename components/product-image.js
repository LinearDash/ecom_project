"use client";
import { useState } from "react";
export default function ProductImage({ src, alt, ...props }) {
  const [failed, setFailed] = useState(false);
  return (
    <img
      {...props}
      src={failed ? "/products/notebook.svg" : src}
      alt={alt}
      onError={() => setFailed(true)}
    />
  );
}
