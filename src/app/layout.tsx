import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Providers } from "@/components/Providers";
import Chatbot from "@/components/Chatbot";
import ClassChat from "@/components/ClassChat";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import "katex/dist/katex.min.css";

export const metadata: Metadata = {
  title: "MAT3001 - Calculus of Variations",
  description: "Course Slides and Interactive Notebooks",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <head>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          {children}
          <div style={{ position: "fixed", bottom: "2rem", right: "2rem", display: "flex", gap: "1rem", zIndex: 1000 }}>
            <ClassChat />
            <Chatbot />
          </div>
        </Providers>
      </body>
    </html>
  );
}
