"use server";
import {
  getAccount,
  getSessionHash,
  startSession,
  endSession,
} from "@/lib/auth";
import { getStore, isConfigured } from "@/lib/db";
import { authenticateAccount } from "@/lib/accounts";
import { categories } from "@/lib/catalog";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

function actionError(error) {
  if (error.code === "P0001") return { error: error.message };
  return {
    error:
      "Could not complete the request. Check your Neon connection and database setup, then try again.",
  };
}
export async function authenticate(formData) {
  if (!isConfigured())
    return { error: "Connect Neon first. See the setup guide." };
  try {
    const result = await authenticateAccount(getStore(), {
      email: formData.get("email"),
      password: formData.get("password"),
      signup: formData.get("mode") === "signup",
    });
    if (result.error) return result;
    await startSession(result.token);
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    return actionError(error);
  }
}
export async function signOut() {
  await endSession();
  revalidatePath("/", "layout");
  redirect("/");
}
export async function placeOrder({ items, name, requestId }) {
  try {
    const { user } = await getAccount();
    if (!user) return { error: "Please sign in before placing an order." };
    if (typeof name !== "string" || name.trim().length < 2 || name.length > 100)
      return { error: "Enter your full name (2–100 characters)." };
    if (
      !Array.isArray(items) ||
      !items.length ||
      items.length > 100 ||
      items.some(
        (i) =>
          !i ||
          !Number.isInteger(i.quantity) ||
          i.quantity < 1 ||
          i.quantity > 999,
      )
    )
      return { error: "Check the quantities in your bag." };
    const id = await getStore().placeOrder(
      await getSessionHash(),
      items,
      name.trim(),
      requestId,
    );
    revalidatePath("/", "layout");
    return { id };
  } catch (error) {
    return actionError(error);
  }
}
async function requireAdmin() {
  const { user, admin } = await getAccount();
  if (!user || !admin) throw new Error("Admin access required.");
  return getStore();
}
export async function saveProduct(formData) {
  try {
    const client = await requireAdmin();
    const product = {
      name: String(formData.get("name") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      category: String(formData.get("category") || ""),
      price: Number(formData.get("price")),
      stock: Number(formData.get("stock")),
      image_url: String(formData.get("image_url") || "").trim(),
    };
    if (
      !product.name ||
      product.name.length > 100 ||
      !product.description ||
      product.description.length > 2000 ||
      !categories.includes(product.category) ||
      !Number.isInteger(product.price) ||
      product.price < 1 ||
      product.price > 1000000 ||
      !Number.isInteger(product.stock) ||
      product.stock < 0 ||
      product.stock > 1000000
    )
      return {
        error:
          "Check all fields. Price must be a positive whole rupee amount; stock must be a whole number of zero or more.",
      };
    if (
      !/^https:\/\/[^\s]+$/.test(product.image_url) &&
      !/^\/products\/[a-z]+\.svg$/.test(product.image_url)
    )
      return {
        error:
          "Use an HTTPS image URL or a supplied /products/name.svg illustration.",
      };
    const id = formData.get("id");
    await client.saveProduct(await getSessionHash(), product, id || null);
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    return actionError(error);
  }
}
export async function deleteProduct(id) {
  try {
    const client = await requireAdmin();
    // Archive so order history and cancellation stock restoration retain the product.
    await client.archiveProduct(await getSessionHash(), id);
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    return actionError(error);
  }
}
export async function updateOrderStatus(id, status) {
  try {
    const client = await requireAdmin();
    if (!["completed", "cancelled"].includes(status))
      return { error: "Choose a valid order status." };
    await client.setStatus(await getSessionHash(), id, status);
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    return actionError(error);
  }
}
