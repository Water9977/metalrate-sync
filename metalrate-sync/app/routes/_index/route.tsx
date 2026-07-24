import type { LoaderFunctionArgs } from "react-router";
import { redirect, Form, useLoaderData } from "react-router";

import { login } from "../../shopify.server";

import styles from "./styles.module.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function App() {
  const { showForm } = useLoaderData<typeof loader>();

  return (
    <div className={styles.index}>
      <div className={styles.content}>
        <h1 className={styles.heading}>Ounce: MetalRate Sync</h1>
        <p className={styles.text}>
          Reprice your Shopify catalog from live gold, silver, platinum and
          palladium rates — with a full preview before anything changes.
        </p>
        {showForm && (
          <Form className={styles.form} method="post" action="/auth/login">
            <label className={styles.label}>
              <span>Shop domain</span>
              <input className={styles.input} type="text" name="shop" />
              <span>e.g: my-shop-domain.myshopify.com</span>
            </label>
            <button className={styles.button} type="submit">
              Log in
            </button>
          </Form>
        )}
        <ul className={styles.list}>
          <li>
            <strong>Preview before commit</strong>. See every price change —
            old, new, % — before anything touches your store.
          </li>
          <li>
            <strong>Bulk import by SKU</strong>. Set weights and formulas for
            a whole catalog in one CSV upload, not one product at a time.
          </li>
          <li>
            <strong>Full audit trail</strong>. Every sync logs what changed,
            what was skipped, and why — nothing fails silently.
          </li>
        </ul>
      </div>
    </div>
  );
}
