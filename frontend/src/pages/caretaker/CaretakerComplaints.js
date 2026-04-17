import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { caretakerAPI } from '../../services/api';
import { Spinner, Badge } from '../../components/ui';
import { Search, Filter } from 'lucide-react';
import { format } from 'date-fns';

const COLORS = {
  primary: '#7D53F6',
  pending: '#F0B041',
  inProgress: '#0388FC',
  resolved: '#008000',
  secondarytext: '#5F6388',
};

export default function CaretakerComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [updating, setUpdating] = useState({});
  const pageSize = 15;

  const loadComplaints = useCallback(() => {
    setLoading(true);
    caretakerAPI.getComplaints({ status: filterStatus, page, limit: pageSize })
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

  const handleStatusChange = async (complaintId, newStatus) => {
    setUpdating(prev => ({ ...prev, [complaintId]: true }));
    try {
      await caretakerAPI.updateComplaint(complaintId, { status: newStatus });
      toast.success(`Complaint status updated to ${newStatus}`);
      loadComplaints();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(prev => ({ ...prev, [complaintId]: false }));
    }
  };

  const filterComplaints = complaints.filter(c =>
    !search || c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.student_name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(total / pageSize);
  const statusColors = {
    pending: COLORS.pending,
    in_progress: COLORS.inProgress,
    resolved: COLORS.resolved,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.section
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        <div className="text-sm font-semibold uppercase tracking-wider text-orange-600">Operations Portal</div>
        <h1 className="text-4xl font-bold text-gray-900">Complaint Management</h1>
        <p className="max-w-2xl text-base leading-relaxed text-gray-600">
          View and manage all student complaints with detailed tracking and status updates.
        </p>
      </motion.section>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title or student name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
            className="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
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

      {/* Complaints Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Title', 'Student', 'Room', 'Priority', 'Status', 'Date', 'Action'].map(header => (
                  <th key={header} className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center">
                    <Spinner size="lg" className="text-orange-600" />
                  </td>
                </tr>
              ) : filterComplaints.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <p className="text-gray-500 font-medium">No complaints found</p>
                  </td>
                </tr>
              ) : (
                filterComplaints.map((complaint, i) => (
                  <motion.tr
                    key={complaint.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.05 }}
                    className="hover:bg-gray-50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900 truncate max-w-xs">{complaint.title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">{complaint.student_name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">{complaint.room_number || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge style={{
                        backgroundColor: complaint.priority === 'high' ? '#FEE2E2' :
                                        complaint.priority === 'medium' ? '#FEF3C7' : '#DBEAFE',
                        color: complaint.priority === 'high' ? '#DC2626' :
                               complaint.priority === 'medium' ? '#D97706' : '#1E40AF',
                        fontSize: '12px',
                        fontWeight: '600',
                        padding: '4px 12px',
                      }}>
                        {complaint.priority?.toUpperCase() || 'MEDIUM'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge style={{
                        backgroundColor: `${statusColors[complaint.status]}20`,
                        color: statusColors[complaint.status],
                        fontSize: '12px',
                        fontWeight: '600',
                        padding: '4px 12px',
                      }}>
                        {complaint.status === 'pending' ? '⏳ Pending' :
                         complaint.status === 'in_progress' ? '🔧 In Progress' :
                         '✓ Resolved'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {format(new Date(complaint.created_at), 'dd MMM yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={complaint.status}
                        onChange={(e) => handleStatusChange(complaint.id, e.target.value)}
                        disabled={updating[complaint.id]}
                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 cursor-pointer bg-white"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > pageSize && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <span className="text-sm font-medium text-gray-700">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-3">
              <button
                disabled={page === 1}
                onClick={() => setPage(1)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-100 transition-colors"
              >
                First
              </button>
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-100 transition-colors"
              >
                Previous
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-100 transition-colors"
              >
                Next
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(totalPages)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-100 transition-colors"
              >
                Last
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
