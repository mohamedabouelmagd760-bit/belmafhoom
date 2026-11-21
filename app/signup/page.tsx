import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams;
  async function signUp(formData: FormData) {
    "use server";
    const displayName = String(formData.get("display_name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const password = String(formData.get("password") || "");
    const role = String(formData.get("role") || "student");
    if (!["student", "teacher", "guardian"].includes(role)) redirect("/signup?error=" + encodeURIComponent("نوع الحساب غير صحيح."));
    if (displayName.length < 3 || password.length < 8) redirect("/signup?error=" + encodeURIComponent("راجع الاسم وكلمة المرور."));
    const supabase = await createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const emailRedirectTo = new URL("/auth/callback", siteUrl).toString();
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo, data: { display_name: displayName, full_name: displayName, phone, role } }
    });
    if (error) redirect("/signup?error=" + encodeURIComponent("تعذر إنشاء الحساب. قد يكون البريد مستخدمًا بالفعل."));
    redirect("/login?message=" + encodeURIComponent("تم إرسال رسالة تأكيد إلى بريدك الإلكتروني. افتحها لتفعيل الحساب."));
  }
  return <main className="auth-page"><section className="auth-card"><Link className="brand centered" href="/"><span className="brand-mark">ب</span><span><b>بالمفهوم</b><small>BELMAFHOOM</small></span></Link><h1>إنشاء حساب جديد</h1><p>اختار نوع الحساب وابدأ رحلتك مع بالمفهوم.</p>{params.error && <p className="error">{params.error}</p>}<form action={signUp}><label>نوع الحساب<select name="role" required defaultValue="student"><option value="student">طالب</option><option value="teacher">مدرس</option><option value="guardian">ولي أمر</option></select></label><label>الاسم بالكامل<input name="display_name" minLength={3} required autoComplete="name"/></label><label>البريد الإلكتروني<input name="email" type="email" required autoComplete="email"/></label><label>رقم الهاتف<input name="phone" type="tel" required autoComplete="tel"/></label><label>كلمة المرور<input name="password" type="password" minLength={8} required autoComplete="new-password"/></label><button className="btn btn-primary" type="submit">إنشاء الحساب</button></form><p className="auth-foot">عندك حساب بالفعل؟ <Link href="/login">سجّل الدخول</Link></p><p className="demo-note">حساب المدرس يبدأ قيد المراجعة ولا يحصل على صلاحية نشر الكورسات قبل اعتماده.</p></section></main>;
}
