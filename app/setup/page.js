export const metadata = { title: "Connect your store" };
export default function Setup() {
  return (
    <div className="container page-space narrow setup-page">
      <p className="eyebrow">FOR THE STORE OWNER</p>
      <h1 className="page-title">Connect your little shop.</h1>
      <p>
        The storefront works as a preview. Connect Neon to enable accounts,
        inventory updates, and orders.
      </p>
      <ol>
        <li>
          <h3>Create a Neon project</h3>
          <p>
            Open{" "}
            <a
              href="https://console.neon.tech"
              target="_blank"
              rel="noreferrer"
            >
              the Neon console
            </a>{" "}
            and create a project with an empty database.
          </p>
        </li>
        <li>
          <h3>Create and seed the database</h3>
          <p>
            In the Neon SQL Editor, run <code>database/schema.sql</code> once,
            then <code>database/seed.sql</code> from this project. Use the same
            database and role for these scripts and the connection string.
          </p>
        </li>
        <li>
          <h3>Add your connection string</h3>
          <p>
            In Neon’s Connect dialog, copy the connection string. Add it as{" "}
            <code>DATABASE_URL</code> in <code>.env.local</code>. Restart the
            development server.
          </p>
          <p>
            This string contains your database password. Keep it in the local
            environment file and never use a <code>NEXT_PUBLIC_</code> variable
            for it.
          </p>
        </li>
        <li>
          <h3>Register and create an admin</h3>
          <p>
            Sign up through the store. Email confirmation is not required for
            this assignment. Run the admin promotion query in README.md using
            the Neon SQL Editor, then refresh the store to see the Admin link.
          </p>
        </li>
      </ol>
      <p>
        Full setup instructions and a presentation walkthrough are in{" "}
        <code>README.md</code>.
      </p>
    </div>
  );
}
