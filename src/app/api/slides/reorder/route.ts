import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request) {
  try {
    const { updates } = await request.json(); // Array of { id, order }

    // Execute updates in a transaction
    await prisma.$transaction(
      updates.map((update: { id: string; order: number }) =>
        prisma.slide.update({
          where: { id: update.id },
          data: { order: update.order }
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to reorder slides:', error);
    return NextResponse.json({ error: "Failed to reorder slides" }, { status: 500 });
  }
}
