import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
export default async function TeachersPage({searchParams}:{searchParams:Promise<{q?:string;subject?:string;stage?:string}>}) {
 const params=await searchParams; const q=(params.q||"").trim().slice(0,80); const subject=(params.subject||"").trim(); const stage=(params.stage||"").trim();
 const s=await createClient();
 const [{data:teachers},{data:subjects},{data:stages}] = await Promise.all([
  s.from("public_teacher_directory").select("user_id,display_name,avatar_url,bio,subjects,stages"),
  s.from("subjects").select("name").eq("is_active",true).order("sort_order"),
  s.from("education_stages").select("name").eq("is_active",true).order("sort_order")
 ]);
 const ids=(teachers||[]).filter((t:any)=>(!subject||(t.subjects||[]).includes(subject))&&(!stage||(t.stages||[]).includes(stage))).map((t:any)=>t.user_id);
 let people:any[]=[]; let courses:any[]=[];
 if(ids.length){ const [{data:c}] = await Promise.all([
  s.from("courses").select("id,teacher_id,title,price,is_free,subjects(name),grades(name)").in("teacher_id",ids).eq("status","published")
 ]); people=(teachers||[]).filter((x:any)=>ids.includes(x.user_id)); courses=c||[]; }
 const visible=people.map((p:any)=>{return {...p,id:p.user_id,subjects:p.subjects||[],stages:p.stages||[],courses:courses.filter((c:any)=>c.teacher_id===p.user_id)}}).filter((p:any)=>!q||p.display_name?.toLowerCase().includes(q.toLowerCase())||p.subjects.some((x:string)=>x.includes(q))||p.courses.some((c:any)=>c.title.includes(q)));
 return <main className="wrap page-shell"><header className="dash-head"><Link className="brand" href="/"><span className="brand-mark">ب</span><span><b>بالمفهوم</b><small>BELMAFHOOM</small></span></Link><Link className="btn btn-primary" href="/courses">اكتشف الكورسات</Link></header><section className="page-intro"><span className="eyebrow">اختار مين يوصلك للمعلومة</span><h1>مدرسونا المعتمدون</h1><p>تعرّف على المدرسين المعتمدين والكورسات المنشورة على بالمفهوم.</p></section>
 <form method="get" className="search-panel"><div><b>ابحث عن مدرس</b><small>بالاسم أو المادة أو اسم الكورس</small><input name="q" defaultValue={q} placeholder="مثال: رياضيات أو أحمد"/></div><label><small>المادة</small><select name="subject" defaultValue={subject}><option value="">كل المواد</option>{(subjects||[]).map((x:any)=><option key={x.name} value={x.name}>{x.name}</option>)}</select></label><label><small>المرحلة</small><select name="stage" defaultValue={stage}><option value="">كل المراحل</option>{(stages||[]).map((x:any)=><option key={x.name} value={x.name}>{x.name}</option>)}</select></label><button className="btn btn-primary">بحث</button><Link className="btn btn-light" href="/teachers">مسح</Link></form>
 {visible.length?<div className="cards" style={{marginTop:28}}>{visible.map((t:any)=><article className="teacher-card" key={t.id}><div className="avatar">{(t.display_name||"م").slice(0,1)}</div><span className="tag">مدرس معتمد</span><h2>{t.display_name||"مدرس بالمفهوم"}</h2><p>{t.bio||"مدرس معتمد يقدم محتوى تعليميًا منظمًا على المنصة."}</p><p className="muted-copy">{t.subjects.join(" • ")||"مواد تعليمية"}{t.stages.length? " — "+t.stages.join(" • "):""}</p><small>{t.courses.length} كورس منشور</small><div style={{marginTop:18}}><Link className="btn btn-light" href={`/teachers/${t.id}`}>عرض الملف والكورسات ←</Link></div></article>)}</div>:<div className="empty-state"><h2>مفيش نتائج مطابقة حاليًا</h2><p>جرّب تغيير كلمات البحث أو الفلاتر. المدرسون المعتمدون هيظهروا هنا بعد نشر بياناتهم.</p><Link className="btn btn-light" href="/teachers">عرض الكل</Link></div>}
 </main>;
}