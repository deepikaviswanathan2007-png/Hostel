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
    <div className="space-y-3">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg p-3 md:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-sm"
      >
        <h1 className="text-lg font-bold text-gray-900 mb-0.5">Complaints Overview</h1>
        <p className="text-xs text-gray-600">Monitor all complaints across the hostel</p>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: total, color: 'bg-blue-50', textColor: 'text-blue-600' },
          { label: 'Pending', value: complaints.filter(c => c.status === 'pending').length, color: 'bg-orange-50', textColor: 'text-orange-600' },
          { label: 'In Progress', value: complaints.filter(c => c.status === 'in_progress').length, color: 'bg-blue-50', textColor: 'text-blue-600' },
          { label: 'Resolved', value: complaints.filter(c => c.status === 'resolved').length, color: 'bg-green-50', textColor: 'text-green-600' },
        ].map(({ label, value, color, textColor }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${color} rounded-lg p-3 border border-gray-100 shadow-sm`}
          >
            <div className="text-xs text-gray-600 mb-1">{label}</div>
            <div className={`text-lg font-bold ${textColor}`}>{value}</div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="rounded-lg p-4 bg-white border border-gray-100 shadow-sm"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title or student..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>

          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>{filterComplaints.length} of {total} complaints</span>
            <Filter className="w-3 h-3" />
          </div>
        </div>
      </motion.div>

      {/* Complaints Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-2"
      >
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Spinner size="md" />
          </div>
        ) : filterComplaints.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg border border-gray-100">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-1 text-green-400" />
            <p className="text-sm font-semibold text-gray-900">No complaints found</p>
            <p className="text-xs text-gray-600">All systems operational!</p>
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
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-lg p-4 border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: statusInfo.bg }}>
                    <StatusIcon className="w-5 h-5" style={{ color: statusInfo.color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{complaint.title}</h3>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {complaint.student_name || 'Unknown'} • Room {complaint.room_number || 'N/A'}
                        </p>
                      </div>
                      <Badge style={{
                        backgroundColor: statusInfo.bg,
                        color: statusInfo.color,
                      }}>
                        {complaint.status === 'pending' ? '⏳ Pending' :
                         complaint.status === 'in_progress' ? '🔧 In Progress' :
                         '✓ Resolved'}
                      </Badge>
                    </div>

                    {complaint.description && (
                      <p className="text-xs text-gray-600 mb-2 line-clamp-1">{complaint.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                      <span>
                        {complaint.category ? `📋 ${complaint.category.toUpperCase()}` : '📋 OTHER'}
                      </span>
                      <span>
                        {complaint.priority === 'high' ? '🔴 High' :
                         complaint.priority === 'medium' ? '🟡 Medium' :
                         '🟢 Low'} Priority
                      </span>
                      <span>{format(new Date(complaint.created_at), 'dd MMM yyyy')}</span>
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
        <div className="flex items-center justify-between bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
          <span className="text-xs text-gray-600">
            Page {page} of {totalPages} • {total} total complaints
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 border border-gray-200 rounded-lg text-xs font-medium disabled:opacity-50 hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 border border-gray-200 rounded-lg text-xs font-medium disabled:opacity-50 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
