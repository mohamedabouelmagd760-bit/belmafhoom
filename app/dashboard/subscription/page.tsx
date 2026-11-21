import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import SubscribeBox from './subscribe-box';

export const dynamic = 'force-dynamic';

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const qp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role,account_status')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'teacher') redirect('/dashboard');

  const [{ data: plans }, { data: subscriptions }] = await Promise.all([
    supabase
      .from('teacher_subscription_plans')
      .select('id,name,price,duration_days,description')
      .eq('is_active', true)
      .order('sort_order'),
    supabase
      .from('teacher_subscriptions')
      .select(
        'id,status,amount,created_at,period_start,period_end,proof_path,teacher_subscription_plans(name,duration_days)',
      )
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false }),
  ]);

  const safePlans = plans ?? [];
  const safeSubscriptions = subscriptions ?? [];
  const pendingSubscription = safeSubscriptions.find(
    (subscription: any) => subscription.status === 'pending',
  );

  return (
    <main className="wrap page-shell">
      <header className="dash-head">
        <Link href="/dashboard" className="brand">
          بالمفهوم
        </Link>
        <Link href="/dashboard" className="btn btn-light">
          لوحة التحكم
        </Link>
      </header>

      {qp.error && <p className="notice error">{qp.error}</p>}
      {qp.ok && <p className="notice success">{qp.ok}</p>}

      <section className="page-intro">
        <span className="eyebrow">اشتراك المدرس</span>
        <h1>اشتراكك في بالمفهوم</h1>
        <p>طلبات الاشتراك تتم بالتحويل اليدوي، وتفعيلها بعد مراجعة الإدارة.</p>
      </section>

      {safePlans.length > 0 ? (
        <SubscribeBox
          teacherId={user.id}
          plans={safePlans.map((plan: any) => ({
            ...plan,
            price: Number(plan.price),
          }))}
          pending={
            pendingSubscription
              ? {
                  id: pendingSubscription.id,
                  proof_path: pendingSubscription.proof_path,
                }
              : null
          }
          active={safeSubscriptions.some(
            (subscription: any) =>
              subscription.status === 'active' &&
              (!subscription.period_end ||
                new Date(subscription.period_end) > new Date()),
          )}
        />
      ) : (
        <div className="notice">
          لا توجد باقات متاحة حاليًا. الإدارة ستضيف الباقات والأسعار قبل فتح
          الاشتراك.
        </div>
      )}

      <section className="section compact-section">
        <h2>سجل طلباتي</h2>
        {safeSubscriptions.length > 0 ? (
          <div className="stack-list">
            {safeSubscriptions.map((subscription: any) => (
              <div className="list-row" key={subscription.id}>
                <div>
                  <b>
                    {subscription.teacher_subscription_plans?.name || 'باقة'}
                  </b>
                  <small>
                    {Number(subscription.amount).toLocaleString('ar-EG')} جنيه
                    {' • '}
                    {new Date(subscription.created_at).toLocaleDateString(
                      'ar-EG',
                    )}
                  </small>
                  <small>
                    {subscription.period_end
                      ? `ينتهي في ${new Date(subscription.period_end).toLocaleDateString('ar-EG')}`
                      : 'بانتظار المراجعة'}
                  </small>
                </div>
                <span className="tag">
                  {subscription.status === 'active'
                    ? 'مفعل'
                    : subscription.status === 'pending'
                      ? 'قيد المراجعة'
                      : subscription.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>لم ترسل طلب اشتراك بعد.</p>
          </div>
        )}
      </section>
    </main>
  );
}
