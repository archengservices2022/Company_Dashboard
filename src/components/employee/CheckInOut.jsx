import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebase';
import { collection, addDoc, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { LogIn, LogOut, CheckCircle, Clock, AlertCircle, Calendar } from 'lucide-react';

export default function CheckInOut() {
  const { user } = useAuth();
  const [employeeData, setEmployeeData] = useState(null);
  const [checkInTime, setCheckInTime] = useState(null);
  const [checkOutTime, setCheckOutTime] = useState(null);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [dailyLogs, setDailyLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().split('T')[0].slice(0, 7));

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

        // Check if already checked in today
        const today = new Date().toISOString().split('T')[0];
        const logsQuery = query(
          collection(db, 'checkInOut'),
          where('employeeId', '==', emp.id),
          where('date', '==', today)
        );
        const logsSnapshot = await getDocs(logsQuery);

        if (logsSnapshot.docs.length > 0) {
          const log = logsSnapshot.docs[0].data();
          setCheckInTime(log.checkInTime);
          setCheckOutTime(log.checkOutTime || null);
          setHasCheckedIn(true);
        }

        // Fetch monthly logs
        const monthlyQuery = query(
          collection(db, 'checkInOut'),
          where('employeeId', '==', emp.id)
        );
        const monthlySnapshot = await getDocs(monthlyQuery);
        const allLogs = monthlySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const filteredLogs = allLogs.filter(l => {
          const lMonth = l.date.slice(0, 7);
          return lMonth === selectedMonth;
        }).sort((a, b) => new Date(b.date) - new Date(a.date));

        setDailyLogs(filteredLogs);
      }
    } catch (error) {
      console.error('Error fetching employee data:', error);
    }
  };

  const handleCheckIn = async () => {
    if (!employeeData) {
      setError('Employee data not found');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      const today = new Date().toISOString().split('T')[0];

      // Check if already checked in
      const existingQuery = query(
        collection(db, 'checkInOut'),
        where('employeeId', '==', employeeData.id),
        where('date', '==', today)
      );
      const existingSnapshot = await getDocs(existingQuery);

      if (existingSnapshot.docs.length > 0) {
        setError('You have already checked in today');
        setLoading(false);
        return;
      }

      // Add check-in record
      await addDoc(collection(db, 'checkInOut'), {
        employeeId: employeeData.id,
        email: employeeData.email,
        name: employeeData.name,
        date: today,
        checkInTime: timeString,
        checkOutTime: null,
        status: 'pending',
        approvedBy: null,
        approvalTime: null,
        companyId: 'default',
        createdAt: now
      });

      setCheckInTime(timeString);
      setHasCheckedIn(true);
      setSuccess(`✅ Checked in at ${timeString}`);

      setTimeout(() => setSuccess(''), 3000);
      await fetchEmployeeData();
    } catch (err) {
      console.error('Error checking in:', err);
      setError('❌ Error checking in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!employeeData || !hasCheckedIn) {
      setError('Please check in first');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      const today = new Date().toISOString().split('T')[0];

      // Find today's check-in record
      const logsQuery = query(
        collection(db, 'checkInOut'),
        where('employeeId', '==', employeeData.id),
        where('date', '==', today)
      );
      const logsSnapshot = await getDocs(logsQuery);

      if (logsSnapshot.docs.length === 0) {
        setError('No check-in found for today');
        setLoading(false);
        return;
      }

      // Update with check-out time
      await updateDoc(
        doc(db, 'checkInOut', logsSnapshot.docs[0].id),
        {
          checkOutTime: timeString,
          updatedAt: now
        }
      );

      setCheckOutTime(timeString);
      setSuccess(`✅ Checked out at ${timeString}`);

      setTimeout(() => setSuccess(''), 3000);
      await fetchEmployeeData();
    } catch (err) {
      console.error('Error checking out:', err);
      setError('❌ Error checking out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '⏳ Pending Approval' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: '✅ Approved' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: '❌ Rejected' }
    };
    return badges[status] || badges.pending;
  };

  const calculateWorkHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return '—';

    const parseTime = (timeStr) => {
      const [time, period] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };

    const checkInMinutes = parseTime(checkIn);
    const checkOutMinutes = parseTime(checkOut);
    const diffMinutes = checkOutMinutes - checkInMinutes;
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;

    return `${hours}h ${mins}m`;
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Check In/Out</h2>
        <p className="text-gray-600 text-sm">Track your daily check-in and check-out times</p>
      </div>

      {/* Check In/Out Buttons */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
        <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
          <div className="flex-1 max-w-sm">
            <div className="text-center">
              <p className="text-gray-600 text-sm font-medium mb-4">Check In Time</p>
              <div className="text-4xl font-bold text-blue-600 mb-6">
                {checkInTime || '—'}
              </div>
              <button
                onClick={handleCheckIn}
                disabled={hasCheckedIn || loading}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold transition duration-200 ${
                  hasCheckedIn || checkInTime
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <LogIn size={20} />
                {checkInTime ? 'Checked In' : 'Check In Now'}
              </button>
            </div>
          </div>

          <div className="hidden md:flex w-0.5 h-32 bg-gray-200"></div>

          <div className="flex-1 max-w-sm">
            <div className="text-center">
              <p className="text-gray-600 text-sm font-medium mb-4">Check Out Time</p>
              <div className="text-4xl font-bold text-emerald-600 mb-6">
                {checkOutTime || '—'}
              </div>
              <button
                onClick={handleCheckOut}
                disabled={!hasCheckedIn || checkOutTime || loading}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold transition duration-200 ${
                  !hasCheckedIn || checkOutTime
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                <LogOut size={20} />
                {checkOutTime ? 'Checked Out' : 'Check Out Now'}
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex gap-2">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex gap-2">
            <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}
      </div>

      {/* Daily Stats */}
      {checkInTime && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-gray-600 text-xs font-medium uppercase">Check In</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">{checkInTime}</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
              <p className="text-gray-600 text-xs font-medium uppercase">Check Out</p>
              <p className="text-2xl font-bold text-emerald-600 mt-2">{checkOutTime || 'Not checked out'}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <p className="text-gray-600 text-xs font-medium uppercase">Work Hours</p>
              <p className="text-2xl font-bold text-purple-600 mt-2">{calculateWorkHours(checkInTime, checkOutTime)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Month Selector */}
      <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200">
        <label className="block text-sm font-semibold text-gray-700 mb-2">View Month</label>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Daily Log History */}
      {dailyLogs.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Calendar size={20} />
              Daily Logs - {selectedMonth}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Check In</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Check Out</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {dailyLogs.map((log) => {
                  const badge = getStatusBadge(log.status);
                  return (
                    <tr key={log.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {new Date(log.date).toLocaleDateString('en-GB', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{log.checkInTime}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{log.checkOutTime || '—'}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {calculateWorkHours(log.checkInTime, log.checkOutTime)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Clock size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg font-semibold">No check-in logs for this month</p>
        </div>
      )}
    </div>
  );
}
