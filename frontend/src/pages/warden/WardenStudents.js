import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { wardenAPI } from '../../services/api';
import { Spinner } from '../../components/ui';
import { Search } from 'lucide-react';
import useHostelNameMap from '../../hooks/useHostelNameMap';

const DEPTS = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'AIML', 'CSD'];
const pageSize = 20;


export default function WardenStudents() {
  const { getHostelName } = useHostelNameMap();
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ dept: '', year: '' });
  const [page, setPage] = useState(1);

  const loadStudents = useCallback(() => {
    setLoading(true);
    wardenAPI.getStudents({
      search,
      ...filters,
      page,
      limit: pageSize,
    })
      .then(r => {
        setStudents(r.data.data || []);
        setTotal(r.data.total || 0);
      })
      .finally(() => setLoading(false));
  }, [search, filters, page]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6 md:p-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-sm"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Management</h1>
        <p className="text-sm text-gray-600">View and manage all hostel students</p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl p-6 bg-white border border-gray-100 shadow-sm"
      >
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, register no..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filters.dept}
            onChange={(e) => {
              setFilters(prev => ({ ...prev, dept: e.target.value }));
              setPage(1);
            }}
            className="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Departments</option>
            {DEPTS.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <select
            value={filters.year}
            onChange={(e) => {
              setFilters(prev => ({ ...prev, year: e.target.value }));
              setPage(1);
            }}
            className="px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Years</option>
            {[1, 2, 3, 4].map(year => (
              <option key={year} value={year}>Year {year}</option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Students Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-white"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Name', 'Register No', 'Department', 'Year', 'Room', 'Phone'].map(header => (
                  <th key={header} className="px-6 py-4 text-left text-xs font-bold uppercase text-gray-600 tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center">
                    <Spinner size="md" />
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No students found
                  </td>
                </tr>
              ) : (
                students.map((student, i) => (
                  <motion.tr
                    key={student.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                          {student.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{student.name}</div>
                          <div className="text-xs text-gray-600">{student.email || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-gray-600">{student.register_no}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {student.department}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      Year {student.year}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {student.room_number ? `${student.room_number} (${getHostelName(student.block)})` : '—'}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-gray-600">
                      {student.phone || '—'}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > pageSize && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
            <span className="text-sm text-gray-600">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-100"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm font-medium">
                {page} / {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-100"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: 'Total Students', value: total, bg: 'bg-blue-50' },
        ].map(({ label, value, bg }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${bg} rounded-xl p-4 border border-gray-100`}
          >
            <div className="text-xs text-gray-600 mb-1">{label}</div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
