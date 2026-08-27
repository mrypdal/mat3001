import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await context.params;
    const { id } = resolvedParams;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const document = await prisma.document.findUnique({
      where: { id },
      include: { sharedWith: true }
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const isOwner = document.ownerId === user.id;
    const share = document.sharedWith.find(s => s.userId === user.id);
    const hasEditPermission = isOwner || share?.permission === 'EDIT' || share?.permission === 'MANAGE';
    const hasManagePermission = isOwner || share?.permission === 'MANAGE';

    if (!hasEditPermission) {
      return NextResponse.json({ error: "Forbidden: No edit permission" }, { status: 403 });
    }

    const data = await request.json();

    // If changing title, ensure they have MANAGE permission (as per user request)
    if (data.title && document.title !== data.title && !hasManagePermission) {
      return NextResponse.json({ error: "Forbidden: Only managers can change the title" }, { status: 403 });
    }

    const updatedDoc = await prisma.document.update({
      where: { id },
      data: {
        ...(data.title ? { title: data.title } : {}),
        ...(data.content ? { content: data.content } : {})
      }
    });

    return NextResponse.json(updatedDoc);
  } catch (error) {
    console.error('Failed to update document:', error);
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await context.params;
    const { id } = resolvedParams;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const document = await prisma.document.findUnique({
      where: { id },
      include: { sharedWith: true }
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const isOwner = document.ownerId === user.id;
    const share = document.sharedWith.find(s => s.userId === user.id);
    const hasManagePermission = isOwner || share?.permission === 'MANAGE';

    if (!hasManagePermission) {
      return NextResponse.json({ error: "Forbidden: No manage permission" }, { status: 403 });
    }

    await prisma.document.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete document:', error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
