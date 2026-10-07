import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSprintUser } from "@/lib/courseAccess";

// Alle testpersoner med resultater (felles datasett for hele kurset).
export async function GET() {
  try {
    const user = await getSprintUser();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const subjects = await prisma.sprintSubject.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        createdBy: { select: { name: true, email: true } },
        results: {
          orderBy: [{ startM: "asc" }, { endM: "asc" }, { createdAt: "asc" }],
          include: { createdBy: { select: { name: true, email: true } } },
        },
      },
    });
    return NextResponse.json(subjects);
  } catch (error) {
    console.error("GET sprint subjects error:", error);
    return NextResponse.json({ error: "Kunne ikke hente testpersoner" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSprintUser();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { name } = await request.json();
    const trimmed = typeof name === "string" ? name.trim() : "";
    if (!trimmed || trimmed.length > 80) {
      return NextResponse.json({ error: "Navn må være mellom 1 og 80 tegn" }, { status: 400 });
    }

    const subject = await prisma.sprintSubject.create({
      data: { name: trimmed, createdById: user.id },
      include: {
        createdBy: { select: { name: true, email: true } },
        results: true,
      },
    });
    return NextResponse.json(subject, { status: 201 });
  } catch (error) {
    console.error("POST sprint subject error:", error);
    return NextResponse.json({ error: "Kunne ikke opprette testperson" }, { status: 500 });
  }
}
