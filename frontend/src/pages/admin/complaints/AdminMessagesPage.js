import React, { useEffect, useState, useCallback } from 'react';
import { messagesAPI, usersAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import { Send, Trash2, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';

const PRIORITY_STYLES = {
  LOW:    'bg-blue-50 text-blue-700 border border-blue-200',
  MEDIUM: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  HIGH:   'bg-red-50 text-red-700 border border-red-200',
};
const STATUS_STYLES = {
  SENT:     'bg-gray-100 text-gray-700',
  SEEN:     'bg-brand-primary/10 text-brand-primary',
  RESOLVED: 'bg-green-100 text-green-700',
};

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-2xl border border-brand-border/60 p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-brand-muted mb-1">{label}</p>
      <p className={`text-3xl font-black ${color}`}>{value}</p>
    </div>
  );
}

export default function AdminMessagesPage() {
  const [messages, setMessages]         = useState([]);
  const [wardens,  setWardens]          = useState([]);
  const [loading,  setLoading]          = useState(true);
  const [filter,   setFilter]           = useState('all');
  const [showCompose, setShowCompose]   = useState(false);
  const [expandedId, setExpandedId]     = useState(null);
  const [replyTargetId, setReplyTargetId] = useState(null);
  const [form, setForm] = useState({ warden_id: '', title: '', description: '', priority: 'MEDIUM', is_to_all_wardens: false });
  const [replyForm, setReplyForm] = useState({ status: 'SEEN', admin_reply: '' });

  const fetchData = useCallback(async () => {
    try {
      const [msgRes, wardensRes] = await Promise.all([
        messagesAPI.adminGetAll(),
        usersAPI.getAll({ role: 'warden', limit: 100 }),
      ]);
      setMessages(msgRes.data.messages || []);
      setWardens(wardensRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSend = async (e) => {
    e.preventDefault();
    try {
      await messagesAPI.adminSend({
        ...form,
        warden_id: form.warden_id ? parseInt(form.warden_id) : null,
      });
      toast.success('Message sent!');
      setForm({ warden_id: '', title: '', description: '', priority: 'MEDIUM', is_to_all_wardens: false });
      setShowCompose(false);
      fetchData();
    } catch {}
  };

  const handleReply = async (msgId) => {
    try {
      await messagesAPI.adminUpdateStatus(msgId, replyForm);
      toast.success('Reply sent!');
      setReplyTargetId(null);
      setReplyForm({ status: 'SEEN', admin_reply: '' });
      fetchData();
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await messagesAPI.adminDelete(id);
      toast.success('Message deleted');
      setMessages(messages.filter(m => m.id !== id));
    } catch {}
  };

  const filtered = messages.filter(m => {
    if (filter === 'from-wardens') return m.sender_role === 'warden';
    if (filter === 'to-wardens')   return m.sender_role !== 'warden';
    return true;
  });

  const unread    = messages.filter(m => m.sender_role === 'warden' && m.status === 'SENT').length;
  const resolved  = messages.filter(m => m.status === 'RESOLVED').length;
  const highPri   = messages.filter(m => m.priority === 'HIGH').length;

  if (loading) return (
    <div className="flex items-center justify-center h-60">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
    </div>
  );

  return (
    <div className="space-y-6 p-1">
      <div className="flex justify-end">
        <button
          onClick={() => setShowCompose(v => !v)}
          className="flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-primary/90 transition-colors"
        >
          <Send className="h-4 w-4" />
          {showCompose ? 'Cancel' : 'Send Message'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total"        value={messages.length} color="text-gray-900" />
        <StatCard label="Unread"       value={unread}          color="text-red-600"  />
        <StatCard label="Resolved"     value={resolved}        color="text-green-600"/>
        <StatCard label="High Priority" value={highPri}        color="text-orange-600"/>
      </div>

      {/* Compose */}
      {showCompose && (
        <div className="bg-white rounded-2xl border border-brand-border/60 p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-4">Compose Message</h2>
          <form onSubmit={handleSend} className="space-y-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.is_to_all_wardens}
                onChange={e => setForm({ ...form, is_to_all_wardens: e.target.checked, warden_id: '' })}
                className="rounded border-gray-300 text-brand-primary"
              />
              Broadcast to all wardens
            </label>
            {!form.is_to_all_wardens && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Select Warden *</label>
                <select
                  value={form.warden_id}
                  onChange={e => setForm({ ...form, warden_id: e.target.value })}
                  required={!form.is_to_all_wardens}
                  className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                >
                  <option value="">Choose a warden…</option>
                  {wardens.map(w => <option key={w.id} value={w.id}>{w.name} — {w.email}</option>)}
                </select>
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Title *</label>
                <input
                  required
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Message subject…"
                  className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Priority</label>
                <select
                  value={form.priority}
                  onChange={e => setForm({ ...form, priority: e.target.value })}
                  className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Message *</label>
              <textarea
                required
                rows={4}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Type your message here…"
                className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 resize-none"
              />
            </div>
            <button type="submit" className="flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2 text-sm font-semibold text-white hover:bg-brand-primary/90 transition-colors">
              <Send className="h-4 w-4" /> Send
            </button>
          </form>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-1 border-b border-brand-border">
        {[
          { key: 'all',          label: `All (${messages.length})` },
          { key: 'from-wardens', label: `From Wardens (${messages.filter(m => m.sender_role === 'warden').length})` },
          { key: 'to-wardens',   label: `To Wardens (${messages.filter(m => m.sender_role !== 'warden').length})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              filter === tab.key
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-brand-muted hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Message List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-brand-muted">
          <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No messages found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(msg => (
            <div key={msg.id} className="bg-white rounded-2xl border border-brand-border/60 shadow-sm overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === msg.id ? null : msg.id)}
                className="w-full text-left px-5 py-4 flex items-start justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_STYLES[msg.priority] || PRIORITY_STYLES.MEDIUM}`}>
                      {msg.priority}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[msg.status] || STATUS_STYLES.SENT}`}>
                      {msg.status}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 truncate">{msg.title}</p>
                  <p className="text-xs text-brand-muted mt-0.5">
                    {msg.sender_role === 'warden' ? `From: ${msg.sender_name}` : msg.is_to_all_wardens ? 'To: All Wardens' : `To: ${msg.receiver_name || 'Warden'}`}
                    {' · '}{new Date(msg.created_at).toLocaleString()}
                  </p>
                </div>
                {expandedId === msg.id ? <ChevronUp className="h-4 w-4 text-brand-muted flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-brand-muted flex-shrink-0" />}
              </button>

              {expandedId === msg.id && (
                <div className="px-5 pb-5 border-t border-brand-border/50 space-y-4 pt-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.description}</p>

                  {msg.admin_reply && (
                    <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-xl p-4">
                      <p className="text-xs font-bold text-brand-primary mb-1">Admin Reply</p>
                      <p className="text-sm text-gray-700">{msg.admin_reply}</p>
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    {msg.sender_role === 'warden' && replyTargetId !== msg.id && (
                      <button
                        onClick={() => { setReplyTargetId(msg.id); setReplyForm({ status: msg.status, admin_reply: msg.admin_reply || '' }); }}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-brand-primary/30 text-brand-primary hover:bg-brand-primary/5 transition-colors"
                      >
                        <MessageSquare className="h-3.5 w-3.5" /> Reply
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(msg.id)}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>

                  {replyTargetId === msg.id && (
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                      <p className="text-sm font-semibold text-gray-900">Write a reply</p>
                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-gray-600 mb-1 block">Update Status</label>
                          <select
                            value={replyForm.status}
                            onChange={e => setReplyForm({ ...replyForm, status: e.target.value })}
                            className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                          >
                            <option value="SENT">Sent</option>
                            <option value="SEEN">Seen</option>
                            <option value="RESOLVED">Resolved</option>
                          </select>
                        </div>
                      </div>
                      <textarea
                        rows={3}
                        value={replyForm.admin_reply}
                        onChange={e => setReplyForm({ ...replyForm, admin_reply: e.target.value })}
                        placeholder="Type your reply…"
                        className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReply(msg.id)}
                          className="text-xs font-semibold px-4 py-2 rounded-lg bg-brand-primary text-white hover:bg-brand-primary/90 transition-colors"
                        >
                          Send Reply
                        </button>
                        <button
                          onClick={() => setReplyTargetId(null)}
                          className="text-xs font-semibold px-4 py-2 rounded-lg border border-brand-border text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
