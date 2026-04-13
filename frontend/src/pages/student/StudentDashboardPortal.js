import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { AlertCircle, CheckCircle2, Clock, MapPin, Sparkles } from 'lucide-react';
import { studentPortalAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Badge, Button, EmptyState, MetricPanel, PanelShell, PortalHero, Spinner } from '../../components/ui';
import useHostelNameMap from '../../hooks/useHostelNameMap';

export default function StudentDashboardPortal() {
  const { getHostelName } = useHostelNameMap();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentPortalAPI.getDashboard()
      .then(response => setData(response.data.data))
      .catch(() => setData({ student: null, complaintStats: {}, recentNotices: [] }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" className="text-brand-primary" />
      </div>
    );
  }

  const { student, complaintStats = {}, recentNotices = [] } = data || {};

  return (
    <div className="space-y-6">
      <PortalHero
        eyebrow="Student Portal"
        title={`Welcome back, ${user?.name || 'Resident'}`}
        description="Review room allocation, service requests, and latest hostel updates from one unified dashboard."
        accent="primary"
        icon={<Sparkles className="h-4 w-4" />}
        actions={
          <>
            <Link to="/student/complaints">
              <Button className="h-12 rounded-[18px] px-5">File Complaint</Button>
            </Link>
            <Link to="/student/profile">
              <Button variant="outline" className="h-12 rounded-[18px] px-5">View Profile</Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricPanel title="Total Complaints" value={complaintStats?.total || 0} helper="All submitted requests" icon={<AlertCircle className="h-5 w-5" />} />
        <MetricPanel title="Pending" value={complaintStats?.pending || 0} helper="Awaiting review" tone="orange" icon={<Clock className="h-5 w-5" />} />
        <MetricPanel title="In Progress" value={complaintStats?.in_progress || 0} helper="Assigned to hostel team" tone="blue" icon={<MapPin className="h-5 w-5" />} />
        <MetricPanel title="Resolved" value={complaintStats?.resolved || 0} helper="Closed requests" tone="green" icon={<CheckCircle2 className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <PanelShell
          title="Room Overview"
          description="Current allocation details for your assigned room."
          action={student?.room_number ? <Badge variant="success">Assigned</Badge> : <Badge variant="warning">Pending Allocation</Badge>}
        >
          {student?.room_number ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[28px] bg-gradient-to-br from-brand-primary to-[#7e57c2] p-6 text-white shadow-lg">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">Room Number</div>
                  <div className="mt-3 font-display text-5xl font-black tracking-[-0.04em]">{student.room_number}</div>
                </div>
                <div className="rounded-[28px] border border-brand-border/70 bg-[#fafbff] p-6">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-muted">Hostel</div>
                  <div className="mt-3 font-display text-4xl font-black tracking-[-0.04em] text-brand-text">{getHostelName(student.block)}</div>
                </div>
                <div className="rounded-[28px] border border-brand-border/70 bg-[#fafbff] p-6">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-muted">Floor</div>
                  <div className="mt-3 font-display text-4xl font-black tracking-[-0.04em] text-brand-text">{student.floor}</div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[24px] border border-brand-border/70 bg-[#fafbff] px-5 py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-muted">Room Type</div>
                  <div className="mt-2 text-base font-semibold capitalize text-brand-text">{student.room_type || 'Standard'}</div>
                </div>
                <div className="rounded-[24px] border border-brand-border/70 bg-[#fafbff] px-5 py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-muted">Warden</div>
                  <div className="mt-2 text-base font-semibold text-brand-text">{student.warden_name || 'Head Warden'}</div>
                </div>
              </div>

            </div>
          ) : (
            <div className="rounded-[28px] border border-dashed border-gray-300 bg-[#fafbff] px-6 py-12">
              <EmptyState title="No room allocated yet" description="Please contact the hostel administration for your room assignment details." icon={<AlertCircle className="h-10 w-10" />} />
            </div>
          )}
        </PanelShell>

        <PanelShell
          title="Recent Notices"
          description="Latest hostel communication relevant to students."
          action={<Link to="/student/notices" className="text-sm font-semibold text-brand-primary">View all</Link>}
        >
          {recentNotices.length > 0 ? (
            <div className="space-y-4">
              {recentNotices.map(notice => (
                <div key={notice.id} className="rounded-[24px] border border-brand-border/70 bg-[#fafbff] px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-base font-semibold text-brand-text">{notice.title}</div>
                    {notice.category === 'urgent' ? <Badge variant="danger">Urgent</Badge> : null}
                  </div>
                  {notice.content ? <p className="mt-3 text-sm leading-7 text-brand-muted">{notice.content}</p> : null}
                  <div className="mt-4 text-xs font-medium uppercase tracking-[0.14em] text-brand-muted">
                    {format(new Date(notice.created_at), 'dd MMM yyyy')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No new notices" description="You're all caught up for now." icon={<CheckCircle2 className="h-10 w-10" />} />
          )}
        </PanelShell>
      </div>
    </div>
  );
}
