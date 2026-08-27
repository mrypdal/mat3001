import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'admin' && session.user.role !== 'teacher')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Since next 15+, params is a promise but this is next 14 so it's direct? 
    // Wait, let's just await it just in case Next 15 is used. But wait, Next is 16.3.1 (actually 14 or 15 but package.json says 16.3.1, Turbopack). Next 15 requires awaiting params.
    const resolvedParams = await context.params;
    const { id } = resolvedParams;
    const data = await request.json();

    const slide = await prisma.slide.update({
      where: { originalId: id },
      data: {
        title: data.title,
        content: data.content
      }
    });

    return NextResponse.json(slide);
  } catch (error) {
    console.error('Failed to update slide:', error);
    return NextResponse.json({ error: "Failed to update slide" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'admin' && session.user.role !== 'teacher')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const resolvedParams = await context.params;
    const { id } = resolvedParams;

    await prisma.slide.delete({
      where: { originalId: id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete slide:', error);
    return NextResponse.json({ error: "Failed to delete slide" }, { status: 500 });
  }
}
