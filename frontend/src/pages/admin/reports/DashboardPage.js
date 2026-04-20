import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, BedDouble, Building2, CheckCircle2, Home, Users } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, XAxis, YAxis, Bar, CartesianGrid } from 'recharts';

import { dashboardAPI } from '../../../services/api';
import useHostelNameMap from '../../../hooks/useHostelNameMap';
import { useTheme } from '../../../context/ThemeContext';
import { Button, Select, Spinner } from '../../../components/ui';

const OCCUPANCY_COLORS = ['#0ea5e9', '#dbeafe'];

function MetricCard({ title, value, helper, icon: Icon, tone }) {
  const tones = {
    cyan: 'from-cyan-500 to-sky-600',
    navy: 'from-slate-700 to-slate-900',
    emerald: 'from-emerald-500 to-emerald-700',
    orange: 'from-orange-500 to-orange-700',
    rose: 'from-rose-500 to-red-700',
    indigo: 'from-indigo-500 to-indigo-700',
  };

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-[0_18px_35px_rgba(15,23,42,0.08)]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{title}</div>
          <div className="mt-1 text-4xl font-black tracking-[-0.03em] text-slate-900">{value}</div>
        </div>
        <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${tones[tone]} text-white`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="rounded-2xl bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">{helper}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { getHostelName } = useHostelNameMap();
  const { collegeTheme, setCollegeTheme, collegeThemeOptions } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getStats()
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const stats = data?.stats || {};
  const totalRooms = Number(stats.totalRooms || 0);
  const occupiedRooms = Number(stats.occupiedRooms || 0);
  const availableRooms = Number(stats.availableRooms || 0);
  const occupancyRatio = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  const barChartData = useMemo(
    () => (data?.blockStats || []).map((block) => ({
      block: getHostelName(block.block),
      occupied: Number(block.occupied || 0),
      capacity: Number(block.capacity || 0),
    })),
    [data?.blockStats, getHostelName],
  );

  const signalItems = [
    {
      label: 'Total Students',
      value: Number(stats.totalStudents || 0).toLocaleString(),
      icon: Users,
      tone: 'cyan',
      helper: 'Live registered students in system',
    },
    {
      label: 'Total Rooms',
      value: Number(stats.totalRooms || 0).toLocaleString(),
      icon: Building2,
      tone: 'navy',
      helper: 'Inventory under hostel management',
    },
    {
      label: 'Available Rooms',
      value: Number(stats.availableRooms || 0).toLocaleString(),
      icon: Home,
      tone: 'emerald',
      helper: 'Immediately available for allocation',
    },
    {
      label: 'Pending Issues',
      value: Number(stats.pendingComplaints || 0).toLocaleString(),
      icon: AlertTriangle,
      tone: 'orange',
      helper: 'Active issues requiring intervention',
    },
    {
      label: 'Resolved Issues',
      value: Number(stats.resolvedComplaints || 0).toLocaleString(),
      icon: CheckCircle2,
      tone: 'indigo',
      helper: 'Successfully closed service tickets',
    },
    {
      label: 'Occupied Rooms',
      value: Number(stats.occupiedRooms || 0).toLocaleString(),
      icon: BedDouble,
      tone: 'rose',
      helper: 'Rooms currently assigned to students',
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Spinner size="lg" className="text-cyan-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      <section className="relative overflow-hidden rounded-[34px] border border-slate-300/70 bg-[linear-gradient(130deg,#082f49_0%,#0f172a_52%,#134e4a_100%)] px-5 py-6 shadow-[0_25px_45px_rgba(15,23,42,0.24)] md:px-8 md:py-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(56,189,248,0.32),transparent_28%),radial-gradient(circle_at_80%_90%,rgba(45,212,191,0.28),transparent_30%)]" />
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/35 bg-cyan-300/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-100">
              Performance Overview
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-white md:text-5xl">Hostel Operations Intelligence</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200 md:text-base">
              Track occupancy, student strength, and issue resolution from one command center with live operational metrics.
            </p>
          </div>

          <div className="grid w-full max-w-[520px] grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-cyan-100/25 bg-white/10 px-4 py-3 text-cyan-50 backdrop-blur-md">
              <div className="text-[11px] uppercase tracking-[0.18em] text-cyan-100/80">Occupancy Pulse</div>
              <div className="mt-1 text-3xl font-black">{occupancyRatio}%</div>
            </div>
            <div className="rounded-2xl border border-cyan-100/25 bg-white/10 px-4 py-3 text-cyan-50 backdrop-blur-md">
              <div className="text-[11px] uppercase tracking-[0.18em] text-cyan-100/80">Open Items</div>
              <div className="mt-1 text-3xl font-black">{Number(stats.pendingComplaints || 0).toLocaleString()}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-[0_18px_35px_rgba(15,23,42,0.08)] md:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black tracking-[-0.02em] text-slate-900">Capacity Distribution by Hostel</h2>
              <p className="mt-1 text-sm text-slate-600">Occupied room capacity across all hostel blocks.</p>
            </div>
            <Button variant="outline" onClick={() => window.location.reload()}>Refresh Data</Button>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="block" tick={{ fill: '#334155', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(15,23,42,0.04)' }}
                  contentStyle={{
                    borderRadius: '14px',
                    border: '1px solid #cbd5e1',
                    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)',
                  }}
                />
                <Bar dataKey="capacity" radius={[8, 8, 0, 0]} fill="#e2e8f0" />
                <Bar dataKey="occupied" radius={[8, 8, 0, 0]} fill="#0891b2" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-[0_18px_35px_rgba(15,23,42,0.08)] md:p-5">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">College Theme</div>
            <Select
              aria-label="College theme"
              value={collegeTheme}
              onChange={(event) => setCollegeTheme(event.target.value)}
            >
              {collegeThemeOptions.map((option) => (
                <option key={option.key} value={option.key}>{option.label}</option>
              ))}
            </Select>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-[0_18px_35px_rgba(15,23,42,0.08)] md:p-5">
            <div className="mb-4">
              <h3 className="text-lg font-black tracking-[-0.01em] text-slate-900">Room Occupancy</h3>
              <p className="text-sm text-slate-600">Current room status split.</p>
            </div>

            <div className="relative mx-auto h-52 w-full max-w-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Occupied', value: occupiedRooms },
                      { name: 'Available', value: availableRooms },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={84}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {OCCUPANCY_COLORS.map((color) => <Cell key={color} fill={color} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '14px',
                      border: '1px solid #cbd5e1',
                      boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-3xl font-black text-slate-900">{occupancyRatio}%</div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Occupied</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-700">Occupied: <span className="font-bold text-slate-900">{occupiedRooms}</span></div>
              <div className="rounded-2xl bg-cyan-50 px-3 py-2 text-sm text-cyan-800">Available: <span className="font-bold">{availableRooms}</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {signalItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * index }}
          >
            <MetricCard
              title={item.label}
              value={item.value}
              helper={item.helper}
              icon={item.icon}
              tone={item.tone}
            />
          </motion.div>
        ))}
      </section>
    </div>
  );
}
