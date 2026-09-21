import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const priceId = process.env.STRIPE_PRO_MEMBERSHIP_PRICE_ID;
  if (!priceId) {
    return NextResponse.json(
      { error: "Membership checkout is not configured yet." },
      { status: 501 },
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { userId: session.user.id },
    subscription_data: { metadata: { userId: session.user.id } },
    success_url: `${appUrl}/settings/billing?upgrade=success`,
    cancel_url: `${appUrl}/settings/billing?upgrade=cancelled`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
