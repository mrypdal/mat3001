import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSprintUser, isStaff } from "@/lib/courseAccess";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSprintUser();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await context.params;
    const subject = await prisma.sprintSubject.findUnique({ where: { id } });
    if (!subject) return NextResponse.json({ error: "Ikke funnet" }, { status: 404 });

    if (subject.createdById !== user.id && !isStaff(user.role)) {
      return NextResponse.json({ error: "Du kan bare slette testpersoner du selv har lagt inn" }, { status: 403 });
    }

    await prisma.sprintSubject.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE sprint subject error:", error);
    return NextResponse.json({ error: "Kunne ikke slette testperson" }, { status: 500 });
  }
}
