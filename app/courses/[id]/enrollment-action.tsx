"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  courseId: string;
  userId: string;
  isFree: boolean;
  price: number;
  initialEnrollment: { id: string; status: string; proof_path: string | null } | null;
};

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

export default function EnrollmentAction({ courseId, userId, isFree, price, initialEnrollment }: Props) {
  const router = useRouter();
  const [enrollment, setEnrollment] = useState(initialEnrollment);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function uploadProof(enrollmentId: string) {
    if (!file) return true;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("ارفع PDF أو صورة JPG أو PNG أو WEBP فقط.");
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("حجم الملف أكبر من 50 ميجابايت.");
      return false;
    }

    const supabase = createClient();
    const safeName = file.name.replace(/[^\p{L}\p{N}._-]/gu, "_").slice(-100) || "payment-proof";
    const path = `enrollment-proofs/${userId}/${enrollmentId}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from("belmafhoom-private").upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (uploadError) {
      setError(`تم إنشاء الطلب لكن تعذر رفع الإيصال: ${uploadError.message}`);
      return false;
    }

    const { error: updateError } = await supabase
      .from("course_enrollments")
      .update({ proof_path: path })
      .eq("id", enrollmentId)
      .eq("student_id", userId);
    if (updateError) {
      await supabase.storage.from("belmafhoom-private").remove([path]);
      setError(`تم رفع الملف لكن تعذر ربطه بالطلب: ${updateError.message}`);
      return false;
    }
    setEnrollment((current) => current ? { ...current, proof_path: path } : current);
    setFile(null);
    setMessage("تم رفع إيصال الدفع بنجاح.");
    return true;
  }

  async function requestEnrollment() {
    setBusy(true);
    setError("");
    setMessage("");
    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("course_enrollments")
      .insert({ student_id: userId, course_id: courseId })
      .select("id,status,proof_path")
      .single();

    if (insertError || !data) {
      setError(insertError?.message.includes("duplicate")
        ? "عندك طلب اشتراك سابق في الكورس. حدّث الصفحة لمتابعة حالته."
        : insertError?.message || "تعذر إرسال طلب الاشتراك.");
      setBusy(false);
      return;
    }

    setEnrollment(data);
    if (file) await uploadProof(data.id);
    else setMessage(isFree ? "تم تفعيل اشتراكك المجاني." : "تم إرسال طلب الاشتراك. تقدر ترفع إيصال الدفع في أي وقت.");
    setBusy(false);
    router.refresh();
  }

  async function addProof() {
    if (!enrollment) return;
    setBusy(true);
    setError("");
    setMessage("");
    await uploadProof(enrollment.id);
    setBusy(false);
    router.refresh();
  }

  if (enrollment?.status === "active") {
    return <div className="notice success">أنت مشترك بالفعل في الكورس. تقدر تدخل على المحتوى من لوحة التحكم.</div>;
  }
  if (enrollment?.status === "rejected") {
    return <div className="notice error">لم يتم قبول طلب الاشتراك. تواصل مع المدرس لمعرفة التفاصيل.</div>;
  }
  if (enrollment?.status === "pending") {
    return <div className="enrollment-box">
      <div className="notice">طلب اشتراكك قيد المراجعة. {enrollment.proof_path ? "إيصال الدفع مرفوع." : "لو دفعت للمدرس، ارفع صورة الإيصال أو ملف PDF."}</div>
      {!enrollment.proof_path && <div className="proof-upload"><label htmlFor="enrollment-proof">إيصال الدفع (PDF أو صورة)</label><input id="enrollment-proof" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" onChange={(event) => setFile(event.target.files?.[0] || null)} /><button className="btn btn-primary" type="button" disabled={!file || busy} onClick={addProof}>{busy ? "جارٍ الرفع..." : "رفع الإيصال"}</button></div>}
      {message && <p className="success">{message}</p>}{error && <p className="error">{error}</p>}
    </div>;
  }

  return <div className="enrollment-box">
    <p className="muted-copy">{isFree ? "الكورس مجاني، وهيتم تفعيل اشتراكك مباشرة." : `قيمة الكورس ${price.toLocaleString("ar-EG")} جنيه. الدفع بيكون للمدرس مباشرة، وبعدها المدرس يراجع طلبك ويفعّل الاشتراك.`}</p>
    {!isFree && <div className="proof-upload"><label htmlFor="new-enrollment-proof">إيصال الدفع (اختياري دلوقتي)</label><input id="new-enrollment-proof" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" onChange={(event) => setFile(event.target.files?.[0] || null)} /></div>}
    <button className="btn btn-primary" type="button" disabled={busy} onClick={requestEnrollment}>{busy ? "جارٍ إرسال الطلب..." : isFree ? "اشترك مجانًا" : "اطلب الاشتراك"}</button>
    {message && <p className="success">{message}</p>}{error && <p className="error">{error}</p>}
  </div>;
}
