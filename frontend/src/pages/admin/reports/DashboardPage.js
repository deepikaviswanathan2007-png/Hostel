import React, { useEffect, useState } from 'react';
import { dashboardAPI } from '../../../services/api';
import { Spinner, Button, Card, MetricPanel, PageHeader, SectionCard, Select } from '../../../components/ui';
import { Building2, Home, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import useHostelNameMap from '../../../hooks/useHostelNameMap';
import { motion } from 'framer-motion';
import { useTheme } from '../../../context/ThemeContext';

export default function DashboardPage() {
  const { getHostelName } = useHostelNameMap();
  const { collegeTheme, setCollegeTheme, collegeThemeOptions } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  useEffect(() => {
    dashboardAPI.getStats()
      .then(res => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const stats = data?.stats || {};
  const blockStats = data?.blockStats || [];

  const metricCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents || 0,
      icon: Users,
      tone: 'blue',
      helper: 'Registered student accounts'
    },
    {
      title: 'Total Rooms',
      value: stats.totalRooms || 0,
      icon: Building2,
      tone: 'purple',
      helper: 'Active hostel inventory'
    },
    {
      title: 'Available Rooms',
      value: stats.availableRooms || 0,
      icon: Home,
      tone: 'green',
      helper: 'Ready for new allocations'
    },
    {
      title: 'Occupied Rooms',
      value: stats.occupiedRooms || 0,
      icon: Home,
      tone: 'primary',
      helper: 'Students currently housed'
    },
    {
      title: 'Pending Issues',
      value: stats.pendingComplaints || 0,
      icon: AlertCircle,
      tone: 'orange',
      helper: 'Open items needing action'
    },
    {
      title: 'Resolved Issues',
      value: stats.resolvedComplaints || 0,
      icon: CheckCircle,
      tone: 'green',
      helper: 'Closed and tracked issues'
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" className="text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="page-shell space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border border-white/80 bg-white/82 px-5 py-5 shadow-[0_22px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl md:px-6 md:py-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,83,246,0.12),transparent_26%),radial-gradient(circle_at_top_right,rgba(3,136,252,0.08),transparent_20%),linear-gradient(180deg,rgba(255,255,255,0.95),rgba(248,250,255,0.88))]" />
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-border bg-brand-primarybg px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-primary shadow-sm">
              Live overview
            </div>
            <h1 className="font-display text-[2rem] font-black tracking-[-0.05em] text-brand-text md:text-[2.75rem]">Hostel command center</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-brand-muted md:text-[0.98rem]">
              Monitor occupancy, room movement, and operational issues from a clean, responsive dashboard built for fast admin decisions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 xl:justify-end">
            <div className="rounded-full border border-brand-border bg-white px-4 py-2 text-sm font-medium text-brand-muted shadow-card">{todayLabel}</div>
            <Select
              aria-label="College theme"
              value={collegeTheme}
              onChange={(event) => setCollegeTheme(event.target.value)}
              className="min-w-[220px]"
            >
              {collegeThemeOptions.map((option) => (
                <option key={option.key} value={option.key}>{option.label}</option>
              ))}
            </Select>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Refresh View
            </Button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {metricCards.map(({ title, value, icon: Icon, tone, helper }, idx) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <MetricPanel
              title={title}
              value={value.toLocaleString()}
              helper={helper}
              icon={<Icon className="h-4 w-4" />}
              tone={tone}
            />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1"
        >
          <SectionCard title="Room Occupancy" description="Current distribution of occupied versus available rooms.">
            <div className="relative mt-6 flex items-center justify-center">
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Occupied', value: stats.occupiedRooms || 0 },
                        { name: 'Available', value: stats.availableRooms || 0 }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      stroke="none"
                    >
                      <Cell fill="#3B82F6" />
                      <Cell fill="#E5E7EB" />
                    </Pie>
                    <Tooltip
                      contentStyle={{
                          borderRadius: '16px',
                        fontSize: '13px',
                          border: '1px solid #D8DCF0',
                        backgroundColor: '#FFFFFF',
                          boxShadow: '0 12px 30px rgba(15, 23, 42, 0.10)'
                      }}
                      itemStyle={{ color: '#111827', fontWeight: 600 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-slate-900">
                  {stats.occupiedRooms ? Math.round((stats.occupiedRooms / (stats.occupiedRooms + stats.availableRooms)) * 100) : 0}%
                </span>
                <span className="text-xs font-medium text-slate-500">Occupied</span>
              </div>
            </div>
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between rounded-2xl bg-brand-primarybg px-3 py-2.5">
                <span className="text-sm text-brand-muted">Occupied</span>
                <span className="font-bold text-brand-text">{stats.occupiedRooms || 0}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-brand-primarybg px-3 py-2.5">
                <span className="text-sm text-brand-muted">Available</span>
                <span className="font-bold text-brand-text">{stats.availableRooms || 0}</span>
              </div>
            </div>
            <Button className="mt-5 w-full">View Details</Button>
          </SectionCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <SectionCard title="Hostel Distribution" description="Block occupancy at a glance with soft progress bars and clean contrast.">
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {blockStats.map((block, idx) => {
                const occupancy = block.capacity ? Math.round((block.occupied / block.capacity) * 100) : 0;
                const barColors = ['from-blue-500 to-blue-600', 'from-indigo-500 to-indigo-600', 'from-emerald-500 to-emerald-600', 'from-purple-500 to-purple-600', 'from-amber-500 to-amber-600'];
                const colorClass = barColors[idx % barColors.length];
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + idx * 0.05 }}
                    className="space-y-2 rounded-[20px] border border-brand-border/70 bg-white/70 p-4 transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:bg-white"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-brand-text">{getHostelName(block.block)}</span>
                      <span className="rounded-full bg-brand-primarybg px-2 py-1 text-xs font-bold text-brand-primary">{occupancy}%</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-brand-primarybg">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${occupancy}%` }}
                        transition={{ duration: 1 }}
                        className={`h-full rounded-full bg-gradient-to-r ${colorClass}`}
                      />
                    </div>
                    <div className="text-xs text-brand-muted">{block.occupied} of {block.capacity} rooms</div>
                  </motion.div>
                );
              })}
            </div>
          </SectionCard>
        </motion.div>
      </div>
    </div>
  );
}
