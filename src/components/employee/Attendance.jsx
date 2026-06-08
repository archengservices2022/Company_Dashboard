import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebase';
import {
  collection,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { Calendar } from 'lucide-react';

export default function Attendance() {
  const { user } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [employeeData, setEmployeeData] = useState(null);
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
      const empQuery = query(
        collection(db, 'employees'),
        where('email', '==', user.email)
      );
      const empSnapshot = await getDocs(empQuery);
      if (empSnapshot.docs.length > 0) {
        const emp = empSnapshot.docs[0];
        setEmployeeData({ id: emp.id, ...emp.data() });

        const attQuery = query(
          collection(db, 'attendance'),
          where('employeeId', '==', emp.id),
          where('month', '==', selectedMonth)
        );
        const attSnapshot = await getDocs(attQuery);
        const records = attSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAttendanceRecords(records);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'absent':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'leave':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'halfday':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'present':
        return '✅ Present';
      case 'absent':
        return '❌ Absence';
      case 'leave':
        return '🏠 Approved Leave';
      case 'halfday':
        return '⏰ Half Day Work';
      default:
        return status;
    }
  };

  const workingDaysInMonth = (month) => {
    const [year, monthNum] = month.split('-');
    const firstDay = new Date(year, monthNum - 1, 1);
    const lastDay = new Date(year, monthNum, 0);
    let workDays = 0;

    for (let day = firstDay; day <= lastDay; day.setDate(day.getDate() + 1)) {
      const dayOfWeek = new Date(day).getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workDays++;
      }
    }
    return workDays;
  };

  const getStatistics = () => {
    const present = attendanceRecords.filter(r => r.status === 'present').length;
    const absence = attendanceRecords.filter(r => r.status === 'absent').length;
    const leave = attendanceRecords.filter(r => r.status === 'leave').length;
    const halfday = attendanceRecords.filter(r => r.status === 'halfday').length;
    const workDays = workingDaysInMonth(selectedMonth);
    const attendancePercentage = workDays > 0 ? Math.round(((present + (halfday * 0.5)) / workDays) * 100) : 0;

    return { present, absence, leave, halfday, workDays, percentage: attendancePercentage };
  };

  const stats = getStatistics();

  const getDaysInMonth = (month) => {
    const [year, monthNum] = month.split('-');
    return new Date(year, monthNum, 0).getDate();
  };

  const getFirstDayOfMonth = (month) => {
    const [year, monthNum] = month.split('-');
    return new Date(year, monthNum - 1, 1).getDay();
  };

  const recordsByDate = {};
  attendanceRecords.forEach(record => {
    recordsByDate[record.date] = record;
  });

  const calendarDays = [];
  const daysInMonth = getDaysInMonth(selectedMonth);
  const firstDay = getFirstDayOfMonth(selectedMonth);

  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Leave & Attendance</h2>
      <p className="text-gray-600 text-sm mb-6">Your monthly attendance and leave records</p>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading attendance data...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg shadow p-5 border-t-4 border-blue-600">
              <p className="text-sm text-gray-600 font-medium">Working Days</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.workDays}</p>
              <p className="text-xs text-gray-500 mt-2">Total in month</p>
            </div>

            <div className="bg-white rounded-lg shadow p-5 border-t-4 border-green-600">
              <p className="text-sm text-gray-600 font-medium">Present</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.present}</p>
              <p className="text-xs text-gray-500 mt-2">Days present</p>
            </div>

            <div className="bg-white rounded-lg shadow p-5 border-t-4 border-red-600">
              <p className="text-sm text-gray-600 font-medium">Absence</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.absence}</p>
              <p className="text-xs text-gray-500 mt-2">Days absent</p>
            </div>

            <div className="bg-white rounded-lg shadow p-5 border-t-4 border-yellow-600">
              <p className="text-sm text-gray-600 font-medium">Approved Leave</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.leave}</p>
              <p className="text-xs text-gray-500 mt-2">Days on leave</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow p-5 text-white">
              <p className="text-sm font-medium">Attendance %</p>
              <p className="text-3xl font-bold mt-2">{stats.percentage}%</p>
              <p className="text-xs mt-2">Overall percentage</p>
            </div>
          </div>

          {/* Month Selector */}
          <div className="bg-white rounded-lg shadow p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Select Month & Year</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Calendar View */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📅 Attendance Calendar</h3>

            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center font-semibold text-gray-600 py-2 text-sm">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="h-16"></div>;
                }

                const dateStr = `${selectedMonth}-${String(day).padStart(2, '0')}`;
                const record = recordsByDate[dateStr];
                const dayOfWeek = new Date(`${selectedMonth}-${String(day).padStart(2, '0')}`).getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                return (
                  <div
                    key={day}
                    className={`h-20 p-2 rounded-lg border-2 transition flex flex-col justify-between ${
                      isWeekend && !record
                        ? 'bg-gray-50 border-gray-200'
                        : record
                        ? `border-2 ${getStatusColor(record.status)}`
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="text-sm font-bold text-gray-900">{day}</div>
                    {record && (
                      <div className="text-xs font-semibold text-center">
                        {getStatusLabel(record.status).split(' ')[0]}
                      </div>
                    )}
                    {isWeekend && !record && (
                      <div className="text-xs text-gray-400 text-center">Weekend</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Records List */}
          {attendanceRecords.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📋 Detailed Records</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {attendanceRecords
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((record) => (
                    <div
                      key={record.id}
                      className={`flex justify-between items-center p-4 rounded-lg border-l-4 ${getStatusColor(record.status)}`}
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {new Date(record.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                        {record.remarks && (
                          <p className="text-sm text-gray-600 mt-1">💬 {record.remarks}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{getStatusLabel(record.status)}</p>
                      </div>
                    </div>
                  ))}
              </div>

              {attendanceRecords.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Calendar size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No attendance records for this month</p>
                </div>
              )}
            </div>
          )}

          {/* Legend */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h4 className="font-bold text-gray-900 mb-4">📌 Attendance Legend</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 rounded bg-green-200 border border-green-400"></span>
                <span>Present</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 rounded bg-red-200 border border-red-400"></span>
                <span>Absence</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 rounded bg-yellow-200 border border-yellow-400"></span>
                <span>Approved Leave</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 rounded bg-blue-200 border border-blue-400"></span>
                <span>Half Day Work</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
