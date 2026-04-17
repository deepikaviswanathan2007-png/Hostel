import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { requestsAPI } from '../../services/api';
import { Badge, Button, Input, Select, Textarea, PanelShell, PortalHero, EmptyState, Spinner } from '../../components/ui';
import { format } from 'date-fns';
import { RefreshCcwIcon, CheckCircle2, Clock, XCircle, FileTextIcon } from 'lucide-react';

export default function StudentRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [requestType, setRequestType] = useState('room_change');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await requestsAPI.getMyRequests();
      setRequests(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await requestsAPI.create({ request_type: requestType, title, description });
      toast.success('Request submitted successfully');
      setTitle('');
      setDescription('');
      setShowForm(false);
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return <Badge variant="success" className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Approved</Badge>;
      case 'rejected': return <Badge variant="danger" className="flex items-center gap-1"><XCircle className="w-3 h-3"/> Rejected</Badge>;
      default: return <Badge variant="warning" className="flex items-center gap-1"><Clock className="w-3 h-3"/> Pending</Badge>;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Spinner size="lg" className="text-brand-primary" /></div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PortalHero
        eyebrow="Hostel Services"
        title="My Requests"
        description="Submit and track room change requests or other special hostel administrative requests."
        accent="blue"
        icon={<RefreshCcwIcon className="w-5 h-5" />}
        actions={
          <Button onClick={() => setShowForm(!showForm)} className="rounded-xl px-6" variant={showForm ? "outline" : "primary"}>
            {showForm ? 'Cancel' : 'New Request'}
          </Button>
        }
      />

      {showForm && (
        <PanelShell title="New Request" description="Provide details about your request.">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Select label="Request Type" value={requestType} onChange={e => setRequestType(e.target.value)} required>
                <option value="room_change">Room Change Request</option>
                <option value="other">Other Administrative Request</option>
              </Select>
              <Input label="Subject / Title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Request to move to Ramanujan Hostel" required />
            </div>
            <Textarea
              label="Description & Reason"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Provide detailed reasons for your request..."
              rows={4}
              required
            />
            <div className="flex justify-end pt-2">
              <Button type="submit" loading={submitting}>Submit Request</Button>
            </div>
          </form>
        </PanelShell>
      )}

      {requests.length > 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="space-y-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider pl-1 font-display">Past Requests</h3>
          {requests.map((req, index) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + index * 0.05 }}
            >
              <PanelShell key={req.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-brand-primary/30">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center flex-wrap gap-3">
                      <h4 className="text-lg font-bold text-gray-900 mr-2">{req.title}</h4>
                      <Badge variant="outline" className="capitalize">{req.request_type.replace('_', ' ')}</Badge>
                      {getStatusBadge(req.status)}
                    </div>
                    
                    <p className="text-sm text-gray-600 leading-relaxed max-w-3xl">{req.description}</p>
                    <p className="text-xs text-gray-400 font-medium tracking-wide border-b border-gray-100 pb-3">Requested on {format(new Date(req.created_at), 'dd MMM yyyy')}</p>

                    {req.status !== 'pending' && req.review_note && (
                      <div className={`mt-3 p-4 rounded-xl border flex gap-3 items-start text-sm ${req.status === 'approved' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                        <FileTextIcon className={`w-4 h-4 mt-0.5 shrink-0 ${req.status === 'approved' ? 'text-emerald-500' : 'text-red-500'}`} />
                        <div>
                          <span className="font-semibold block mb-0.5">Reviewed by {req.reviewed_by_name}:</span>
                          <p>{req.review_note}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </PanelShell>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        !showForm && <EmptyState title="No Requests Found" description="You haven't submitted any requests." icon={<RefreshCcwIcon className="w-10 h-10 text-gray-300" />} />
      )}
    </div>
  );
}
