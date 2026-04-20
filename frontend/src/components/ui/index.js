import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

export function Button({ children, variant = 'primary', size = 'md', className = '', loading, ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 ease-in-out disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent hover:-translate-y-0.5 hover:shadow-card-hover';
  
  const variants = {
    primary:  'bg-gradient-to-r from-brand-primary to-brand-primary-light text-white shadow-brand focus:ring-brand-primary',
    outline:  'border border-brand-border bg-white/90 text-brand-text shadow-card hover:bg-white focus:ring-brand-primary/20',
    ghost:    'bg-transparent text-brand-muted hover:bg-brand-primarybg hover:text-brand-text focus:ring-brand-primary/20',
    danger:   'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-brand focus:ring-red-500',
    success:  'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-brand focus:ring-emerald-500',
    skyblue:  'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-brand focus:ring-sky-500',
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
    default:  'bg-brand-primarybg text-brand-muted border-brand-border',
    success:  'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning:  'bg-amber-50 text-amber-700 border-amber-200',
    danger:   'bg-red-50 text-red-700 border-red-200',
    info:     'bg-sky-50 text-sky-700 border-sky-200',
    primary:  'bg-indigo-50 text-indigo-700 border-indigo-200',
    purple:   'bg-violet-50 text-violet-700 border-violet-200',
    pending:  'bg-orange-50 text-orange-700 border-orange-200',
    outline:  'bg-white/90 text-brand-muted border-brand-border',
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
      className={`rounded-[24px] border border-white/80 bg-white/85 shadow-card backdrop-blur-xl ${hover ? 'transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover' : ''} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function Input({ label, error, className = '', icon, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-brand-text">{label}</label>}
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted">{icon}</span>}
        <input
          className={`w-full ${icon ? 'pl-9' : 'pl-3'} pr-3 h-11 rounded-2xl border border-brand-border bg-white/92 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all shadow-card ${error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''} ${className}`}
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
      {label && <label className="text-sm font-medium text-brand-text">{label}</label>}
      <select
        className={`w-full h-11 px-3 pr-10 rounded-2xl border border-brand-border bg-white/92 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all shadow-card appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%235F6388%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_12px_center] bg-no-repeat ${error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''} ${className}`}
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
      {label && <label className="text-sm font-medium text-brand-text">{label}</label>}
      <textarea
        rows={3}
        className={`w-full px-3 py-3 rounded-2xl border border-brand-border bg-white/92 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all shadow-card resize-none ${error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''} ${className}`}
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
              className={`my-2 w-full ${sizes[size]} pointer-events-auto overflow-hidden rounded-[28px] border border-white/80 bg-white/88 shadow-[0_28px_70px_rgba(15,23,42,0.18)] backdrop-blur-xl flex flex-col max-h-[92vh] sm:my-0`}
            >
              <div className="flex items-center justify-between border-b border-brand-border/70 px-6 py-4 bg-white/60">
                <h2 className="text-lg font-bold text-brand-text">{title}</h2>
                <button type="button" onClick={onClose} className="rounded-full p-1.5 text-brand-muted hover:bg-brand-primarybg hover:text-brand-text transition-colors">
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
      {icon ? <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primarybg text-brand-primary">{icon}</div> : null}
      <h3 className="text-base font-semibold text-brand-text mb-1">{title}</h3>
      {description && <p className="text-sm text-brand-muted max-w-sm">{description}</p>}
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
    purple:  'bg-violet-50 text-violet-600',
    skyblue: 'bg-sky-50 text-sky-600',
  };
  
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-medium text-brand-muted">{title}</div>
        {icon && (
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${colors[color] || colors.primary}`}>
            {icon}
          </div>
        )}
      </div>
      <div>
        <div className="text-3xl font-bold text-brand-text">{value}</div>
        {(delta || subtitle) && (
          <div className="mt-1 flex items-center text-sm">
            <span className="text-emerald-600 font-medium mr-2">{delta}</span>
            <span className="text-brand-muted">{subtitle}</span>
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

  const renderCellValue = (column, row) => (column.render ? column.render(row[column.key], row) : row[column.key] ?? '-');

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-[24px] border border-brand-border bg-white/90 shadow-card">
        {(!data || data.length === 0) ? (
          <EmptyState title="No records found" description="We could not find any data matching your criteria." />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm text-left">
                <thead className="bg-brand-primarybg/70 border-b border-brand-border text-brand-muted text-[11px] font-semibold uppercase tracking-[0.18em]">
                  <tr>
                    {columns?.map(c => (
                      <th key={c.key} className="px-6 py-4 whitespace-nowrap">
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border bg-white/90">
                  {displayData?.map((row, i) => (
                    <motion.tr
                      key={row.id || i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      onClick={() => onRow && onRow(row)}
                      className={`${onRow ? 'cursor-pointer hover:bg-brand-primarybg/60' : ''} transition-colors group`}
                    >
                      {columns?.map(c => (
                        <td key={c.key} className="px-6 py-4 text-brand-text whitespace-nowrap">
                          {renderCellValue(c, row)}
                        </td>
                      ))}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-3 md:hidden">
              {displayData?.map((row, rowIndex) => (
                <motion.button
                  key={row.id || rowIndex}
                  type="button"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: rowIndex * 0.02 }}
                  onClick={() => onRow && onRow(row)}
                  className={`rounded-[20px] border border-brand-border bg-white p-4 text-left shadow-card ${onRow ? 'active:scale-[0.99]' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-brand-text">
                        {renderCellValue(columns[0], row)}
                      </div>
                      {columns[1] && (
                        <div className="mt-1 text-xs text-brand-muted">
                          {columns[1].label}: {renderCellValue(columns[1], row)}
                        </div>
                      )}
                    </div>
                    <div className="rounded-full bg-brand-primarybg px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-primary">
                      View
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2">
                    {columns?.slice(2).map((column) => (
                      <div key={column.key} className="flex items-center justify-between gap-3 rounded-xl bg-brand-primarybg/60 px-3 py-2">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-muted">{column.label}</span>
                        <span className="text-sm font-medium text-brand-text text-right">{renderCellValue(column, row)}</span>
                      </div>
                    ))}
                  </div>
                </motion.button>
              ))}
            </div>
          </>
        )}
      </div>
      
      {paginate && totalPages > 1 && (
        <div className="flex flex-col gap-3 px-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-brand-muted">
            Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-medium">{Math.min(currentPage * pageSize, data.length)}</span> of <span className="font-medium">{data.length}</span> results
          </div>
          <div className="flex gap-2 sm:justify-end">
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
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-text tracking-tight">{title}</h1>
        {description && <p className="mt-2 text-sm text-brand-muted leading-relaxed">{description}</p>}
        {meta && <div className="mt-3">{meta}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
}

export function SectionCard({ title, description, action, children, className = '' }) {
  return (
    <Card className={`overflow-hidden ${className}`}>
      {(title || description || action) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border/70 bg-gradient-to-r from-white via-white to-brand-primarybg/40 px-6 py-5">
          <div>
            {title && <h3 className="text-lg font-bold text-brand-text">{title}</h3>}
            {description && <p className="mt-1 text-sm text-brand-muted">{description}</p>}
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
    <section className={`relative overflow-hidden rounded-[28px] border border-white/80 bg-white/82 px-4 py-4 shadow-[0_18px_40px_rgba(145,158,171,0.12)] backdrop-blur-xl md:px-5 md:py-5 ${className}`}>
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
    <Card className={`rounded-[22px] border-white/80 bg-white/88 p-4 backdrop-blur-xl ${className}`}>
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
    <section className={`overflow-hidden rounded-[28px] border border-white/80 bg-white/88 shadow-[0_18px_42px_rgba(145,158,171,0.11)] backdrop-blur-xl ${className}`}>
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
