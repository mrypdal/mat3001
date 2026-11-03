"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

/** Felles tilgangskontroll for sprintsidene: sender uinnloggede til innlogging og andre brukere til forsiden. */
export function useSprintAccess() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user;
  const hasAccess = !!user && (user.course === "sprint" || user.role === "admin");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/sprint/login");
    else if (status === "authenticated" && !hasAccess) router.replace("/");
  }, [status, hasAccess, router]);

  return { user, hasAccess, ready: status !== "loading" && hasAccess };
}
