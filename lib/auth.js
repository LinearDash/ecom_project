import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { getStore, isConfigured } from "./db";
import { hashToken } from "./passwords";
import { SESSION_SECONDS } from "./accounts";
export { isConfigured } from "./db";
const COOKIE = "paper-pen-session";
export async function getSessionHash() {
  const token = (await cookies()).get(COOKIE)?.value;
  return token && /^[a-f0-9]{64}$/.test(token) ? hashToken(token) : null;
}
export const getAccount = cache(async () => {
  if (!isConfigured()) return { user: null, admin: false };
  const tokenHash = await getSessionHash();
  const user = tokenHash ? await getStore().account(tokenHash) : null;
  return { user: user || null, admin: user?.role === "admin" };
});
export async function startSession(token) {
  const old = await getSessionHash();
  if (old)
    await getStore().query("delete from public.sessions where token_hash=$1", [
      old,
    ]);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}
export async function endSession() {
  const tokenHash = await getSessionHash();
  if (tokenHash && isConfigured())
    await getStore().query("delete from public.sessions where token_hash=$1", [
      tokenHash,
    ]);
  (await cookies()).delete(COOKIE);
}
