import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { format } from 'date-fns';
import { Building2, Home, ShieldCheck, UserPlus, Users } from 'lucide-react';
import { wardenAPI } from '../../services/api';
import { Badge, EmptyState, MetricPanel, PanelShell, PortalHero, Spinner } from '../../components/ui';
import useHostelNameMap from '../../hooks/useHostelNameMap';

const PIE_COLORS = ['#6366f1', '#a855f7', '#ec4899', '#3b82f6', '#14b8a6', '#f59e0b'];

export default function WardenDashboardPortal() {
  const { getHostelName } = useHostelNameMap();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    wardenAPI.getStats()
      .then(response => setData(response.data))
      .catch(() => setData({ stats: {}, blockStats: [], recentStudents: [] }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Spinner size="lg" className="text-sky-500" /></div>;
  }

  const stats = data?.stats || {};
  const blockStats = data?.blockStats || [];
  const recentStudents = data?.recentStudents || [];
  const pieData = blockStats.length > 0 ? blockStats.map(item => ({ name: getHostelName(item.block), value: Number(item.occupied) || 0 })) : [{ name: 'No Data', value: 1 }];
  const totalCapacity = blockStats.reduce((sum, item) => sum + (Number(item.capacity) || 0), 0);
  const totalOccupied = blockStats.reduce((sum, item) => sum + (Number(item.occupied) || 0), 0);
  const availableSlots = Math.max(0, totalCapacity - totalOccupied);

  return (
    <div className="space-y-6">
      <PortalHero
        eyebrow="Warden Portal"
        title="Hostel Overview"
        description="Monitor students, occupancy, leave flow, and complaint activity from one management-level dashboard."
        accent="blue"
        icon={<ShieldCheck className="h-4 w-4" />}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricPanel title="Total Students" value={stats.totalStudents || 0} helper="Students assigned" tone="blue" icon={<Users className="h-5 w-5" />} />
        <MetricPanel title="Total Rooms" value={stats.totalRooms || 0} helper="Inventory available" tone="primary" icon={<Building2 className="h-5 w-5" />} />
        <MetricPanel title="Available Slots" value={stats.availableRooms || 0} helper="Open capacity" tone="orange" icon={<Home className="h-5 w-5" />} />
        <MetricPanel title="Occupied Rooms" value={stats.occupiedRooms || 0} helper="Active allocations" tone="green" icon={<ShieldCheck className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <PanelShell title="Occupancy by Hostel" description="Visual breakdown of occupied rooms across hostels.">
          {pieData.length > 0 && pieData[0].value > 0 ? (
            <div className="space-y-4">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} innerRadius={58} outerRadius={96} paddingAngle={4} dataKey="value" stroke="none">
                      {pieData.map((entry, index) => <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 16, border: '1px solid #e5e7eb', backgroundColor: '#ffffff' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                {pieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2 text-xs font-medium text-brand-muted">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                    {entry.name} ({entry.value})
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState title="No occupancy data" description="Hostel occupancy statistics will appear here when room data is available." icon={<Building2 className="h-10 w-10" />} />
          )}
        </PanelShell>

        <PanelShell title="Capacity Snapshot" description="Key accommodation numbers for hostel planning and oversight.">
          <div className="space-y-4">
            {[
              { label: 'Total Capacity', value: totalCapacity, tone: 'bg-sky-50 border-sky-100 text-sky-600', icon: <Building2 className="h-5 w-5" /> },
              { label: 'Currently Occupied', value: totalOccupied, tone: 'bg-emerald-50 border-emerald-100 text-emerald-600', icon: <Users className="h-5 w-5" /> },
              { label: 'Available Slots', value: availableSlots, tone: 'bg-amber-50 border-amber-100 text-amber-600', icon: <Home className="h-5 w-5" /> },
            ].map(item => (
              <div key={item.label} className={`flex items-center justify-between rounded-[26px] border p-5 ${item.tone}`}>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white">{item.icon}</div>
                  <div className="text-base font-semibold text-brand-text">{item.label}</div>
                </div>
                <div className="font-display text-4xl font-black tracking-[-0.04em] text-brand-text">{item.value}</div>
              </div>
            ))}
          </div>
        </PanelShell>
      </div>

      <PanelShell title="Recent Registrations" description="Latest student records added to the hostel system.">
        {recentStudents.length > 0 ? (
          <div className="space-y-4">
            {recentStudents.map(student => (
              <div key={student.id} className="flex flex-col gap-4 rounded-[28px] border border-brand-border/70 bg-[#fafbff] p-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500 text-sm font-bold text-white">
                    {student.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <div className="text-base font-semibold text-brand-text">{student.name}</div>
                    <div className="mt-1 text-sm text-brand-muted">{student.department} • Year {student.year}</div>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3 lg:w-[420px]">
                  <div className="rounded-[22px] border border-white bg-white px-4 py-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-muted">Register No</div>
                    <div className="mt-2 text-sm font-semibold text-brand-text">{student.register_no}</div>
                  </div>
                  <div className="rounded-[22px] border border-white bg-white px-4 py-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-muted">Room</div>
                    <div className="mt-2 text-sm font-semibold text-brand-text">
                      {student.room_number ? `${student.room_number} (${getHostelName(student.block)})` : 'Not Allocated'}
                    </div>
                  </div>
                  <div className="rounded-[22px] border border-white bg-white px-4 py-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-muted">Added On</div>
                    <div className="mt-2 text-sm font-semibold text-brand-text">{format(new Date(student.created_at), 'dd MMM yyyy')}</div>
                  </div>
                  <div className="rounded-[22px] border border-white bg-white px-4 py-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-muted">Floor/Wing</div>
                    <div className="mt-2 text-sm font-semibold capitalize text-brand-text">
                      {student.floor ?? '—'} / {student.wing || '—'}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Badge variant="info"><UserPlus className="mr-1 h-3.5 w-3.5" /> New Entry</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No recent student records" description="New registrations will show up here once they are added." icon={<Users className="h-10 w-10" />} />
        )}
      </PanelShell>
    </div>
  );
}
