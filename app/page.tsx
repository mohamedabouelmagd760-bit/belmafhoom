import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Course = {
  id: string; title: string; description: string | null; price: number; is_free: boolean;
  subjects?: { name: string } | null; grades?: { name: string } | null;
};

export default async function Home() {
  let courses: Course[] = [];
  let connectionReady = false;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("courses")
      .select("id,title,description,price,is_free,subjects(name),grades(name)")
      .eq("status", "published").order("published_at", { ascending: false }).limit(6);
    if (!error) { courses = (data || []) as unknown as Course[]; connectionReady = true; }
  } catch { /* The public page remains usable while environment setup is pending. */ }

  return <>
    <header className="topbar wrap">
      <Link className="brand" href="/"><span className="brand-mark">ب</span><span><b>بالمفهوم</b><small>BELMAFHOOM</small></span></Link>
      <nav><a href="#courses">الكورسات</a><a href="#how">عن المنصة</a></nav>
      <div className="top-actions"><Link className="btn btn-ghost" href="/login">تسجيل الدخول</Link><Link className="btn btn-primary" href="/signup">ابدأ الآن</Link></div>
    </header>
    <main>
      <section className="hero wrap">
        <div><span className="eyebrow">✦ تعلّم على طريقتك</span><h1>مش مجرد شرح..<br/><em>فهم حقيقي.</em></h1>
          <p>اكتشف المدرس المناسب ليك، وتعلّم من كورسات منظمة تتابع فيها تقدمك خطوة بخطوة.</p>
          <div className="hero-actions"><Link className="btn btn-primary btn-lg" href="/courses">اكتشف الكورسات ←</Link><Link className="btn btn-light btn-lg" href="/signup">انضم كمدرس</Link></div>
          <div className="trust-row"><span>✓ محتوى منظم</span><span>✓ تعلّم في أي وقت</span><span>✓ متابعة تقدمك</span></div>
        </div>
        <div className="hero-art"><div className="orbit"/><div className="learning-card"><span className="eyebrow">✦ مساحة تعلّمك</span><div className="book-shape">ف</div><h3>افهمها.. مش تحفظها</h3><p>كل خطوة تقرّبك من هدفك</p><div className="progress"><i/></div><small>رحلتك التعليمية تبدأ هنا</small></div><div className="floating-chip">✦ فهم أعمق</div></div>
      </section>
      <section className="section wrap" id="courses">
        <div className="section-head"><div><span className="eyebrow">خطوتك الجاية</span><h2>كورسات منشورة على المنصة</h2><p>محتوى حقيقي يضيفه المدرسون المعتمدون.</p></div><Link className="text-link" href="/courses">عرض كل الكورسات ←</Link></div>
        {courses.length ? <div className="cards">{courses.map((course, i) => <article className="course-card" key={course.id}><div className={`course-art ${["blue","gold","violet"][i % 3]}`}>{course.subjects?.name || "بالمفهوم"}</div><div className="course-info"><span className="tag">{course.grades?.name || "كل الصفوف"}</span><h3>{course.title}</h3><p>{course.description || "تفاصيل الكورس ومحتواه التعليمي."}</p><div className="meta"><b>{course.is_free ? "مجاني" : `${Number(course.price).toLocaleString("ar-EG")} ج.م`}</b><Link href={`/courses/${course.id}`}>التفاصيل ←</Link></div></div></article>)}</div> : <div className="empty-state"><div className="empty-icon">✦</div><h3>{connectionReady ? "لسه مفيش كورسات منشورة" : "مساحة التعلّم جاهزة"}</h3><p>{connectionReady ? "أول ما المدرسين ينشروا كورساتهم هتظهر هنا." : "اربط إعدادات Supabase لعرض الكورسات المنشورة مباشرة."}</p><Link className="btn btn-light" href="/courses">تصفح الكورسات</Link></div>}
      </section>
      <section className="join wrap" id="how"><div><span className="eyebrow">للمعلمين والمعلمات</span><h2>خلّي خبرتك توصل لطلاب أكتر</h2><p>أنشئ مساحتك التعليمية، وقدّم كورساتك وتابع طلابك من مكان واحد.</p></div><Link className="btn btn-primary btn-lg" href="/signup">انضم كمدرس ←</Link></section>
    </main>
    <footer className="wrap footer"><Link className="brand" href="/"><span className="brand-mark">ب</span><span><b>بالمفهوم</b><small>BELMAFHOOM</small></span></Link><span>مش مجرد شرح.. فهم حقيقي.</span><small>© 2026 بالمفهوم</small></footer>
  </>;
}
