"use client";
export default function ErrorPage({ reset }) {
  return (
    <div className="container empty page-space">
      <h1>We couldn’t load this page.</h1>
      <p>
        Please try again. If you just connected Neon, make sure you ran both SQL
        files.
      </p>
      <button className="button" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
