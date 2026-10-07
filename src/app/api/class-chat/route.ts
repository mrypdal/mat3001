import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.course === "sprint") {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const messages = await prisma.classMessage.findMany({
      where: { user: { course: "mat3001" } },
      include: {
        user: {
          select: { name: true, email: true, role: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("GET Class Chat error:", error);
    return NextResponse.json({ error: 'Failed to fetch class chat' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || session.user.course === "sprint") {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text } = await request.json();
    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const newMsg = await prisma.classMessage.create({
      data: {
        text: text.trim(),
        userId: user.id
      },
      include: {
        user: {
          select: { name: true, email: true, role: true }
        }
      }
    });

    return NextResponse.json(newMsg);
  } catch (error) {
    console.error("POST Class Chat error:", error);
    return NextResponse.json({ error: 'Failed to post message' }, { status: 500 });
  }
}
