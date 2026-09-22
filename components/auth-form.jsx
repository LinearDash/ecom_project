"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authenticate } from "@/app/actions";
import { ArrowRight } from "lucide-react";
export default function AuthForm({ next, configured }) {
  const [mode, setMode] = useState("login");
  const [result, setResult] = useState({});
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setResult({});
    try {
      const result = await authenticate(new FormData(e.currentTarget));
      setResult(result);
      if (result.success) {
        router.push(next);
        router.refresh();
      }
    } catch {
      setResult({ error: "Could not connect. Please try again." });
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-card">
      <div className="auth-tabs">
        <button
          onClick={() => {
            setMode("login");
            setResult({});
          }}
          aria-pressed={mode === "login"}
          className={mode === "login" ? "selected" : ""}
        >
          Sign in
        </button>
        <button
          onClick={() => {
            setMode("signup");
            setResult({});
          }}
          aria-pressed={mode === "signup"}
          className={mode === "signup" ? "selected" : ""}
        >
          Create account
        </button>
      </div>
      <h2>{mode === "login" ? "Welcome back." : "Make yourself at home."}</h2>
      <p>
        {mode === "login"
          ? "Your next good idea is waiting."
          : "Save your orders and find your everyday favorites."}
      </p>
      {!configured && (
        <p className="message">
          Connect Neon to enable sign in and registration. The setup guide is
          linked above.
        </p>
      )}
      <form onSubmit={submit} className="form-stack">
        <input type="hidden" name="mode" value={mode} />
        <label>
          Email address
          <input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            maxLength="254"
          />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete={
              mode === "signup" ? "new-password" : "current-password"
            }
            placeholder="At least 8 characters"
            required
            minLength="8"
            maxLength="128"
          />
        </label>
        {result.error && (
          <p role="alert" className="message error">
            {result.error}
          </p>
        )}
        {result.message && (
          <p role="status" className="message">
            {result.message}
          </p>
        )}
        <button disabled={busy || !configured} className="button full">
          {busy
            ? "One moment…"
            : mode === "login"
              ? "Sign in"
              : "Create account"}
          <ArrowRight size={16} />
        </button>
      </form>
      <p className="fine-print">
        Customers and admins use the same sign-in form.
      </p>
    </div>
  );
}
