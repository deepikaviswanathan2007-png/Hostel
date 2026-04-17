import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { hostelsAPI, roomsAPI } from '../../../services/api';
import { Button, Badge, Select, Spinner, SectionCard } from '../../../components/ui';

export default function FloorWardenPage() {
  const [hostels, setHostels] = useState([]);
  const [wardens, setWardens] = useState([]);
  const [floorWardens, setFloorWardens] = useState([]);
  const [assignmentLoading, setAssignmentLoading] = useState(true);
  const [assignmentSaving, setAssignmentSaving] = useState(false);
  const [assignmentBlock, setAssignmentBlock] = useState('');
  const [assignmentFloor, setAssignmentFloor] = useState(1);
  const [wingAssignments, setWingAssignments] = useState({ left: '', right: '' });

  useEffect(() => {
    hostelsAPI.getAll()
      .then((res) => {
        const mapped = (res.data.hostels || []).filter((item) => item.block_code);
        setHostels(mapped);
        if (mapped.length > 0) {
          setAssignmentBlock(mapped[0].block_code);
        } else {
          setAssignmentLoading(false);
        }
      })
      .catch(() => {
        toast.error('Failed to load hostels.');
        setAssignmentLoading(false);
      });
  }, []);

  const loadAssignments = useCallback(() => {
    if (!assignmentBlock) return;
    setAssignmentLoading(true);
    Promise.all([
      roomsAPI.getWardens(),
      roomsAPI.getFloorWardens({ block: assignmentBlock, floor: assignmentFloor }),
    ])
      .then(([wardenResponse, assignmentResponse]) => {
        const wardenList = wardenResponse.data.data || [];
        const assignmentList = assignmentResponse.data.data || [];
        setWardens(wardenList);
        setFloorWardens(assignmentList);
        setWingAssignments({
          left: assignmentList.find(item => item.wing === 'left')?.warden_id || '',
          right: assignmentList.find(item => item.wing === 'right')?.warden_id || '',
        });
      })
      .catch(() => toast.error('Failed to load floor wardens.'))
      .finally(() => setAssignmentLoading(false));
  }, [assignmentBlock, assignmentFloor]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const saveFloorWardens = async () => {
    if (wingAssignments.left && wingAssignments.right && Number(wingAssignments.left) === Number(wingAssignments.right)) {
      toast.error('Left wing and right wing must have different wardens.');
      return;
    }
    setAssignmentSaving(true);
    try {
      await roomsAPI.setFloorWardens({
        block: assignmentBlock,
        floor: assignmentFloor,
        assignments: {
          left: wingAssignments.left || null,
          right: wingAssignments.right || null,
        },
      });
      toast.success('Floor warden assignment updated.');
      loadAssignments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update floor wardens.');
    } finally {
      setAssignmentSaving(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <SectionCard>
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={saveFloorWardens} loading={assignmentSaving} disabled={!assignmentBlock}>Save Floor Wardens</Button>
          </div>

          <div className="flex flex-wrap gap-3">
            <Select value={assignmentBlock} onChange={e => setAssignmentBlock(e.target.value)} disabled={!assignmentBlock}>
              {hostels.length > 0 ? hostels.map((h) => (
                <option key={h.id} value={h.block_code}>
                  {h.name}
                </option>
              )) : (
                <option value="">No hostels available</option>
              )}
            </Select>
            <Select value={assignmentFloor} onChange={e => setAssignmentFloor(Number(e.target.value))} disabled={!assignmentBlock}>
              {[1, 2, 3, 4, 5].map(f => <option key={f} value={f}>Floor {f}</option>)}
            </Select>
          </div>

          {assignmentLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Left Wing Warden"
                  value={wingAssignments.left}
                  onChange={e => setWingAssignments(current => ({ ...current, left: e.target.value }))}
                  disabled={!assignmentBlock}
                >
                  <option value="">Select warden</option>
                  {wardens.map(warden => (
                    <option key={warden.id} value={warden.id}>{warden.name} ({warden.email})</option>
                  ))}
                </Select>

                <Select
                  label="Right Wing Warden"
                  value={wingAssignments.right}
                  onChange={e => setWingAssignments(current => ({ ...current, right: e.target.value }))}
                  disabled={!assignmentBlock}
                >
                  <option value="">Select warden</option>
                  {wardens.map(warden => (
                    <option key={warden.id} value={warden.id}>{warden.name} ({warden.email})</option>
                  ))}
                </Select>
              </div>

              <div className="rounded-2xl border border-brand-border/70 bg-brand-surface/40 p-4">
                <div className="text-xs font-bold uppercase tracking-[0.12em] text-brand-muted mb-2">Assigned Wardens</div>
                {floorWardens.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {floorWardens.map(item => (
                      <Badge key={`${item.wing}-${item.warden_id}`} variant="primary">
                        {item.wing === 'left' ? 'Left Wing' : 'Right Wing'}: {item.warden_name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-brand-muted">No wardens assigned to this floor.</p>
                )}
              </div>
            </>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
