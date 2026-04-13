import React, { useState, useEffect } from 'react';
import { messMenuAPI } from '../../../services/api';
import { Card, Button, Spinner } from '../../../components/ui';
import { Edit2, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEALS = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];

export default function MessMenuPage() {
  const { isStudent } = useAuth();
  const [menu, setMenu] = useState({});
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // local edits
  // Object shape: { [id]: newItemsString }
  const [edits, setEdits] = useState({});

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const res = await messMenuAPI.getAll();
      setMenu(res.data.data); // data is grouped by day then meal
    } catch (err) {
      toast.error('Failed to load mess menu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleEditChange = (day, meal, val) => {
    const key = `${day}-${meal}`;
    setEdits(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = async () => {
    const entries = Object.entries(edits).map(([key, items]) => {
      const [day_of_week, meal_type] = key.split('-');
      return { day_of_week, meal_type, items };
    });
    if (entries.length === 0) {
      setIsEditing(false);
      return;
    }

    try {
      setSaving(true);
      await messMenuAPI.update({ entries });
      toast.success('Menu updated successfully!');
      setIsEditing(false);
      setEdits({});
      fetchMenu();
    } catch (err) {
      toast.error('Failed to update menu');
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEdits({});
  };

  if (loading) return <div className="py-20 flex justify-center"><Spinner /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Weekly Mess Menu</h1>
          <p className="text-sm text-gray-500 mt-1">View the schedule for the upcoming week</p>
        </div>
        {!isStudent && (
          <div>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} variant="outline" className="flex items-center gap-2">
                <Edit2 className="h-4 w-4" /> Edit Menu
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button onClick={cancelEdit} variant="outline" className="flex items-center gap-2 text-red-600">
                  <X className="h-4 w-4" /> Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                  <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-7 gap-4">
        {DAYS.map(day => (
          <Card key={day} className="overflow-hidden flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-brand-primary text-white text-center py-3 font-semibold rounded-t-xl">
              {day}
            </div>
            <div className="p-4 flex flex-col gap-4 flex-1">
              {MEALS.map(meal => {
                const itemData = menu[day]?.[meal];
                const editKey = `${day}-${meal}`;
                const displayVal = edits[editKey] !== undefined ? edits[editKey] : (itemData?.items || 'Not setup');

                return (
                  <div key={meal} className="border-b last:border-0 pb-3 last:pb-0">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{meal}</div>
                    {isEditing ? (
                      <textarea
                        className="w-full text-sm font-bold rounded border-gray-300 shadow-sm focus:border-brand-primary focus:ring-brand-primary p-2 min-h-[60px]"
                        value={displayVal}
                        onChange={(e) => handleEditChange(day, meal, e.target.value)}
                      />
                    ) : (
                      <div className="text-sm font-bold text-gray-800 whitespace-pre-wrap">{displayVal}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
