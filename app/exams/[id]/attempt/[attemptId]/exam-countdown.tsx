'use client';

import { useEffect, useRef, useState } from 'react';

type Props = { deadline: string; submitButtonId: string };

export default function ExamCountdown({ deadline, submitButtonId }: Props) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const submitted = useRef(false);

  useEffect(() => {
    const deadlineMs = Date.parse(deadline);
    if (!Number.isFinite(deadlineMs)) return;

    const tick = () => {
      const seconds = Math.max(0, Math.ceil((deadlineMs - Date.now()) / 1000));
      setRemaining(seconds);
      if (seconds === 0 && !submitted.current) {
        submitted.current = true;
        const button = document.getElementById(submitButtonId) as HTMLButtonElement | null;
        button?.click();
      }
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [deadline, submitButtonId]);

  if (remaining === null) return <div className="notice" role="status">جارٍ حساب الوقت المتبقي…</div>;

  const minutes = Math.floor(remaining / 60).toString().padStart(2, '0');
  const seconds = (remaining % 60).toString().padStart(2, '0');

  return (
    <div className="notice" role="timer" aria-live="off" style={{ display: 'inline-flex', gap: 8, alignItems: 'center', marginTop: 12 }}>
      <b>الوقت المتبقي</b>
      <strong dir="ltr" style={{ fontVariantNumeric: 'tabular-nums', fontSize: 20 }}>{minutes}:{seconds}</strong>
      {remaining === 0 && <span>جارٍ تسليم الامتحان…</span>}
    </div>
  );
}
