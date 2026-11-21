import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams;

  async function sendResetLink(formData: FormData) {
    "use server";
    const email = String(formData.get("email") || "").trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      redirect("/forgot-password?error=اكتب بريدًا إلكترونيًا صحيحًا.");
    }
    const supabase = await createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const redirectTo = new URL("/auth/callback?next=/reset-password", siteUrl).toString();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) redirect("/forgot-password?error=تعذر إرسال رابط الاستعادة الآن. حاول مرة أخرى.");
    redirect("/forgot-password?message=لو البريد مسجل عندنا، هيوصلك رابط لتغيير كلمة المرور.");
  }

  return <main className="auth-page"><section className="auth-card"><Link className="brand centered" href="/"><span className="brand-mark">ب</span><span><b>بالمفهوم</b><small>BELMAFHOOM</small></span></Link><h1>استعادة كلمة المرور</h1><p>اكتب بريدك الإلكتروني وسنبعت لك رابطًا آمنًا لتعيين كلمة مرور جديدة.</p>{params.error && <p className="error">{params.error}</p>}{params.message && <p className="success">{params.message}</p>}<form action={sendResetLink}><label>البريد الإلكتروني<input name="email" type="email" autoComplete="email" required/></label><button className="btn btn-primary" type="submit">إرسال رابط الاستعادة</button></form><p className="auth-foot"><Link href="/login">العودة لتسجيل الدخول</Link></p></section></main>;
}
