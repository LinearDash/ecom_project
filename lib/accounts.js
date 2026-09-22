import {
  hashPassword,
  verifyPassword,
  hashToken,
  newToken,
} from "./passwords.js";
export const SESSION_SECONDS = 7 * 24 * 60 * 60;
// This service is called only by a Server Action; tests use the same SQL and hashing code.
export async function authenticateAccount(store, { email, password, signup }) {
  email = String(email || "")
    .trim()
    .toLowerCase();
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 254 ||
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > 128
  )
    return { error: "Enter a valid email and a password of 8–128 characters." };
  const [limit] = await store.query(
    `insert into public.login_attempts(email) values($1)
    on conflict(email) do update set
      attempts=case when login_attempts.window_started<now()-interval '15 minutes' then 1 else login_attempts.attempts+1 end,
      window_started=case when login_attempts.window_started<now()-interval '15 minutes' then now() else login_attempts.window_started end
    returning attempts`,
    [email],
  );
  if (limit.attempts > 10)
    return {
      error: "Too many attempts for this email. Try again in 15 minutes.",
    };
  let user;
  if (signup) {
    const passwordHash = await hashPassword(password);
    [user] = await store.query(
      `insert into public.users(email,password_hash) values($1,$2)
      on conflict(email) do nothing returning id,email`,
      [email, passwordHash],
    );
    if (!user)
      return {
        error: "An account already exists for this email. Please sign in.",
      };
  } else {
    [user] = await store.query(
      "select id,email,password_hash from public.users where email=$1",
      [email],
    );
    // Do the expensive derivation even for unknown emails.
    const encoded =
      user?.password_hash || `scrypt:${"0".repeat(32)}:${"0".repeat(128)}`;
    if (!(await verifyPassword(password, encoded)) || !user)
      return { error: "Email or password is incorrect." };
  }
  const token = newToken();
  await store.query(
    "insert into public.sessions(token_hash,user_id,expires_at) values($1,$2,now()+interval '7 days')",
    [hashToken(token), user.id],
  );
  await store.query("delete from public.login_attempts where email=$1", [
    email,
  ]);
  await store.query("delete from public.sessions where expires_at<=now()");
  return { token };
}
