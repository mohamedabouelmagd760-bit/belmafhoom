import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

const roleLabels: Record<string, string> = { student: "الطالب", teacher: "المدرس", guardian: "ولي الأمر", admin: "الإدارة" };
const statusLabels: Record<string, string> = { active: "نشط", pending: "قيد المراجعة", suspended: "موقوف", rejected: "مرفوض" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("display_name, role, account_status").eq("id", user.id).maybeSingle();
  if (!profile) return <main className="dashboard wrap"><p className="notice error">لم نتمكن من تحميل ملف الحساب. تواصل مع الدعم.</p></main>;

  const [{ data: notifications }, { count: unreadCount }] = await Promise.all([
    supabase.from("notifications").select("id,title,body,created_at,read_at,entity_type,entity_id").order("created_at", { ascending: false }).limit(8),
    supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null)
  ]);

  let teacherReview = "";
  let courses: any[] = [];
  let enrollments: any[] = [];
  let assignments: any[] = [];
  if (profile.role === "teacher") {
    const [{ data: teacher }, { data: teacherCourses }] = await Promise.all([
      supabase.from("teacher_profiles").select("review_status,review_note").eq("user_id", user.id).maybeSingle(),
      supabase.from("courses").select("id,title,status,created_at").eq("teacher_id", user.id).order("created_at", { ascending: false }).limit(8)
    ]);
    teacherReview = teacher?.review_status || "pending";
    courses = teacherCourses || [];
  } else if (profile.role === "student") {
    const { data: studentEnrollments } = await supabase.from("course_enrollments").select("id,status,created_at,course_id,courses(id,title,description)").eq("student_id", user.id).order("created_at", { ascending: false }).limit(20);
    enrollments = studentEnrollments || [];
    const activeCourseIds = enrollments.filter((x:any) => x.status === "active").map((x:any) => x.course_id);
    if (activeCourseIds.length) {
      const { data: studentAssignments } = await supabase.from("assignments").select("id,title,due_at,max_points,courses(title)").in("course_id", activeCourseIds).eq("status", "published").order("due_at", { ascending: true }).limit(6);
      assignments = studentAssignments || [];
    }
  }

  async function signOut() {
    "use server";
    const client = await createClient();
    await client.auth.signOut();
    redirect("/");
  }
  async function markRead(formData: FormData) {
    "use server";
    const id = String(formData.get("notification_id") || "");
    const client = await createClient();
    const { data: { user: currentUser } } = await client.auth.getUser();
    if (!currentUser || !id) return;
    await client.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id).eq("recipient_id", currentUser.id);
    redirect("/dashboard");
  }
  async function deleteNotification(formData: FormData) {
    "use server";
    const id = String(formData.get("notification_id") || "");
    const client = await createClient();
    const { data: { user: currentUser } } = await client.auth.getUser();
    if (!currentUser || !id) return;
    await client.from("notifications").delete().eq("id", id).eq("recipient_id", currentUser.id);
    redirect("/dashboard");
  }

  return <main className="dashboard wrap"><header className="dash-head"><Link className="brand" href="/"><span className="brand-mark">ب</span><span><b>بالمفهوم</b><small>BELMAFHOOM</small></span></Link><div className="form-actions"><Link className="btn btn-light" href="/dashboard/profile">الملف الشخصي</Link><form action={signOut}><button className="btn btn-light">تسجيل الخروج</button></form></div></header>
    <section className="dash-welcome"><span className="eyebrow">مساحتك التعليمية</span><h1>أهلًا {profile.display_name || user.email}</h1><p>نوع الحساب: {roleLabels[profile.role] || "مستخدم"} • حالة الحساب: {statusLabels[profile.account_status] || profile.account_status}</p></section>
    {profile.role === "teacher" && <>
      <section className="panel-card"><div className="section-head"><div><span className="eyebrow">حساب المدرس</span><h2>حالة الاعتماد: {teacherReview === "approved" ? "معتمد" : teacherReview === "rejected" ? "غير معتمد" : "قيد المراجعة"}</h2><p>{teacherReview === "approved" ? "تقدر تبدأ في تجهيز ونشر محتواك حسب صلاحية حسابك." : "تقدر تجهز كورساتك كمسودات، والنشر متاح بعد اعتماد الإدارة."}</p></div>{profile.account_status === "active" && <Link className="btn btn-primary" href="/dashboard/courses/new">إنشاء كورس جديد</Link>}</div></section>
      <section className="section compact-section"><div className="section-head"><div><span className="eyebrow">إدارة المحتوى</span><h2>كورساتي</h2></div></div>{courses.length ? <div className="stack-list">{courses.map(course => <div className="list-row" key={course.id}><div><b>{course.title}</b><small>الحالة: {course.status === "published" ? "منشور" : course.status === "draft" ? "مسودة" : course.status}</small></div><Link className="btn btn-light" href={`/dashboard/courses/${course.id}/manage`}>إدارة الكورس</Link></div>)}</div> : <div className="empty-state small-empty"><p>لسه ما أنشأتش أي كورس.</p>{profile.account_status === "active" && <Link className="btn btn-primary" href="/dashboard/courses/new">ابدأ بأول كورس</Link>}</div>}</section>
      <section className="section compact-section"><div className="form-actions"><Link className="btn btn-light" href="/dashboard/assignments">الواجبات والتصحيح</Link><Link className="btn btn-light" href="/dashboard/exams">الامتحانات</Link><Link className="btn btn-light" href="/dashboard/subscription">اشتراك المنصة</Link></div></section>
    </>}
    {profile.role === "student" && <section className="cards" style={{marginTop:24}}><article className="panel-card"><span className="eyebrow">اشتراكاتك</span><h2>{enrollments.filter((x:any)=>x.status==="active").length}</h2><p>كورسات مفعّلة</p></article><article className="panel-card"><span className="eyebrow">مهامك</span><h2>{assignments.length}</h2><p>واجبات منشورة في كورساتك</p></article><article className="panel-card"><span className="eyebrow">المتابعة</span><h2>{enrollments.filter((x:any)=>x.status==="pending").length}</h2><p>طلبات اشتراك قيد المراجعة</p></article></section>}
    {profile.role === "student" && <section className="section compact-section"><div className="section-head"><div><span className="eyebrow">رحلتك التعليمية</span><h2>كورساتي</h2></div><Link className="text-link" href="/courses">اكتشف كورسات ←</Link></div>{enrollments.length ? <div className="stack-list">{enrollments.map((item: any) => <div className="list-row" key={item.id}><div><b>{item.courses?.title || "كورس"}</b><small>حالة الاشتراك: {item.status === "active" ? "مفعل" : item.status === "pending" ? "قيد المراجعة" : item.status}</small></div><Link className="btn btn-light" href={`/learn/${item.courses?.id || ""}`}>فتح الكورس</Link></div>)}</div> : <div className="empty-state small-empty"><p>لسه مشتركش في أي كورس.</p><Link className="btn btn-primary" href="/courses">تصفح الكورسات</Link></div>}</section>}
    {profile.role === "guardian" && <section className="panel-card"><h2>حساب ولي الأمر</h2><p>تابع اشتراكات الأبناء بعد موافقتهم على الربط.</p><Link className="btn btn-primary" href="/dashboard/guardian">إدارة الأبناء</Link></section>}
    {profile.role === "admin" && <section className="panel-card"><h2>لوحة الإدارة</h2><p>مراجعة الاعتمادات والاشتراكات وإدارة الباقات.</p><Link className="btn btn-primary" href="/dashboard/admin">فتح لوحة الإدارة</Link></section>}
    {profile.role === "student" && <section className="section compact-section"><div className="form-actions"><Link className="btn btn-light" href="/dashboard/assignments">واجباتي</Link><Link className="btn btn-light" href="/dashboard/exams">الامتحانات</Link><Link className="btn btn-light" href="/dashboard/guardian-requests">طلبات ولي الأمر</Link></div></section>}
    {profile.role === "student" && assignments.length > 0 && <section className="section compact-section"><h2>واجبات منشورة</h2><div className="stack-list">{assignments.map((item: any) => <div className="list-row" key={item.id}><div><b>{item.title}</b><small>{item.courses?.title || "كورس"} • الدرجة النهائية {item.max_points}</small></div><small>{item.due_at ? new Date(item.due_at).toLocaleDateString("ar-EG") : "بدون موعد محدد"}</small></div>)}</div><Link className="text-link" href="/dashboard/assignments">فتح صفحة الواجبات والتسليم</Link></section>}
    <section className="section compact-section"><div className="section-head"><div><span className="eyebrow">آخر التحديثات</span><h2>الإشعارات <span className="count-pill">{unreadCount || 0} غير مقروء</span></h2></div></div>{notifications?.length ? <div className="stack-list">{notifications.map((item: any) => <article className={`notification-row ${item.read_at ? "is-read" : ""}`} key={item.id}><div className="notification-dot"/><div className="notification-content"><b>{item.title}</b><p>{item.body}</p><small>{new Date(item.created_at).toLocaleString("ar-EG")}</small></div><div className="notification-actions">{!item.read_at && <form action={markRead}><input type="hidden" name="notification_id" value={item.id}/><button className="text-button">تحديد كمقروء</button></form>}<form action={deleteNotification}><input type="hidden" name="notification_id" value={item.id}/><button className="text-button danger-text">حذف</button></form></div></article>)}</div> : <div className="empty-state small-empty"><p>مفيش إشعارات لحد دلوقتي.</p></div>}</section>
  </main>;
}
