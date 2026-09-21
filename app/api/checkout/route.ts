import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

const checkoutSchema = z.object({ moduleId: z.string().min(1) });

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const module_ = await prisma.module.findUnique({
    where: { id: parsed.data.moduleId },
    include: { publishedVersion: true },
  });
  if (!module_ || module_.visibility === "PRIVATE" || !module_.publishedVersion) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (module_.priceCents <= 0) {
    return NextResponse.json({ error: "This module is free — acquire it directly." }, { status: 400 });
  }
  if (module_.ownerId === session.user.id) {
    return NextResponse.json({ error: "You already own this module." }, { status: 400 });
  }

  const existing = await prisma.acquisition.findUnique({
    where: { userId_moduleId: { userId: session.user.id, moduleId: module_.id } },
  });
  if (existing) {
    return NextResponse.json({ error: "You already acquired this module." }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: module_.currency,
          unit_amount: module_.priceCents,
          product_data: { name: module_.title, description: module_.description },
        },
        quantity: 1,
      },
    ],
    metadata: {
      moduleId: module_.id,
      moduleVersionId: module_.publishedVersion.id,
      buyerId: session.user.id,
    },
    success_url: `${appUrl}/marketplace/${module_.slug}?purchase=success`,
    cancel_url: `${appUrl}/marketplace/${module_.slug}?purchase=cancelled`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
