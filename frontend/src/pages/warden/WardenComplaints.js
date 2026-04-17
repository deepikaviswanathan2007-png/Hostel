import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { wardenAPI } from '../../services/api';
import { Spinner, Badge } from '../../components/ui';
import { Search, Filter, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

const pageSize = 20;

export default function WardenComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);

  const loadComplaints = useCallback(() => {
    setLoading(true);
    wardenAPI.getComplaints({ status: filterStatus, page, limit: pageSize })
      .then(r => {
        setComplaints(r.data.data || []);
        setTotal(r.data.total || 0);
      })
      .catch(() => toast.error('Failed to load complaints'))
      .finally(() => setLoading(false));
  }, [filterStatus, page]);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  const filterComplaints = complaints.filter(c =>
    !search || c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.student_name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(total / pageSize);
  const statusIcons = {
    pending: { icon: AlertCircle, color: '#F0B041', bg: '#FFF5DC' },
    in_progress: { icon: Clock, color: '#0388FC', bg: '#E3F2FD' },
    resolved: { icon: CheckCircle2, color: '#008000', bg: '#DFF8DC' },
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.section
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        <div className="text-sm font-semibold uppercase tracking-wider text-sky-600">Management Portal</div>
        <h1 className="text-4xl font-bold text-gray-900">Complaints Overview</h1>
        <p className="max-w-2xl text-base leading-relaxed text-gray-600">
          Monitor all complaints across the hostel and track resolution progress.
        </p>
      </motion.section>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total', value: total, color: 'bg-blue-100 text-blue-600' },
          { label: 'Pending', value: complaints.filter(c => c.status === 'pending').length, color: 'bg-orange-100 text-orange-600' },
          { label: 'In Progress', value: complaints.filter(c => c.status === 'in_progress').length, color: 'bg-sky-100 text-sky-600' },
          { label: 'Resolved', value: complaints.filter(c => c.status === 'resolved').length, color: 'bg-green-100 text-green-600' },
        ].map(({ label, value, color }, idx) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="group"
          >
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-gray-300">
              <div className="space-y-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color} transition-transform group-hover:scale-110`} />
                <div className="text-sm font-medium text-gray-600">{label}</div>
                <div className="text-3xl font-bold text-gray-900">{value}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title or student..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
            className="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>

          <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
            <span className="font-medium">{filterComplaints.length} of {total}</span>
            <Filter className="w-4 h-4" />
          </div>
        </div>
      </motion.div>

      {/* Complaints Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" className="text-sky-600" />
          </div>
        ) : filterComplaints.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
            <CheckCircle2 className="h-12 w-12 text-green-300 mx-auto mb-3" />
            <p className="text-lg font-bold text-gray-900">No complaints found</p>
            <p className="text-sm text-gray-600 mt-1">All systems operational!</p>
          </div>
        ) : (
          filterComplaints.map((complaint, i) => {
            const statusInfo = statusIcons[complaint.status];
            const StatusIcon = statusInfo.icon;
            return (
              <motion.div
                key={complaint.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="group"
              >
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm transition-all hover:shadow-md hover:border-gray-300">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 h-12 w-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: statusInfo.bg }}>
                      <StatusIcon className="h-6 w-6" style={{ color: statusInfo.color }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{complaint.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {complaint.student_name || 'Unknown'} • Room {complaint.room_number || 'N/A'}
                          </p>
                        </div>
                        <Badge style={{
                          backgroundColor: statusInfo.bg,
                          color: statusInfo.color,
                          fontSize: '12px',
                          padding: '6px 12px',
                        }}>
                          {complaint.status === 'pending' ? '⏳ Pending' :
                           complaint.status === 'in_progress' ? '🔧 In Progress' :
                           '✓ Resolved'}
                        </Badge>
                      </div>

                      {complaint.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{complaint.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                        <span className="inline-flex items-center gap-1">
                          📋 {complaint.category ? complaint.category.toUpperCase() : 'OTHER'}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          {complaint.priority === 'high' ? '🔴 High' :
                           complaint.priority === 'medium' ? '🟡 Medium' :
                           '🟢 Low'} Priority
                        </span>
                        <span>{format(new Date(complaint.created_at), 'dd MMM yyyy')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>

      {/* Pagination */}
      {total > pageSize && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-between bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
        >
          <span className="text-sm font-medium text-gray-600">
            Page {page} of {totalPages} • {total} total complaints
          </span>
          <div className="flex gap-3">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-50 transition-colors"
            >
              Previous
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-50 transition-colors"
            >
              Next
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
