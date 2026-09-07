import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/** Ensures a logged-in staff member. Redirects to /login otherwise. */
export async function requireStaff() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/** Ensures a logged-in ADMIN. Redirects otherwise. */
export async function requireAdmin() {
  const user = await requireStaff();
  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }
  return user;
}
