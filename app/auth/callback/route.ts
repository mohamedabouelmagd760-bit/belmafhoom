import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const requestedNext = requestUrl.searchParams.get("next") || "/dashboard";
  const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin;
  let next = "/dashboard";
  try {
    const base = new URL(siteOrigin);
    const destination = new URL(requestedNext, base);
    if (destination.origin === base.origin) {
      next = `${destination.pathname}${destination.search}${destination.hash}`;
    }
  } catch {
    next = "/dashboard";
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, siteOrigin));
  }

  return NextResponse.redirect(new URL("/login?error=تعذر تأكيد البريد. حاول مرة أخرى.", siteOrigin));
}
