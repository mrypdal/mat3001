import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSprintUser, isStaff } from "@/lib/courseAccess";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSprintUser();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await context.params;
    const result = await prisma.sprintResult.findUnique({ where: { id } });
    if (!result) return NextResponse.json({ error: "Ikke funnet" }, { status: 404 });

    if (result.createdById !== user.id && !isStaff(user.role)) {
      return NextResponse.json({ error: "Du kan bare slette resultater du selv har lagt inn" }, { status: 403 });
    }

    await prisma.sprintResult.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE sprint result error:", error);
    return NextResponse.json({ error: "Kunne ikke slette resultat" }, { status: 500 });
  }
}
