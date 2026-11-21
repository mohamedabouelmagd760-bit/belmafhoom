import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EnrollmentAction from "./enrollment-action";

export const dynamic = "force-dynamic";

export default async function CourseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: course, error } = await supabase
    .from("courses")
    .select("id,teacher_id,title,description,price,is_free,subjects(name),grades(name)")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();
  if (error || !course) notFound();

  const { data: sections } = await supabase
    .from("course_sections")
    .select("id,title,sort_order,lessons(id,is_preview)")
    .eq("course_id", id)
    .order("sort_order");
  const { data: { user } } = await supabase.auth.getUser();
  let enrollment: { id: string; status: string; proof_path: string | null } | null = null;
  let role: string | null = null;
  if (user) {
    const [enrollmentResult, profileResult] = await Promise.all([
      supabase.from("course_enrollments").select("id,status,proof_path").eq("course_id", id).eq("student_id", user.id).maybeSingle(),
      supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
    ]);
    enrollment = enrollmentResult.data;
    role = profileResult.data?.role ?? null;
  }

  const subject = (course.subjects as unknown as { name: string } | null)?.name;
  const grade = (course.grades as unknown as { name: string } | null)?.name;
  const hasPreview = !!sections?.some((section: any) => section.lessons?.some((lesson: any) => lesson.is_preview));
  return <main className="page-shell wrap">
    <header className="dash-head"><Link className="brand" href="/"><span className="brand-mark">ب</span><span><b>بالمفهوم</b><small>BELMAFHOOM</small></span></Link><Link className="btn btn-light" href="/courses">كل الكورسات</Link></header>
    <section className="course-detail">
      <span className="tag">{subject || "مادة تعليمية"} • {grade || "كل الصفوف"}</span>
      <h1>{course.title}</h1>
      <p>{course.description || "تفاصيل الكورس هتظهر هنا."}</p>
      <div className="course-price">{course.is_free ? "كورس مجاني" : `${Number(course.price).toLocaleString("ar-EG")} جنيه`}</div>
      {!user ? <Link className="btn btn-primary" href="/login">سجّل الدخول للاشتراك</Link>
        : role === "student" && enrollment?.status === "active" ? <Link className="btn btn-primary" href={`/learn/${course.id}`}>ادخل الكورس وابدأ التعلم</Link>
        : role === "student" && hasPreview ? <><Link className="btn btn-light" href={`/learn/${course.id}`}>مشاهدة المعاينة المجانية</Link><EnrollmentAction courseId={course.id} userId={user.id} isFree={course.is_free} price={Number(course.price)} initialEnrollment={enrollment} /></>
        : role === "student" ? <EnrollmentAction courseId={course.id} userId={user.id} isFree={course.is_free} price={Number(course.price)} initialEnrollment={enrollment} />
        : <div className="notice">الاشتراك في الكورسات متاح لحسابات الطلاب فقط.</div>}
    </section>
    <section className="section compact-section">
      <h2>محتويات الكورس</h2>
      {sections?.length ? <div className="stack-list">{sections.map((section, index) => <div className="list-row" key={section.id}><span className="number-chip">{index + 1}</span><div><b>{section.title}</b><small>وحدة تعليمية</small></div></div>)}</div>
        : <div className="empty-state small-empty"><p>لم يضف المدرس وحدات للكورس بعد.</p></div>}
    </section>
  </main>;
}
