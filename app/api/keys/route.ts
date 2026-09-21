import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { decryptSecret, encryptSecret, maskSecret } from "@/lib/crypto";
import { AI_PROVIDERS } from "@/types/graph";

const createSchema = z.object({
  provider: z.enum(AI_PROVIDERS),
  label: z.string().min(1).max(60),
  apiKey: z.string().min(1).max(500),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const keys = await prisma.apiKey.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    keys.map((k) => ({
      id: k.id,
      provider: k.provider,
      label: k.label,
      masked: maskSecret(decryptSecret(k.encryptedKey)),
      createdAt: k.createdAt,
    })),
  );
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const { provider, label, apiKey } = parsed.data;
  const encryptedKey = encryptSecret(apiKey);

  const created = await prisma.apiKey.create({
    data: { userId: session.user.id, provider, label, encryptedKey },
  });

  return NextResponse.json({
    id: created.id,
    provider: created.provider,
    label: created.label,
    masked: maskSecret(apiKey),
    createdAt: created.createdAt,
  });
}
