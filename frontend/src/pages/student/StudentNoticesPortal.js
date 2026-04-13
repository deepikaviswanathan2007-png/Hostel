import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Megaphone } from 'lucide-react';
import { format } from 'date-fns';
import { noticesAPI } from '../../services/api';
import { Badge, EmptyState, PanelShell, PortalHero, Spinner } from '../../components/ui';

const CAT_BADGE = { general: 'default', urgent: 'danger', maintenance: 'warning', accounts: 'info', events: 'primary' };

export default function StudentNoticesPortal() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    noticesAPI.getAll({ category: filter || undefined })
      .then(response => setNotices(response.data.data || []))
      .catch(() => setNotices([]))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="space-y-6">
      <PortalHero
        eyebrow="Communication Centre"
        title="Student Notices"
        description="Published announcements, urgent updates, and hostel communication arranged in a cleaner student-facing reading experience."
        accent="primary"
        icon={<Megaphone className="h-4 w-4" />}
      />

      <PanelShell title="Categories" description="Filter notices by announcement type.">
        <div className="flex flex-wrap gap-3">
          {['', 'general', 'urgent', 'maintenance', 'accounts', 'events'].map(category => (
            <button
              key={category || 'all'}
              type="button"
              onClick={() => setFilter(category)}
              className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-all ${
                filter === category
                  ? 'border-brand-primary bg-brand-primary text-white shadow-brand'
                  : 'border-brand-border bg-white text-brand-muted hover:border-brand-primary/30'
              }`}
            >
              {category || 'All'}
            </button>
          ))}
        </div>
      </PanelShell>

      <PanelShell title="Published Notices" description="Latest notice board entries for hostel residents.">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" className="text-brand-primary" /></div>
        ) : notices.length === 0 ? (
          <EmptyState title="No notices found" description="There are no published announcements for this category right now." icon={<Megaphone className="h-10 w-10" />} />
        ) : (
          <div className="space-y-4">
            {notices.map((notice, index) => (
              <motion.article
                key={notice.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="rounded-[28px] border border-brand-border/70 bg-[#fafbff] p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
                    <Megaphone className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-brand-text">{notice.title}</h3>
                      <Badge variant={CAT_BADGE[notice.category] || 'default'}>{notice.category}</Badge>
                      {notice.target !== 'all' ? <Badge variant="purple">{notice.target.replace('_', ' ')}</Badge> : null}
                    </div>
                    {notice.content ? <p className="mt-3 text-sm leading-7 text-brand-muted">{notice.content}</p> : null}
                    <div className="mt-4 text-xs font-medium uppercase tracking-[0.14em] text-brand-muted">
                      {format(new Date(notice.created_at), 'dd MMM yyyy, HH:mm')}
                      {notice.posted_by_name ? ` • ${notice.posted_by_name}` : ''}
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </PanelShell>
    </div>
  );
}
