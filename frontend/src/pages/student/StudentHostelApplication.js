import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { hostelApplicationsAPI } from '../../services/api';
import { Badge, Button, Select, PanelShell, PortalHero, EmptyState, Spinner } from '../../components/ui';
import { format } from 'date-fns';
import { BuildingIcon, FileTextIcon, CheckCircle2, Clock, XCircle } from 'lucide-react';
import useHostelNameMap from '../../hooks/useHostelNameMap';

export default function StudentHostelApplication() {
  const { hostels, getHostelName } = useHostelNameMap();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [semester, setSemester] = useState(1);
  const [preferredBlock, setPreferredBlock] = useState('');
  const [preferredRoomType, setPreferredRoomType] = useState('triple');
  const [reason, setReason] = useState('');

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await hostelApplicationsAPI.getMyApplications();
      setApplications(res.data.data || []);
      const hasPending = (res.data.data || []).some(a => a.status === 'pending');
      if (!hasPending && (res.data.data || []).length === 0) {
        setShowForm(true);
      } else {
        setShowForm(false);
      }
    } catch (err) {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await hostelApplicationsAPI.create({
        academic_year: academicYear,
        semester: Number(semester),
        preferred_block: preferredBlock || null,
        preferred_room_type: preferredRoomType || null,
        reason
      });
      toast.success('Application submitted successfully!');
      setReason('');
      fetchApplications();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit application');
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

  const hasPending = applications.some(a => a.status === 'pending');

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PortalHero
        eyebrow="Hostel Accommodation"
        title="Hostel Application"
        description="Apply for a hostel room for the upcoming academic year. View your application status and history."
        accent="primary"
        icon={<BuildingIcon className="w-5 w-5" />}
        actions={
          !hasPending && !showForm && (
            <Button onClick={() => setShowForm(true)} className="rounded-xl px-6">
              New Application
            </Button>
          )
        }
      />

      {showForm && !hasPending && (
        <PanelShell title="New Hostel Application" description="Submit your preferences for the upcoming academic year.">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <Select label="Academic Year" value={academicYear} onChange={e => setAcademicYear(e.target.value)} required>
                <option value="2024-2025">2024-2025</option>
                <option value="2025-2026">2025-2026</option>
                <option value="2026-2027">2026-2027</option>
              </Select>
              <Select label="Year of Study" value={semester} onChange={e => setSemester(e.target.value)} required>
                <option value={1}>1st Year</option>
                <option value={2}>2nd Year</option>
                <option value={3}>3rd Year</option>
                <option value={4}>4th Year</option>
              </Select>
              <Select label="Preferred Hostel (Optional)" value={preferredBlock} onChange={e => setPreferredBlock(e.target.value)}>
                <option value="">No Preference</option>
                {hostels.map((h) => (
                  <option key={h.id} value={h.block_code}>{h.name}</option>
                ))}
              </Select>
              <Select label="Preferred Room Type" value={preferredRoomType} onChange={e => setPreferredRoomType(e.target.value)}>
                <option value="single">Single Cot</option>
                <option value="double">Double Cot</option>
                <option value="triple">Triple Cot</option>
                <option value="quad">Quad Cot</option>
              </Select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              {applications.length > 0 && (
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              )}
              <Button type="submit" loading={submitting}>Submit Application</Button>
            </div>
          </form>
        </PanelShell>
      )}

      {applications.length > 0 && !showForm && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider pl-1 font-display">Your Applications</h3>
          {applications.map(app => (
            <PanelShell key={app.id} className="transition-all hover:border-brand-primary/30">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg text-gray-900">{app.academic_year}</span>
                    <Badge variant="outline">Year {app.semester}</Badge>
                    {getStatusBadge(app.status)}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-y-2 gap-x-8 text-sm">
                    <div>
                      <span className="text-gray-500 text-xs uppercase tracking-wider font-medium block mb-1">Hostel Pref</span>
                      <span className="text-gray-900 font-medium">{app.preferred_block ? getHostelName(app.preferred_block) : 'Any'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs uppercase tracking-wider font-medium block mb-1">Room Pref</span>
                      <span className="text-gray-900 font-medium capitalize">{app.preferred_room_type ? `${app.preferred_room_type} Cot` : 'Any'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs uppercase tracking-wider font-medium block mb-1">Applied On</span>
                      <span className="text-gray-900 font-medium">{format(new Date(app.created_at), 'dd MMM yyyy')}</span>
                    </div>
                  </div>

                  {app.reason && (
                    <div className="mt-4 pt-3 border-t border-gray-50">
                       <span className="text-gray-500 text-xs uppercase tracking-wider font-medium block mb-1">Note</span>
                       <p className="text-gray-700 text-sm leading-relaxed">{app.reason}</p>
                    </div>
                  )}

                  {app.status !== 'pending' && app.review_note && (
                    <div className={`mt-2 p-3 rounded-xl border flex gap-3 items-start text-sm ${app.status === 'approved' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                      <FileTextIcon className={`w-4 h-4 mt-0.5 shrink-0 ${app.status === 'approved' ? 'text-emerald-500' : 'text-red-500'}`} />
                      <div>
                        <span className="font-semibold block mb-0.5">Warden Note:</span>
                        <p>{app.review_note}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </PanelShell>
          ))}
        </div>
      )}

      {applications.length === 0 && !showForm && (
        <EmptyState 
           title="No Applications Found" 
           description="You haven't applied for a hostel room yet. Click 'New Application' to get started." 
           icon={<BuildingIcon className="w-12 h-12 text-gray-300" />} 
        />
      )}
    </div>
  );
}
