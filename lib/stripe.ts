import Stripe from "stripe";

// Falls back to a placeholder so the app can build/boot without Stripe
// configured; routes that call Stripe will fail clearly at request time
// instead of crashing the whole server on startup.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_not_configured", {
  apiVersion: "2026-08-26.dahlia",
});

const PLATFORM_FEE_BPS = Number(process.env.PLATFORM_FEE_BPS ?? "1500");

// Splits a sale price into what the platform keeps and what the creator earns.
export function splitSale(priceCents: number): {
  platformFeeCents: number;
  sellerEarningsCents: number;
} {
  const platformFeeCents = Math.round((priceCents * PLATFORM_FEE_BPS) / 10_000);
  return {
    platformFeeCents,
    sellerEarningsCents: priceCents - platformFeeCents,
  };
}
