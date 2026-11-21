import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export default async function NewCoursePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [{ data: profile }, { data: subjects }, { data: grades }] = await Promise.all([
    supabase.from("profiles").select("role,account_status").eq("id", user.id).maybeSingle(),
    supabase.from("subjects").select("id,name").eq("is_active", true).order("sort_order"),
    supabase.from("grades").select("id,name,stage_id").eq("is_active", true).order("sort_order")
  ]);
  if (profile?.role !== "teacher" || profile.account_status !== "active") redirect("/dashboard");

  async function createCourse(formData: FormData) {
    "use server";
    const client = await createClient();
    const { data: { user: currentUser } } = await client.auth.getUser();
    if (!currentUser) redirect("/login");
    const title = String(formData.get("title") || "").trim();
    const subjectId = String(formData.get("subject_id") || "");
    const gradeId = String(formData.get("grade_id") || "");
    const description = String(formData.get("description") || "").trim();
    const isFree = formData.get("is_free") === "on";
    const price = isFree ? 0 : Number(formData.get("price") || 0);
    if (title.length < 4 || !subjectId || !gradeId || !Number.isFinite(price) || price < 0) redirect("/dashboard/courses/new?error=راجع بيانات الكورس.");
    const { error } = await client.from("courses").insert({ teacher_id: currentUser.id, title, slug: `course-${randomUUID()}`, subject_id: subjectId, grade_id: gradeId, description: description || null, is_free: isFree, price, currency: "EGP", status: "draft" });
    if (error) redirect("/dashboard/courses/new?error=تعذر إنشاء الكورس. تأكد من اعتماد حساب المدرس وصحة البيانات.");
    redirect("/dashboard?message=course-created");
  }

  return <main className="page-shell wrap"><header className="dash-head"><Link className="brand" href="/"><span className="brand-mark">ب</span><span><b>بالمفهوم</b><small>BELMAFHOOM</small></span></Link><Link className="btn btn-light" href="/dashboard">العودة للوحة التحكم</Link></header><section className="page-intro"><span className="eyebrow">مساحة المدرس</span><h1>إنشاء كورس جديد</h1><p>الكورس هيتحفظ كمسودة، والنشر متاح بعد استيفاء شروط الاعتماد.</p></section>
    {params.error && <p className="error">{params.error}</p>}
    {profile.account_status !== "active" && <p className="notice">حالة حسابك الحالية: {profile.account_status}. قد تمنعك صلاحيات قاعدة البيانات من إنشاء كورس حتى تفعيل الحساب.</p>}
    <section className="form-panel"><form action={createCourse} className="form-grid"><label className="field-wide">اسم الكورس<input name="title" required minLength={4} maxLength={140} placeholder="مثال: تأسيس النحو من البداية"/></label><label>المادة<select name="subject_id" required defaultValue=""><option value="" disabled>اختار المادة</option>{(subjects || []).map((s: any)=><option value={s.id} key={s.id}>{s.name}</option>)}</select></label><label>الصف الدراسي<select name="grade_id" required defaultValue=""><option value="" disabled>اختار الصف</option>{(grades || []).map((g: any)=><option value={g.id} key={g.id}>{g.name}</option>)}</select></label><label className="field-wide">وصف الكورس<textarea name="description" rows={4} maxLength={3000} placeholder="اكتب للطلاب هيتعلموا إيه في الكورس..."/></label><label className="checkbox-field"><input type="checkbox" name="is_free"/> الكورس مجاني</label><label>السعر بالجنيه<input name="price" type="number" min="0" step="0.01" defaultValue="0"/></label><div className="field-wide form-actions"><button className="btn btn-primary" type="submit">حفظ كمسودة</button><Link className="btn btn-light" href="/dashboard">إلغاء</Link></div></form></section>
  </main>;
}
