import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'WRITING';

    const ownedDocuments = await prisma.document.findMany({
      where: { ownerId: user.id, docType: type },
      include: { owner: { select: { name: true, email: true } } },
      orderBy: { updatedAt: 'desc' }
    });

    const sharedDocuments = await prisma.documentShare.findMany({
      where: { userId: user.id, document: { docType: type } },
      include: {
        document: {
          include: { owner: { select: { name: true, email: true } } }
        }
      }
    });

    return NextResponse.json({
      owned: ownedDocuments,
      shared: sharedDocuments.map(share => ({ ...share.document, permission: share.permission }))
    });
  } catch (error) {
    console.error('Failed to fetch documents:', error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { title, content, type } = await request.json();
    const docType = type === 'ASSIGNMENT' ? 'ASSIGNMENT' : 'WRITING';

    if (docType === 'ASSIGNMENT' && user.role === 'student') {
      return NextResponse.json({ error: "Students cannot create assignments" }, { status: 403 });
    }

    const writingTemplate = `Welcome to MAT3001 Writing Mode!

Here you can write your mathematical notes and derivations.

### Mathematical Formatting

You can write **inline equations** by wrapping them in single dollar signs. For example, Euler's formula is $e^{i\\pi} + 1 = 0$.

For **display equations** (centered on their own line), use double dollar signs:

$$
\\mathcal{L}(q, \\dot{q}, t) = T - V
$$

$$
\\frac{d}{dt} \\left( \\frac{\\partial \\mathcal{L}}{\\partial \\dot{q}_i} \\right) - \\frac{\\partial \\mathcal{L}}{\\partial q_i} = 0
$$

Click **Edit** to modify this document or clear the template.`;

    const assignmentTemplate = `### Assignment: [Topic]

Please solve the following problems and show your work.

**Problem 1:**
Solve the Euler-Lagrange equation for the functional:
$$
J[y] = \\int_{x_1}^{x_2} L(x, y, y') dx
$$
`;

    const defaultTemplate = docType === 'ASSIGNMENT' ? assignmentTemplate : writingTemplate;

    const newDoc = await prisma.document.create({
      data: {
        title: title || (docType === 'ASSIGNMENT' ? "New Assignment" : "New Document"),
        content: content || defaultTemplate,
        docType: docType,
        ownerId: user.id
      }
    });

    return NextResponse.json(newDoc);
  } catch (error) {
    console.error('Failed to create document:', error);
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
  }
}
