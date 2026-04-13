import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle, Search, Trash2, XCircle } from 'lucide-react';
import { leavesAPI } from '../../services/api';
import { Badge, Button, EmptyState, Input, PanelShell, PortalHero, Select, Spinner } from '../../components/ui';

export default function WardenLeaveApprovalsPortal() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');

  const fetchLeaves = useCallback(async () => {
    try {
      setLoading(true);
      const response = await leavesAPI.getAll({ status: statusFilter !== 'all' ? statusFilter : undefined });
      let filtered = response.data.data || [];
      if (search) {
        filtered = filtered.filter(item =>
          item.student_name?.toLowerCase().includes(search.toLowerCase()) ||
          item.student_reg?.toLowerCase().includes(search.toLowerCase())
        );
      }
      setLeaves(filtered);
    } catch (error) {
      toast.error('Failed to load leave requests');
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const handleStatusUpdate = async (id, newStatus) => {
    if (!window.confirm(`Are you sure you want to ${newStatus} this leave request?`)) return;
    try {
      await leavesAPI.updateStatus(id, { status: newStatus });
      toast.success(`Leave request ${newStatus}`);
      fetchLeaves();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this leave request?')) return;
    try {
      await leavesAPI.delete(id);
      toast.success('Leave request deleted');
      fetchLeaves();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete request');
    }
  };

  const statusVariant = status => ({
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
  }[status] || 'default');

  return (
    <div className="space-y-6">
      <PortalHero
        eyebrow="Warden Outpass Desk"
        title="Leave Approvals"
        description="Review student outpass requests, search by resident details, and approve or reject from one organized moderation flow."
        accent="blue"
      />

      <PanelShell title="Filters" description="Filter leave requests by student search and approval status.">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.55fr]">
          <Input icon={<Search className="h-4 w-4" />} value={search} onChange={event => setSearch(event.target.value)} placeholder="Search by student name or register number" className="h-14 rounded-[20px] bg-[#fbfbff] px-5" />
          <Select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="h-14 rounded-[20px] bg-[#fbfbff] px-5">
            <option value="pending">Pending Requests</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All Requests</option>
          </Select>
        </div>
      </PanelShell>

      <PanelShell title="Approval Queue" description="Student leave requests awaiting action or available for review.">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" className="text-sky-500" /></div>
        ) : leaves.length === 0 ? (
          <EmptyState title="No leave requests found" description="No outpass requests match the current filter settings." />
        ) : (
          <div className="space-y-4">
            {leaves.map(leave => {
              const days = Math.ceil((new Date(leave.to_date) - new Date(leave.from_date)) / (1000 * 60 * 60 * 24)) + 1;
              return (
                <div key={leave.id} className="rounded-[28px] border border-brand-border/70 bg-[#fafbff] p-5">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="text-lg font-semibold text-brand-text">{leave.student_name}</div>
                        <Badge variant={statusVariant(leave.status)}>{leave.status}</Badge>
                      </div>
                      <div className="text-sm text-brand-muted">{leave.student_reg}</div>
                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="rounded-[22px] border border-white bg-white px-4 py-3">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-muted">Duration</div>
                          <div className="mt-2 text-sm font-semibold text-brand-text">{days} day{days > 1 ? 's' : ''}</div>
                        </div>
                        <div className="rounded-[22px] border border-white bg-white px-4 py-3">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-muted">From</div>
                          <div className="mt-2 text-sm font-semibold text-brand-text">{new Date(leave.from_date).toLocaleDateString()}</div>
                        </div>
                        <div className="rounded-[22px] border border-white bg-white px-4 py-3">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-muted">To</div>
                          <div className="mt-2 text-sm font-semibold text-brand-text">{new Date(leave.to_date).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="rounded-[22px] border border-white bg-white px-4 py-3">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-muted">Reason</div>
                        <div className="mt-2 text-sm leading-7 text-brand-text">{leave.reason}</div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 xl:w-[180px]">
                      {leave.status === 'pending' ? (
                        <>
                        <Button variant="outline" onClick={() => handleStatusUpdate(leave.id, 'approved')} className="h-11 rounded-[18px] px-4 text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                          <CheckCircle className="h-4 w-4" />
                          Approve
                        </Button>
                        <Button variant="outline" onClick={() => handleStatusUpdate(leave.id, 'rejected')} className="h-11 rounded-[18px] px-4 text-red-600 border-red-200 hover:bg-red-50">
                          <XCircle className="h-4 w-4" />
                          Reject
                        </Button>
                        </>
                      ) : null}
                      <Button variant="outline" onClick={() => handleDelete(leave.id)} className="h-11 rounded-[18px] px-4 text-red-600 border-red-200 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PanelShell>
    </div>
  );
}
