import { useState, useEffect } from 'react';
import { Trash2, Plus } from 'lucide-react';
import api from '../services/api';

export default function UnavailablePeriodsPage() {
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState('1');
  const [sectionNumber, setSectionNumber] = useState('1');
  const [reason, setReason] = useState('');

  const DAYS = { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday' };
  const SECTIONS = [1, 2, 3, 4, 5];

  useEffect(() => {
    fetchUnavailablePeriods();
  }, []);

  const fetchUnavailablePeriods = async () => {
    setLoading(true);
    try {
      const res = await api.get('/unavailable-periods');
      setPeriods(res.data || []);
    } catch (error) {
      console.error('Error fetching unavailable periods:', error);
      alert('Error loading unavailable periods');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!dayOfWeek || !sectionNumber) {
      alert('Please select a day and section');
      return;
    }

    try {
      const res = await api.post('/unavailable-periods', {
        day_of_week: parseInt(dayOfWeek),
        section_number: parseInt(sectionNumber),
        reason: reason || ''
      });

      setPeriods([...periods, res.data]);
      setReason('');
      alert('Unavailable period added successfully');
    } catch (error) {
      console.error('Error adding unavailable period:', error);
      alert('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this unavailable period?')) {
      try {
        await api.delete(`/unavailable-periods/${id}`);
        setPeriods(periods.filter(p => p.id !== id));
        alert('Unavailable period removed');
      } catch (error) {
        console.error('Error deleting unavailable period:', error);
        alert('Error removing unavailable period');
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Unavailable Periods
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Block specific day and section combinations so no programme will be scheduled during that time
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Add Unavailable Period
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Day
            </label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              {Object.entries(DAYS).map(([key, name]) => (
                <option key={key} value={key}>{name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Section
            </label>
            <select
              value={sectionNumber}
              onChange={(e) => setSectionNumber(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              {SECTIONS.map(s => (
                <option key={s} value={s}>Section {s}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reason (optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Maintenance, Special Event"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleAdd}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Add Block
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Blocked Sections
          </h2>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-600 dark:text-gray-400">Loading...</div>
        ) : periods.length === 0 ? (
          <div className="p-6 text-center text-gray-600 dark:text-gray-400">
            No unavailable periods set. All day/section combinations are available for scheduling.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Day
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Section
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Time Slot
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {periods.map((period) => {
                  const times = ['9:00-10:30', '11:00-12:30', '13:00-14:30', '15:00-16:30', '17:00-18:30'];
                  const timeSlot = times[period.section_number - 1];
                  return (
                    <tr
                      key={period.id}
                      className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {DAYS[period.day_of_week]}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        Section {period.section_number}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {period.reason || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {timeSlot}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => handleDelete(period.id)}
                          className="text-red-600 hover:text-red-800 dark:hover:text-red-400 transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>ℹ️ Info:</strong> When you block a day and section combination, no programme will be scheduled during that time slot. 
          This is useful for maintenance windows, special events, or when certain facilities are unavailable.
        </p>
      </div>
    </div>
  );
}
