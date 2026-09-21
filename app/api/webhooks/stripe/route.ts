import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe, splitSale } from "@/lib/stripe";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const checkoutSession = event.data.object as Stripe.Checkout.Session;

    if (checkoutSession.mode === "subscription") {
      const userId = checkoutSession.metadata?.userId;
      const subscriptionId =
        typeof checkoutSession.subscription === "string" ? checkoutSession.subscription : undefined;
      if (userId && subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await prisma.membership.upsert({
          where: { userId },
          update: {
            tier: "PRO",
            stripeCustomerId: String(checkoutSession.customer),
            stripeSubscriptionId: subscriptionId,
            currentPeriodEnd: new Date(subscription.items.data[0].current_period_end * 1000),
          },
          create: {
            userId,
            tier: "PRO",
            stripeCustomerId: String(checkoutSession.customer),
            stripeSubscriptionId: subscriptionId,
            currentPeriodEnd: new Date(subscription.items.data[0].current_period_end * 1000),
          },
        });
      }
      return NextResponse.json({ received: true });
    }

    const { moduleId, moduleVersionId, buyerId } = checkoutSession.metadata ?? {};
    if (moduleId && moduleVersionId && buyerId) {
      const module_ = await prisma.module.findUnique({ where: { id: moduleId } });
      if (module_) {
        const { platformFeeCents, sellerEarningsCents } = splitSale(module_.priceCents);
        await prisma.acquisition.upsert({
          where: { userId_moduleId: { userId: buyerId, moduleId } },
          update: {},
          create: {
            userId: buyerId,
            moduleId,
            moduleVersionId,
            priceCentsPaid: module_.priceCents,
            platformFeeCents,
            sellerEarningsCents,
            stripeCheckoutSessionId: checkoutSession.id,
            stripePaymentIntentId:
              typeof checkoutSession.payment_intent === "string"
                ? checkoutSession.payment_intent
                : undefined,
          },
        });
        // Seller payouts are transferred via Stripe Connect once the creator
        // has onboarded (see SellerAccount). Recording sellerEarningsCents
        // here keeps an accurate ledger even before a transfer is made.
      }
    }
  }

  return NextResponse.json({ received: true });
}
