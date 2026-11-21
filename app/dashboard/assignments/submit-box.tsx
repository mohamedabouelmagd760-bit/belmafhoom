'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {createClient} from '@/lib/supabase/client';
export default function SubmitBox({assignmentId,studentId,initial}:{assignmentId:string;studentId:string;initial:{id:string;answer_text:string|null;file_path:string|null;status:string}|null}){
 const [answer,setAnswer]=useState(initial?.answer_text||''); const [file,setFile]=useState<File|null>(null); const [busy,setBusy]=useState(false); const [msg,setMsg]=useState(''); const [err,setErr]=useState(''); const router=useRouter();
 async function submit(){setBusy(true);setErr('');setMsg('');const s=createClient();let path=initial?.file_path||null;
  if(file){if(!['application/pdf','image/jpeg','image/png','image/webp'].includes(file.type)||file.size>50*1024*1024){setErr('الملف لازم يكون PDF أو صورة وأقل من 50 ميجابايت.');setBusy(false);return;}const safe=file.name.replace(/[^\p{L}\p{N}._-]/gu,'_').slice(-80);path=`assignment-submissions/${studentId}/${assignmentId}/${Date.now()}-${safe}`;const {error}=await s.storage.from('belmafhoom-private').upload(path,file,{contentType:file.type});if(error){setErr(error.message);setBusy(false);return;}}
  const payload={assignment_id:assignmentId,student_id:studentId,answer_text:answer.trim()||null,file_path:path,status:'submitted'};
  const result=initial?.id?await s.from('assignment_submissions').update(payload).eq('id',initial.id).select('id').maybeSingle():await s.from('assignment_submissions').insert(payload).select('id').maybeSingle();
  if(result.error){if(file&&path)await s.storage.from('belmafhoom-private').remove([path]);setErr(result.error.message);setBusy(false);return;}setMsg('تم تسليم الواجب بنجاح.');setFile(null);setBusy(false);router.refresh();
 }
 if(initial?.status==='graded') return <div className="notice success">تم تصحيح الواجب. الدرجة والملاحظات تظهر أعلى الصفحة.</div>;
 return <div className="form-panel"><h3>تسليم الواجب</h3><label className="field-label">إجابتك<textarea value={answer} onChange={e=>setAnswer(e.target.value)} rows={4} maxLength={12000} placeholder="اكتب إجابتك هنا..."/></label><label className="proof-upload">إرفاق ملف PDF أو صورة<input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={e=>setFile(e.target.files?.[0]||null)}/></label><button className="btn btn-primary" disabled={busy||(!answer.trim()&&!file&&!initial?.file_path)} onClick={submit}>{busy?'جارٍ التسليم...':'تسليم الواجب'}</button>{msg&&<p className="success">{msg}</p>}{err&&<p className="error">{err}</p>}</div>
}
