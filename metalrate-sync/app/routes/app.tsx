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
        {/* Without an explicit rel="home" link, Shopify defaults the app-name
            entry in the admin sidebar to "/" -- our real home is "/app", so
            clicking the app name (not "Dashboard") landed on the public
            marketing/login route instead of the embedded dashboard. This
            link is hidden from the rendered menu (that's what rel="home"
            does) -- "Dashboard" below stays as the visible entry. */}
        {/* @shopify/polaris-types' generated Link interface doesn't expose
            `rel`, even though it's a real, documented app-nav attribute
            (shopify.dev/docs/api/app-home/app-bridge-web-components/app-nav)
            -- a type-defs gap, not a runtime one. Spread-cast works around it
            without a blanket `any` on the element. */}
        <s-link href="/app" {...({ rel: "home" } as Record<string, string>)}>
          Home
        </s-link>
        <s-link href="/app">Dashboard</s-link>
        <s-link href="/app/products">Products</s-link>
        <s-link href="/app/formulas">Formulas</s-link>
        <s-link href="/app/sync">Preview &amp; Sync</s-link>
        <s-link href="/app/history">History</s-link>
        <s-link href="/app/settings">Settings</s-link>
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
