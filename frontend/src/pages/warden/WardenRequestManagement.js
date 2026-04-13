import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { requestsAPI } from '../../services/api';
import { Table, Badge, Button, Modal, Textarea, PageHeader, EmptyState } from '../../components/ui';
import { format } from 'date-fns';
import { RefreshCcwIcon } from 'lucide-react';

export default function WardenRequestManagement() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState(null);
  
  const [reviewNote, setReviewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('pending');

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await requestsAPI.getAll({ status: statusFilter, limit: 100 });
      setRequests(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleReview = async (status) => {
    if (!selectedReq) return;
    setSubmitting(true);
    try {
      await requestsAPI.review(selectedReq.id, { status, review_note: reviewNote });
      toast.success(`Request ${status}`);
      setSelectedReq(null);
      setReviewNote('');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${status} request`);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: 'student_name', label: 'Student', render: (val, row) => (
      <div>
        <div className="font-semibold text-gray-900">{val}</div>
        <div className="text-xs text-gray-500">{row.register_no} • {row.department}</div>
        {row.room_number && <div className="text-[10px] uppercase font-bold text-brand-primary mt-0.5">Room {row.room_number}</div>}
      </div>
    )},
    { key: 'title', label: 'Request Details', render: (val, row) => (
      <div className="max-w-md">
        <div className="font-semibold text-gray-900 truncate max-w-sm" title={val}>{val}</div>
        <div className="text-xs text-gray-500 capitalize">{row.request_type.replace('_', ' ')}</div>
      </div>
    )},
    { key: 'status', label: 'Status', render: (val) => {
      const styles = { pending: 'warning', approved: 'success', rejected: 'danger' };
      return <Badge variant={styles[val] || 'default'} className="capitalize">{val}</Badge>;
    }},
    { key: 'created_at', label: 'Submitted', render: (val) => <span className="text-gray-600 whitespace-nowrap">{format(new Date(val), 'dd MMM yy')}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Student Requests"
        description="Review room change requests and other administrative student tickets."
        actions={
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {['pending', 'approved', 'rejected'].map(status => (
              <button
                key={status}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${statusFilter === status ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setStatusFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>
        }
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
         {requests.length > 0 ? (
           <Table columns={columns} data={requests} loading={loading} onRow={(req) => setSelectedReq(req)} />
         ) : (
           <EmptyState 
             title={`No ${statusFilter} requests`} 
             description={`There are currently no student requests marked as ${statusFilter}.`} 
             icon={<RefreshCcwIcon className="w-10 h-10 text-gray-300" />} 
           />
         )}
      </div>

      <Modal open={!!selectedReq} onClose={() => setSelectedReq(null)} title="Request Details" size="lg">
        {selectedReq && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 grid grid-cols-2 gap-4">
              <div>
                <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Student Details</span>
                <span className="block font-bold text-gray-900 text-lg">{selectedReq.student_name}</span>
                <span className="block text-sm text-gray-600">{selectedReq.register_no} • Room {selectedReq.room_number || 'N/A'}</span>
              </div>
              <div className="text-right">
                <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Status</span>
                <Badge variant={selectedReq.status === 'pending' ? 'warning' : selectedReq.status === 'approved' ? 'success' : 'danger'} className="capitalize">{selectedReq.status}</Badge>
              </div>
            </div>

            <div>
               <h4 className="text-lg font-bold text-gray-900">{selectedReq.title}</h4>
               <Badge variant="outline" className="capitalize my-2">{selectedReq.request_type.replace('_', ' ')}</Badge>
               <div className="mt-2 text-sm text-gray-700 leading-relaxed bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                 {selectedReq.description}
               </div>
            </div>

            {selectedReq.status !== 'pending' && selectedReq.review_note && (
              <div>
                <h4 className="text-sm font-bold text-gray-900 border-b pb-2 mb-3">Your Review Note</h4>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedReq.review_note}</p>
              </div>
            )}

            {selectedReq.status === 'pending' && (
              <div className="pt-4 border-t">
                <Textarea
                  label="Review Note (Sent to Student)"
                  placeholder="Provide instructions or reasons..."
                  value={reviewNote}
                  onChange={e => setReviewNote(e.target.value)}
                  rows={3}
                />
                <div className="flex gap-3 justify-end mt-4">
                  <Button variant="danger" onClick={() => handleReview('rejected')} loading={submitting}>Reject Request</Button>
                  <Button variant="success" onClick={() => handleReview('approved')} loading={submitting}>Approve Request</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
