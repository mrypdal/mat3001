import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await context.params;
    const { id } = resolvedParams;

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        sharedWith: {
          include: { user: { select: { id: true, name: true, email: true } } }
        }
      }
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json(document.sharedWith.map(s => ({
      userId: s.userId,
      name: s.user.name,
      email: s.user.email,
      permission: s.permission
    })));
  } catch (error) {
    console.error('Failed to fetch shares:', error);
    return NextResponse.json({ error: "Failed to fetch shares" }, { status: 500 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
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

    const { shares } = await request.json(); // Array of { userId, permission }

    // Enforce ASSIGNMENT student rule
    const targetUsers = await prisma.user.findMany({
      where: { id: { in: shares.map((s: any) => s.userId) } }
    });
    
    const validShares = shares.map((s: any) => {
      const tUser = targetUsers.find(u => u.id === s.userId);
      let perm = s.permission;
      if (document.docType === 'ASSIGNMENT' && tUser?.role === 'student') {
        perm = 'READ';
      }
      return {
        documentId: id,
        userId: s.userId,
        permission: perm
      };
    });

    // Execute in transaction: Delete all current shares and re-insert them
    await prisma.$transaction([
      prisma.documentShare.deleteMany({
        where: { documentId: id }
      }),
      prisma.documentShare.createMany({
        data: validShares
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update shares:', error);
    return NextResponse.json({ error: "Failed to update shares" }, { status: 500 });
  }
}
