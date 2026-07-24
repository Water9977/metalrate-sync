import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";

import { authenticate } from "../shopify.server";
import { requirePlanOrRedirect } from "../services/billing.server";

// Single enforcement point for every /app/* page: this layout loader runs
// before ANY nested route, so gating here covers the whole app without
// repeating the check in each page. (Actions still re-check independently
// -- see billing.server.ts requireActivePlan -- since a fetcher.submit on
// an already-mounted page doesn't re-run this loader.)
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session, redirect } = await authenticate.admin(request);

  const planOrRedirect = await requirePlanOrRedirect(
    admin,
    redirect,
    session.shop,
  );
  if (planOrRedirect instanceof Response) return planOrRedirect;

  // eslint-disable-next-line no-undef
  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    <AppProvider embedded apiKey={apiKey}>
      <s-app-nav>
        <s-link href="/app">Dashboard</s-link>
        <s-link href="/app/products">Products</s-link>
        <s-link href="/app/formulas">Formulas</s-link>
        <s-link href="/app/sync">Preview &amp; Sync</s-link>
        <s-link href="/app/history">History</s-link>
        <s-link href="/app/settings">Settings</s-link>
        <s-link href="https://metalratesync.com/docs" target="_blank">
          Help &amp; guides
        </s-link>
      </s-app-nav>
      <Outlet />
    </AppProvider>
  );
}

// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
