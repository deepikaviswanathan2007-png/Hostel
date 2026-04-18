import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { CalendarClock, ClipboardCheck, Plus, Trash2 } from 'lucide-react';
import { leavesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Badge, Button, EmptyState, Input, MetricPanel, Modal, PanelShell, PortalHero, Select, Spinner } from '../../components/ui';

const LEAVE_TYPE_OPTIONS = [
  { value: 'OnDuty - NPTEL Exam', label: 'OnDuty - NPTEL Exam' },
  { value: 'OnDuty - Offcampus Placement', label: 'OnDuty - Offcampus Placement' },
  { value: 'OnDuty - Training Course', label: 'Onduty - Training Course' },
  { value: 'OnDuty - Govt Exams', label: 'Onduty - Govt Exams' },
  { value: 'GP', label: 'GP' },
  { value: 'OnDuty - Clubs', label: 'Onduty - Clubs' },
  { value: 'Leave', label: 'Leave' },
  { value: 'OnDuty - Events', label: 'OnDuty - Events' },
  { value: 'OnDuty - Project Competition', label: 'OnDuty - Project Competition' },
  { value: 'OnDuty - Internship', label: 'OnDuty - Internship' },
  { value: 'OnDuty - Paper Presentation', label: 'OnDuty - Paper Presentation' },
  { value: 'OnDuty - Technical Competition', label: 'OnDuty - Technical Competition' },
  { value: 'OnDuty - NSS/NCC', label: 'OnDuty - NSS/NCC' },
  { value: 'OnDuty - Sports', label: 'OnDuty - Sports' },
  { value: 'Sick Leave', label: 'Sick Leave' },
  { value: 'Emergency Leave', label: 'Emergency Leave' },
];

const LEAVE_REASON_PREFIX = 'Leave Type: ';

const encodeLeaveReason = (type, reason) => `${LEAVE_REASON_PREFIX}${type}\n${reason}`;

const decodeLeaveReason = (reason = '') => {
  if (!reason.startsWith(LEAVE_REASON_PREFIX)) {
    return { type: null, description: reason };
  }
  const [firstLine, ...rest] = reason.split('\n');
  const type = firstLine.replace(LEAVE_REASON_PREFIX, '').trim();
  return { type: type || null, description: rest.join('\n').trim() };
};

