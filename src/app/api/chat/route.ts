import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { messages, pageContext } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API Key is missing in the environment variables.' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Fetch all slides from the database to build the knowledge base
    const slides = await prisma.slide.findMany({
      orderBy: { order: 'asc' }
    });

    // Compile the slides into a Markdown document
    const slideContent = slides.map(s => `## ${s.title}\n${s.content}`).join('\n\n');

    // Load PDF knowledge base
    const pdfPath = path.join(process.cwd(), 'src', 'data', 'pdf_knowledge.txt');
    let pdfContent = "";
    try {
      if (fs.existsSync(pdfPath)) {
        pdfContent = fs.readFileSync(pdfPath, 'utf-8');
      }
    } catch (e) {
      console.error("Failed to read PDF knowledge base:", e);
    }

    const systemPrompt = `You are a helpful teaching assistant chatbot for the course MAT3001 (Calculus of Variations). 
Your goal is to answer student questions accurately and patiently. 
You MUST base your answers on the course material provided below (both the slides and the full syllabus textbook).
If a question is outside the scope of the course material, politely let the user know.

IMPORTANT: You must always respond in English, regardless of the language the user asks the question in. Do not apologize for answering in English, just naturally provide the answer in English.

Use Markdown for formatting, and use KaTeX for math (e.g. $E=mc^2$ for inline math and $$E=mc^2$$ for block math).

--- 

${pageContext ? `## CURRENT USER CONTEXT\nThe user is currently looking at this specific content on their screen. Use this context to answer questions like "explain this to me" or "solve this assignment":\n${pageContext}\n\n---` : ""}

### Course Slides Database:
${slideContent}

---
COURSE TEXTBOOK (Calculus of Variations):
${pdfContent}
`;

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: apiMessages,
    });

    return NextResponse.json({
      reply: response.choices[0].message.content
    });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during chat processing.' },
      { status: 500 }
    );
  }
}
