import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, getDocs, query, where, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { ChevronLeft, ChevronRight, Calendar, CheckCircle, AlertCircle, Clock, Briefcase } from 'lucide-react';

export default function CalendarAttendance() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [employees, setEmployees] = useState([]);
  const [workingHours, setWorkingHours] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    startDate: '',
    endDate: '',
    type: 'casual',
    reason: ''
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const REQUIRED_HOURS_WEEKDAY = 8; // Monday-Friday
  const REQUIRED_HOURS_SATURDAY = 6; // Saturday
  const OVERTIME_THRESHOLD = 8;

  useEffect(() => {
    fetchAllData();
  }, [currentMonth]);

  const fetchAllData = async () => {
    try {
      // Fetch employees
      const empQuery = query(collection(db, 'employees'), where('companyId', '==', 'default'));
      const empSnapshot = await getDocs(empQuery);
      const empData = empSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEmployees(empData);
      if (empData.length > 0 && !selectedEmployee) {
        setSelectedEmployee(empData[0].id);
      }

      // Fetch working hours
      const hoursQuery = query(collection(db, 'workingHours'), where('companyId', '==', 'default'));
      const hoursSnapshot = await getDocs(hoursQuery);
      setWorkingHours(hoursSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch holidays
      const holidayQuery = query(collection(db, 'holidays'), where('companyId', '==', 'default'));
      const holidaySnapshot = await getDocs(holidayQuery);
      setHolidays(holidaySnapshot.docs.map(doc => doc.data().date));

      // Fetch leaves
      const leaveQuery = query(collection(db, 'leaves'), where('companyId', '==', 'default'));
      const leaveSnapshot = await getDocs(leaveQuery);
      setLeaves(leaveSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch leave requests
      const requestQuery = query(collection(db, 'leaveRequests'), where('companyId', '==', 'default'));
      const requestSnapshot = await getDocs(requestQuery);
      setLeaveRequests(requestSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Error loading data');
    }
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isWorkingDay = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dayOfWeek = date.getDay();
    return dayOfWeek !== 0; // Mon-Sat working, Sunday only off
  };

  const getRequiredHours = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0) return 0; // Sunday
    if (dayOfWeek === 6) return REQUIRED_HOURS_SATURDAY; // Saturday - 6 hours
    return REQUIRED_HOURS_WEEKDAY; // Mon-Fri - 8 hours
  };

  const isHoliday = (day) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return holidays.includes(dateStr);
  };

  const hasLeaveApplication = (day) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return leaves.some(l => l.startDate <= dateStr && l.endDate >= dateStr && l.status === 'approved');
  };

  const getEmployeeDayStatus = (empId, day) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const requiredHours = getRequiredHours(day);

    // Check if holiday
    if (isHoliday(day)) {
      return { status: 'holiday', label: 'Holiday', color: 'bg-purple-100 text-purple-800' };
    }

    // Check if approved leave
    if (hasLeaveApplication(day)) {
      return { status: 'leave', label: 'Leave', color: 'bg-blue-100 text-blue-800' };
    }

    // Check if log exists
    const log = workingHours.find(h => h.employeeId === empId && h.date === dateStr);

    if (log) {
      const hours = log.hoursWorked;
      if (hours > OVERTIME_THRESHOLD) {
        return { status: 'overtime', label: `${hours}h (OT)`, color: 'bg-green-100 text-green-800', hours };
      } else if (hours >= requiredHours) {
        return { status: 'present', label: `${hours}h Full`, color: 'bg-green-100 text-green-800', hours };
      } else {
        return { status: 'partial', label: `${hours}h Part`, color: 'bg-yellow-100 text-yellow-800', hours };
      }
    }

    // If day is in past and working day with no log
    const today = new Date();
    const dayDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);

    if (dayDate < today && isWorkingDay(day)) {
      return { status: 'absent', label: 'Absent', color: 'bg-red-100 text-red-800' };
    }

    // Not yet worked
    if (isWorkingDay(day)) {
      return { status: 'pending', label: 'Pending', color: 'bg-gray-100 text-gray-800' };
    }

    return { status: 'weekend', label: 'Weekend', color: 'bg-gray-50 text-gray-400' };
  };

  const handleSubmitLeaveRequest = async () => {
    if (!selectedEmployee || !leaveForm.startDate || !leaveForm.endDate) {
      setError('Please fill all fields');
      return;
    }

    try {
      const employee = employees.find(e => e.id === selectedEmployee);
      await addDoc(collection(db, 'leaveRequests'), {
        employeeId: selectedEmployee,
        employeeName: employee.name,
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
        type: leaveForm.type,
        reason: leaveForm.reason,
        status: 'pending',
        companyId: 'default',
        createdAt: new Date()
      });

      setSuccess('✅ Leave request submitted! Waiting for approval.');
      setLeaveForm({ startDate: '', endDate: '', type: 'casual', reason: '' });
      setShowLeaveForm(false);
      setTimeout(() => setSuccess(''), 3000);
      await fetchAllData();
    } catch (err) {
      setError('Error submitting leave request');
    }
  };

  const approveLeaveRequest = async (requestId, request) => {
    try {
      // Add to approved leaves
      await addDoc(collection(db, 'leaves'), {
        employeeId: request.employeeId,
        employeeName: request.employeeName,
        startDate: request.startDate,
        endDate: request.endDate,
        type: request.type,
        reason: request.reason,
        status: 'approved',
        companyId: 'default',
        createdAt: new Date()
      });

      // Delete request
      await deleteDoc(doc(db, 'leaveRequests', requestId));

      setSuccess('✅ Leave approved!');
      setTimeout(() => setSuccess(''), 3000);
      await fetchAllData();
    } catch (err) {
      setError('Error approving leave');
    }
  };

  const rejectLeaveRequest = async (requestId) => {
    try {
      await deleteDoc(doc(db, 'leaveRequests', requestId));
      setSuccess('✅ Leave request rejected!');
      setTimeout(() => setSuccess(''), 3000);
      await fetchAllData();
    } catch (err) {
      setError('Error rejecting leave');
    }
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = Array(firstDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

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

      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">📅 Attendance Calendar</h2>
        <p className="text-gray-600 text-sm">Professional attendance tracking with leave management</p>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Calendar */}
        <div className="lg:col-span-2">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-xl border border-gray-200">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ChevronLeft size={24} />
            </button>
            <h3 className="text-xl font-bold text-gray-900">{monthName}</h3>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Employee Selection */}
          <div className="mb-6 bg-white p-4 rounded-xl border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Employee</label>
            <select
              value={selectedEmployee || ''}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name} - {emp.position}</option>
              ))}
            </select>
          </div>

          {/* Calendar Grid */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-lg">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-0 bg-gray-100 border-b border-gray-200">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <div key={day} className="p-4 text-center font-bold text-gray-700 text-sm">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-0">
              {days.map((day, idx) => {
                if (!day) {
                  return <div key={`empty-${idx}`} className="p-4 bg-gray-50" />;
                }

                const status = selectedEmployee ? getEmployeeDayStatus(selectedEmployee, day) : { status: 'pending', label: 'Select' };

                return (
                  <div
                    key={day}
                    className={`p-3 border border-gray-200 min-h-24 flex flex-col ${
                      isWorkingDay(day) ? 'bg-white hover:bg-blue-50' : 'bg-gray-50'
                    } transition cursor-pointer`}
                  >
                    <p className="font-bold text-gray-900 mb-2">{day}</p>
                    {selectedEmployee && (
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${status.color} text-center mt-auto`}>
                        {status.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4">
            <p className="font-bold text-gray-900 mb-3">📋 Status Legend</p>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-gray-900 mb-2">Working Days Status:</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    <span className="text-xs text-gray-700">Present/Full (≥ req hrs)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                    <span className="text-xs text-gray-700">Partial ({
 '<'} req hrs)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                    <span className="text-xs text-gray-700">Absent (0 hrs)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-400 rounded-full"></span>
                    <span className="text-xs text-gray-700">Overtime ({
 '>'} 8h)</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-900 mb-2">Special Status:</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                    <span className="text-xs text-gray-700">Holiday</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                    <span className="text-xs text-gray-700">Leave</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
                    <span className="text-xs text-gray-700">Pending</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-gray-300 rounded-full"></span>
                    <span className="text-xs text-gray-700">Weekend</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Leave Management & Notifications */}
        <div className="space-y-6">
          {/* Leave Request Form */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📋 Request Leave</h3>
            {!showLeaveForm ? (
              <button
                onClick={() => setShowLeaveForm(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition"
              >
                Apply for Leave
              </button>
            ) : (
              <div className="space-y-3">
                <input
                  type="date"
                  value={leaveForm.startDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <input
                  type="date"
                  value={leaveForm.endDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <select
                  value={leaveForm.type}
                  onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="casual">Casual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="paid">Paid Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                </select>
                <textarea
                  placeholder="Reason"
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  rows="2"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSubmitLeaveRequest}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition text-sm"
                  >
                    Submit
                  </button>
                  <button
                    onClick={() => setShowLeaveForm(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold py-2 rounded-lg transition text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Leave Requests Notification */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock size={20} className="text-blue-600" />
              Pending Requests
            </h3>
            {leaveRequests.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No pending requests</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {leaveRequests.map(req => (
                  <div key={req.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition">
                    <p className="font-semibold text-gray-900 text-sm">{req.employeeName}</p>
                    <p className="text-gray-600 text-xs mt-1">
                      {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-gray-600 text-xs mt-1"><strong>Type:</strong> {req.type}</p>
                    <p className="text-gray-600 text-xs mt-1"><strong>Reason:</strong> {req.reason}</p>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => approveLeaveRequest(req.id, req)}
                        className="flex-1 bg-green-100 hover:bg-green-200 text-green-800 font-bold py-1 rounded text-xs transition"
                      >
                        ✅ Approve
                      </button>
                      <button
                        onClick={() => rejectLeaveRequest(req.id)}
                        className="flex-1 bg-red-100 hover:bg-red-200 text-red-800 font-bold py-1 rounded text-xs transition"
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Key Information */}
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
            <p className="text-sm text-blue-900 font-semibold mb-2">📌 Key Information</p>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>✓ Mon-Fri: 8 hours/day required</li>
              <li>✓ Saturday: 6 hours/day required</li>
              <li>✓ Sunday: Weekend (Off)</li>
              <li>✓ Full Day: ≥ required hours</li>
              <li>✓ Partial: {'<'} required hours</li>
              <li>✓ Overtime: {'>'} 8 hours</li>
              <li>✓ Admin adds holidays for all</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
