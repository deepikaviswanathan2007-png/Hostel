import React, { useState, useEffect } from 'react';
import { leavesAPI } from '../../services/api';
import { Card, Button, Input, Select, Badge, Table, Spinner } from '../../components/ui';
import { Search, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function WardenLeaveApprovals() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      // Backend automatically checks filter status
      const res = await leavesAPI.getAll({ status: statusFilter !== 'all' ? statusFilter : undefined });
      
      // Client side search for student name or reg. Alternatively add search to backend leavesAPI.
      let filtered = res.data.data;
      if (search) {
        filtered = filtered.filter(l => 
          l.student_name?.toLowerCase().includes(search.toLowerCase()) || 
          l.student_reg?.toLowerCase().includes(search.toLowerCase())
        );
      }
      setLeaves(filtered);
    } catch (err) {
      toast.error('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
    // eslint-disable-next-line
  }, [search, statusFilter]);

  const handleStatusUpdate = async (id, newStatus) => {
    if (!window.confirm(`Are you sure you want to ${newStatus} this leave request?`)) return;
    try {
      await leavesAPI.updateStatus(id, { status: newStatus });
      toast.success(`Leave request ${newStatus}`);
      fetchLeaves();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const getStatusBadge = (status) => {
    const map = { pending: 'warning', approved: 'success', rejected: 'danger' };
    return <Badge variant={map[status]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Outpass Approvals</h1>
          <p className="text-sm text-gray-500 mt-1">Review and manage student leave requests</p>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <Input
              icon={<Search className="w-4 h-4" />}
              placeholder="Search by student name or register number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full md:w-64">
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="pending">Pending Requests</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="all">All Requests</option>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center"><Spinner /></div>
        ) : (
          <div className="overflow-x-auto mt-4">
            <Table 
              columns={[
                { key: 'student', label: 'Student', render: (_, row) => (
                  <div>
                    <div className="font-medium text-gray-900">{row.student_name}</div>
                    <div className="text-xs text-gray-500">{row.student_reg}</div>
                  </div>
                )},
                { key: 'duration', label: 'Duration', render: (_, row) => {
                    const days = Math.ceil((new Date(row.to_date) - new Date(row.from_date)) / (1000 * 60 * 60 * 24)) + 1;
                    return (
                      <div>
                        <div className="text-sm text-gray-900">{days} Day(s)</div>
                        <div className="text-xs text-gray-500">
                          {new Date(row.from_date).toLocaleDateString()} to {new Date(row.to_date).toLocaleDateString()}
                        </div>
                      </div>
                    );
                }},
                { key: 'reason', label: 'Reason', render: (val) => <div className="max-w-xs truncate" title={val}>{val}</div> },
                { key: 'created_at', label: 'Applied On', render: (val) => new Date(val).toLocaleDateString() },
                { key: 'status', label: 'Status', render: (_, row) => (
                    <div className="flex flex-col">
                      {getStatusBadge(row.status)}
                      {row.approved_by_name && (
                          <span className="text-[10px] text-gray-400 mt-1">by {row.approved_by_name}</span>
                      )}
                    </div>
                )},
                { key: 'actions', label: 'Actions', render: (_, row) => (
                    row.status === 'pending' ? (
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(row.id, 'approved')} title="Approve" className="text-green-600 border-green-200 hover:bg-green-50">
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(row.id, 'rejected')} title="Reject" className="text-red-600 border-red-200 hover:bg-red-50">
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : null
                )},
              ]}
              data={leaves} 
            />
          </div>
        )}
      </Card>
    </div>
  );
}
