import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, getDocs, query, where, setDoc, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Calendar, Users, Settings, Plus, X, Edit2, Trash2, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';

export default function ProfessionalAttendance() {
  const [activeTab, setActiveTab] = useState('working-rules');
  const [workingConfig, setWorkingConfig] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [workingHours, setWorkingHours] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().split('T')[0].slice(0, 7));
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Form states
  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [holidayForm, setHolidayForm] = useState({ name: '', date: '', type: 'public' });
  const [leaveForm, setLeaveForm] = useState({ employeeId: '', startDate: '', endDate: '', type: 'casual', reason: '' });
  const [editingHoliday, setEditingHoliday] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, [selectedMonth]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch working config
      const configQuery = query(collection(db, 'workingDaysConfig'), where('companyId', '==', 'default'));
      const configSnapshot = await getDocs(configQuery);
      if (configSnapshot.docs.length > 0) {
        setWorkingConfig(configSnapshot.docs[0].data());
      } else {
        const defaultConfig = {
          companyId: 'default',
          monday: { isWorkingDay: true, hours: 8 },
          tuesday: { isWorkingDay: true, hours: 8 },
          wednesday: { isWorkingDay: true, hours: 8 },
          thursday: { isWorkingDay: true, hours: 8 },
          friday: { isWorkingDay: true, hours: 8 },
          saturday: { isWorkingDay: true, hours: 4 },
          sunday: { isWorkingDay: false, hours: 0 },
          createdAt: new Date()
        };
        setWorkingConfig(defaultConfig);
        await setDoc(doc(db, 'workingDaysConfig', 'default'), defaultConfig);
      }

      // Fetch holidays
      const holidayQuery = query(collection(db, 'holidays'), where('companyId', '==', 'default'));
      const holidaySnapshot = await getDocs(holidayQuery);
      setHolidays(holidaySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch leaves
      const leaveQuery = query(collection(db, 'leaves'), where('companyId', '==', 'default'));
      const leaveSnapshot = await getDocs(leaveQuery);
      setLeaves(leaveSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch employees
      const empQuery = query(collection(db, 'employees'), where('companyId', '==', 'default'));
      const empSnapshot = await getDocs(empQuery);
      setEmployees(empSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch working hours
      const hoursQuery = query(collection(db, 'workingHours'), where('companyId', '==', 'default'));
      const hoursSnapshot = await getDocs(hoursQuery);
      const filteredHours = hoursSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(h => h.date.slice(0, 7) === selectedMonth);
      setWorkingHours(filteredHours);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const updateWorkingConfig = async (day, isWorkingDay, hours) => {
    try {
      const updatedConfig = {
        ...workingConfig,
        [day]: { isWorkingDay, hours }
      };
      await setDoc(doc(db, 'workingDaysConfig', 'default'), updatedConfig);
      setWorkingConfig(updatedConfig);
      setSuccess('✅ Working rules updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error updating working rules');
    }
  };

  const addHoliday = async () => {
    if (!holidayForm.name || !holidayForm.date) {
      setError('Please fill all fields');
      return;
    }

    try {
      if (editingHoliday) {
        await updateDoc(doc(db, 'holidays', editingHoliday.id), {
          name: holidayForm.name,
          date: holidayForm.date,
          type: holidayForm.type,
          updatedAt: new Date()
        });
        setSuccess('✅ Holiday updated!');
      } else {
        await addDoc(collection(db, 'holidays'), {
          name: holidayForm.name,
          date: holidayForm.date,
          type: holidayForm.type,
          companyId: 'default',
          createdAt: new Date()
        });
        setSuccess('✅ Holiday added!');
      }

      setHolidayForm({ name: '', date: '', type: 'public' });
      setEditingHoliday(null);
      setShowHolidayForm(false);
      setTimeout(() => setSuccess(''), 3000);
      await fetchAllData();
    } catch (err) {
      setError('Error adding holiday');
    }
  };

  const deleteHoliday = async (id) => {
    if (window.confirm('Delete this holiday?')) {
      try {
        await deleteDoc(doc(db, 'holidays', id));
        setSuccess('✅ Holiday deleted!');
        setTimeout(() => setSuccess(''), 3000);
        await fetchAllData();
      } catch (err) {
        setError('Error deleting holiday');
      }
    }
  };

  const addLeave = async () => {
    if (!leaveForm.employeeId || !leaveForm.startDate || !leaveForm.endDate) {
      setError('Please fill all fields');
      return;
    }

    try {
      const employee = employees.find(e => e.id === leaveForm.employeeId);
      await addDoc(collection(db, 'leaves'), {
        employeeId: leaveForm.employeeId,
        employeeName: employee.name,
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
        type: leaveForm.type,
        reason: leaveForm.reason,
        status: 'approved',
        companyId: 'default',
        createdAt: new Date()
      });

      setSuccess('✅ Leave approved!');
      setLeaveForm({ employeeId: '', startDate: '', endDate: '', type: 'casual', reason: '' });
      setShowLeaveForm(false);
      setTimeout(() => setSuccess(''), 3000);
      await fetchAllData();
    } catch (err) {
      setError('Error adding leave');
    }
  };

  const getDayOfWeek = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  };

  const getExpectedHours = (dateString) => {
    if (!workingConfig) return 0;
    const dayOfWeek = getDayOfWeek(dateString);
    const dayConfig = workingConfig[dayOfWeek];
    return dayConfig && dayConfig.isWorkingDay ? dayConfig.hours : 0;
  };

  const isDateHoliday = (dateString) => {
    return holidays.some(h => h.date === dateString);
  };

  const calculateMonthlyMetrics = () => {
    const daysInMonth = new Date(selectedMonth.split('-')[0], parseInt(selectedMonth.split('-')[1]), 0).getDate();
    let totalExpectedHours = 0;
    let workingDays = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${selectedMonth}-${String(day).padStart(2, '0')}`;
      const expectedHours = getExpectedHours(dateStr);
      const isHoliday = isDateHoliday(dateStr);

      if (!isHoliday && expectedHours > 0) {
        workingDays++;
        totalExpectedHours += expectedHours;
      }
    }

    return { workingDays, totalExpectedHours };
  };

  const getEmployeeMonthlyStats = (empId) => {
    const empLogs = workingHours.filter(h => h.employeeId === empId);
    const totalActual = empLogs.reduce((sum, h) => sum + (h.hoursWorked || 0), 0);
    const { totalExpectedHours } = calculateMonthlyMetrics();

    const percentage = totalExpectedHours > 0 ? (totalActual / totalExpectedHours) * 100 : 0;

    let rating = '🔴 Needs Improvement';
    if (percentage >= 95) rating = '🟢 Excellent';
    else if (percentage >= 80) rating = '🟡 Good';

    return {
      totalActual: totalActual.toFixed(1),
      totalExpected: totalExpectedHours.toFixed(1),
      percentage: percentage.toFixed(1),
      rating
    };
  };

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const { workingDays, totalExpectedHours } = calculateMonthlyMetrics();

  return (
    <div>
      {/* Messages */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle size={20} /> {success}
        </div>
      )}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Professional Attendance Management</h2>
        <p className="text-gray-600 text-sm">MNC-Standard Attendance & Leave Management System</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {[
          { id: 'working-rules', label: 'Working Rules', icon: Settings },
          { id: 'holidays', label: 'Holiday List', icon: Calendar },
          { id: 'leaves', label: 'Leave Management', icon: Users },
          { id: 'attendance', label: 'Attendance Report', icon: TrendingUp }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 font-medium text-sm transition flex items-center gap-2 ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'working-rules' && (
        <div className="space-y-6">
          {/* Info Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-bold text-gray-900 mb-3">📋 Standard Working Rules</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-sm">
                <p className="text-gray-600 font-medium">Mon-Fri</p>
                <p className="text-2xl font-bold text-blue-600">8 hrs</p>
              </div>
              <div className="text-sm">
                <p className="text-gray-600 font-medium">Saturday</p>
                <p className="text-2xl font-bold text-green-600">4 hrs</p>
              </div>
              <div className="text-sm">
                <p className="text-gray-600 font-medium">Sunday</p>
                <p className="text-2xl font-bold text-red-600">Holiday</p>
              </div>
              <div className="text-sm">
                <p className="text-gray-600 font-medium">Weekly Total</p>
                <p className="text-2xl font-bold text-purple-600">44 hrs</p>
              </div>
            </div>
          </div>

          {/* Working Days Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {days.map((day, idx) => {
              const config = workingConfig?.[day] || { isWorkingDay: false, hours: 0 };
              return (
                <div key={day} className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">{dayLabels[idx]}</h3>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                      config.isWorkingDay ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {config.isWorkingDay ? '✅ Working' : '❌ Holiday'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateWorkingConfig(day, true, config.hours)}
                        className={`flex-1 px-3 py-2 rounded-lg font-medium transition ${
                          config.isWorkingDay
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Working
                      </button>
                      <button
                        onClick={() => updateWorkingConfig(day, false, 0)}
                        className={`flex-1 px-3 py-2 rounded-lg font-medium transition ${
                          !config.isWorkingDay
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Holiday
                      </button>
                    </div>

                    {config.isWorkingDay && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Hours</label>
                        <input
                          type="number"
                          min="0.5"
                          max="24"
                          step="0.5"
                          value={config.hours}
                          onChange={(e) => updateWorkingConfig(day, true, parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'holidays' && (
        <div className="space-y-6">
          <button
            onClick={() => {
              setShowHolidayForm(true);
              setEditingHoliday(null);
              setHolidayForm({ name: '', date: '', type: 'public' });
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            <Plus size={20} /> Add Holiday
          </button>

          {showHolidayForm && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{editingHoliday ? 'Edit Holiday' : 'Add Holiday'}</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Holiday Name (e.g., Independence Day)"
                  value={holidayForm.name}
                  onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="date"
                  value={holidayForm.date}
                  onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={holidayForm.type}
                  onChange={(e) => setHolidayForm({ ...holidayForm, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="public">Public Holiday</option>
                  <option value="festival">Festival</option>
                  <option value="company">Company Holiday</option>
                  <option value="restricted">Restricted</option>
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={addHoliday}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setShowHolidayForm(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Holidays List */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Holiday Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {holidays.map(holiday => (
                  <tr key={holiday.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{holiday.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(holiday.date).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded">
                        {holiday.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => {
                            setEditingHoliday(holiday);
                            setHolidayForm(holiday);
                            setShowHolidayForm(true);
                          }}
                          className="text-blue-600 hover:bg-blue-100 p-2 rounded"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => deleteHoliday(holiday.id)}
                          className="text-red-600 hover:bg-red-100 p-2 rounded"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'leaves' && (
        <div className="space-y-6">
          <button
            onClick={() => setShowLeaveForm(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            <Plus size={20} /> Approve Leave
          </button>

          {showLeaveForm && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Approve Leave</h3>
              <div className="space-y-4">
                <select
                  value={leaveForm.employeeId}
                  onChange={(e) => setLeaveForm({ ...leaveForm, employeeId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
                <input
                  type="date"
                  value={leaveForm.startDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Start Date"
                />
                <input
                  type="date"
                  value={leaveForm.endDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="End Date"
                />
                <select
                  value={leaveForm.type}
                  onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="casual">Casual Leave (CL)</option>
                  <option value="sick">Sick Leave (SL)</option>
                  <option value="paid">Paid Leave (PL)</option>
                  <option value="work-from-home">Work From Home (WFH)</option>
                  <option value="half-day">Half Day</option>
                  <option value="unpaid">Unpaid Leave (LOP)</option>
                </select>
                <textarea
                  placeholder="Reason for leave"
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
                <div className="flex gap-2">
                  <button
                    onClick={addLeave}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => setShowLeaveForm(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Approved Leaves List */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Employee</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Period</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Reason</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map(leave => (
                  <tr key={leave.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{leave.employeeName}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded">
                        {leave.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(leave.startDate).toLocaleDateString('en-GB')} to {new Date(leave.endDate).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{leave.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div className="mb-6 bg-white p-4 rounded-lg shadow border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-2">📅 Select Month</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Monthly Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Monthly Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-gray-600 text-sm font-medium">Working Days</p>
                <p className="text-3xl font-bold text-blue-600">{workingDays}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-gray-600 text-sm font-medium">Expected Hours</p>
                <p className="text-3xl font-bold text-green-600">{totalExpectedHours.toFixed(1)}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-gray-600 text-sm font-medium">Total Holidays</p>
                <p className="text-3xl font-bold text-purple-600">{holidays.filter(h => h.date.slice(0, 7) === selectedMonth).length}</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <p className="text-gray-600 text-sm font-medium">Total Leaves</p>
                <p className="text-3xl font-bold text-orange-600">{leaves.filter(l => l.startDate.slice(0, 7) <= selectedMonth && l.endDate.slice(0, 7) >= selectedMonth).length}</p>
              </div>
            </div>
          </div>

          {/* Employee Performance */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-bold text-gray-900">Employee Performance Report</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Employee</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Expected</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Actual</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">%</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Rating</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => {
                  const stats = getEmployeeMonthlyStats(emp.id);
                  return (
                    <tr key={emp.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{emp.name}</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">{stats.totalExpected} hrs</td>
                      <td className="px-6 py-4 text-center text-sm font-bold text-blue-600">{stats.totalActual} hrs</td>
                      <td className="px-6 py-4 text-center text-sm font-bold text-gray-900">{stats.percentage}%</td>
                      <td className="px-6 py-4 text-center text-sm font-bold">{stats.rating}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
