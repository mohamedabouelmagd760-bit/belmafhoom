import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams;
  async function signIn(formData: FormData) {
    "use server";
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) redirect("/login?error=" + encodeURIComponent("تعذر تسجيل الدخول. راجع البيانات وحاول مرة أخرى."));
    redirect("/dashboard");
  }
  return <main className="auth-page"><section className="auth-card"><Link className="brand centered" href="/"><span className="brand-mark">ب</span><span><b>بالمفهوم</b><small>BELMAFHOOM</small></span></Link><h1>أهلاً بعودتك</h1><p>سجّل الدخول لمتابعة رحلتك التعليمية.</p>{params.error && <p className="error">{params.error}</p>}{params.message && <p className="success">{params.message}</p>}<form action={signIn}><label>البريد الإلكتروني<input name="email" type="email" autoComplete="email" required/></label><label>كلمة المرور<input name="password" type="password" autoComplete="current-password" required/></label><button className="btn btn-primary" type="submit">تسجيل الدخول</button></form><p className="auth-foot"><Link href="/forgot-password">نسيت كلمة المرور؟</Link></p><p className="auth-foot">لسه معندكش حساب؟ <Link href="/signup">أنشئ حساب</Link></p></section></main>;
}
