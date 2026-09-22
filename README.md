# Paper & Pen

A simple stationery e-commerce assignment using **Next.js App Router, JavaScript, plain CSS, and Neon PostgreSQL**. Runs locally; checkout is simulated and never collects money.

## Run locally

Requires Node.js 20.9 or newer and npm.

```bash
npm install
cp .env.example .env.local # Only if .env.local does not already exist
npm run dev
```

Open **http://localhost:3000**. With no `DATABASE_URL`, the app shows a labeled preview catalog. Search, filters, sorting, product pages, and the shopping bag work. Accounts, orders, and admin features need Neon.

## Connect Neon

1. Create a project at https://console.neon.tech with an empty database.
2. In the Neon SQL Editor, run `database/schema.sql` **once**, then `database/seed.sql`. Use the same database and database-owner role for these scripts and your connection string. The seed adds 12 products and can be rerun without resetting existing inventory.
3. In the **Connect** dialog, copy the PostgreSQL connection string, with its SSL parameters, into `.env.local`:

   ```dotenv
   DATABASE_URL="postgresql://ROLE:PASSWORD@HOST/neondb?sslmode=require"
   ```

   This is a secret containing your database password. Keep it server-only, never use a `NEXT_PUBLIC_` prefix, and do not commit `.env.local`. The app uses Neon's HTTP driver, so no extra backend service or local PostgreSQL install is required.

4. Restart `npm run dev`.
5. Register at `/login` with an email and an 8–128 character password. Signup logs you in immediately; this assignment does not require email verification or implement password reset.
6. To make your account an admin, run this in the Neon SQL Editor:

   ```sql
   update public.users
   set role = 'admin'
   where email = lower('your-admin@example.com');
   ```

7. Refresh the store. The Admin link appears. Register a separate customer account to demonstrate the customer flow.

For a brand-new empty database, you can alternatively set `.env.local` first and run:

```bash
node --env-file=.env.local scripts/setup-database.mjs
```

This initializes schema and seed together in one transaction. It refuses to change a database that already contains public tables.

Customers and admins use the same sign-in page. Registration always creates a customer. This project is a fresh Neon setup; the SQL does not import accounts or data from another provider.

## Features and rules

- 12 illustrated products, name search, four category filters, featured/name/price sorting, individual product pages.
- Persistent browser-local shopping bag, quantity changes, removal, stock limits.
- Email/password signup and login; server-side sessions and sign out.
- Login-required checkout; full name and the account's email; whole NPR amounts. No shipping, taxes, or actual payments.
- Customer order history with items, quantities, prices, total, date, and status.
- Admin product creation/editing, inventory editing, product removal, all orders, completion/cancellation.
- Stock decreases only when placing an order. Out-of-stock products remain visible but cannot be bought.
- Status transitions: `pending → completed` or `pending → cancelled`. Both are final. Cancellation restores stock exactly once.
- Removing a product archives it (`active=false`), preserving past orders and allowing stock restoration. Order items preserve the name and price at purchase time.
- Checkout retries reuse a reference within the same mounted checkout screen to prevent duplicate orders. A fresh checkout is a new purchase.

## How to explain it to your teacher

1. **Next.js is both frontend and backend.** Files in `app/` become routes. Server Components load database data; Client Components handle search, forms, and the bag. Server Actions handle writes.
2. **The bag uses React state and localStorage.** It stores product IDs and quantities. Checkout reads actual prices from the database, never trusts prices from the browser.
3. **Neon hosts PostgreSQL.** Only server code reads `DATABASE_URL`. `lib/store.js` contains parameterized SQL, protecting values from SQL injection.
4. **Authentication is part of this app.** `users` stores a salted scrypt password hash, never the password. Login creates a random token; an HTTP-only cookie holds the token, while the database stores only its SHA-256 hash. Sessions expire after seven days; logout revokes the session. An email-based attempt limit reduces repeated password guessing.
5. **Permissions are checked on the server and in database queries.** Protected pages and actions load the account from the session. Product writes check the session's admin role in SQL. `visible_orders` restricts results to the customer's orders or all orders for an admin. Browser users have no direct database connection. The server's database-owner credential is trusted and must stay private.
6. **Checkout is transactional.** `place_order` identifies the customer from a valid session, locks product rows in ID order, checks availability, reads prices, reduces stock, and creates the order/items. An error rolls the whole operation back.
7. **Cancellation is transactional too.** `set_order_status` checks the admin session, locks the order, permits only pending orders to change, and restores stock exactly once.

Tables: `users` (accounts and roles), `sessions` (login sessions), `login_attempts` (attempt limit), `products` (catalog and stock), `orders` (purchase header), and `order_items` (purchased product snapshots). One user has many orders; one order has many order items.

Suggested demo: filter/sort → product page → bag → signup/login → checkout → order history → admin login → inspect stock → cancel order → show restored stock → add/edit/remove a product.

## Project map

| Path                      | Purpose                                                      |
| ------------------------- | ------------------------------------------------------------ |
| `app/`                    | Store, product, login, bag, checkout, order, and admin pages |
| `app/actions.js`          | Server Actions for authentication, products, and orders      |
| `components/`             | Forms, catalog, bag, and reusable UI                         |
| `lib/db.js`               | Server-only Neon connection                                  |
| `lib/store.js`            | Parameterized database queries                               |
| `lib/auth.js`             | Session cookies and current-account lookup                   |
| `lib/accounts.js`         | Registration, login, attempt limit, session creation         |
| `lib/passwords.js`        | Password and session-token hashing                           |
| `lib/data.js`             | Catalog reads and explicit unconfigured preview              |
| `lib/catalog.js`          | Categories, NPR formatting, sample products                  |
| `database/schema.sql`     | Tables, indexes, session checks, transactional functions     |
| `database/seed.sql`       | Starter products                                             |
| `public/`                 | Original local SVG stationery illustrations                  |
| `tests/database.test.mjs` | Authentication, queries, and transaction integration tests   |

## Verification

```bash
npm run lint
npm test
npm run build
npm start
```

Database tests execute the real schema and production query/authentication code against embedded PostgreSQL (PGlite). They cover password hashing, registration/login, attempt limits, session expiry/revocation, order isolation, admin restrictions, price integrity, retries, rollback, stock limits, status transitions, and archiving. They do not replace a final test against your Neon project or a multi-connection load test.

With `npm run dev` running and **no DATABASE_URL configured**, run:

```bash
npx playwright test
```

These browser tests target the preview on `http://127.0.0.1:3000`. Set `CHROMIUM_PATH` if your Chromium is not at `/usr/bin/chromium`.

To verify a configured live Neon database with the local development server running:

```bash
npx playwright test --config=playwright.live.config.js
```

This creates temporary customer/admin accounts and a product, verifies signup, login, checkout, order history, cancellation, stock restoration, and sign out, then removes only that test run's records.

## Design

Cream paper `#faf8f2`, forest ink `#23392f`, green `#315b45`, sage `#e8eddf`, warm sand `#eee9de`. Playfair Display and DM Sans use Google Fonts, with Georgia/Arial fallbacks. All 12 SVG product illustrations ship locally. Admin-added HTTPS images need their host to be reachable.

References: [Next.js App Router](https://nextjs.org/docs/app), [Neon PostgreSQL driver and parameterized queries](https://github.com/neondatabase/serverless).
