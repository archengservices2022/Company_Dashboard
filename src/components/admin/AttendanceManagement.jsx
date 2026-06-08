import React, { useState, useEffect } from 'react';
import { Plus, Calendar, User, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { db } from '../../config/firebase';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  updateDoc
} from 'firebase/firestore';

export default function AttendanceManagement() {
  const [employees, setEmployees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().split('T')[0].slice(0, 7));
  const [formData, setFormData] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    remarks: ''
  });

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch employees
      const empQuery = query(collection(db, 'employees'), where('companyId', '==', 'default'));
      const empSnapshot = await getDocs(empQuery);
      const empData = empSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEmployees(empData);

      // Fetch attendance for selected month
      const attQuery = query(
        collection(db, 'attendance'),
        where('companyId', '==', 'default'),
        where('month', '==', selectedMonth)
      );
      const attSnapshot = await getDocs(attQuery);
      const attData = attSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAttendanceRecords(attData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const monthValue = formData.date.slice(0, 7);

      await addDoc(collection(db, 'attendance'), {
        ...formData,
        month: monthValue,
        companyId: 'default',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      setFormData({
        employeeId: '',
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        remarks: ''
      });
      setShowForm(false);
      fetchData();
    } catch (error) {
      console.error('Error saving attendance:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this attendance record?')) {
      try {
        await deleteDoc(doc(db, 'attendance', id));
        fetchData();
      } catch (error) {
        console.error('Error deleting record:', error);
      }
    }
  };

  // Calculate statistics
  const getMonthStats = (empId) => {
    const records = attendanceRecords.filter(r => r.employeeId === empId);
    const presentDays = records.filter(r => r.status === 'present').length;
    const halfDayDays = records.filter(r => r.status === 'halfday').length;
    const absenceDays = records.filter(r => r.status === 'absent').length;
    const leaveDays = records.filter(r => r.status === 'leave').length;
    const workingDays = workingDaysInMonth(selectedMonth);
    const totalMarked = records.length;
    const attendancePercentage = totalMarked > 0 ? Math.round(((presentDays + (halfDayDays * 0.5)) / workingDays) * 100) : 0;

    return {
      workingDays: workingDays,
      total: totalMarked,
      present: presentDays,
      halfDay: halfDayDays,
      absence: absenceDays,
      leave: leaveDays,
      percentage: attendancePercentage
    };
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Leave & Attendance</h2>
          <p className="text-gray-600 text-sm mt-1">Manage employee attendance and leave records</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition font-semibold shadow-md"
        >
          <Plus size={20} />
          Mark Attendance
        </button>
      </div>

      {/* Month & Year Selection */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Select Month & Year</label>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-600 mt-2">Working Days in {selectedMonth}: <strong>{workingDaysInMonth(selectedMonth)}</strong></p>
      </div>

      {/* Add Attendance Form */}
      {showForm && (
        <div className="bg-blue-50 p-6 rounded-lg mb-6 border-2 border-blue-200 shadow-md">
          <h3 className="text-xl font-bold text-gray-900 mb-4">📅 Mark Attendance</h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>

              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />

              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="present">✅ Present</option>
                <option value="absent">❌ Absence</option>
                <option value="leave">🏠 Approved Leave</option>
                <option value="halfday">⏰ Half Day Work</option>
              </select>

              <input
                type="text"
                placeholder="Remarks (optional)"
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition font-semibold"
              >
                ✅ Mark Attendance
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-2 rounded-lg transition font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Employee Attendance Summary */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {employees.length > 0 ? (
            employees.map((employee) => {
              const stats = getMonthStats(employee.id);
              const empRecords = attendanceRecords.filter(r => r.employeeId === employee.id);

              return (
                <div key={employee.id} className="bg-white rounded-lg shadow hover:shadow-lg transition">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-t-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <User size={24} />
                        <div>
                          <h3 className="text-lg font-bold">{employee.name}</h3>
                          <p className="text-blue-100">{employee.position}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold">{stats.percentage}%</p>
                        <p className="text-blue-100 text-sm">Attendance</p>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-5 gap-2 p-4 border-b border-gray-200">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{stats.workingDays}</p>
                      <p className="text-xs text-gray-600">Working Days</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{stats.present}</p>
                      <p className="text-xs text-gray-600">Present</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{stats.absence}</p>
                      <p className="text-xs text-gray-600">Absence</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-600">{stats.leave}</p>
                      <p className="text-xs text-gray-600">Approved Leave</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{stats.percentage}%</p>
                      <p className="text-xs text-gray-600">Attendance %</p>
                    </div>
                  </div>

                  {/* Records */}
                  {empRecords.length > 0 && (
                    <div className="p-4">
                      <p className="text-sm font-semibold text-gray-700 mb-3">📋 Recent Records</p>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {empRecords.slice(-5).map((record) => (
                          <div key={record.id} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                            <div>
                              <span className="font-medium">{new Date(record.date).toLocaleDateString()}</span>
                              <span className="text-gray-600 ml-2">
                                {record.status === 'present' && '✅ Present'}
                                {record.status === 'absent' && '❌ Absence'}
                                {record.status === 'leave' && '🏠 Approved Leave'}
                                {record.status === 'halfday' && '⏰ Half Day Work'}
                              </span>
                            </div>
                            <button
                              onClick={() => handleDelete(record.id)}
                              className="text-red-600 hover:text-red-800 text-xs"
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 bg-white rounded-lg">
              <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No employees found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
