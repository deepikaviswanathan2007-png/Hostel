import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { complaintsAPI, studentsAPI } from '../../../services/api';
import { Button, Badge, Select, Input, Textarea, Modal, Spinner, EmptyState, SectionCard } from '../../../components/ui';
import { format } from 'date-fns';

const PRIORITY_BADGE = { low: 'success', medium: 'warning', high: 'danger' };
const STATUS_BADGE = { pending: 'warning', in_progress: 'info', resolved: 'success' };

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', category: '', priority: '' });
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ student_id: '', title: '', description: '', category: 'other', priority: 'medium' });
  const [statusForm, setStatusForm] = useState({ status: '', admin_note: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    complaintsAPI.getAll(filters).then(r => setComplaints(r.data.data)).finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = async () => {
    const r = await studentsAPI.getAll({ limit: 200 });
    setStudents(r.data.data);
    setForm({ student_id: '', title: '', description: '', category: 'other', priority: 'medium' });
    setModal('add');
  };

  const openUpdate = complaint => {
    setSelected(complaint);
    setStatusForm({ status: complaint.status, admin_note: complaint.admin_note || '' });
    setModal('update');
  };

  const handleAdd = async () => {
    if (!form.title) return toast.error('Title required.');
    setSaving(true);
    try {
      await complaintsAPI.create(form);
      toast.success('Complaint filed!');
      setModal(null);
      load();
    } catch {
      toast.error('Error filing complaint.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await complaintsAPI.updateStatus(selected.id, statusForm);
      toast.success('Status updated!');
      setModal(null);
      load();
    } catch {
      toast.error('Error updating.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this complaint?')) return;
    try {
      await complaintsAPI.delete(id);
      toast.success('Deleted.');
      load();
    } catch {
      toast.error('Delete failed.');
    }
  };

  const pending = complaints.filter(c => c.status === 'pending').length;
  const progress = complaints.filter(c => c.status === 'in_progress').length;
  const resolved = complaints.filter(c => c.status === 'resolved').length;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <Badge variant="default">{complaints.length} active records</Badge>
        <Button size="sm" onClick={openAdd}>File Complaint</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[['Pending', pending], ['In Progress', progress], ['Resolved', resolved]].map(([label, value]) => (
          <div key={label} className="rounded-3xl border border-brand-border bg-white p-5 text-center shadow-card">
            <div className="font-display text-2xl font-black text-brand-text">{value}</div>
            <div className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-brand-muted">{label}</div>
          </div>
        ))}
      </div>

      <SectionCard title="Service Filters" description="Filter requests by workflow status, complaint category, and urgency.">
        <div className="flex flex-wrap gap-3">
          <Select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </Select>
          <Select value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}>
            <option value="">All Categories</option>
            {['plumbing', 'electrical', 'carpentry', 'housekeeping', 'network', 'mess', 'other'].map(c => (
              <option key={c} value={c} className="capitalize">{c}</option>
            ))}
          </Select>
          <Select value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}>
            <option value="">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>
          {(filters.status || filters.category || filters.priority) && (
            <Button variant="ghost" size="sm" onClick={() => setFilters({ status: '', category: '', priority: '' })}>Clear</Button>
          )}
        </div>
      </SectionCard>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" className="text-brand-primary" /></div>
      ) : complaints.length === 0 ? (
        <EmptyState title="No complaints found" description="All clear!" />
      ) : (
        <div className="space-y-3">
          {complaints.map((complaint, i) => (
            <motion.div
              key={complaint.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 flex items-start gap-4 hover:shadow-card-hover transition-shadow"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-semibold flex-shrink-0
                ${complaint.priority === 'high' ? 'bg-red-50 text-red-700' : complaint.priority === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
                {complaint.category.slice(0, 3).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-brand-text text-sm">{complaint.title}</span>
                  <Badge variant={STATUS_BADGE[complaint.status]}>{complaint.status.replace('_', ' ')}</Badge>
                  <Badge variant={PRIORITY_BADGE[complaint.priority]}>{complaint.priority}</Badge>
                  <Badge variant="default" className="capitalize">{complaint.category}</Badge>
                </div>
                {complaint.description && <p className="text-xs text-brand-muted mb-1 line-clamp-2">{complaint.description}</p>}                  {complaint.image_url && (
                    <a href={`${(process.env.REACT_APP_API_URL || '').replace(/(\/api)?$/, '')}${complaint.image_url}`} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-primary font-medium hover:underline mb-1 block">
                      View Attachment
                    </a>
                  )}                <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                  {complaint.student_name && <span>{complaint.student_name} ({complaint.register_no})</span>}
                  {complaint.room_number && <span>Room {complaint.room_number}</span>}
                  <span>{format(new Date(complaint.created_at), 'dd MMM yyyy')}</span>
                </div>
                {complaint.admin_note && (
                  <div className="mt-2 text-xs bg-brand-bg rounded-lg px-2 py-1.5 text-brand-muted border border-gray-100">
                    <span className="font-semibold text-brand-primary">Admin note:</span> {complaint.admin_note}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1 flex-shrink-0">
                <Button variant="outline" size="sm" onClick={() => openUpdate(complaint)}>Update</Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(complaint.id)}>Delete</Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={modal === 'add'} onClose={() => setModal(null)} title="File New Complaint" size="lg">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <Select
              label="Student (optional)"
              value={form.student_id}
              onChange={e => setForm(f => ({ ...f, student_id: e.target.value }))}
              className="h-16 rounded-[24px] px-6 text-base"
            >
            <option value="">Anonymous or select student</option>
            {students.map(student => <option key={student.id} value={student.id}>{student.name} ({student.register_no})</option>)}
            </Select>
          </div>
          <div className="md:col-span-2">
            <Input
              label="Title"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Brief description of issue"
              className="h-16 rounded-[24px] px-6 text-base"
            />
          </div>
          <div>
            <Select
              label="Category"
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="h-16 rounded-[24px] px-6 text-base capitalize"
            >
              {['plumbing', 'electrical', 'carpentry', 'housekeeping', 'network', 'mess', 'other'].map(c => (
                <option key={c} value={c} className="capitalize">{c}</option>
              ))}
            </Select>
          </div>
          <div>
            <Select
              label="Priority"
              value={form.priority}
              onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
              className="h-16 rounded-[24px] px-6 text-base"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Textarea
              label="Description"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Detailed description..."
              className="min-h-[132px] rounded-[24px] px-6 py-5 text-base"
            />
          </div>
          <div className="flex flex-col-reverse gap-3 pt-1 md:col-span-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setModal(null)} className="h-14 rounded-[20px] px-6 text-base">
              Cancel
            </Button>
            <Button onClick={handleAdd} loading={saving} className="h-14 rounded-[20px] px-6 text-base">
              File Complaint
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={modal === 'update'} onClose={() => setModal(null)} title="Update Complaint Status">
        {selected && (
          <div className="space-y-4">
            <div className="bg-brand-bg rounded-xl p-3">
              <p className="font-semibold text-brand-text">{selected.title}</p>
              <p className="text-xs text-brand-muted mt-0.5">{selected.category}, filed {format(new Date(selected.created_at), 'dd MMM yyyy')}</p>
            </div>
            <Select label="New Status" value={statusForm.status} onChange={e => setStatusForm(f => ({ ...f, status: e.target.value }))}>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </Select>
            <Textarea label="Admin Note" value={statusForm.admin_note} onChange={e => setStatusForm(f => ({ ...f, admin_note: e.target.value }))} placeholder="Optional note to student..." />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
              <Button onClick={handleUpdate} loading={saving}>Update Status</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
