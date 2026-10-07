"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Chatbot from "@/components/Chatbot";
import ClassChat from "@/components/ClassChat";

const PUBLIC_PREFIXES = ["/sprint", "/login", "/register", "/api"];

/**
 * - Sender sprint-studenter bort fra MAT3001-sidene.
 * - Viser MAT3001-chatboten og klassechatten bare utenfor /sprint.
 */
export default function CourseShell() {
  const { data: session } = useSession();
  const pathname = usePathname() || "/";
  const router = useRouter();

  const isSprintUser = session?.user?.course === "sprint" && session?.user?.role !== "admin";
  const onSprint = pathname.startsWith("/sprint");

  useEffect(() => {
    if (isSprintUser && !PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
      router.replace("/sprint");
    }
  }, [isSprintUser, pathname, router]);

  if (onSprint || isSprintUser) return null;

  return (
    <div style={{ position: "fixed", bottom: "2rem", right: "2rem", display: "flex", gap: "1rem", zIndex: 1000 }}>
      <ClassChat />
      <Chatbot />
    </div>
  );
}
