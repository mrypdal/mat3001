import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const slides = await prisma.slide.findMany({
      orderBy: { order: 'asc' }
    });
    return NextResponse.json(slides);
  } catch (error) {
    console.error('Failed to fetch slides:', error);
    return NextResponse.json({ error: "Failed to fetch slides" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { title, content, order } = await request.json();
    
    // Shift the order of all slides that come after the new one
    await prisma.slide.updateMany({
      where: { order: { gte: order } },
      data: { order: { increment: 1 } }
    });

    const newSlide = await prisma.slide.create({
      data: {
        title: title || "New Slide",
        content: content || "Add content here...",
        originalId: `slide-${Date.now()}`,
        order: order
      }
    });

    return NextResponse.json(newSlide);
  } catch (error) {
    console.error('Failed to create slide:', error);
    return NextResponse.json({ error: "Failed to create slide" }, { status: 500 });
  }
}
