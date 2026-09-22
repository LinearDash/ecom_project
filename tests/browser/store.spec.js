import { test, expect } from "@playwright/test";
test("catalog search, categories, sorting, empty results, and product detail", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Little things. Big ideas." }),
  ).toBeVisible();
  await expect(page.locator(".product-card")).toHaveCount(12);
  await page.getByRole("button", { name: "Notebooks", exact: true }).click();
  await expect(page.locator(".product-card")).toHaveCount(3);
  await page
    .getByRole("button", { name: "All essentials", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Sort products" })
    .selectOption("low");
  await expect(page.locator(".product-name").first()).toHaveText(
    "Brass page clips",
  );
  await page
    .getByRole("combobox", { name: "Sort products" })
    .selectOption("high");
  await expect(page.locator(".product-name").first()).toHaveText(
    "Oak desk organizer",
  );
  await page
    .getByRole("combobox", { name: "Sort products" })
    .selectOption("name");
  await expect(page.locator(".product-name").first()).toHaveText(
    "Brass page clips",
  );
  await page
    .getByRole("textbox", { name: "Search products" })
    .fill("brass pen");
  await expect(page.locator(".product-card")).toHaveCount(1);
  await page
    .getByRole("textbox", { name: "Search products" })
    .fill("unfindable");
  await expect(page.getByText("No matches, just yet.")).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await page
    .getByRole("link", { name: "View The everyday notebook", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "The everyday notebook", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("24 in stock, ready for your desk"),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("cart persists, enforces available stock, updates totals, removes products and requires login", async ({
  page,
}) => {
  await page.goto("/products/00000000-0000-4000-8000-000000000001");
  await page.getByRole("spinbutton", { name: "Quantity" }).fill("2");
  await page.getByRole("button", { name: "Add to bag", exact: true }).click();
  await page.getByRole("link", { name: "Shopping bag, 2 items" }).click();
  await expect(page.locator(".summary-total")).toHaveText("TotalNPR 760");
  await page.reload();
  await expect(page.locator(".summary-total")).toHaveText("TotalNPR 760");
  await page
    .getByRole("button", { name: "Increase The everyday notebook quantity" })
    .click();
  await expect(page.locator(".summary-total")).toHaveText("TotalNPR 1,140");
  await page
    .getByRole("button", { name: "Decrease The everyday notebook quantity" })
    .click();
  await page.getByRole("link", { name: "Continue to checkout" }).click();
  await expect(page).toHaveURL(/\/login\?next=\/checkout/);
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }).last(),
  ).toBeDisabled();
  await page.goto("/cart");
  await page.getByRole("button", { name: "Remove", exact: true }).click();
  await expect(page.getByText("Your bag is empty.")).toBeVisible();
  await page.goto("/products/00000000-0000-4000-8000-000000000001");
  await page.getByRole("spinbutton", { name: "Quantity" }).fill("999");
  await expect(page.getByRole("spinbutton", { name: "Quantity" })).toHaveValue(
    "24",
  );
  await page.getByRole("button", { name: "Add to bag", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "All available stock in bag" }),
  ).toBeDisabled();
  await page.goto("/cart");
  await expect(
    page.getByRole("button", {
      name: "Increase The everyday notebook quantity",
    }),
  ).toBeDisabled();
});
test("out-of-stock products, missing products and protected routes behave correctly", async ({
  page,
}) => {
  await page.goto("/products/00000000-0000-4000-8000-000000000012");
  await expect(
    page.getByRole("button", { name: "Out of stock", exact: true }),
  ).toBeDisabled();
  await page.goto("/products/not-a-product");
  await expect(
    page.getByRole("heading", { name: "Nothing on this page." }),
  ).toBeVisible();
  for (const route of ["admin", "orders", "checkout"]) {
    await page.goto(`/${route}`);
    await expect(page).toHaveURL(new RegExp(`/login\\?next=/${route}`));
  }
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Make yourself at home." }),
  ).toBeVisible();
});
test("desktop and mobile layouts have no overflow or broken illustrations", async ({
  page,
}) => {
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator(".product-card")).toHaveCount(12);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.locator(".footer").scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        page
          .locator("img")
          .evaluateAll((imgs) =>
            imgs.every((img) => img.complete && img.naturalWidth > 0),
          ),
      )
      .toBe(true);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: `/tmp/paper-pen-${viewport.width}.png`,
      fullPage: true,
    });
  }
});
