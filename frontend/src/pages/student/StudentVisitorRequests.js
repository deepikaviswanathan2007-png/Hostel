import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { CheckCircle2, Clock3, LogIn, LogOut, UserPlus, Users, XCircle } from 'lucide-react';
import { visitorsAPI } from '../../services/api';
import { Badge, Button, EmptyState, Input, PanelShell, PortalHero, Spinner } from '../../components/ui';

export default function StudentVisitorRequests() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [visitorName, setVisitorName] = useState('');
  const [relation, setRelation] = useState('');
  const [phone, setPhone] = useState('');
  const [idProof, setIdProof] = useState('');

  const fetchVisitors = async () => {
    try {
      setLoading(true);
      const res = await visitorsAPI.getMine();
      setVisitors(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load visitor requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, []);

  const resetForm = () => {
    setVisitorName('');
    setRelation('');
    setPhone('');
    setIdProof('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await visitorsAPI.createMine({
        visitor_name: visitorName,
        relation,
        phone,
        id_proof: idProof,
      });
      toast.success('Visitor request submitted successfully');
      resetForm();
      setShowForm(false);
      fetchVisitors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit visitor request');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'inside') {
      return <Badge variant="success" className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Inside</Badge>;
    }
    if (status === 'exited') {
      return <Badge variant="default" className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Exited</Badge>;
    }
    return <Badge variant="warning" className="flex items-center gap-1"><Clock3 className="h-3 w-3" /> Pending</Badge>;
  };

  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Spinner size="lg" className="text-brand-primary" /></div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PortalHero
        eyebrow="Guest Access"
        title="Visitor Requests"
        description="Share expected visitor details and keep track of entry and exit updates for your guests."
        accent="orange"
        icon={<Users className="h-5 w-5" />}
        actions={
          <Button onClick={() => setShowForm((value) => !value)} variant={showForm ? 'outline' : 'primary'} className="rounded-xl px-6">
            {showForm ? 'Cancel' : 'New Visitor'}
          </Button>
        }
      />

      {showForm && (
        <PanelShell title="Add Visitor Request" description="Enter the details of the person visiting you.">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Input label="Visitor Name" value={visitorName} onChange={(e) => setVisitorName(e.target.value)} placeholder="Enter visitor name" required />
              <Input label="Relation" value={relation} onChange={(e) => setRelation(e.target.value)} placeholder="Father, mother, guardian, friend..." required />
              <Input label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter contact number" required />
              <Input label="ID Proof" value={idProof} onChange={(e) => setIdProof(e.target.value)} placeholder="Optional ID reference" />
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" loading={submitting}>Submit Request</Button>
            </div>
          </form>
        </PanelShell>
      )}

      {visitors.length > 0 ? (
        <div className="grid gap-4">
          <h3 className="pl-1 font-display text-sm font-semibold uppercase tracking-wider text-gray-500">Visitor History</h3>
          {visitors.map((visitor) => (
            <PanelShell key={visitor.id} className="transition-all hover:border-brand-primary/30">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-base font-bold text-gray-900">{visitor.visitor_name}</h4>
                  <Badge variant="outline">{visitor.relation || 'Visitor'}</Badge>
                  {getStatusBadge(visitor.status)}
                </div>

                <div className="grid grid-cols-1 gap-3 text-sm text-gray-600 md:grid-cols-3">
                  <div>
                    <span className="block text-xs font-medium uppercase tracking-wider text-gray-400">Phone</span>
                    <span className="font-medium text-gray-900">{visitor.phone || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium uppercase tracking-wider text-gray-400">Entry Time</span>
                    <span className="inline-flex items-center gap-1 font-medium text-gray-900">
                      <LogIn className="h-3.5 w-3.5 text-emerald-500" />
                      {format(new Date(visitor.in_time), 'dd MMM yyyy, hh:mm a')}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium uppercase tracking-wider text-gray-400">Exit Time</span>
                    <span className="inline-flex items-center gap-1 font-medium text-gray-900">
                      <LogOut className="h-3.5 w-3.5 text-orange-500" />
                      {visitor.out_time ? format(new Date(visitor.out_time), 'dd MMM yyyy, hh:mm a') : 'Still inside'}
                    </span>
                  </div>
                </div>

                {visitor.id_proof && (
                  <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                    <span className="mr-2 text-xs font-semibold uppercase tracking-wider text-gray-500">ID Proof</span>
                    {visitor.id_proof}
                  </div>
                )}
              </div>
            </PanelShell>
          ))}
        </div>
      ) : (
        !showForm && (
          <EmptyState
            title="No Visitor Requests Yet"
            description="Add a visitor request to start tracking guest entries for your room."
            icon={<UserPlus className="h-10 w-10 text-gray-300" />}
          />
        )
      )}
    </div>
  );
}
