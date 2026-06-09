import React, { useState, useEffect } from 'react';
import { Calendar, User, TrendingUp, BarChart3, Clock, Edit2, Trash2, X, Plus, AlertCircle, CheckCircle } from 'lucide-react';
import { db } from '../../config/firebase';
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  doc,
  addDoc
} from 'firebase/firestore';

export default function AttendanceManagement() {
  const [employees, setEmployees] = useState([]);
  const [workingHours, setWorkingHours] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().split('T')[0].slice(0, 7));
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editFormData, setEditFormData] = useState({
    hoursWorked: '',
    workDescription: '',
    status: 'completed'
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormData, setAddFormData] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    hoursWorked: '',
    workDescription: '',
    status: 'completed'
  });
  const [holidays, setHolidays] = useState([]);

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

      // Fetch working hours
      const hoursQuery = query(
        collection(db, 'workingHours'),
        where('companyId', '==', 'default')
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

      // Fetch holidays
      const holidayQuery = query(
        collection(db, 'holidays'),
        where('companyId', '==', 'default')
      );
      const holidaySnapshot = await getDocs(holidayQuery);
      const holidayDates = holidaySnapshot.docs.map(doc => doc.data().date);
      setHolidays(holidayDates);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (record) => {
    setEditingRecord(record);
    setEditFormData({
      hoursWorked: record.hoursWorked,
      workDescription: record.workDescription,
      status: record.status
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await updateDoc(doc(db, 'workingHours', editingRecord.id), {
        hoursWorked: parseFloat(editFormData.hoursWorked),
        workDescription: editFormData.workDescription,
        status: editFormData.status,
        updatedAt: new Date()
      });

      setSuccess('✅ Record updated successfully!');
      setShowEditModal(false);
      setTimeout(() => setSuccess(''), 3000);
      await fetchData();
    } catch (err) {
      console.error('Error updating record:', err);
      setError('❌ Error updating record. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (record) => {
    setDeleteConfirm(record);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await deleteDoc(doc(db, 'workingHours', deleteConfirm.id));
      setSuccess('✅ Record deleted successfully!');
      setDeleteConfirm(null);
      setTimeout(() => setSuccess(''), 3000);
      await fetchData();
    } catch (err) {
      console.error('Error deleting record:', err);
      setError('❌ Error deleting record. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLog = async () => {
    if (!addFormData.employeeId || !addFormData.hoursWorked || !addFormData.workDescription) {
      setError('❌ Please fill all fields');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const selectedEmployee = employees.find(emp => emp.id === addFormData.employeeId);

      // Check if log already exists for this date
      const existingQuery = query(
        collection(db, 'workingHours'),
        where('employeeId', '==', addFormData.employeeId),
        where('date', '==', addFormData.date)
      );
      const existingSnapshot = await getDocs(existingQuery);

      if (existingSnapshot.docs.length > 0) {
        setError('❌ A log already exists for this employee on this date');
        setLoading(false);
        return;
      }

      await addDoc(collection(db, 'workingHours'), {
        employeeId: addFormData.employeeId,
        email: selectedEmployee.email,
        name: selectedEmployee.name,
        date: addFormData.date,
        hoursWorked: parseFloat(addFormData.hoursWorked),
        workDescription: addFormData.workDescription,
        status: addFormData.status,
        addedByAdmin: true,
        createdAt: new Date(),
        companyId: 'default'
      });

      setSuccess('✅ Work log added successfully!');
      setShowAddForm(false);
      setAddFormData({
        employeeId: '',
        date: new Date().toISOString().split('T')[0],
        hoursWorked: '',
        workDescription: '',
        status: 'completed'
      });
      setTimeout(() => setSuccess(''), 3000);
      await fetchData();
    } catch (err) {
      console.error('Error adding log:', err);
      setError('❌ Error adding work log. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getEmployeeHoursStats = (empId) => {
    const records = workingHours.filter(r => r.employeeId === empId);
    const totalHours = records.reduce((sum, r) => sum + (r.hoursWorked || 0), 0);
    const daysLogged = records.length;
    const avgHours = daysLogged > 0 ? (totalHours / daysLogged).toFixed(1) : 0;

    return {
      totalHours: totalHours.toFixed(1),
      daysLogged,
      avgHours
    };
  };

  const isWeekend = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  };

  const getDaysInMonth = (monthStr) => {
    const [year, month] = monthStr.split('-');
    return new Date(year, parseInt(month), 0).getDate();
  };

  const getEmployeeAbsentDays = (empId) => {
    const absentDays = [];
    const daysInMonth = getDaysInMonth(selectedMonth);

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${selectedMonth}-${String(day).padStart(2, '0')}`;

      // Skip weekends
      if (isWeekend(dateStr)) continue;

      // Check if logged
      const hasLog = workingHours.some(log => log.employeeId === empId && log.date === dateStr);

      // Check if holiday
      const isHoliday = holidays.includes(dateStr);

      // If no log and no holiday, it's absent
      if (!hasLog && !isHoliday) {
        absentDays.push(dateStr);
      }
    }

    return absentDays;
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

  const sortedEmployees = employees.sort((a, b) => a.name.localeCompare(b.name));
  const overallStats = {
    totalHours: workingHours.reduce((sum, r) => sum + (r.hoursWorked || 0), 0).toFixed(1),
    avgHoursPerDay: workingHours.length > 0 ? (workingHours.reduce((sum, r) => sum + (r.hoursWorked || 0), 0) / workingHours.length).toFixed(1) : 0,
    totalEntries: workingHours.length
  };

  return (
    <div>
      {/* Messages */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Working Hours Tracking</h2>
          <p className="text-gray-600 text-sm mt-1">Monitor employee work-from-home hours and productivity</p>
        </div>
      </div>

      {/* Month Selection & Add Log Button */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">📅 Select Month</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
          >
            <Plus size={20} />
            Add Log
          </button>
        </div>
      </div>

      {/* Overall Statistics */}
      {!loading && workingHours.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <p className="text-gray-600 text-sm font-medium">Total Employees</p>
            <p className="text-3xl font-bold text-blue-600">{sortedEmployees.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <p className="text-gray-600 text-sm font-medium">Total Hours Logged</p>
            <p className="text-3xl font-bold text-green-600">{overallStats.totalHours}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
            <p className="text-gray-600 text-sm font-medium">Avg Hours/Day</p>
            <p className="text-3xl font-bold text-purple-600">{overallStats.avgHoursPerDay}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
            <p className="text-gray-600 text-sm font-medium">Total Entries</p>
            <p className="text-3xl font-bold text-orange-600">{overallStats.totalEntries}</p>
          </div>
        </div>
      )}

      {/* Employee Hours Summary Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading working hours data...</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow mb-8">
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Employee Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Designation</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Days Logged</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Total Hours</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Avg Hours/Day</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Absent Days</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Performance</th>
              </tr>
            </thead>
            <tbody>
              {sortedEmployees.map((employee) => {
                const stats = getEmployeeHoursStats(employee.id);
                const avgHours = parseFloat(stats.avgHours);
                let performanceColor = 'bg-red-100 text-red-800'; // Low
                if (avgHours >= 8) performanceColor = 'bg-green-100 text-green-800'; // Good
                else if (avgHours >= 6) performanceColor = 'bg-yellow-100 text-yellow-800'; // Average

                return (
                  <tr key={employee.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{employee.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{employee.position}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                        {stats.daysLogged}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-semibold text-gray-900">{stats.totalHours} hrs</td>
                    <td className="px-6 py-4 text-center text-sm font-semibold text-gray-900">{stats.avgHours} hrs</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                        {getEmployeeAbsentDays(employee.id).length}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${performanceColor}`}>
                        {avgHours >= 8 ? '⭐ Excellent' : avgHours >= 6 ? '👍 Good' : '⚠️ Low'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {sortedEmployees.length === 0 && (
            <div className="text-center py-12">
              <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 font-medium">No employees found</p>
            </div>
          )}
        </div>
      )}

      {/* Detailed Records */}
      {!loading && workingHours.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">📋 Detailed Work Logs</h3>
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Employee</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Date</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Hours Worked</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Work Description</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {workingHours.map((record) => {
                  const badge = getStatusColor(record.status);
                  return (
                    <tr key={record.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{record.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(record.date).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-block px-3 py-1 rounded-full text-sm font-bold bg-blue-100 text-blue-800">
                          {record.hoursWorked} hrs
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <p className="line-clamp-2">{record.workDescription}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditClick(record)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                            title="Edit record"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(record)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                            title="Delete record"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && workingHours.length === 0 && (
        <div className="text-center py-16 bg-white rounded-lg">
          <Clock size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg font-semibold">No working hours logged for this month</p>
          <p className="text-gray-400 mt-2">Employees can log their hours in their portal</p>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Edit Work Log</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Employee</label>
                <p className="text-gray-900 font-medium">{editingRecord.name}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                <p className="text-gray-900 font-medium">
                  {new Date(editingRecord.date).toLocaleDateString('en-GB')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Hours Worked</label>
                <input
                  type="number"
                  step="0.5"
                  value={editFormData.hoursWorked}
                  onChange={(e) => setEditFormData({...editFormData, hoursWorked: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Work Description</label>
                <textarea
                  value={editFormData.workDescription}
                  onChange={(e) => setEditFormData({...editFormData, workDescription: e.target.value})}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="completed">✅ Completed</option>
                  <option value="pending">⏳ Pending</option>
                  <option value="sick-leave">🏥 Sick Leave</option>
                  <option value="personal-leave">🏠 Personal Leave</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleSaveEdit}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Delete Work Log?</h3>
            <p className="text-gray-600 mb-2">
              Are you sure you want to delete this work log for <strong>{deleteConfirm.name}</strong> on{' '}
              <strong>{new Date(deleteConfirm.date).toLocaleDateString('en-GB')}</strong>?
            </p>
            <p className="text-gray-500 text-sm mb-6">This action cannot be undone.</p>

            <div className="flex gap-2">
              <button
                onClick={handleConfirmDelete}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold py-2 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Work Log Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Add Work Log</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Employee</label>
                <select
                  value={addFormData.employeeId}
                  onChange={(e) => setAddFormData({...addFormData, employeeId: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.position})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={addFormData.date}
                  onChange={(e) => setAddFormData({...addFormData, date: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Hours Worked</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={addFormData.hoursWorked}
                  onChange={(e) => setAddFormData({...addFormData, hoursWorked: e.target.value})}
                  placeholder="e.g., 8.5"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Work Description</label>
                <textarea
                  value={addFormData.workDescription}
                  onChange={(e) => setAddFormData({...addFormData, workDescription: e.target.value})}
                  placeholder="Brief description of work done"
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  value={addFormData.status}
                  onChange={(e) => setAddFormData({...addFormData, status: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="completed">✅ Completed</option>
                  <option value="pending">⏳ Pending</option>
                  <option value="sick-leave">🏥 Sick Leave</option>
                  <option value="personal-leave">🏠 Personal Leave</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleAddLog}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Log'}
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
