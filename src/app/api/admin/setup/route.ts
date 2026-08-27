import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const adminExists = await prisma.user.findFirst({ where: { role: "admin" } });
    
    if (adminExists) {
      return NextResponse.json({ message: "Admin already exists." });
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);
    
    await prisma.user.create({
      data: {
        name: "Admin User",
        email: "admin@admin.com",
        password: hashedPassword,
        role: "admin",
      }
    });

    return NextResponse.json({ 
      message: "Admin created successfully!", 
      credentials: "Email: admin@admin.com | Password: admin123" 
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create admin" }, { status: 500 });
  }
}
