import Link from "next/link";
import {notFound} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
export const dynamic="force-dynamic";
export default async function TeacherDetail({params}:{params:Promise<{id:string}>}) {
 const {id}=await params; const s=await createClient();
 const [{data:t},{data:p},{data:courses}] = await Promise.all([
  s.from("teacher_profiles").select("user_id,bio,subjects,stages,review_status").eq("user_id",id).eq("review_status","approved").maybeSingle(),
  s.from("profiles").select("id,display_name,avatar_url").eq("id",id).eq("account_status","active").maybeSingle(),
  s.from("courses").select("id,title,description,price,is_free,subjects(name),grades(name)").eq("teacher_id",id).eq("status","published").order("published_at",{ascending:false})
 ]);
 if(!t||!p)notFound();
 return <main className="wrap page-shell"><header className="dash-head"><Link className="brand" href="/teachers">← المدرسون</Link><Link className="btn btn-primary" href="/courses">كل الكورسات</Link></header><section className="panel-card" style={{marginTop:30}}><div className="avatar">{(p.display_name||"م").slice(0,1)}</div><span className="tag">مدرس معتمد على بالمفهوم</span><h1>{p.display_name}</h1><p>{t.bio||"مدرس يقدم محتوى تعليميًا منظمًا."}</p><p className="muted-copy">المواد: {(t.subjects||[]).join(" • ")||"غير محددة"}</p><p className="muted-copy">المراحل: {(t.stages||[]).join(" • ")||"غير محددة"}</p></section><section className="section compact-section"><div className="section-head"><div><span className="eyebrow">محتوى المدرس</span><h2>الكورسات المنشورة</h2></div></div>{courses?.length?<div className="cards">{courses.map((c:any,i:number)=><article className="course-card" key={c.id}><div className={`course-art ${["blue","gold","violet"][i%3]}`}>{c.subjects?.name||"بالمفهوم"}</div><div className="course-info"><span className="tag">{c.grades?.name||"كل الصفوف"}</span><h3>{c.title}</h3><p>{c.description||"تفاصيل الكورس ومحتواه التعليمي."}</p><div className="meta"><b>{c.is_free?"مجاني":Number(c.price).toLocaleString("ar-EG")+" ج.م"}</b><Link href={`/courses/${c.id}`}>التفاصيل ←</Link></div></div></article>)}</div>:<div className="empty-state"><p>لا توجد كورسات منشورة لهذا المدرس حاليًا.</p></div>}</section></main>;
}