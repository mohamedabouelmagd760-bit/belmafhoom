import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Re-check admin privileges on the server for every protected page/action.
 * Both the trusted JWT app_metadata claim and the profile role must agree.
 */
export async function requireAdmin() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();

  if (!user) redirect("/login");
  if (user.app_metadata?.role !== "admin") redirect("/dashboard");

  const { data: profile } = await client
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") redirect("/dashboard");

  return { client, user };
}
