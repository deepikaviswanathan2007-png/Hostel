import React, { useEffect, useState, useCallback } from 'react';
import { messagesAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Send, Inbox, ChevronDown, ChevronUp } from 'lucide-react';

const PRIORITY_STYLES = {
  LOW:    'bg-blue-50 text-blue-700 border border-blue-200',
  MEDIUM: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  HIGH:   'bg-red-50 text-red-700 border border-red-200',
};
const STATUS_STYLES = {
  SENT:     'bg-gray-100 text-gray-700',
  SEEN:     'bg-sky-100 text-sky-700',
  RESOLVED: 'bg-green-100 text-green-700',
};

export default function WardenMessagesPage() {
  const [activeTab,    setActiveTab]    = useState('received');
  const [sent,         setSent]         = useState([]);
  const [received,     setReceived]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showCompose,  setShowCompose]  = useState(false);
  const [expandedId,   setExpandedId]   = useState(null);
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM' });

  const fetchMessages = useCallback(async () => {
    try {
      const [sentRes, recvRes] = await Promise.all([
        messagesAPI.wardenGetSent(),
        messagesAPI.wardenGetReceived(),
      ]);
      setSent(sentRes.data.messages || []);
      setReceived(recvRes.data.messages || []);
    } catch {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const handleSend = async (e) => {
    e.preventDefault();
    try {
      await messagesAPI.wardenSend(form);
      toast.success('Message sent to admin!');
      setForm({ title: '', description: '', priority: 'MEDIUM' });
      setShowCompose(false);
      fetchMessages();
    } catch {}
  };

  const handleMarkSeen = async (id) => {
    try {
      await messagesAPI.markSeen(id);
      fetchMessages();
    } catch {}
  };

  const messages = activeTab === 'sent' ? sent : received;

  if (loading) return (
    <div className="flex items-center justify-center h-60">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
    </div>
  );

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-sm text-brand-muted mt-0.5">Communicate directly with administration</p>
        </div>
        <button
          onClick={() => setShowCompose(v => !v)}
          className="flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600 transition-colors"
        >
          <Send className="h-4 w-4" />
          {showCompose ? 'Cancel' : 'New Message'}
        </button>
      </div>

      {/* Compose */}
      {showCompose && (
        <div className="bg-white rounded-2xl border border-brand-border/60 p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-4">Send Message to Admin</h2>
          <form onSubmit={handleSend} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Subject *</label>
                <input
                  required
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Brief subject…"
                  className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Priority</label>
                <select
                  value={form.priority}
                  onChange={e => setForm({ ...form, priority: e.target.value })}
                  className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/40"
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
                placeholder="Describe your message or concern…"
                className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/40 resize-none"
              />
            </div>
            <button type="submit" className="flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-600 transition-colors">
              <Send className="h-4 w-4" /> Send
            </button>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-brand-border">
        {[
          { key: 'received', label: `Inbox (${received.length})`, icon: Inbox },
          { key: 'sent',     label: `Sent (${sent.length})`,     icon: Send  },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-sky-500 text-sky-600'
                : 'border-transparent text-brand-muted hover:text-gray-700'
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Message List */}
      {messages.length === 0 ? (
        <div className="text-center py-16 text-brand-muted">
          <Inbox className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No messages {activeTab === 'sent' ? 'sent' : 'received'} yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map(msg => (
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
                    {activeTab === 'received' && msg.sender_name ? `From: ${msg.sender_name}` : 'To: Admin'}
                    {' · '}{new Date(msg.created_at).toLocaleString()}
                  </p>
                </div>
                {expandedId === msg.id ? <ChevronUp className="h-4 w-4 text-brand-muted flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-brand-muted flex-shrink-0" />}
              </button>

              {expandedId === msg.id && (
                <div className="px-5 pb-5 border-t border-brand-border/50 space-y-3 pt-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.description}</p>

                  {msg.admin_reply && (
                    <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
                      <p className="text-xs font-bold text-sky-700 mb-1">Admin Reply</p>
                      <p className="text-sm text-gray-700">{msg.admin_reply}</p>
                    </div>
                  )}

                  {activeTab === 'received' && msg.status === 'SENT' && (
                    <button
                      onClick={() => handleMarkSeen(msg.id)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-sky-200 text-sky-600 hover:bg-sky-50 transition-colors"
                    >
                      Mark as Seen
                    </button>
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
