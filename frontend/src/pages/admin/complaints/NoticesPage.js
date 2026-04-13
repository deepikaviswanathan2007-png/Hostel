import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button, Badge, Input, Select, Textarea, Modal, PageHeader, Spinner } from '../../../components/ui';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { noticesAPI } from '../../../services/api';
import useHostelNameMap from '../../../hooks/useHostelNameMap';



export default function NoticesPage() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: 'general', target: 'all' });
  const [saving, setSaving] = useState(false);
  const { hostels, getHostelName } = useHostelNameMap();

  const getTargetLabel = (target) => {
    if (!target || target === 'all') return 'All Students';
    if (String(target).startsWith('block_')) {
      const blockCode = String(target).replace('block_', '').toUpperCase();
      return getHostelName(blockCode);
    }
    return getHostelName(target);
  };

  const load = () => {
    setLoading(true);
    noticesAPI.getAll()
      .then(r => setNotices(r.data.data || []))
      .catch(() => toast.error('Failed to load notices.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handlePost = async () => {
    if (!form.title || !form.content) return toast.error('Title and content required.');
    setSaving(true);
    try {
      await noticesAPI.create(form);
      toast.success('Notice published!');
      setModal(false);
      setForm({ title: '', content: '', category: 'general', target: 'all' });
      load();
    } catch {
      toast.error('Failed to post notice.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this notice?')) return;
    try {
      await noticesAPI.delete(id);
      toast.success('Notice removed.');
      load();
    } catch {
      toast.error('Failed to delete notice.');
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        eyebrow="Communication Centre"
        title="Notice Board"
        description="Publish official hostel announcements, operational circulars, and student-facing updates within one academic communication stream."
        actions={<Button size="sm" onClick={() => setModal(true)}>Post Notice</Button>}
        meta={<Badge variant="default">{notices.length} published notices</Badge>}
      />

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" className="text-brand-primary" /></div>
      ) : (
        <div className="space-y-4">
          {notices.map((notice, i) => (
            <motion.div
              key={notice.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-3xl border border-brand-border bg-white p-6 shadow-card"
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-semibold flex-shrink-0
                  ${notice.category === 'urgent' ? 'bg-red-50 text-red-700' : notice.category === 'maintenance' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                  {(notice.category || 'general').slice(0, 3).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-brand-text">{notice.title}</h3>
                  </div>
                  <p className="mt-2 mb-3 text-sm text-gray-600 whitespace-pre-wrap">{notice.content}</p>
                  
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>{format(new Date(notice.created_at), 'dd MMM yyyy, h:mm a')}</span>
                    <span>Target: {getTargetLabel(notice.target)}</span>
                    {notice.posted_by_name && <span>By: {notice.posted_by_name}</span>}
                  </div>
                </div>
                <button onClick={() => handleDelete(notice.id)} className="text-gray-400 hover:text-brand-red transition-colors text-sm font-semibold">Remove</button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Post New Notice">
        <div className="space-y-4">
          <Input label="Notice Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Brief, descriptive title" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              <option value="general">General</option>
              <option value="urgent">Urgent</option>
              <option value="maintenance">Maintenance</option>
              <option value="accounts">Accounts</option>
              <option value="events">Events</option>
            </Select>
            <Select label="Target Audience" value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))}>
              <option value="all">All Students</option>
              {hostels
                .filter((h) => h?.block_code)
                .map((h) => (
                  <option key={h.id || h.block_code} value={`block_${String(h.block_code).toLowerCase()}`}>
                    {h.name || `Hostel ${h.block_code}`}
                  </option>
                ))}
            </Select>
          </div>
          <Textarea label="Message" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Notice content..." rows={4} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={handlePost} loading={saving}>Publish</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
