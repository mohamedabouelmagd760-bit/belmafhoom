import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Course = { id:string; title:string; description:string|null; price:number; is_free:boolean; subjects?:{name:string}|null; grades?:{name:string}|null };
const stages=[
 {title:"المرحلة الابتدائية",en:"PRIMARY",desc:"تأسيس وفهم خطوة بخطوة",icon:"✿",tone:"stage-blue"},
 {title:"المرحلة الإعدادية",en:"PREPARATORY",desc:"ابني أساس قوي لكل مادة",icon:"⌘",tone:"stage-gold"},
 {title:"المرحلة الثانوية",en:"SECONDARY",desc:"استعد بثقة للخطوة الجاية",icon:"✦",tone:"stage-violet"}
];
const features=[
 {title:"مدرسون معتمدون",desc:"اختيارات واضحة وملفات تعريف تساعدك تختار المدرس المناسب.",icon:"teacher"},
 {title:"محتوى منظم",desc:"كورسات ودروس مرتبة تخليك تعرف تبدأ منين وتكمل إزاي.",icon:"book"},
 {title:"متابعة تقدمك",desc:"تابع إنجازك وواجباتك ونتايجك من لوحة واحدة.",icon:"chart"},
 {title:"مساحة آمنة",desc:"حسابات وصلاحيات منفصلة وتجربة مناسبة لكل دور.",icon:"shield"}
];
function FeatureIcon({name}:{name:string}){
 if(name==="teacher")return <svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="20" r="11"/><path d="M10 53c2-12 10-18 22-18s20 6 22 18M7 24h8m34 0h8M12 18v13m40-13v13" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/></svg>;
 if(name==="book")return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M8 13c10-4 18-2 24 4v36c-7-6-15-8-24-4zM56 13c-10-4-18-2-24 4v36c7-6 15-8 24-4z" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round"/><path d="M15 24h10m-10 9h10m14-9h10m-10 9h10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>;
 if(name==="chart")return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M9 53V12m0 41h47M18 43l11-12 9 6 16-19" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/><circle cx="54" cy="18" r="4"/></svg>;
 return <svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 7 53 15v15c0 13-8 22-21 28C19 52 11 43 11 30V15z" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round"/><path d="m22 32 7 7 14-16" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
export default async function Home(){
 let courses:Course[]=[];let connectionReady=false;
 try{const s=await createClient();const {data,error}=await s.from("courses").select("id,title,description,price,is_free,subjects(name),grades(name)").eq("status","published").order("published_at",{ascending:false}).limit(3);if(!error){courses=(data||[]) as unknown as Course[];connectionReady=true;}}catch{}
 return <>
 <header className="site-header"><div className="site-header-inner wrap">
  <Link href="/" className="brand brand-lockup" aria-label="بالمفهوم الرئيسية"><img src="/logo-approved.svg" alt="بالمفهوم BELMAFHOOM — مش مجرد شرح.. فهم حقيقي" /></Link>
  <nav className="main-nav" aria-label="القائمة الرئيسية"><Link className="nav-active" href="/">الرئيسية</Link><Link href="/courses">الكورسات</Link><Link href="/teachers">المدرسون</Link><Link href="/about">عن المنصة</Link><Link href="/help">الأسئلة والمساعدة</Link></nav>
  <div className="header-actions"><Link className="header-login" href="/login">تسجيل الدخول</Link><Link className="btn btn-primary header-cta" href="/signup">ابدأ الآن <span>←</span></Link></div><details className="mobile-menu"><summary aria-label="فتح القائمة"><span/><span/><span/></summary><div className="mobile-menu-panel"><Link href="/">الرئيسية</Link><Link href="/courses">الكورسات</Link><Link href="/teachers">المدرسون</Link><Link href="/about">عن المنصة</Link><Link href="/help">الأسئلة والمساعدة</Link><Link href="/login">تسجيل الدخول</Link><Link href="/signup">إنشاء حساب</Link></div></details>
 </div></header>
 <main className="landing-v3">
  <section className="hero-v3"><div className="hero-v3-pattern pattern-a"/><div className="hero-v3-pattern pattern-b"/>
   <div className="wrap hero-v3-grid">
    <div className="hero-v3-copy"><span className="hero-v3-kicker"><i/> منصة تعليمية.. بفكرة مختلفة</span>
     <h1>اتعلم بالطريقة<br/>اللي <em>تفهمك.</em></h1>
     <p>اكتشف مدرسين متميزين، واختار الكورسات المناسبة ليك. تعلّم منظم يساعدك تفهم المعلومة وتوصل لهدفك بثقة.</p>
     <div className="hero-v3-actions"><Link className="btn btn-primary btn-v3-main" href="/courses">اكتشف الكورسات <span>←</span></Link><Link className="btn btn-v3-outline" href="/teachers">تعرّف على المدرسين <span>↗</span></Link></div><form action="/courses" method="get" className="hero-search-v3"><span>⌕</span><input name="q" type="search" placeholder="ابحث عن كورس أو مادة..." aria-label="ابحث عن كورس أو مادة"/><button type="submit">بحث <b>←</b></button></form>
     <div className="hero-v3-points"><span><b>✓</b> محتوى تعليمي منظم</span><span><b>✓</b> مدرسون معتمدون</span><span><b>✓</b> متابعة مستمرة</span></div>
    </div>
    <div className="hero-v3-art">
     <div className="hero-v3-photo"><div className="photo-wash"/><div className="photo-caption"><small>YOUR NEXT STEP STARTS HERE</small><b>افهمها.. مش تحفظها.</b></div></div>
     <div className="hero-doodle doodle-cap">⌑</div><div className="hero-doodle doodle-bulb">✧</div><div className="hero-dot-grid"/>
     <div className="hero-floating-card"><div className="floating-card-icon">✦</div><div><small>كل خطوة بتفرق</small><b>تعلّم على مقاسك</b></div><span>↗</span></div>
     <div className="hero-progress-card"><div className="progress-ring">✓</div><div><b>رحلتك التعليمية</b><small>ابدأ أول خطوة النهارده</small></div></div>
    </div>
   </div>
   <div className="wrap hero-v3-bottom"><span>LEARN · UNDERSTAND · GROW</span><i/><b>مش مجرد شرح.. فهم حقيقي.</b></div>
  </section>
  <section className="stage-section wrap"><div className="section-title-v3"><div><span className="section-kicker">اختار مرحلتك التعليمية</span><h2>ابدأ من <em>مكانك.</em></h2></div><p>محتوى مناسب لمرحلتك، يساعدك تبني فهم حقيقي وتتحرك بثبات.</p></div>
   <div className="stage-grid">{stages.map((stage,i)=><Link href="/courses" className={`stage-card ${stage.tone}`} key={stage.en}><div className="stage-card-top"><small>{stage.en}</small><span>0{i+1}</span></div><div className="stage-illustration"><span>{stage.icon}</span><i/><b/></div><h3>{stage.title}</h3><p>{stage.desc}</p><div className="stage-link">استكشف المحتوى <span>←</span></div></Link>)}</div>
  </section>
  <section className="features-section"><div className="wrap"><div className="section-title-v3 centered-title"><div><span className="section-kicker">ليه بالمفهوم؟</span><h2>كل اللي يساعدك <em>تتقدم.</em></h2></div><p>مش بنقدملك فيديو وخلاص؛ بنبني تجربة تعليمية متكاملة من أول اختيارك لحد ما تلاحظ تطورك.</p></div>
   <div className="features-grid">{features.map((f,i)=><article className="feature-card-v3" key={f.icon}><div className={`feature-icon feature-icon-${i}`}><FeatureIcon name={f.icon}/></div><span className="feature-index">0{i+1}</span><h3>{f.title}</h3><p>{f.desc}</p></article>)}</div>
  </div></section>
  <section className="courses-section-v3 wrap"><div className="section-title-v3"><div><span className="section-kicker">اختيارات تستاهل وقتك</span><h2>كورس يفتحلك <em>طريق.</em></h2></div><Link href="/courses" className="section-more">كل الكورسات <span>←</span></Link></div>
   {courses.length?<div className="courses-grid-v3">{courses.map((c,i)=><article className="course-card-v3" key={c.id}><div className={`course-art-v3 art-${i}`}><small>0{i+1} / BELMAFHOOM</small><b>{c.subjects?.name||"تعلّم"}</b><span>{c.grades?.name||"كل المراحل"}</span><i>ب</i></div><div className="course-body-v3"><span>{c.is_free?"متاح مجانًا":"كورس تعليمي"}</span><h3>{c.title}</h3><p>{c.description||"محتوى تعليمي منظم يساعدك تفهم وتتقدم."}</p><div><b>{c.is_free?"مجاني":Number(c.price).toLocaleString("ar-EG")+" ج.م"}</b><Link href={`/courses/${c.id}`}>عرض التفاصيل ←</Link></div></div></article>)}</div>:<div className="courses-empty-v3"><div className="empty-book-art"><span>ب</span><i/></div><div><span className="section-kicker">{connectionReady?"قريبًا على المنصة":"مساحة التعلّم"}</span><h3>{connectionReady?"أول كورس ليك لسه مستنيك.":"بنجهّزلك محتوى يليق بطموحك."}</h3><p>{connectionReady?"الكورسات هتظهر هنا بمجرد نشرها واعتمادها. تقدر تبدأ بالتعرف على المدرسين.":"استكشف المدرسين وتعرّف على تجربة بالمفهوم لحد ما تنضم أول الكورسات."}</p><Link className="btn btn-primary" href="/teachers">اكتشف المدرسين ←</Link></div></div>}
  </section>
  <section className="teacher-band"><div className="wrap teacher-band-inner"><div className="teacher-band-art"><div className="teacher-band-circle">✳</div><div className="teacher-band-mini"><b>شارك علمك</b><small>وخلي أثره يكبر</small></div></div><div><span className="section-kicker">للمدرسين وصنّاع المعرفة</span><h2>علمك يستحق<br/><em>يوصل أبعد.</em></h2><p>أنشئ مساحتك التعليمية، نظّم كورساتك، وتابع طلابك وأداءهم من مكان واحد.</p><Link className="btn btn-gold-v3" href="/signup">انضم كمدرس <span>←</span></Link></div></div></section>
  <section className="faq-section wrap"><div className="section-title-v3"><div><span className="section-kicker">محتاج تعرف أكتر؟</span><h2>أسئلة <em>بتتكرر.</em></h2></div><Link className="section-more" href="/help">مركز المساعدة <span>←</span></Link></div><div className="faq-grid"><details><summary>إزاي أبدأ أتعلم على بالمفهوم؟</summary><p>أنشئ حساب طالب، واستكشف الكورسات والمدرسين، وبعدها اختار المحتوى المناسب لمرحلتك.</p></details><details><summary>هل أقدر أتابع تقدمي وواجباتي؟</summary><p>أيوه، لوحة الطالب بتجمع كورساتك وواجباتك والإشعارات الخاصة بحسابك.</p></details><details><summary>إزاي أنضم كمدرس؟</summary><p>أنشئ حساب مدرس، وبعدها بيتم مراجعة بياناتك قبل تفعيل صلاحيات نشر الكورسات.</p></details><details><summary>هل المنصة مناسبة لولي الأمر؟</summary><p>فيه حساب مخصص لولي الأمر لمتابعة الأبناء بعد إتمام طلب الربط والموافقة المطلوبة.</p></details></div></section>
  <section className="final-cta-v3"><div className="wrap final-cta-v3-inner"><div><span>خطوتك الأولى تبدأ هنا</span><h2>خلّي الفهم<br/>طريقتك.</h2></div><div><p>ابدأ رحلتك التعليمية مع بالمفهوم، واختار المحتوى اللي يساعدك توصل.</p><Link className="btn btn-gold-v3" href="/signup">ابدأ الآن <span>↗</span></Link></div><b className="cta-letter">ب</b></div></section>
 </main>
 <footer className="footer-v3"><div className="wrap footer-v3-main"><Link href="/" className="footer-logo"><img src="/logo-approved.svg" alt="بالمفهوم BELMAFHOOM"/></Link><p>مش مجرد شرح.. فهم حقيقي.</p><div className="footer-v3-links"><Link href="/courses">الكورسات</Link><Link href="/teachers">المدرسون</Link><Link href="/about">عن المنصة</Link><Link href="/help">المساعدة</Link><Link href="/login">تسجيل الدخول</Link></div></div><div className="wrap footer-v3-bottom"><span>© 2026 بالمفهوم. جميع الحقوق محفوظة.</span><span>LEARN · UNDERSTAND · GROW</span></div></footer>
 </>;
}
