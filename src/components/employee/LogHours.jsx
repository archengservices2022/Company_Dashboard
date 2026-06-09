import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebase';
import { collection, addDoc, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function LogHours() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [employeeData, setEmployeeData] = useState(null);
  const [workLogs, setWorkLogs] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().split('T')[0].slice(0, 7));

  const today = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    date: today,
    hoursWorked: '',
    workDescription: '',
    status: 'completed'
  });

  useEffect(() => {
    if (user) {
      fetchEmployeeData();
    }
  }, [user, selectedMonth]);

  const fetchEmployeeData = async () => {
    try {
      const empQuery = query(
        collection(db, 'employees'),
        where('email', '==', user.email)
      );
      const empSnapshot = await getDocs(empQuery);

      if (empSnapshot.docs.length > 0) {
        const emp = empSnapshot.docs[0];
        setEmployeeData({ id: emp.id, ...emp.data() });

        // Fetch work logs
        const logsQuery = query(
          collection(db, 'workingHours'),
          where('employeeId', '==', emp.id)
        );
        const logsSnapshot = await getDocs(logsQuery);
        const allLogs = logsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Filter by month
        const filteredLogs = allLogs.filter(l => {
          const lMonth = l.date.slice(0, 7);
          return lMonth === selectedMonth;
        }).sort((a, b) => new Date(b.date) - new Date(a.date));

        setWorkLogs(filteredLogs);
      }
    } catch (error) {
      console.error('Error fetching employee data:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!employeeData) {
        setError('❌ Employee data not found');
        setLoading(false);
        return;
      }

      // Check if entry for this date already exists
      const existingQuery = query(
        collection(db, 'workingHours'),
        where('employeeId', '==', employeeData.id),
        where('date', '==', formData.date)
      );
      const existingSnapshot = await getDocs(existingQuery);

      if (existingSnapshot.docs.length > 0) {
        setError('⚠️ Work hours for today have already been logged. You can log tomorrow\'s hours starting tomorrow. For any corrections, please contact your administrator.');
        setLoading(false);
        return;
      }

      // Save working hours
      await addDoc(collection(db, 'workingHours'), {
        employeeId: employeeData.id,
        email: employeeData.email,
        name: employeeData.name,
        date: formData.date,
        hoursWorked: parseFloat(formData.hoursWorked),
        workDescription: formData.workDescription,
        status: formData.status,
        createdAt: new Date(),
        companyId: 'default'
      });

      setSuccess('✅ Working hours logged successfully!');

      // Clear form
      setFormData({
        date: today,
        hoursWorked: '',
        workDescription: '',
        status: 'completed'
      });

      // Refresh logs
      await fetchEmployeeData();

      // Clear message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error logging hours:', err);
      setError('❌ Error saving working hours. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: '✅ Completed' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '⏳ Pending' },
      'sick-leave': { bg: 'bg-orange-100', text: 'text-orange-800', label: '🏥 Sick Leave' },
      'personal-leave': { bg: 'bg-blue-100', text: 'text-blue-800', label: '🏠 Personal Leave' }
    };
    return badges[status] || badges.completed;
  };

  const monthStats = {
    totalHours: workLogs.reduce((sum, log) => sum + (log.hoursWorked || 0), 0).toFixed(1),
    daysLogged: workLogs.length,
    avgHours: workLogs.length > 0 ? (workLogs.reduce((sum, log) => sum + (log.hoursWorked || 0), 0) / workLogs.length).toFixed(1) : 0
  };

  const todayLogExists = workLogs.some(log => log.date === today);

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Log Working Hours</h2>
        <p className="text-gray-600 text-sm">Track your daily work hours and productivity</p>
      </div>

      {/* Statistics */}
      {workLogs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <p className="text-gray-600 text-sm font-medium">Total Hours</p>
            <p className="text-3xl font-bold text-blue-600">{monthStats.totalHours}</p>
            <p className="text-xs text-gray-500 mt-1">This month</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <p className="text-gray-600 text-sm font-medium">Days Logged</p>
            <p className="text-3xl font-bold text-green-600">{monthStats.daysLogged}</p>
            <p className="text-xs text-gray-500 mt-1">Work entries</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
            <p className="text-gray-600 text-sm font-medium">Avg Hours/Day</p>
            <p className="text-3xl font-bold text-purple-600">{monthStats.avgHours}</p>
            <p className="text-xs text-gray-500 mt-1">Average daily</p>
          </div>
        </div>
      )}

      {/* Log Hours Form */}
      <div className={`p-6 rounded-lg mb-6 border-2 shadow-md ${
        todayLogExists
          ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
          : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'
      }`}>
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">📝 Log Today's Hours</h3>
          {todayLogExists && (
            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1">
              ✅ Logged Today
            </span>
          )}
        </div>

        {todayLogExists ? (
          <div className="bg-white rounded-lg p-6 border border-green-200">
            <div className="flex items-start gap-4">
              <div className="text-green-600 text-3xl">✅</div>
              <div className="flex-1">
                <p className="text-gray-900 font-bold mb-2">Work Hours Already Logged for Today</p>
                <p className="text-gray-600 text-sm mb-4">
                  You have successfully logged your work hours for today. Your hours will be recorded and visible in your monthly report.
                </p>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200 mb-4">
                  <p className="text-gray-700 font-medium text-sm mb-2">What's Next?</p>
                  <ul className="text-gray-600 text-xs space-y-1 list-disc list-inside">
                    <li>Come back tomorrow to log tomorrow's work hours</li>
                    <li>View your work logs below to track your hours</li>
                    <li>Contact your administrator if you need to make corrections</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">📅 Work Date</label>
              <div className="px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 font-medium">
                Today: {new Date(today).toLocaleDateString('en-GB', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
              <p className="text-xs text-gray-500 mt-2">You can only log hours for today</p>
            </div>

            {/* Hours Worked */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">⏱️ Hours Worked</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={formData.hoursWorked}
                  onChange={(e) => setFormData({ ...formData, hoursWorked: e.target.value })}
                  placeholder="e.g., 8.5"
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <span className="flex items-center px-4 py-2.5 bg-white rounded-lg text-sm font-semibold text-gray-700 border border-gray-300">
                  hours
                </span>
              </div>
            </div>
          </div>

          {/* Work Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">📝 Work Description</label>
            <textarea
              value={formData.workDescription}
              onChange={(e) => setFormData({ ...formData, workDescription: e.target.value })}
              placeholder="Brief description of work done (e.g., Completed dashboard design, Fixed bugs, Attended meetings)"
              rows="3"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">✓ Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="completed">✅ Completed</option>
              <option value="pending">⏳ Pending</option>
              <option value="sick-leave">🏥 Sick Leave</option>
              <option value="personal-leave">🏠 Personal Leave</option>
            </select>
          </div>

          {/* Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex gap-2">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex gap-2">
              <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition duration-200 disabled:opacity-50 shadow-md"
            >
              {loading ? '⏳ Saving...' : '✅ Log Hours'}
            </button>
          </form>
        )}
      </div>

      {/* Month Selector */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow border border-gray-200">
        <label className="block text-sm font-semibold text-gray-700 mb-2">📅 View Month</label>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Work Logs List */}
      {workLogs.length > 0 ? (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">📋 Work Logs - {selectedMonth}</h3>
          <div className="space-y-3">
            {workLogs.map((log) => {
              const badge = getStatusBadge(log.status);
              return (
                <div
                  key={log.id}
                  className={`p-4 rounded-lg border-l-4 transition ${badge.bg}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {new Date(log.date).toLocaleDateString('en-GB', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text}`}>
                      {log.hoursWorked} hrs
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{log.workDescription}</p>
                  <div className="flex justify-end">
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
        <div className="text-center py-12 bg-white rounded-lg">
          <Clock size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg font-semibold">No work logs for this month</p>
          <p className="text-gray-400">Start logging your daily working hours above</p>
        </div>
      )}

      {/* Tips */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm font-semibold text-blue-900 mb-2">💡 Tips:</p>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✓ Log your hours daily for accurate records</li>
          <li>✓ Include a brief description of work completed</li>
          <li>✓ Maintain 8 hours/day for standard full-time work</li>
          <li>✓ Mark leaves appropriately (Sick/Personal)</li>
        </ul>
      </div>
    </div>
  );
}
