import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { attendanceAPI } from '../../services/api';
import { Table, Badge, Button, Input, Select, Modal, PageHeader, EmptyState } from '../../components/ui';
import { format } from 'date-fns';
import { CalendarCheckIcon, RefreshCw, CheckSquare } from 'lucide-react';

export default function WardenAttendance() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [dateStr, setDateStr] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [checkType, setCheckType] = useState('');
  
  // Bulk Mark State
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [bulkType, setBulkType] = useState('morning');
  const [submittingBulk, setSubmittingBulk] = useState(false);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await attendanceAPI.getAll({ date: dateStr, check_type: checkType, limit: 100 });
      setAttendance(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      // Fetch all students for the bulk attendance marker
      // Wait, we can't easily fetch ALL students without the students API. Let's use the warden students API.
      const { wardenAPI } = require('../../services/api');
      const stRes = await wardenAPI.getStudents({ limit: 500 });
      setStudents(stRes.data.data || []);
    } catch(err) {
      toast.error('Failed to load students for bulk marking');
    }
  };

  useEffect(() => {
    fetchAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateStr, checkType]);

  const handleBulkMarkOpen = () => {
    if(students.length === 0) fetchStudents();
    setShowBulkModal(true);
  };

  const toggleStudent = (id) => {
    const newSet = new Set(selectedStudents);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedStudents(newSet);
  };

  const toggleAll = () => {
    if (selectedStudents.size === students.length) setSelectedStudents(new Set());
    else setSelectedStudents(new Set(students.map(s => s.id)));
  };

  const handleBulkSubmit = async () => {
    if (selectedStudents.size === 0) return toast.error('Select at least one student');
    setSubmittingBulk(true);
    try {
      const res = await attendanceAPI.bulkMark({
        student_ids: Array.from(selectedStudents),
        check_type: bulkType,
        method: 'manual'
      });
      toast.success(res.data.message || 'Attendance marked successfully');
      setShowBulkModal(false);
      setSelectedStudents(new Set());
      fetchAttendance();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setSubmittingBulk(false);
    }
  };

  const columns = [
    { key: 'student_name', label: 'Student', render: (val, row) => (
      <div>
        <div className="font-semibold text-gray-900">{val}</div>
        <div className="text-xs text-gray-500">{row.register_no}</div>
        {row.room_number && <div className="text-[10px] uppercase font-bold text-brand-primary mt-0.5">Room {row.room_number}</div>}
      </div>
    )},
    { key: 'checked_at', label: 'Time', render: (val) => <span className="font-medium text-gray-900">{format(new Date(val), 'hh:mm a')}</span> },
    { key: 'check_type', label: 'Shift', render: (val) => <Badge variant={val === 'morning' ? 'primary' : 'purple'} className="capitalize">{val}</Badge> },
    { key: 'method', label: 'Source', render: (val) => <Badge variant="outline" className="capitalize">{val}</Badge> },
    { key: 'marked_by_name', label: 'Marked By', render: (val) => <span className="text-sm text-gray-600">{val || 'System'}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Monitoring"
        title="Attendance Logs"
        description="Monitor daily student check-ins and manually manage attendance rolls."
        actions={
          <Button onClick={handleBulkMarkOpen} className="gap-2">
            <CheckSquare className="w-4 h-4" /> Bulk Mark Attendance
          </Button>
        }
      />

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap gap-4 items-end">
        <Input type="date" label="Date Filter" value={dateStr} onChange={e => setDateStr(e.target.value)} className="w-48" />
        <Select label="Shift Filter" value={checkType} onChange={e => setCheckType(e.target.value)} className="w-48">
          <option value="">All Shifts</option>
          <option value="morning">Morning Check</option>
          <option value="evening">Evening Check</option>
          <option value="manual">Manual Roll Call</option>
        </Select>
        <Button variant="ghost" onClick={fetchAttendance} className="w-10 px-0 h-10 ml-auto border"><RefreshCw className="w-4 h-4" /></Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
         {attendance.length > 0 ? (
           <Table columns={columns} data={attendance} loading={loading} />
         ) : (
           <EmptyState 
             title="No Records Found" 
             description={`No attendance records available for ${format(new Date(dateStr), 'MMM dd, yyyy')}${checkType ? ` during ${checkType} shift` : ''}.`} 
             icon={<CalendarCheckIcon className="w-10 h-10 text-gray-300" />} 
           />
         )}
      </div>

      <Modal open={showBulkModal} onClose={() => setShowBulkModal(false)} title="Bulk Mark Attendance" size="lg">
         <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-4">
               <Select label="Select Shift" value={bulkType} onChange={e => setBulkType(e.target.value)} className="w-48 bg-white">
                  <option value="morning">Morning Roll Call</option>
                  <option value="evening">Evening Roll Call</option>
                  <option value="manual">Special Check</option>
               </Select>
               <div className="flex-1 mt-auto pb-1 text-sm text-blue-800 flex justify-end gap-2 font-medium">
                 {selectedStudents.size} students selected
               </div>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden max-h-[50vh] flex flex-col">
              <div className="bg-gray-50 flex items-center px-4 py-2 border-b border-gray-200">
                <input type="checkbox" checked={students.length > 0 && selectedStudents.size === students.length} onChange={toggleAll} className="w-4 h-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary mr-4" />
                <span className="text-sm font-semibold text-gray-700">Select All Students</span>
              </div>
              <div className="overflow-y-auto p-2 space-y-1">
                 {students.length === 0 ? <div className="p-4 text-center text-gray-500">No students available in your jurisdiction.</div> : null}
                 {students.map(s => (
                   <label key={s.id} className={`flex items-center px-3 py-2 rounded-lg cursor-pointer transition-colors ${selectedStudents.has(s.id) ? 'bg-brand-primary/5' : 'hover:bg-gray-50'}`}>
                     <input type="checkbox" checked={selectedStudents.has(s.id)} onChange={() => toggleStudent(s.id)} className="w-4 h-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary mr-4" />
                     <div className="flex-1">
                       <span className="font-medium text-gray-900 block text-sm">{s.name}</span>
                       <span className="text-xs text-gray-500">{s.register_no} • {s.room_number ? `Room ${s.room_number}` : 'No Room'}</span>
                     </div>
                   </label>
                 ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
               <Button variant="outline" onClick={() => setShowBulkModal(false)}>Cancel</Button>
               <Button onClick={handleBulkSubmit} loading={submittingBulk} disabled={selectedStudents.size === 0}>Submit Attendance</Button>
            </div>
         </div>
      </Modal>
    </div>
  );
}
