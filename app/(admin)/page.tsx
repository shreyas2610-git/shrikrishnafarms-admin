import { createServiceClient } from "@/lib/supabase-server";
import Link from "next/link";
import InlineStatus from "@/components/InlineStatus";
import PaymentBadge from "@/components/PaymentBadge";

export const dynamic = "force-dynamic";

type PaymentConfRow = { id: string; utr_number: string; screenshot_url: string; verified: boolean };

export default async function DashboardPage() {
  const supabase = createServiceClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    { data: allOrders },
    { count: pendingVerifications },
    { data: recentOrders },
  ] = await Promise.all([
    supabase.from("orders").select("status, payment_mode, total_amount, created_at").is("deleted_at", null),
    supabase.from("payment_confirmations").select("*", { count: "exact", head: true }).eq("verified", false),
    supabase
      .from("orders")
      .select("id, created_at, customer_name, total_amount, payment_mode, payment_status, status, payment_confirmations(id, utr_number, screenshot_url, verified)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const s = {
    total: 0, today: 0, revenue: 0, todayRevenue: 0,
    byStatus: { pending: { n: 0, r: 0 }, confirmed: { n: 0, r: 0 }, delivered: { n: 0, r: 0 }, cancelled: { n: 0, r: 0 } } as Record<string, { n: number; r: number }>,
    cod: { n: 0, r: 0 }, online: { n: 0, r: 0 },
  };

  allOrders?.forEach((o) => {
    const amt = Number(o.total_amount) || 0;
    const isToday = new Date(o.created_at) >= today;
    s.total++;
    s.revenue += amt;
    if (isToday) { s.today++; s.todayRevenue += amt; }
    if (s.byStatus[o.status]) { s.byStatus[o.status].n++; s.byStatus[o.status].r += amt; }
    if (o.payment_mode === "cod") { s.cod.n++; s.cod.r += amt; } else { s.online.n++; s.online.r += amt; }
  });

  const fmt = (n: number) => n.toLocaleString("en-IN");

  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: "Pending", color: "text-amber-600 bg-amber-50 border-amber-200" },
    confirmed: { label: "Confirmed", color: "text-blue-600 bg-blue-50 border-blue-200" },
    delivered: { label: "Delivered", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
    cancelled: { label: "Cancelled", color: "text-red-600 bg-red-50 border-red-200" },
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl">
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm">Overview of orders and revenue</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Orders</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{s.total}</p>
          <p className="text-xs text-slate-400 mt-0.5">{s.today} today</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Revenue</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{fmt(s.revenue)}</p>
          <p className="text-xs text-slate-400 mt-0.5">{fmt(s.todayRevenue)} today</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Pending Verify</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{pendingVerifications ?? 0}</p>
          <p className="text-xs text-slate-400 mt-0.5">online payments</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">COD / Online</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{s.cod.n} / {s.online.n}</p>
          <p className="text-xs text-slate-400 mt-0.5">{fmt(s.cod.r)} / {fmt(s.online.r)}</p>
        </div>
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {Object.entries(statusLabels).map(([key, { label, color }]) => (
          <div key={key} className={`border rounded-lg p-3 ${color}`}>
            <p className="text-xs font-medium">{label}</p>
            <p className="text-xl font-semibold text-slate-900 mt-0.5">{s.byStatus[key]?.n ?? 0}</p>
            <p className="text-xs text-slate-500">{fmt(s.byStatus[key]?.r ?? 0)}</p>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-900">Recent Orders</h2>
        <Link href="/orders" className="text-blue-600 text-xs font-medium hover:text-blue-700">View all</Link>
      </div>

      {/* Mobile: stacked cards */}
      <div className="md:hidden space-y-3">
        {recentOrders?.map((order) => {
          const pc = (order.payment_confirmations as PaymentConfRow[] | null)?.[0];
          return (
            <div key={order.id} className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/orders/${order.id}`} className="font-semibold text-slate-900 hover:text-blue-600 text-sm">{order.customer_name}</Link>
                  <p className="text-slate-400 text-xs font-mono mt-0.5">
                    {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <span className="font-semibold text-slate-900 text-sm whitespace-nowrap">₹{order.total_amount}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                <PaymentBadge orderId={order.id} mode={order.payment_mode} paymentStatus={order.payment_status ?? "pending"} utr={pc?.utr_number} screenshotUrl={pc?.screenshot_url} verified={pc?.verified} confirmationId={pc?.id} />
                <InlineStatus orderId={order.id} status={order.status} />
              </div>
            </div>
          );
        })}
        {(!recentOrders || recentOrders.length === 0) && (
          <div className="bg-white border border-slate-200 rounded-lg px-4 py-8 text-center text-slate-400 text-sm">No orders yet.</div>
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Date</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Customer</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Total</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Payment</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders?.map((order) => {
                const pc = (order.payment_confirmations as PaymentConfRow[] | null)?.[0];
                return (
                  <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-2.5 text-slate-500 font-mono text-xs whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </td>
                    <td className="px-4 py-2.5">
                      <Link href={`/orders/${order.id}`} className="font-medium text-slate-900 hover:text-blue-600 text-sm">{order.customer_name}</Link>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-slate-900 whitespace-nowrap">{order.total_amount}</td>
                    <td className="px-4 py-2.5">
                      <PaymentBadge orderId={order.id} mode={order.payment_mode} paymentStatus={order.payment_status ?? "pending"} utr={pc?.utr_number} screenshotUrl={pc?.screenshot_url} verified={pc?.verified} confirmationId={pc?.id} />
                    </td>
                    <td className="px-4 py-2.5">
                      <InlineStatus orderId={order.id} status={order.status} />
                    </td>
                  </tr>
                );
              })}
              {(!recentOrders || recentOrders.length === 0) && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">No orders yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
