import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSprintUser } from "@/lib/courseAccess";

export async function POST(request: Request) {
  try {
    const user = await getSprintUser();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const subjectId = body.subjectId;
    const startM = Number(body.startM);
    const endM = Number(body.endM);
    const timeS = Number(body.timeS);

    if (typeof subjectId !== "string" || !subjectId) {
      return NextResponse.json({ error: "Mangler testperson" }, { status: 400 });
    }
    if (![startM, endM, timeS].every(Number.isFinite)) {
      return NextResponse.json({ error: "Start, slutt og tid må være tall" }, { status: 400 });
    }
    if (startM < 0 || endM <= startM || endM > 60) {
      return NextResponse.json({ error: "Strekningen må oppfylle 0 ≤ start < slutt ≤ 60 m" }, { status: 400 });
    }
    if (timeS <= 0.2 || timeS >= 15) {
      return NextResponse.json({ error: "Tiden må være mellom 0,2 og 15 sekunder" }, { status: 400 });
    }

    const subject = await prisma.sprintSubject.findUnique({ where: { id: subjectId } });
    if (!subject) return NextResponse.json({ error: "Testpersonen finnes ikke" }, { status: 404 });

    const result = await prisma.sprintResult.create({
      data: { subjectId, startM, endM, timeS, createdById: user.id },
      include: { createdBy: { select: { name: true, email: true } } },
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("POST sprint result error:", error);
    return NextResponse.json({ error: "Kunne ikke lagre resultat" }, { status: 500 });
  }
}
