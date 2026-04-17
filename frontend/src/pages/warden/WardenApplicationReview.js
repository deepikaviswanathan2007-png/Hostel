import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { hostelApplicationsAPI } from '../../services/api';
import { Table, Badge, Button, Modal, Textarea, EmptyState } from '../../components/ui';
import { format } from 'date-fns';
import { BuildingIcon } from 'lucide-react';
import useHostelNameMap from '../../hooks/useHostelNameMap';

export default function WardenApplicationReview() {
  const { getHostelName } = useHostelNameMap();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  
  const [reviewNote, setReviewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('pending');

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await hostelApplicationsAPI.getAll({ status: statusFilter, limit: 100 });
      setApplications(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleReview = async (status) => {
    setSubmitting(true);
    try {
      await hostelApplicationsAPI.review(selectedApp.id, { status, review_note: reviewNote });
      toast.success(`Application ${status}`);
      setSelectedApp(null);
      setReviewNote('');
      fetchApplications();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${status} application`);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: 'student_name', label: 'Student Name', render: (val, row) => (
      <div>
        <div className="font-semibold text-gray-900">{val}</div>
        <div className="text-xs text-gray-500">{row.register_no} • {row.department} (Year {row.year})</div>
      </div>
    )},
    { key: 'academic_year', label: 'Term', render: (val, row) => (
      <div>
        <div className="font-medium text-gray-900">{val}</div>
        <div className="text-xs text-gray-500">Sem {row.semester}</div>
      </div>
    )},
    { key: 'preferred_block', label: 'Preferences', render: (val, row) => (
      <div className="text-xs">
        <div className="text-gray-900 font-medium">Hostel: {val ? getHostelName(val) : 'Any'}</div>
        <div className="text-gray-600 capitalize">Room: {row.preferred_room_type || 'Any'}</div>
      </div>
    )},
    { key: 'status', label: 'Status', render: (val) => {
      const styles = { pending: 'warning', approved: 'success', rejected: 'danger' };
      return <Badge variant={styles[val] || 'default'} className="capitalize">{val}</Badge>;
    }},
    { key: 'created_at', label: 'Applied On', render: (val) => <span className="text-gray-600 whitespace-nowrap">{format(new Date(val), 'dd MMM yyyy')}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
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
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
         {applications.length > 0 ? (
           <Table columns={columns} data={applications} loading={loading} onRow={(app) => setSelectedApp(app)} />
         ) : (
           <EmptyState 
             title={`No ${statusFilter} applications`} 
             description={`There are currently no applications marked as ${statusFilter}.`} 
             icon={<BuildingIcon className="w-10 h-10 text-gray-300" />} 
           />
         )}
      </div>

      <Modal open={!!selectedApp} onClose={() => setSelectedApp(null)} title="Application Details" size="lg">
        {selectedApp && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 grid grid-cols-2 gap-4">
              <div>
                <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Applicant</span>
                <span className="block font-bold text-gray-900 text-lg">{selectedApp.student_name}</span>
                <span className="block text-sm text-gray-600">{selectedApp.register_no} • {selectedApp.department} (Year {selectedApp.year})</span>
              </div>
              <div className="text-right">
                <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Status</span>
                <Badge variant={selectedApp.status === 'pending' ? 'warning' : selectedApp.status === 'approved' ? 'success' : 'danger'} className="capitalize">{selectedApp.status}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
               <div>
                  <h4 className="text-sm font-bold text-gray-900 border-b pb-2 mb-3">Preferences</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between"><span className="text-gray-500">Term:</span> <span className="font-medium">{selectedApp.academic_year} (Sem {selectedApp.semester})</span></li>
                    <li className="flex justify-between"><span className="text-gray-500">Hostel:</span> <span className="font-medium">{selectedApp.preferred_block ? getHostelName(selectedApp.preferred_block) : 'No Preference'}</span></li>
                    <li className="flex justify-between"><span className="text-gray-500">Room Type:</span> <span className="font-medium capitalize">{selectedApp.preferred_room_type || 'No Preference'}</span></li>
                  </ul>
               </div>
               <div>
                  <h4 className="text-sm font-bold text-gray-900 border-b pb-2 mb-3">Student Note</h4>
                  <p className="text-sm text-gray-700 bg-orange-50/50 p-3 rounded-lg border border-orange-100 min-h-[4rem]">
                    {selectedApp.reason || <span className="text-gray-400 italic">No additional note provided.</span>}
                  </p>
               </div>
            </div>

            {selectedApp.status !== 'pending' && selectedApp.review_note && (
              <div>
                <h4 className="text-sm font-bold text-gray-900 border-b pb-2 mb-3">Previous Review Note</h4>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedApp.review_note}</p>
              </div>
            )}

            {selectedApp.status === 'pending' && (
              <div className="pt-4 border-t">
                <Textarea
                  label="Review Note (Optional)"
                  placeholder="Add a note or reason for your decision..."
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
