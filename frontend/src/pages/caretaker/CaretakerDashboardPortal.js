import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { AlertCircle, Building2, Clock, Home, Wrench } from 'lucide-react';
import { caretakerAPI } from '../../services/api';
import { Badge, EmptyState, MetricPanel, PanelShell, PortalHero, Spinner } from '../../components/ui';

export default function CaretakerDashboardPortal() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    caretakerAPI.getStats()
      .then(response => setData(response.data))
      .catch(() => setData({ stats: {}, recentComplaints: [] }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Spinner size="lg" className="text-orange-500" /></div>;
  }

  const stats = data?.stats || {};
  const recentComplaints = data?.recentComplaints || [];

  return (
    <div className="space-y-6">
      <PortalHero
        eyebrow="Caretaker Portal"
        title="Facilities Operations"
        description="Track complaint flow, monitor room usage, and keep hostel service activity moving from a single caretaker dashboard."
        accent="orange"
        icon={<Wrench className="h-4 w-4" />}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricPanel title="Total Students" value={stats.totalStudents || 0} helper="Residents on record" tone="orange" icon={<Wrench className="h-5 w-5" />} />
        <MetricPanel title="Total Rooms" value={stats.totalRooms || 0} helper="Hostel inventory" tone="blue" icon={<Building2 className="h-5 w-5" />} />
        <MetricPanel title="Occupied Rooms" value={stats.occupiedRooms || 0} helper="Rooms currently in use" tone="primary" icon={<Home className="h-5 w-5" />} />
        <MetricPanel title="Pending Issues" value={stats.pendingComplaints || 0} helper="Tickets needing action" tone="orange" icon={<AlertCircle className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.35fr]">
        <PanelShell title="Complaint Status" description="Current operational split for service desk tickets.">
          <div className="space-y-4">
            <div className="rounded-[26px] border border-orange-100 bg-orange-50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-600">Pending</div>
                  <div className="mt-3 font-display text-4xl font-black tracking-[-0.04em] text-brand-text">{stats.pendingComplaints || 0}</div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-orange-600"><AlertCircle className="h-5 w-5" /></div>
              </div>
            </div>

            <div className="rounded-[26px] border border-sky-100 bg-sky-50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-600">In Progress</div>
                  <div className="mt-3 font-display text-4xl font-black tracking-[-0.04em] text-brand-text">{stats.inProgressComplaints || 0}</div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-sky-600"><Clock className="h-5 w-5" /></div>
              </div>
            </div>
          </div>
        </PanelShell>

        <PanelShell title="Recent Complaints" description="Latest student complaints entering the caretaker queue.">
          {recentComplaints.length > 0 ? (
            <div className="space-y-4">
              {recentComplaints.map(complaint => (
                <div key={complaint.id} className="rounded-[28px] border border-brand-border/70 bg-[#fafbff] p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-lg font-semibold text-brand-text">{complaint.title}</div>
                        <Badge variant={complaint.status === 'pending' ? 'warning' : complaint.status === 'in_progress' ? 'info' : 'success'}>
                          {complaint.status === 'in_progress' ? 'In Progress' : complaint.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-brand-muted">
                        {complaint.student_name || 'Unknown Student'} • Room {complaint.room_number || 'N/A'}
                      </div>
                      {complaint.description ? <p className="text-sm leading-7 text-brand-muted">{complaint.description}</p> : null}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:w-[290px]">
                      <div className="rounded-[22px] border border-white bg-white px-4 py-3">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-muted">Priority</div>
                        <div className="mt-2 text-sm font-semibold uppercase text-brand-text">{complaint.priority || 'Medium'}</div>
                      </div>
                      <div className="rounded-[22px] border border-white bg-white px-4 py-3">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-muted">Created</div>
                        <div className="mt-2 text-sm font-semibold text-brand-text">{format(new Date(complaint.created_at), 'dd MMM yyyy')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No active complaints" description="All service records are clear right now." icon={<Wrench className="h-10 w-10" />} />
          )}
        </PanelShell>
      </div>
    </div>
  );
}
