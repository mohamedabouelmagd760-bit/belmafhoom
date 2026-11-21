import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Course = { id: string; title: string; description: string | null; price: number; is_free: boolean; subjects?: { name: string } | null; grades?: { name: string } | null };

export default async function CoursesPage() {
  let courses: Course[] = [];
  let errorMessage = "";
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("courses").select("id,title,description,price,is_free,subjects(name),grades(name)").eq("status", "published").order("published_at", { ascending: false });
    if (error) errorMessage = "تعذر تحميل الكورسات حاليًا. حاول مرة تانية.";
    else courses = (data || []) as unknown as Course[];
  } catch { errorMessage = "إعدادات الاتصال بقاعدة البيانات غير مكتملة."; }
  return <main className="page-shell wrap"><header className="dash-head"><Link className="brand" href="/"><span className="brand-mark">ب</span><span><b>بالمفهوم</b><small>BELMAFHOOM</small></span></Link><Link className="btn btn-primary" href="/dashboard">مساحتي التعليمية</Link></header><section className="page-intro"><span className="eyebrow">اتعلم بالمفهوم</span><h1>اكتشف الكورسات</h1><p>اختار الكورس المناسب لصفك والمادة اللي عايز تتقنها.</p></section>
    {errorMessage ? <div className="notice error">{errorMessage}</div> : courses.length ? <div className="cards">{courses.map((course, i) => <article className="course-card" key={course.id}><div className={`course-art ${["blue","gold","violet"][i % 3]}`}>{course.subjects?.name || "بالمفهوم"}</div><div className="course-info"><span className="tag">{course.grades?.name || "كل الصفوف"}</span><h3>{course.title}</h3><p>{course.description || "تفاصيل الكورس ومحتواه التعليمي."}</p><div className="meta"><b>{course.is_free ? "مجاني" : `${Number(course.price).toLocaleString("ar-EG")} ج.م`}</b><Link href={`/courses/${course.id}`}>التفاصيل ←</Link></div></div></article>)}</div> : <div className="empty-state"><div className="empty-icon">✦</div><h3>مفيش كورسات منشورة حاليًا</h3><p>الكورسات هتظهر هنا بعد اعتماد المدرس ونشره للمحتوى.</p><Link className="btn btn-primary" href="/signup">انضم كمدرس</Link></div>}
  </main>;
}
