import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ClipboardList, Search } from 'lucide-react';
import { format } from 'date-fns';
import { wardenAPI } from '../../services/api';
import { Badge, EmptyState, Input, MetricPanel, PanelShell, PortalHero, Select, Spinner } from '../../components/ui';

const PAGE_SIZE = 20;

export default function WardenComplaintsPortal() {
  const [complaints, setComplaints] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);

  const loadComplaints = useCallback(() => {
    setLoading(true);
    wardenAPI.getComplaints({ status: filterStatus, page, limit: PAGE_SIZE })
      .then(response => {
        setComplaints(response.data.data || []);
        setTotal(response.data.total || 0);
      })
      .catch(() => toast.error('Failed to load complaints'))
      .finally(() => setLoading(false));
  }, [filterStatus, page]);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  const filteredComplaints = useMemo(() => complaints.filter(item => (
    !search ||
    item.title?.toLowerCase().includes(search.toLowerCase()) ||
    item.student_name?.toLowerCase().includes(search.toLowerCase())
  )), [complaints, search]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <PortalHero
        eyebrow="Warden Complaints"
        title="Complaints Overview"
        description="Review complaint trends and quickly inspect student issue records across the hostel."
        accent="blue"
        icon={<ClipboardList className="h-4 w-4" />}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricPanel title="Total" value={total} helper="Records in complaint queue" tone="blue" icon={<ClipboardList className="h-5 w-5" />} />
        <MetricPanel title="Pending" value={complaints.filter(item => item.status === 'pending').length} helper="Awaiting assignment" tone="orange" icon={<ClipboardList className="h-5 w-5" />} />
        <MetricPanel title="In Progress" value={complaints.filter(item => item.status === 'in_progress').length} helper="Under active work" tone="primary" icon={<ClipboardList className="h-5 w-5" />} />
        <MetricPanel title="Resolved" value={complaints.filter(item => item.status === 'resolved').length} helper="Closed complaints" tone="green" icon={<ClipboardList className="h-5 w-5" />} />
      </div>

      <PanelShell title="Filters" description="Find complaint records by resident name, issue title, or workflow status.">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.6fr]">
          <Input icon={<Search className="h-4 w-4" />} value={search} onChange={event => setSearch(event.target.value)} placeholder="Search by title or student" className="h-14 rounded-[20px] bg-[#fbfbff] px-5" />
          <Select value={filterStatus} onChange={event => { setFilterStatus(event.target.value); setPage(1); }} className="h-14 rounded-[20px] bg-[#fbfbff] px-5">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </Select>
        </div>
      </PanelShell>

      <PanelShell title="Complaint Feed" description="Recent complaint cards with student, room, priority, and workflow details.">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" className="text-sky-500" /></div>
        ) : filteredComplaints.length === 0 ? (
          <EmptyState title="No complaints found" description="No complaint records match the current search and filter settings." icon={<ClipboardList className="h-10 w-10" />} />
        ) : (
          <div className="space-y-4">
            {filteredComplaints.map(complaint => (
              <div key={complaint.id} className="rounded-[28px] border border-brand-border/70 bg-[#fafbff] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-lg font-semibold text-brand-text">{complaint.title}</div>
                      <Badge variant={complaint.status === 'pending' ? 'warning' : complaint.status === 'in_progress' ? 'info' : 'success'}>
                        {complaint.status === 'in_progress' ? 'In Progress' : complaint.status}
                      </Badge>
                      <Badge variant={complaint.priority === 'high' ? 'danger' : complaint.priority === 'medium' ? 'warning' : 'info'}>
                        {(complaint.priority || 'medium').toUpperCase()} Priority
                      </Badge>
                    </div>
                    <div className="text-sm text-brand-muted">
                      {complaint.student_name || 'Unknown Student'} • Room {complaint.room_number || 'N/A'} • {complaint.category || 'other'}
                    </div>
                    {complaint.description ? <p className="text-sm leading-7 text-brand-muted">{complaint.description}</p> : null}
                    {complaint.image_url && (
                      <div className="mt-2">
                        <a href={`${(process.env.REACT_APP_API_URL || '').replace(/(\/api)?$/, '')}${complaint.image_url}`} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-primary font-medium hover:underline inline-flex items-center gap-1">
                          View Attachment
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:w-[280px]">
                    <div className="rounded-[22px] border border-white bg-white px-4 py-3">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-muted">Created</div>
                      <div className="mt-2 text-sm font-semibold text-brand-text">{format(new Date(complaint.created_at), 'dd MMM yyyy')}</div>
                    </div>
                    <div className="rounded-[22px] border border-white bg-white px-4 py-3">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-muted">Scope</div>
                      <div className="mt-2 text-sm font-semibold text-brand-text">{complaint.room_number ? `Room ${complaint.room_number}` : 'Resident record'}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {total > PAGE_SIZE ? (
          <div className="mt-6 flex flex-col gap-3 border-t border-brand-border/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-brand-muted">Page {page} of {totalPages}</div>
            <div className="flex gap-2">
              <button type="button" disabled={page === 1} onClick={() => setPage(current => current - 1)} className="rounded-2xl border border-brand-border px-4 py-2 text-sm font-medium text-brand-muted disabled:opacity-50">Previous</button>
              <button type="button" disabled={page === totalPages} onClick={() => setPage(current => current + 1)} className="rounded-2xl border border-brand-border px-4 py-2 text-sm font-medium text-brand-muted disabled:opacity-50">Next</button>
            </div>
          </div>
        ) : null}
      </PanelShell>
    </div>
  );
}
