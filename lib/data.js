import "server-only";
import { getStore, isConfigured } from "./db";
import { demoProducts } from "./catalog";
export async function getProducts() {
  return isConfigured() ? getStore().products() : demoProducts;
}
export async function getProduct(id) {
  return isConfigured()
    ? getStore().product(id)
    : demoProducts.find((p) => p.id === id);
}
