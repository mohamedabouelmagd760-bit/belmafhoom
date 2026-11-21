import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?error=افتح رابط الاستعادة من بريدك الإلكتروني أولًا.");

  async function updatePassword(formData: FormData) {
    "use server";
    const password = String(formData.get("password") || "");
    const confirm = String(formData.get("confirm_password") || "");
    if (password.length < 8) redirect("/reset-password?error=كلمة المرور يجب ألا تقل عن 8 أحرف.");
    if (password !== confirm) redirect("/reset-password?error=كلمتا المرور غير متطابقتين.");
    const client = await createClient();
    const { data: { user: currentUser } } = await client.auth.getUser();
    if (!currentUser) redirect("/login?error=انتهت صلاحية رابط الاستعادة. اطلب رابطًا جديدًا.");
    const { error } = await client.auth.updateUser({ password });
    if (error) redirect("/reset-password?error=تعذر تحديث كلمة المرور. اطلب رابطًا جديدًا.");
    await client.auth.signOut();
    redirect("/login?message=تم تغيير كلمة المرور بنجاح. سجّل الدخول بكلمتك الجديدة.");
  }

  return <main className="auth-page"><section className="auth-card"><Link className="brand centered" href="/"><span className="brand-mark">ب</span><span><b>بالمفهوم</b><small>BELMAFHOOM</small></span></Link><h1>تعيين كلمة مرور جديدة</h1><p>اختار كلمة مرور قوية لا تقل عن 8 أحرف.</p>{params.error && <p className="error">{params.error}</p>}<form action={updatePassword}><label>كلمة المرور الجديدة<input name="password" type="password" minLength={8} autoComplete="new-password" required/></label><label>تأكيد كلمة المرور<input name="confirm_password" type="password" minLength={8} autoComplete="new-password" required/></label><button className="btn btn-primary" type="submit">حفظ كلمة المرور</button></form></section></main>;
}
