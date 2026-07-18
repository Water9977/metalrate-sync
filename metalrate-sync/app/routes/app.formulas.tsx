import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useLoaderData, useFetcher } from "react-router";
import { useEffect, useRef, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import {
  METAL_LABELS,
  METAL_TONE,
  SUPPORTED_METALS,
  PURITY_PRESETS,
} from "../constants";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const formulas = await prisma.pricingFormula.findMany({
    where: { shop: session.shop },
    orderBy: { name: "asc" },
    include: { _count: { select: { variants: true } } },
  });
  return { formulas };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const form = await request.formData();
  const intent = String(form.get("intent"));

  if (intent === "delete") {
    const id = Number(form.get("id"));
    await prisma.pricingFormula.deleteMany({ where: { id, shop } });
    return { ok: true, message: "Formula deleted" };
  }

  if (intent === "save") {
    const idRaw = form.get("id");
    const id = idRaw ? Number(idRaw) : null;
    const name = String(form.get("name") ?? "").trim();
    if (!name) return { ok: false, message: "Name is required" };

    const stopLossRaw = String(form.get("stopLossPerGram") ?? "").trim();
    const data = {
      name,
      metal: String(form.get("metal") ?? "XAU"),
      purityFactor: Number(form.get("purityFactor") ?? 1),
      makingChargeType: String(form.get("makingChargeType") ?? "flat"),
      makingChargeValue: Number(form.get("makingChargeValue") ?? 0),
      wastagePct: Number(form.get("wastagePct") ?? 0),
      markupType: String(form.get("markupType") ?? "percent"),
      markupValue: Number(form.get("markupValue") ?? 0),
      taxPct: Number(form.get("taxPct") ?? 0),
      roundingStep: Number(form.get("roundingStep") ?? 0),
      endsIn99: form.get("endsIn99") === "on" || form.get("endsIn99") === "true",
      minChangeAmount: Number(form.get("minChangeAmount") ?? 0),
      stopLossPerGram: stopLossRaw === "" ? null : Number(stopLossRaw),
      active: form.get("active") === "on" || form.get("active") === "true",
    };

    try {
      if (id) {
        await prisma.pricingFormula.updateMany({ where: { id, shop }, data });
      } else {
        await prisma.pricingFormula.create({ data: { shop, ...data } });
      }
      return { ok: true, message: id ? "Formula updated" : "Formula created" };
    } catch (error) {
      const message =
        error instanceof Error && error.message.includes("Unique constraint")
          ? "A formula with that name already exists"
          : "Could not save formula";
      return { ok: false, message };
    }
  }

  return { ok: false, message: "Unknown action" };
};

type Formula = ReturnType<typeof useLoaderData<typeof loader>>["formulas"][number];

