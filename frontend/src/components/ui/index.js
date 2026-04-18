import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

export function Button({ children, variant = 'primary', size = 'md', className = '', loading, ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variants = {
    primary:  'bg-brand-primary text-white hover:bg-brand-primary-light shadow-sm focus:ring-brand-primary',
    outline:  'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-sm focus:ring-gray-200',
    ghost:    'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-200',
    danger:   'bg-red-500 text-white hover:bg-red-600 shadow-sm focus:ring-red-500',
    success:  'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm focus:ring-emerald-500',
    skyblue:  'bg-sky-500 text-white hover:bg-sky-600 shadow-sm focus:ring-sky-500',
  };
  
  const sizes = { sm: 'h-9 px-3 text-sm', md: 'h-10 px-4 text-sm', lg: 'h-11 px-6 text-base' };
  const { type = 'button' } = props;
  
  return (
    <button type={type} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}

export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default:  'bg-gray-100 text-gray-700 border-gray-200',
    success:  'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning:  'bg-amber-50 text-amber-700 border-amber-200',
    danger:   'bg-red-50 text-red-700 border-red-200',
    info:     'bg-blue-50 text-blue-700 border-blue-200',
    primary:  'bg-indigo-50 text-indigo-700 border-indigo-200',
    purple:   'bg-purple-50 text-purple-700 border-purple-200',
    pending:  'bg-orange-50 text-orange-700 border-orange-200',
    outline:  'bg-white text-gray-700 border-gray-200',
  };
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  );
}

