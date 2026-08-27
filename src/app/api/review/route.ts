import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, content } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API Key is missing.' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const systemPrompt = `You are a helpful and expert mathematics professor. A student has written some notes/documentation on Calculus of Variations.
Your job is to read their document, review the mathematical content, and provide constructive feedback.
- Highlight any mathematical errors or unclear formulations.
- Suggest improvements for clarity.
- Check if their LaTeX formatting is correct.
- Keep your tone encouraging and educational.
IMPORTANT: You must always respond in English. Do not apologize for answering in English, just naturally provide the review in English.
Format your response using Markdown, and use $...$ for inline math and $$...$$ for display math.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Here is my document titled "${title}":\n\n${content}` }
      ],
      temperature: 0.7,
    });

    const aiMessage = response.choices[0].message.content;

    return NextResponse.json({ review: aiMessage });
  } catch (error) {
    console.error('AI Review Error:', error);
    return NextResponse.json(
      { error: 'An error occurred during AI Review.' },
      { status: 500 }
    );
  }
}
