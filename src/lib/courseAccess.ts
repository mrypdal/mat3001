import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

/** Returnerer innlogget bruker hvis den har tilgang til sprintkurset (sprint-bruker, lærer med sprint, eller admin). */
export async function getSprintUser() {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  if (!user?.id) return null;
  if (user.role === "admin" || user.course === "sprint") return user;
  return null;
}

export function isStaff(role: string | undefined) {
  return role === "admin" || role === "teacher";
}
