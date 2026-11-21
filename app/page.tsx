import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Course = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  is_free: boolean;
  subjects?: { name: string } | null;
  grades?: { name: string } | null;
};

const learningPaths = [
  { number: "01", title: "اختار طريقك", text: "حدد مرحلتك والمادة اللي عايز تتقنها.", tone: "path-blue" },
  { number: "02", title: "اتعلم مع الأفضل", text: "اكتشف المدرسين والكورسات المناسبة ليك.", tone: "path-gold" },
  { number: "03", title: "شوف تطورك", text: "تابع دروسك وواجباتك ونتايجك من مكان واحد.", tone: "path-ink" },
];

export default async function Home() {
  let courses: Course[] = [];
  let connectionReady = false;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("courses")
      .select("id,title,description,price,is_free,subjects(name),grades(name)")
      .eq("status", "published").order("published_at", { ascending: false }).limit(3);
    if (!error) { courses = (data || []) as unknown as Course[]; connectionReady = true; }
  } catch { /* Keep the public landing page available if the database is temporarily unreachable. */ }

  return <>
    <header className="site-header">
      <div className="site-header-inner wrap">
        <Link className="brand" href="/" aria-label="بالمفهوم - الرئيسية">
          <span className="brand-mark brand-mark-new"><i>ب</i></span>
          <span className="brand-copy"><b>بالمفهوم</b><small>BELMAFHOOM</small></span>
        </Link>
        <nav className="main-nav" aria-label="القائمة الرئيسية">
          <Link className="nav-active" href="/">الرئيسية</Link>
          <Link href="/courses">الكورسات</Link>
          <Link href="/teachers">المدرسون</Link>
          <Link href="/about">عن المنصة</Link>
          <Link href="/help">المساعدة</Link>
        </nav>
        <div className="header-actions">
          <Link className="header-login" href="/login">تسجيل الدخول</Link>
          <Link className="btn btn-primary header-cta" href="/signup">ابدأ رحلتك <span>↗</span></Link>
        </div>
      </div>
    </header>

    <main className="landing-page">
      <section className="hero-v2">
        <div className="hero-glow" />
        <div className="wrap hero-v2-grid">
          <div className="hero-copy">
            <div className="hero-kicker"><span className="kicker-dot" /> مساحة أذكى للتعلّم</div>
            <h1>لما تفهم،<br /><span>كل حاجة بتتغيّر.</span></h1>
            <p className="hero-lead">مش هدفنا إنك تخلص درس وخلاص. هدفنا إن المعلومة تثبت، وثقتك تكبر، وتعرف توصل لهدفك خطوة بخطوة.</p>
            <div className="hero-buttons">
              <Link className="btn btn-primary btn-hero" href="/courses">اكتشف الكورسات <span>←</span></Link>
              <Link className="hero-secondary" href="/teachers"><span className="play-icon">↗</span> اتعرف على مدرسينا</Link>
            </div>
            <div className="hero-note"><span className="note-line" /> تعلّم منظم. اختيار أوضح. فهم أعمق.</div>
          </div>
          <div className="hero-visual" aria-label="رحلة تعلّم تفاعلية">
            <div className="hero-photo" />
            <div className="photo-shade" />
            <div className="visual-top-label"><span>01 / YOUR LEARNING SPACE</span><b>مساحتك.. على طريقتك</b></div>
            <div className="floating-learning">
              <div className="float-icon">✳</div>
              <div><small>خطوة جديدة كل يوم</small><b>الفهم هو البداية</b></div>
              <span className="float-arrow">↗</span>
            </div>
            <div className="visual-index"><b>ب</b><span>تعليم يوصّلك<br />للي تستحقه</span></div>
            <div className="visual-orbit orbit-one" />
            <div className="visual-orbit orbit-two" />
          </div>
        </div>
        <div className="hero-bottom wrap"><span>LEARN WITH PURPOSE</span><span className="hero-bottom-line" /><span>مش مجرد شرح.. فهم حقيقي.</span></div>
      </section>

      <section className="intro-strip wrap">
        <div className="intro-mark">✳</div>
        <p>التعلّم مش سباق في عدد الدروس.<br /><strong>التعلّم الحقيقي إنك تفهم وتعرف تستخدم اللي اتعلمته.</strong></p>
        <Link href="/about" className="inline-arrow">اكتشف فلسفتنا <span>←</span></Link>
      </section>

      <section className="section-v2 wrap">
        <div className="section-heading-v2">
          <div><span className="eyebrow-v2">ابدأ من هنا</span><h2>رحلتك التعليمية،<br /><em>بقت أوضح.</em></h2></div>
          <p>كل اللي تحتاجه عشان تتعلم بثقة، في تجربة واحدة متصممة حواليك.</p>
        </div>
        <div className="path-grid">
          {learningPaths.map((item) => <article className={`path-card ${item.tone}`} key={item.number}>
            <div className="path-card-top"><span>{item.number}</span><i>↗</i></div>
            <div className="path-symbol">{item.number === "01" ? "⌁" : item.number === "02" ? "✳" : "◉"}</div>
            <h3>{item.title}</h3><p>{item.text}</p>
          </article>)}
        </div>
      </section>

      <section className="courses-v2">
        <div className="wrap">
          <div className="section-heading-v2 courses-heading">
            <div><span className="eyebrow-v2">اختيارات تستاهل وقتك</span><h2>اتعلم حاجة<br /><em>تفرق معاك.</em></h2></div>
            <div className="courses-heading-side"><p>كورسات ينشرها مدرسونا المعتمدون، بتفاصيل واضحة تساعدك تختار صح.</p><Link href="/courses" className="inline-arrow">كل الكورسات <span>←</span></Link></div>
          </div>
          {courses.length ? <div className="courses-grid-v2">{courses.map((course, i) => <article className="course-card-v2" key={course.id}>
            <div className={`course-cover-v2 cover-${i % 3}`}>
              <span className="cover-index">0{i + 1}</span><span className="cover-subject">{course.subjects?.name || "بالمفهوم"}</span>
              <div className="cover-shape">{i === 0 ? "ف" : i === 1 ? "ع" : "م"}</div>
              <span className="cover-grade">{course.grades?.name || "كل المراحل"}</span>
            </div>
            <div className="course-card-body"><div className="course-card-label">{course.is_free ? "متاح مجانًا" : "كورس تعليمي"}</div><h3>{course.title}</h3><p>{course.description || "ابدأ رحلة فهم منظمة مع محتوى تعليمي واضح."}</p><div className="course-card-foot"><b>{course.is_free ? "مجاني" : `${Number(course.price).toLocaleString("ar-EG")} ج.م`}</b><Link href={`/courses/${course.id}`}>التفاصيل <span>←</span></Link></div></div>
          </article>)}</div> : <div className="courses-empty-v2">
            <div className="empty-orbit"><span>✳</span></div>
            <div><span className="eyebrow-v2">{connectionReady ? "قريبًا على المنصة" : "مساحة التعلّم"}</span><h3>{connectionReady ? "أول كورس ليك لسه مستنيك." : "بنجهّزلك مساحة تعلّم متكاملة."}</h3><p>{connectionReady ? "مدرسونا هيضيفوا الكورسات المعتمدة هنا قريبًا. تقدر تتعرف عليهم وتتابع الجديد." : "تقدر تستكشف المنصة والمدرسين، والكورسات هتظهر هنا بمجرد نشرها."}</p><Link href="/teachers" className="btn btn-dark-v2">اكتشف المدرسين <span>←</span></Link></div>
          </div>}
        </div>
      </section>

      <section className="teacher-feature wrap">
        <div className="teacher-feature-image"><div className="teacher-image-caption"><span>FOR EDUCATORS</span><b>خبرتك تستحق<br />مساحة أكبر.</b></div></div>
        <div className="teacher-feature-copy"><span className="eyebrow-v2">للمدرسين وصنّاع المعرفة</span><h2>خلّي علمك<br /><em>يوصل أبعد.</em></h2><p>أنشئ مساحتك التعليمية، نظّم كورساتك، وتابع طلابك وأداءهم من مكان واحد.</p><Link href="/signup" className="btn btn-primary btn-hero">انضم كمدرس <span>←</span></Link><small>كل مدرس يمر بمراجعة واعتماد قبل نشر المحتوى.</small></div>
      </section>

      <section className="final-cta">
        <div className="wrap final-cta-inner"><div><span className="eyebrow-v2">مستعد تبدأ؟</span><h2>خلّي الفهم<br />أول خطوة.</h2></div><div className="final-cta-action"><p>مكان واحد يجمعك بالمدرس المناسب، والمحتوى اللي يساعدك تتقدم.</p><Link href="/signup" className="btn btn-gold-v2">ابدأ مع بالمفهوم <span>↗</span></Link></div><span className="cta-watermark">ب</span></div>
      </section>
    </main>

    <footer className="site-footer">
      <div className="wrap footer-main"><Link className="brand footer-brand" href="/"><span className="brand-mark brand-mark-new"><i>ب</i></span><span className="brand-copy"><b>بالمفهوم</b><small>BELMAFHOOM</small></span></Link><p>مش مجرد شرح.. فهم حقيقي.</p><div className="footer-links"><Link href="/courses">الكورسات</Link><Link href="/teachers">المدرسون</Link><Link href="/about">عن المنصة</Link><Link href="/help">المساعدة</Link></div></div>
      <div className="wrap footer-bottom"><span>© 2026 بالمفهوم. جميع الحقوق محفوظة.</span><span>LEARN · UNDERSTAND · GROW</span></div>
    </footer>
  </>;
}