export default function StudentLeaveRequestPortal() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formData, setFormData] = useState({ from_date: '', to_date: '', leave_type: LEAVE_TYPE_OPTIONS[0].value, reason: '' });

  const fetchLeaves = useCallback(async () => {
    try {
      setLoading(true);
      const response = await leavesAPI.getAll({ student_id: user.student_id });
      setLeaves(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load leave history');
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  }, [user?.student_id]);

  useEffect(() => {
    if (user?.student_id) {
      fetchLeaves();
    } else if (user?.student_id === undefined && !user?.student_id) {
      setLoading(false);
    }
  }, [fetchLeaves, user?.student_id]);

  const stats = useMemo(() => ({
    total: leaves.length,
    pending: leaves.filter(item => item.status === 'pending').length,
    approved: leaves.filter(item => item.status === 'approved').length,
  }), [leaves]);

  const handleCreate = async event => {
    event.preventDefault();
    if (!user?.student_id) {
      toast.error('Student profile not linked. Cannot request leave.');
      return;
    }

    try {
      setSubmitLoading(true);
      await leavesAPI.create({
        from_date: formData.from_date,
        to_date: formData.to_date,
        reason: encodeLeaveReason(formData.leave_type, formData.reason),
        student_id: user.student_id,
      });
      toast.success('Leave request submitted');
      setIsModalOpen(false);
      setFormData({ from_date: '', to_date: '', leave_type: LEAVE_TYPE_OPTIONS[0].value, reason: '' });
      fetchLeaves();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Are you sure you want to delete this pending request?')) return;
    try {
      await leavesAPI.delete(id);
      toast.success('Request deleted');
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
        eyebrow="Student Outpass"
        title="Leave Requests"
        description="Plan out-of-campus movement, submit leave dates, and keep track of approval status from a single student workflow."
        accent="primary"
        icon={<CalendarClock className="h-4 w-4" />}
        actions={<Button onClick={() => setIsModalOpen(true)} className="h-12 rounded-[18px] px-5"><Plus className="h-4 w-4" /> Apply for Leave</Button>}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricPanel title="Total Requests" value={stats.total} helper="Leave entries on file" icon={<ClipboardCheck className="h-5 w-5" />} />
        <MetricPanel title="Pending" value={stats.pending} helper="Waiting for review" tone="orange" icon={<CalendarClock className="h-5 w-5" />} />
        <MetricPanel title="Approved" value={stats.approved} helper="Cleared requests" tone="green" icon={<ClipboardCheck className="h-5 w-5" />} />
      </div>

      <PanelShell title="Leave History" description="Review submitted outpass records and remove a request while it is still pending.">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" className="text-brand-primary" /></div>
        ) : leaves.length === 0 ? (
          <EmptyState title="No leave requests yet" description="Your submitted outpass requests will appear here." icon={<CalendarClock className="h-10 w-10" />} />
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="space-y-4">
            {leaves.map((leave, index) => {
              const days = Math.ceil((new Date(leave.to_date) - new Date(leave.from_date)) / (1000 * 60 * 60 * 24)) + 1;
              const parsedReason = decodeLeaveReason(leave.reason || '');
              return (
                <motion.div
                  key={leave.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + index * 0.05 }}
                  className="rounded-2xl border border-brand-border/70 bg-white p-6 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-4 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="text-lg font-bold text-brand-text">{days} day{days > 1 ? 's' : ''} leave</div>
                        <Badge variant={statusVariant(leave.status)}>{leave.status}</Badge>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-xl border border-brand-border/50 bg-brand-bg px-4 py-3">
                          <div className="text-xs font-semibold uppercase tracking-widest text-brand-muted">From</div>
                          <div className="mt-2 text-sm font-semibold text-brand-text">{new Date(leave.from_date).toLocaleDateString()}</div>
                        </div>
                        <div className="rounded-xl border border-brand-border/50 bg-brand-bg px-4 py-3">
                          <div className="text-xs font-semibold uppercase tracking-widest text-brand-muted">To</div>
                          <div className="mt-2 text-sm font-semibold text-brand-text">{new Date(leave.to_date).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="rounded-xl border border-brand-border/50 bg-brand-bg px-4 py-3">
                        <div className="text-xs font-semibold uppercase tracking-widest text-brand-muted">Leave Type</div>
                        <div className="mt-2 text-sm font-semibold text-brand-text">{parsedReason.type || 'General'}</div>
                      </div>
                      <div className="rounded-xl border border-brand-border/50 bg-brand-bg px-4 py-3">
                        <div className="text-xs font-semibold uppercase tracking-widest text-brand-muted">Reason</div>
                        <div className="mt-2 text-sm leading-7 text-brand-text">{parsedReason.description || '-'}</div>
                      </div>
                    </div>

                    {leave.status === 'pending' ? (
                      <Button variant="outline" size="sm" onClick={() => handleDelete(leave.id)} className="h-11 rounded-lg px-4 text-red-600 border-red-200 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    ) : null}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </PanelShell>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Apply for Leave" size="lg">
        <form onSubmit={handleCreate} className="grid gap-5">
          <Select
            label="Leave Type"
            value={formData.leave_type}
            onChange={event => setFormData(current => ({ ...current, leave_type: event.target.value }))}
            required
            className="h-14 rounded-[20px] bg-[#fbfbff] px-5"
          >
            {LEAVE_TYPE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <div className="grid gap-4 md:grid-cols-2">
            <Input 
              type="datetime-local" 
              label="From Date" 
              required 
              value={formData.from_date} 
              onChange={event => setFormData(current => ({ ...current, from_date: event.target.value }))} 
              className="h-14 rounded-[20px] bg-[#fbfbff] px-5" 
            />
            <Input 
              type="datetime-local" 
              label="To Date" 
              required 
              value={formData.to_date} 
              onChange={event => setFormData(current => ({ ...current, to_date: event.target.value }))} 
              className="h-14 rounded-[20px] bg-[#fbfbff] px-5" 
            />
          </div>

          <Input
            label="Remarks"
            required
            value={formData.reason}
            onChange={event => setFormData(current => ({ ...current, reason: event.target.value }))}
            placeholder="Enter reason for leave"
            className="h-14 rounded-[20px] bg-[#fbfbff] px-5 w-full"
          />

          <div className="flex gap-3 pt-2">
            <Button 
              type="button" 
              variant="danger" 
              onClick={() => setIsModalOpen(false)} 
              className="flex-1 h-12 rounded-[18px] text-[15px] font-medium tracking-wide"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              loading={submitLoading} 
              className="flex-1 h-12 rounded-[18px] text-[15px] font-medium tracking-wide bg-[#7f56d9] hover:bg-[#6941c6]"
            >
              {submitLoading ? 'Submitting...' : 'Submit Leave Request'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}