export function Card({ children, className = '', hover = false, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border border-gray-100 bg-white shadow-card ${hover ? 'transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5' : ''} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function Input({ label, error, className = '', icon, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>}
        <input
          className={`w-full ${icon ? 'pl-9' : 'pl-3'} pr-3 h-10 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all shadow-sm ${error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

export function Select({ label, error, className = '', children, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <select
        className={`w-full h-10 px-3 pr-8 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all shadow-sm appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_12px_center] bg-no-repeat ${error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <textarea
        rows={3}
        className={`w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all shadow-sm resize-none ${error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  return (
    <svg className={`animate-spin ${sizes[size]} ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function Modal({ open, isOpen, onClose, title, children, size = 'md' }) {
  const isVisible = open || isOpen;
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  const modalNode = (
    <AnimatePresence>
      {isVisible && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-8 sm:items-center sm:pt-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className={`my-2 w-full ${sizes[size]} pointer-events-auto overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col max-h-[92vh] sm:my-0`}
            >
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-white/50">
                <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-6 overflow-y-auto">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') {
    return modalNode;
  }

  return createPortal(modalNode, document.body);
}

export function EmptyState({ icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
      {icon ? <div className="text-4xl mb-4 text-gray-300">{icon}</div> : null}
      <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 max-w-sm">{description}</p>}
    </div>
  );
}

export function StatCard({ title, value, icon, color = 'primary', delta, subtitle }) {
  const colors = {
    primary: 'bg-indigo-50 text-indigo-600',
    green:   'bg-emerald-50 text-emerald-600',
    blue:    'bg-sky-50 text-sky-600',
    amber:   'bg-amber-50 text-amber-600',
    red:     'bg-red-50 text-red-600',
    purple:  'bg-purple-50 text-purple-600',
    skyblue: 'bg-sky-50 text-sky-600',
  };
  
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-medium text-gray-500">{title}</div>
        {icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color] || colors.primary}`}>
            {icon}
          </div>
        )}
      </div>
      <div>
        <div className="text-3xl font-bold text-gray-900">{value}</div>
        {(delta || subtitle) && (
          <div className="mt-1 flex items-center text-sm">
            <span className="text-emerald-600 font-medium mr-2">{delta}</span>
            <span className="text-gray-500">{subtitle}</span>
          </div>
        )}
      </div>
    </Card>
  );
}

export function Table({ columns, data, loading, onRow, paginate = false, pageSize = 10 }) {
  const [currentPage, setCurrentPage] = React.useState(1);

  React.useEffect(() => {
    if (!paginate) return;
    setCurrentPage((page) => {
      const nextTotalPages = Math.max(1, Math.ceil((data?.length || 0) / pageSize));
      return Math.min(page, nextTotalPages);
    });
  }, [data?.length, pageSize, paginate]);

  if (loading) return (
    <div className="flex justify-center py-12"><Spinner size="lg" className="text-brand-primary" /></div>
  );

  const displayData = (paginate && data) ? data.slice((currentPage - 1) * pageSize, currentPage * pageSize) : data;
  const totalPages = (paginate && data) ? Math.ceil(data.length / pageSize) : 1;

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs font-semibold uppercase tracking-wider">
            <tr>
              {columns?.map(c => (
                <th key={c.key} className="px-6 py-3 whitespace-nowrap">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {displayData?.map((row, i) => (
              <motion.tr
                key={row.id || i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => onRow && onRow(row)}
                className={`${onRow ? 'cursor-pointer hover:bg-gray-50' : ''} transition-colors group`}
              >
                {columns?.map(c => (
                  <td key={c.key} className="px-6 py-4 text-gray-700 whitespace-nowrap">
                    {c.render ? c.render(row[c.key], row) : row[c.key] ?? '-'}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
        {(!data || data.length === 0) && <EmptyState title="No records found" description="We couldn't find any data matching your criteria." />}
      </div>
      
      {paginate && totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-medium">{Math.min(currentPage * pageSize, data.length)}</span> of <span className="font-medium">{data.length}</span> results
          </div>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, actions, meta }) {
  return (
    <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow && <div className="text-sm font-semibold text-brand-primary mb-1">{eyebrow}</div>}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">{title}</h1>
        {description && <p className="mt-2 text-sm text-gray-500 leading-relaxed">{description}</p>}
        {meta && <div className="mt-3">{meta}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
}

export function SectionCard({ title, description, action, children, className = '' }) {
  return (
    <Card className={className}>
      {(title || description || action) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 border-b border-gray-100 bg-white">
          <div>
            {title && <h3 className="text-lg font-bold text-gray-900">{title}</h3>}
            {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </Card>
  );
}

export function PortalHero({
  eyebrow,
  title,
  description,
  actions,
  meta,
  icon,
  accent = 'primary',
  className = '',
}) {
  const accents = {
    primary: {
      glow: 'bg-brand-primary/12',
      soft: 'bg-[#f4f1ff]',
      text: 'text-brand-primary',
      ring: 'border-[#ece8ff]',
      icon: 'bg-brand-primary/12 text-brand-primary',
    },
    orange: {
      glow: 'bg-[#CDBDF1]/30',
      soft: 'bg-[#CDBDF1]/20',
      text: 'text-[#2F3396]',
      ring: 'border-[#CDBDF1]',
      icon: 'bg-[#CDBDF1]/40 text-[#2F3396]',
    },
    blue: {
      glow: 'bg-sky-500/10',
      soft: 'bg-sky-50',
      text: 'text-sky-600',
      ring: 'border-sky-100',
      icon: 'bg-sky-100 text-sky-600',
    },
  };

  const palette = accents[accent] || accents.primary;

  return (
    <section className={`relative overflow-hidden rounded-[24px] border border-white/80 bg-white/80 px-4 py-4 shadow-[0_18px_40px_rgba(145,158,171,0.12)] backdrop-blur-xl md:px-5 md:py-5 ${className}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,83,246,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(3,136,252,0.08),transparent_24%)]" />
      <div className={`absolute -right-8 -top-8 h-28 w-28 rounded-full blur-3xl ${palette.glow}`} />
      <div className="relative flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-2xl">
          {eyebrow && (
            <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] ${palette.soft} ${palette.text} ${palette.ring}`}>
              {icon ? <span className={`flex h-5 w-5 items-center justify-center rounded-full ${palette.icon}`}>{icon}</span> : null}
              <span>{eyebrow}</span>
            </div>
          )}
          <h1 className="mt-3 font-display text-[2rem] font-black tracking-[-0.04em] text-brand-text md:text-[2.25rem] md:leading-[1.05]">{title}</h1>
          {description && (
            <p className="mt-2.5 max-w-2xl text-sm leading-6 text-brand-muted md:text-[0.95rem]">{description}</p>
          )}
          {meta && <div className="mt-4">{meta}</div>}
        </div>
        {actions && <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">{actions}</div>}
      </div>
    </section>
  );
}

export function MetricPanel({ title, value, helper, icon, tone = 'primary', className = '' }) {
  const tones = {
    primary: 'bg-brand-primary/10 text-brand-primary',
    orange: 'bg-orange-100 text-orange-600',
    blue: 'bg-sky-100 text-sky-600',
    green: 'bg-emerald-100 text-emerald-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <Card className={`rounded-[20px] border-white/80 bg-white/85 p-4 backdrop-blur-xl ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-brand-muted">{title}</div>
          <div className="mt-2 font-display text-[2rem] font-black tracking-[-0.04em] text-brand-text">{value}</div>
          {helper && <div className="mt-1 text-xs text-brand-muted">{helper}</div>}
        </div>
        {icon ? <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone] || tones.primary}`}>{icon}</div> : null}
      </div>
    </Card>
  );
}

export function PanelShell({ title, description, action, children, className = '' }) {
  return (
    <section className={`overflow-hidden rounded-[24px] border border-white/80 bg-white/86 shadow-[0_18px_42px_rgba(145,158,171,0.11)] backdrop-blur-xl ${className}`}>
      {(title || description || action) && (
        <div className="flex flex-col gap-3 border-b border-brand-border/70 bg-[linear-gradient(180deg,rgba(247,248,253,0.95)_0%,rgba(247,248,253,0.76)_100%)] px-4 py-4 md:flex-row md:items-center md:justify-between md:px-5">
          <div>
            {title && <h2 className="font-display text-[1.15rem] font-bold tracking-[-0.03em] text-brand-text md:text-[1.35rem]">{title}</h2>}
            {description && <p className="mt-1.5 max-w-2xl text-xs leading-6 text-brand-muted md:text-sm">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className="px-4 py-4 md:px-5">{children}</div>
    </section>
  );
}
