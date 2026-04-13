import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, Filter, Search, Wrench } from 'lucide-react';
import { format } from 'date-fns';
import { caretakerAPI } from '../../services/api';
import { Badge, Button, EmptyState, Input, PanelShell, PortalHero, Select, Spinner } from '../../components/ui';

const PAGE_SIZE = 15;

export default function CaretakerComplaintsPortal() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [updating, setUpdating] = useState({});

  const loadComplaints = useCallback(() => {
    setLoading(true);
    caretakerAPI.getComplaints({ status: filterStatus, page, limit: PAGE_SIZE })
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

  const handleStatusChange = async (complaintId, newStatus) => {
    setUpdating(current => ({ ...current, [complaintId]: true }));
    try {
      await caretakerAPI.updateComplaint(complaintId, { status: newStatus });
      toast.success(`Complaint updated to ${newStatus.replace('_', ' ')}`);
      loadComplaints();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(current => ({ ...current, [complaintId]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <PortalHero
        eyebrow="Caretaker Queue"
        title="Complaint Management"
        description="Search, triage, and update student complaints from a cleaner service operations view."
        accent="orange"
        icon={<Wrench className="h-4 w-4" />}
      />

      <PanelShell title="Filters" description="Refine the complaint queue by resident name, issue title, or workflow status.">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.7fr_auto]">
          <Input icon={<Search className="h-4 w-4" />} value={search} onChange={event => setSearch(event.target.value)} placeholder="Search by title or student name" className="h-14 rounded-[20px] bg-[#fbfbff] px-5" />
          <Select value={filterStatus} onChange={event => { setFilterStatus(event.target.value); setPage(1); }} className="h-14 rounded-[20px] bg-[#fbfbff] px-5">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </Select>
          <div className="flex items-center rounded-[20px] border border-brand-border/70 bg-[#fafbff] px-5 text-sm font-medium text-brand-muted">
            <Filter className="mr-2 h-4 w-4" />
            {filteredComplaints.length} of {total}
          </div>
        </div>
      </PanelShell>

      <PanelShell title="Complaint Queue" description="Update each complaint as it moves from pending to resolution.">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" className="text-orange-500" /></div>
        ) : filteredComplaints.length === 0 ? (
          <EmptyState title="No complaints found" description="Try a different search or filter to view more service records." icon={<CheckCircle2 className="h-10 w-10" />} />
        ) : (
          <div className="space-y-4">
            {filteredComplaints.map(complaint => (
              <div key={complaint.id} className="rounded-[28px] border border-brand-border/70 bg-[#fafbff] p-5">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-lg font-semibold text-brand-text">{complaint.title}</div>
                      <Badge variant={complaint.status === 'pending' ? 'warning' : complaint.status === 'in_progress' ? 'info' : 'success'}>
                        {complaint.status === 'in_progress' ? 'In Progress' : complaint.status}
                      </Badge>
                      <Badge variant={complaint.priority === 'high' ? 'danger' : complaint.priority === 'medium' ? 'warning' : 'info'}>
                        {(complaint.priority || 'medium').toUpperCase()}
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
                    <div className="text-xs font-medium uppercase tracking-[0.14em] text-brand-muted">
                      Created {format(new Date(complaint.created_at), 'dd MMM yyyy')}
                    </div>
                  </div>

                  <div className="w-full xl:max-w-[220px]">
                    <Select
                      value={complaint.status}
                      onChange={event => handleStatusChange(complaint.id, event.target.value)}
                      disabled={updating[complaint.id]}
                      className="h-12 rounded-[18px] bg-white"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </Select>
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
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(current => Math.max(1, current - 1))}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(current => Math.min(totalPages, current + 1))}>Next</Button>
            </div>
          </div>
        ) : null}
      </PanelShell>
    </div>
  );
}
