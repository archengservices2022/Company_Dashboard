import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebase';
import {
  collection,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { Clock, BarChart3, TrendingUp } from 'lucide-react';

export default function Attendance() {
  const { user } = useAuth();
  const [workingHours, setWorkingHours] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().split('T')[0].slice(0, 7));

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, selectedMonth]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get current employee
      const empQuery = query(
        collection(db, 'employees'),
        where('email', '==', user.email)
      );
      const empSnapshot = await getDocs(empQuery);

      if (empSnapshot.docs.length === 0) {
        setWorkingHours([]);
        setLoading(false);
        return;
      }

      const employeeId = empSnapshot.docs[0].id;

      // Fetch working hours for this employee
      const hoursQuery = query(
        collection(db, 'workingHours'),
        where('employeeId', '==', employeeId)
      );
      const hoursSnapshot = await getDocs(hoursQuery);
      const allHours = hoursSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter by month
      const filteredHours = allHours.filter(h => {
        const hMonth = h.date.slice(0, 7);
        return hMonth === selectedMonth;
      }).sort((a, b) => new Date(b.date) - new Date(a.date));

      setWorkingHours(filteredHours);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: '✅ Completed' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '⏳ Pending' },
      'sick-leave': { bg: 'bg-orange-100', text: 'text-orange-800', label: '🏥 Sick Leave' },
      'personal-leave': { bg: 'bg-blue-100', text: 'text-blue-800', label: '🏠 Personal Leave' }
    };
    return colors[status] || colors.completed;
  };

  // Calculate statistics
  const stats = {
    totalHours: workingHours.reduce((sum, r) => sum + (r.hoursWorked || 0), 0).toFixed(1),
    avgHours: workingHours.length > 0 ? (workingHours.reduce((sum, r) => sum + (r.hoursWorked || 0), 0) / workingHours.length).toFixed(1) : 0,
    daysLogged: workingHours.length,
    completedDays: workingHours.filter(r => r.status === 'completed').length,
    leaveDays: workingHours.filter(r => r.status === 'sick-leave' || r.status === 'personal-leave').length
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Working Hours Tracking</h2>
      <p className="text-gray-600 text-sm mb-6">Your work-from-home hours and productivity logs</p>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your work logs...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg shadow p-5 border-t-4 border-blue-600">
              <p className="text-sm text-gray-600 font-medium">Total Hours</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalHours}</p>
              <p className="text-xs text-gray-500 mt-2">This month</p>
            </div>

            <div className="bg-white rounded-lg shadow p-5 border-t-4 border-green-600">
              <p className="text-sm text-gray-600 font-medium">Days Logged</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.daysLogged}</p>
              <p className="text-xs text-gray-500 mt-2">Work entries</p>
            </div>

            <div className="bg-white rounded-lg shadow p-5 border-t-4 border-purple-600">
              <p className="text-sm text-gray-600 font-medium">Avg Hours/Day</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{stats.avgHours}</p>
              <p className="text-xs text-gray-500 mt-2">Average daily</p>
            </div>

            <div className="bg-white rounded-lg shadow p-5 border-t-4 border-orange-600">
              <p className="text-sm text-gray-600 font-medium">Completed</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{stats.completedDays}</p>
              <p className="text-xs text-gray-500 mt-2">Full work days</p>
            </div>

            <div className="bg-white rounded-lg shadow p-5 border-t-4 border-red-600">
              <p className="text-sm text-gray-600 font-medium">Leave Days</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.leaveDays}</p>
              <p className="text-xs text-gray-500 mt-2">Sick/Personal</p>
            </div>
          </div>

          {/* Month Selector */}
          <div className="bg-white rounded-lg shadow p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">📅 Select Month</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Work Logs List */}
          {workingHours.length > 0 ? (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📋 Work Logs</h3>
              <div className="space-y-3">
                {workingHours.map((record) => {
                  const badge = getStatusColor(record.status);
                  return (
                    <div
                      key={record.id}
                      className={`p-4 rounded-lg border-l-4 transition ${badge.bg}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {new Date(record.date).toLocaleDateString('en-GB', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text}`}>
                            {record.hoursWorked} hrs
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">
                        <Clock size={14} className="inline mr-1" />
                        {record.workDescription}
                      </p>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                        <span className={`text-xs font-semibold ${badge.text}`}>
                          {badge.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-lg">
              <Clock size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg font-semibold">No work logs for this month</p>
              <p className="text-gray-400 mt-2">Log your working hours before login to get started</p>
            </div>
          )}

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-900 mb-2">💡 Tips for Logging Hours:</p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✓ Log your hours daily for accurate records</li>
              <li>✓ Include a brief description of work completed</li>
              <li>✓ Maintain 8 hours/day for standard full-time work</li>
              <li>✓ Mark leaves appropriately (Sick/Personal)</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