export default function Formulas() {
  const { formulas } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();
  const formRef = useRef<HTMLFormElement>(null);
  const saving = fetcher.state !== "idle";
  const [editingFormula, setEditingFormula] = useState<Formula | null>(null);
  // Two-click delete: first click arms, second confirms. Cheap insurance
  // against one misclick destroying a formula that variants depend on.
  const [deleteArmedId, setDeleteArmedId] = useState<number | null>(null);

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.message) {
      shopify.toast.show(fetcher.data.message, {
        isError: !fetcher.data.ok,
      });
      if (fetcher.data.ok) {
        formRef.current?.reset();
        setEditingFormula(null);
        // Close the modal after successful save. shopify.modal is the real
        // API (App Bridge) -- element.hide()/.show() don't exist, calling
        // them was a silent no-op since optional chaining swallows it.
        shopify.modal.hide("formula-modal");
      }
    }
  }, [fetcher.state, fetcher.data, shopify]);

  const openNewFormula = () => setEditingFormula(null);
  const openEditFormula = (formula: Formula) => {
    setEditingFormula(formula);
    shopify.modal.show("formula-modal");
  };

  return (
    <s-page heading="Pricing formulas">
      <s-button
        slot="primary-action"
        variant="primary"
        commandFor="formula-modal"
        command="--show"
        onClick={openNewFormula}
      >
        New formula
      </s-button>

      <s-section>
        {formulas.length === 0 ? (
          <s-stack direction="block" gap="base" alignItems="center">
            <s-heading>No formulas yet</s-heading>
            <s-paragraph>
              A formula turns a live metal rate into a product price: weight ×
              purity × rate, plus making charges, markup and tax. Create one,
              then assign it to products.
            </s-paragraph>
            <s-button
              variant="primary"
              commandFor="formula-modal"
              command="--show"
              onClick={openNewFormula}
            >
              Create your first formula
            </s-button>
          </s-stack>
        ) : (
          <s-table>
            <s-table-header-row>
              <s-table-header listSlot="primary">Name</s-table-header>
              <s-table-header>Metal</s-table-header>
              <s-table-header>Purity</s-table-header>
              <s-table-header>Making</s-table-header>
              <s-table-header>Markup</s-table-header>
              <s-table-header>Rounding</s-table-header>
              <s-table-header>Min change</s-table-header>
              <s-table-header>Stop-loss</s-table-header>
              <s-table-header>Variants</s-table-header>
              <s-table-header>Status</s-table-header>
              <s-table-header></s-table-header>
            </s-table-header-row>
            <s-table-body>
              {formulas.map((formula) => (
                <s-table-row key={formula.id}>
                  <s-table-cell>{formula.name}</s-table-cell>
                  <s-table-cell>
                    <s-badge
                      tone={
                        METAL_TONE[formula.metal as keyof typeof METAL_TONE] ??
                        "neutral"
                      }
                    >
                      {METAL_LABELS[
                        formula.metal as keyof typeof METAL_LABELS
                      ] ?? formula.metal}
                    </s-badge>
                  </s-table-cell>
                  <s-table-cell>{formula.purityFactor}</s-table-cell>
                  <s-table-cell>
                    {formula.makingChargeValue}
                    {formula.makingChargeType === "percent"
                      ? "%"
                      : formula.makingChargeType === "perGram"
                        ? "/g"
                        : " flat"}
                  </s-table-cell>
                  <s-table-cell>
                    {formula.markupValue}
                    {formula.markupType === "percent" ? "%" : " flat"}
                  </s-table-cell>
                  <s-table-cell>
                    {formula.roundingStep > 0
                      ? `Nearest ${formula.roundingStep}`
                      : "Exact"}
                    {formula.endsIn99 ? " · .99" : ""}
                  </s-table-cell>
                  <s-table-cell>
                    {formula.minChangeAmount > 0
                      ? `± ${formula.minChangeAmount}`
                      : "Always"}
                  </s-table-cell>
                  <s-table-cell>
                    {formula.stopLossPerGram != null
                      ? `${formula.stopLossPerGram}/g`
                      : "—"}
                  </s-table-cell>
                  <s-table-cell>{formula._count.variants}</s-table-cell>
                  <s-table-cell>
                    <s-badge tone={formula.active ? "success" : "neutral"}>
                      {formula.active ? "Active" : "Inactive"}
                    </s-badge>
                  </s-table-cell>
                  <s-table-cell>
                    <s-stack direction="inline" gap="small-200">
                      <s-button
                        variant="tertiary"
                        icon="edit"
                        accessibilityLabel={`Edit ${formula.name}`}
                        onClick={() => openEditFormula(formula)}
                      ></s-button>
                      {deleteArmedId === formula.id ? (
                        <s-button
                          variant="primary"
                          tone="critical"
                          accessibilityLabel={`Confirm delete ${formula.name}`}
                          onClick={() => {
                            setDeleteArmedId(null);
                            fetcher.submit(
                              { intent: "delete", id: String(formula.id) },
                              { method: "POST" },
                            );
                          }}
                        >
                          Confirm delete?
                        </s-button>
                      ) : (
                        <s-button
                          variant="tertiary"
                          tone="critical"
                          icon="delete"
                          accessibilityLabel={`Delete ${formula.name}`}
                          onClick={() => setDeleteArmedId(formula.id)}
                        ></s-button>
                      )}
                    </s-stack>
                  </s-table-cell>
                </s-table-row>
              ))}
            </s-table-body>
          </s-table>
        )}
      </s-section>

      <s-modal
        id="formula-modal"
        heading={editingFormula ? "Edit pricing formula" : "New pricing formula"}
      >
        {/* Remount on every target change so each Polaris field's default
            value attribute reflects the formula being edited, rather than
            relying on these custom elements syncing a changed React prop. */}
        <fetcher.Form
          method="POST"
          ref={formRef}
          key={editingFormula?.id ?? "new"}
        >
          <input type="hidden" name="intent" value="save" />
          <input type="hidden" name="id" value={editingFormula?.id ?? ""} />
          <s-stack direction="block" gap="base">
            <s-text-field
              label="Formula name"
              name="name"
              placeholder="e.g. 22K Gold Chains"
              required
              value={editingFormula?.name ?? ""}
            ></s-text-field>

            <s-grid gridTemplateColumns="1fr 1fr" gap="base">
              <s-select label="Metal" name="metal" value={editingFormula?.metal ?? "XAU"}>
                {SUPPORTED_METALS.map((metal) => (
                  <s-option key={metal} value={metal}>
                    {METAL_LABELS[metal]}
                  </s-option>
                ))}
              </s-select>
              <s-select
                label="Purity"
                name="purityFactor"
                value={String(editingFormula?.purityFactor ?? 1)}
              >
                {PURITY_PRESETS.map((preset) => (
                  <s-option key={preset.value} value={String(preset.value)}>
                    {preset.label}
                  </s-option>
                ))}
              </s-select>
            </s-grid>

            <s-grid gridTemplateColumns="1fr 1fr" gap="base">
              <s-select
                label="Making charge type"
                name="makingChargeType"
                value={editingFormula?.makingChargeType ?? "flat"}
              >
                <s-option value="flat">Flat amount</s-option>
                <s-option value="perGram">Per gram</s-option>
                <s-option value="percent">% of metal value</s-option>
              </s-select>
              <s-number-field
                label="Making charge value"
                name="makingChargeValue"
                min={0}
                value={String(editingFormula?.makingChargeValue ?? 0)}
              ></s-number-field>
            </s-grid>

            <s-grid gridTemplateColumns="1fr 1fr" gap="base">
              <s-select
                label="Markup type"
                name="markupType"
                value={editingFormula?.markupType ?? "percent"}
              >
                <s-option value="percent">Percent</s-option>
                <s-option value="flat">Flat amount</s-option>
              </s-select>
              <s-number-field
                label="Markup value"
                name="markupValue"
                min={0}
                value={String(editingFormula?.markupValue ?? 0)}
              ></s-number-field>
            </s-grid>

            <s-grid gridTemplateColumns="1fr 1fr" gap="base">
              <s-number-field
                label="Wastage %"
                name="wastagePct"
                min={0}
                value={String(editingFormula?.wastagePct ?? 0)}
                details="Jewellery convention — % of metal value"
              ></s-number-field>
              <s-number-field
                label="Tax %"
                name="taxPct"
                min={0}
                value={String(editingFormula?.taxPct ?? 0)}
                details="e.g. GST"
              ></s-number-field>
            </s-grid>

            <s-divider></s-divider>

            <s-select
              label="Round to nearest"
              name="roundingStep"
              value={String(editingFormula?.roundingStep ?? 0)}
              details="Exact cents tracks the market closely — use this for bullion and coins. A step of 5 or 10 keeps jewellery prices looking clean instead of landing on odd numbers like 217.32."
            >
              <s-option value="0">Exact (cents) — bullion</s-option>
              <s-option value="1">Nearest whole dollar</s-option>
              <s-option value="5">Nearest 5</s-option>
              <s-option value="10">Nearest 10</s-option>
              <s-option value="25">Nearest 25</s-option>
              <s-option value="50">Nearest 50</s-option>
              <s-option value="100">Nearest 100</s-option>
            </s-select>

            <s-switch
              label="End in .99"
              name="endsIn99"
              details="Charm pricing — e.g. 220 becomes 219.99"
              {...(editingFormula?.endsIn99 ? { checked: true } : {})}
            ></s-switch>

            <s-number-field
              label="Minimum change to trigger an update"
              name="minChangeAmount"
              min={0}
              value={String(editingFormula?.minChangeAmount ?? 0)}
              details="If the new price is closer than this to the current price, leave it alone instead of nudging it a couple of dollars either way. Set to 0 for bullion (always track exactly), or 5 to 10 for jewellery so prices only move when it's worth it."
            ></s-number-field>

            <s-number-field
              label="Stop-loss rate per gram"
              name="stopLossPerGram"
              min={0}
              value={
                editingFormula?.stopLossPerGram != null
                  ? String(editingFormula.stopLossPerGram)
                  : ""
              }
              details="Skip repricing if the live rate drops below this. Leave blank to disable."
            ></s-number-field>

            <s-switch
              label="Active"
              name="active"
              {...((editingFormula?.active ?? true) ? { checked: true } : {})}
            ></s-switch>

            <s-button
              variant="primary"
              type="submit"
              {...(saving ? { loading: true } : {})}
            >
              Save formula
            </s-button>
          </s-stack>
        </fetcher.Form>
      </s-modal>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
