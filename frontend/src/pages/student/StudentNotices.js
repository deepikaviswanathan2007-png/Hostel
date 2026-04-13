import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { noticesAPI } from '../../services/api';
import { Badge, Spinner, EmptyState, PageHeader, SectionCard } from '../../components/ui';
import { format } from 'date-fns';

const CAT_BADGE = { general: 'default', urgent: 'danger', maintenance: 'warning', accounts: 'info', events: 'primary' };

export default function StudentNotices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    noticesAPI.getAll({ category: filter || undefined })
      .then(r => setNotices(r.data.data))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        eyebrow="Communication Centre"
        title="Student Notices"
        description="Browse published hostel announcements, student-specific updates, and administrative circulars."
      />

      <SectionCard title="Notice Filters" description="Filter published communication by category.">
        <div className="flex gap-2 flex-wrap">
          {['', 'general', 'urgent', 'maintenance', 'accounts', 'events'].map(category => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all
                ${filter === category
                  ? 'bg-brand-primary text-white shadow-brand'
                  : 'bg-white text-brand-muted border border-brand-border hover:border-brand-primary/30'}`}
            >
              {category ? category.charAt(0).toUpperCase() + category.slice(1) : 'All'}
            </button>
          ))}
        </div>
      </SectionCard>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" className="text-brand-primary" /></div>
      ) : notices.length === 0 ? (
        <EmptyState title="No notices" description="There are no notices to display." />
      ) : (
        <div className="space-y-3">
          {notices.map((notice, i) => (
            <motion.div
              key={notice.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 hover:shadow-card-hover transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-semibold flex-shrink-0
                  ${notice.category === 'urgent' ? 'bg-red-50 text-red-700' : notice.category === 'maintenance' ? 'bg-amber-50 text-amber-700' : notice.category === 'events' ? 'bg-purple-50 text-purple-700' : notice.category === 'accounts' ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-700'}`}>
                  {notice.category.slice(0, 3).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-brand-text">{notice.title}</span>
                    <Badge variant={CAT_BADGE[notice.category] || 'default'}>{notice.category}</Badge>
                    {notice.target !== 'all' && <Badge variant="purple">{notice.target.replace('_', ' ')}</Badge>}
                  </div>
                  {notice.content && <p className="text-sm text-brand-muted mt-1 leading-relaxed">{notice.content}</p>}
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-3">
                    <span>{format(new Date(notice.created_at), 'dd MMM yyyy, HH:mm')}</span>
                    {notice.posted_by_name && <span>{notice.posted_by_name}</span>}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
