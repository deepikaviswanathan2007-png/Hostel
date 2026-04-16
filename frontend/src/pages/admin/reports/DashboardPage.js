import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { dashboardAPI } from '../../../services/api';
 import { Spinner, Card } from '../../../components/ui';
import { Building2, Home, Users, CheckCircle, Clock } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import useHostelNameMap from '../../../hooks/useHostelNameMap';

const PIE_COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#0EA5E9', '#8B5CF6'];

export default function DashboardPage() {
  const { getHostelName } = useHostelNameMap();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getStats()
      .then(res => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const stats = data?.stats || {};
  const blockStats = data?.blockStats || [];

  const metricCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents || 0,
      icon: Users,
      tone: 'bg-indigo-100 text-indigo-600',
    },
    {
      title: 'Total Rooms',
      value: stats.totalRooms || 0,
      icon: Building2,
      tone: 'bg-sky-100 text-sky-600',
    },
    {
      title: 'Available Rooms',
      value: stats.availableRooms || 0,
      icon: Home,
      tone: 'bg-emerald-100 text-emerald-600',
    },
    {
      title: 'Occupied Rooms',
      value: stats.occupiedRooms || 0,
      icon: Home,
      tone: 'bg-violet-100 text-violet-600',
    },
    {
      title: 'Pending Complaints',
      value: stats.pendingComplaints || 0,
      icon: Clock,
      tone: 'bg-amber-100 text-amber-600',
    },
    {
      title: 'Resolved Complaints',
      value: stats.resolvedComplaints || 0,
      icon: CheckCircle,
      tone: 'bg-emerald-100 text-emerald-600',
    },
  ];

  const pieData = blockStats.length > 0 
    ? blockStats.map((b) => ({
        name: getHostelName(b.block),
        value: Number(b.occupied) || 0
      }))
    : [{ name: 'No Data', value: 1 }];

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" className="text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:col-span-8">
          {metricCards.map(({ title, value, icon: Icon, tone }) => (
            <Card key={title} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-semibold text-slate-500">{title}</div>
                <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${tone}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-4xl font-black tracking-tight text-slate-900">{value}</div>
            </Card>
          ))}
        </section>

        <section className="xl:col-span-4">
          <Card className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
            <h2 className="text-lg font-bold text-slate-900">Occupancy by Hostel</h2>
            <div className="relative mt-4 min-h-[250px] flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={58}
                    outerRadius={88}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      fontSize: '13px',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 4px 10px -2px rgba(0, 0, 0, 0.08)'
                    }}
                    itemStyle={{ color: '#0F172A', fontWeight: 600 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black tracking-tight text-slate-900">{stats.occupiedRooms || 0}</span>
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Occupied</span>
              </div>
            </div>

            <div className="mt-4 space-y-2.5">
              {pieData.map((d, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                    <span className="font-medium text-slate-600">{d.name}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{d.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
