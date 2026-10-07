import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { name, email, password, course, joinCode } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 });
    }

    const userCourse = course === "sprint" ? "sprint" : "mat3001";

    if (userCourse === "sprint") {
      const expected = process.env.SPRINT_JOIN_CODE;
      if (!expected) {
        return NextResponse.json({ message: "Registrering er ikke åpnet for dette kurset ennå." }, { status: 403 });
      }
      if (!joinCode || String(joinCode).trim() !== expected.trim()) {
        return NextResponse.json({ message: "Feil tilgangskode." }, { status: 403 });
      }
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ message: "User already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        course: userCourse,
      }
    });

    return NextResponse.json({ message: "User created successfully" }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
