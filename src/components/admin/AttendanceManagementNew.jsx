import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, getDocs, query, where, addDoc, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { Users, X, ChevronLeft, ChevronRight, AlertCircle, CheckCircle, Calendar, Plus } from 'lucide-react';

export default function AttendanceManagementNew({ activeTab = 'attendance' }) {
  const [employees, setEmployees] = useState([]);
  const [workingHours, setWorkingHours] = useState([]);
  const [dayConfigs, setDayConfigs] = useState({});
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear()); // 'calendar' or 'holidays'
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedDateForAction, setSelectedDateForAction] = useState(null);
  const [selectedDateDetail, setSelectedDateDetail] = useState(null);
  const [calendarEvents, setCalendarEvents] = useState({});
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventForm, setEventForm] = useState({ title: '', type: 'event', date: null });
  const [selectedEventDate, setSelectedEventDate] = useState(null);
  const [editingEventIndex, setEditingEventIndex] = useState(null);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [yearRangeStart, setYearRangeStart] = useState(new Date().getFullYear() - 6);
  const [detailedEmployeeView, setDetailedEmployeeView] = useState(null);
  const [showHolidayFormModal, setShowHolidayFormModal] = useState(false);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]);
  const [appliedFromDate, setAppliedFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [appliedToDate, setAppliedToDate] = useState(new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateFilterApplied, setDateFilterApplied] = useState(false);
  const [activeFilter, setActiveFilter] = useState('holidays');
  const [holidaySearch, setHolidaySearch] = useState('');
  const [addForm, setAddForm] = useState({
    date: new Date().toISOString().split('T')[0],
    status: 'working',
    hours: 8,
    note: '',
    holidayType: 'national',
    isRecurring: false
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [notifying, setNotifying] = useState(false);

  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const empQuery = query(collection(db, 'employees'), where('companyId', '==', 'default'));
      const empSnapshot = await getDocs(empQuery);
      setEmployees(empSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const hoursQuery = query(collection(db, 'workingHours'), where('companyId', '==', 'default'));
      const hoursSnapshot = await getDocs(hoursQuery);
      setWorkingHours(hoursSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const configQuery = query(collection(db, 'dayConfigs'), where('companyId', '==', 'default'));
      const configSnapshot = await getDocs(configQuery);
      const configs = {};
      configSnapshot.docs.forEach(doc => {
        configs[doc.data().date] = { id: doc.id, ...doc.data() };
      });
      setDayConfigs(configs);

      // Load calendar events from Firestore
      const eventsQuery = query(collection(db, 'calendarEvents'), where('companyId', '==', 'default'));
      const eventsSnapshot = await getDocs(eventsQuery);
      const events = {};
      eventsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (!events[data.date]) {
          events[data.date] = [];
        }
        events[data.date].push({ id: doc.id, ...data });
      });
      setCalendarEvents(events);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Error loading data');
    }
  };

  const formatDate = (date) => {
    if (typeof date === 'string') {
      return date;
    }
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const getDayStatus = (date) => {
    const dateStr = formatDate(date);
    const config = dayConfigs[dateStr];

    if (config) {
      return config;
    }

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[new Date(dateStr).getDay()];

    if (dayName === 'sunday') {
      return { status: 'weekend', hours: 0, note: 'Sunday' };
    }
    if (dayName === 'saturday') {
      return { status: 'working', hours: 6, note: 'Saturday' };
    }
    return { status: 'working', hours: 8, note: '' };
  };

  const getWeekDates = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.getFullYear(), d.getMonth(), diff);

    const week = [];
    for (let i = 0; i < 7; i++) {
      const weekDate = new Date(monday);
      weekDate.setDate(weekDate.getDate() + i);
      week.push(new Date(weekDate));
    }
    return week;
  };

  const saveDayConfig = async () => {
    if (!addForm.date) {
      setError('Please select a date');
      return;
    }

    if (addForm.status === 'holiday' && !addForm.note) {
      setError('Please enter holiday name');
      return;
    }

    try {
      const baseConfig = {
        status: addForm.status,
        hours: addForm.status === 'weekend' ? 0 : (addForm.status === 'holiday' ? 0 : addForm.hours),
        note: addForm.note,
        companyId: 'default',
        updatedAt: new Date()
      };

      // Handle recurring holidays - create for multiple years
      let datesToSave = [];
      if (addForm.status === 'holiday' && addForm.isRecurring) {
        // Extract month and day from the selected date
        const selectedDate = new Date(addForm.date);
        const month = selectedDate.getMonth();
        const day = selectedDate.getDate();

        // Create holidays for years 2020-2035 on the same month and day
        for (let year = 2020; year <= 2035; year++) {
          const dateStr = new Date(year, month, day).toISOString().split('T')[0];
          datesToSave.push(dateStr);
        }
      } else {
        datesToSave = [addForm.date];
      }

      // Add holiday type and recurring flag for holidays
      if (addForm.status === 'holiday') {
        baseConfig.holidayType = addForm.holidayType || 'national';
        baseConfig.isRecurring = addForm.isRecurring || false;
      }

      // Save main date immediately
      const config = { ...baseConfig, date: addForm.date };
      const existingConfig = dayConfigs[addForm.date];
      let docId = existingConfig?.id;

      if (existingConfig && existingConfig.id) {
        await updateDoc(doc(db, 'dayConfigs', existingConfig.id), config);
      } else {
        const docRef = await addDoc(collection(db, 'dayConfigs'), { ...config, createdAt: new Date() });
        docId = docRef.id;
      }

      const updatedConfigs = { ...dayConfigs, [addForm.date]: { id: docId, ...config } };
      setDayConfigs(updatedConfigs);

      // Process recurring dates in background (non-blocking)
      if (datesToSave.length > 1) {
        setTimeout(async () => {
          const recurringConfigs = { ...updatedConfigs };
          for (let i = 1; i < datesToSave.length; i++) {
            const dateToSave = datesToSave[i];
            const recurringConfig = { ...baseConfig, date: dateToSave };
            const existingRecurringConfig = dayConfigs[dateToSave];

            if (existingRecurringConfig && existingRecurringConfig.id) {
              await updateDoc(doc(db, 'dayConfigs', existingRecurringConfig.id), recurringConfig);
            } else {
              const docRef = await addDoc(collection(db, 'dayConfigs'), { ...recurringConfig, createdAt: new Date() });
              recurringConfigs[dateToSave] = { id: docRef.id, ...recurringConfig };
            }
          }
          setDayConfigs(recurringConfigs);
        }, 0);
      }

      // Save day configuration as calendar events
      let eventTitle = '';
      if (addForm.status === 'working') {
        eventTitle = `Working Day (${addForm.hours}h)`;
      } else if (addForm.status === 'holiday') {
        eventTitle = addForm.note;
      } else if (addForm.status === 'weekend') {
        eventTitle = 'Weekend';
      }

      // Update main date calendar event immediately
      const existingEvents = calendarEvents[addForm.date] || [];
      const existingEventIndex = existingEvents.findIndex(e => e.isDayConfig === true);
      let updatedEvents = { ...calendarEvents };

      if (existingEventIndex !== null && existingEventIndex >= 0) {
        const eventToUpdate = existingEvents[existingEventIndex];
        if (eventToUpdate.id) {
          await updateDoc(doc(db, 'calendarEvents', eventToUpdate.id), {
            title: eventTitle,
            description: addForm.note || '',
            isDayConfig: true
          });
        }
        const updatedEventsList = [...existingEvents];
        updatedEventsList[existingEventIndex] = {
          ...eventToUpdate,
          title: eventTitle,
          description: addForm.note || '',
          isDayConfig: true
        };
        updatedEvents[addForm.date] = updatedEventsList;
      } else {
        const newEvent = {
          title: eventTitle,
          type: 'event',
          description: addForm.note || '',
          date: addForm.date,
          companyId: 'default',
          isDayConfig: true,
          createdAt: new Date()
        };
        const eventDocRef = await addDoc(collection(db, 'calendarEvents'), newEvent);
        updatedEvents[addForm.date] = [...existingEvents, { id: eventDocRef.id, ...newEvent }];
      }
      setCalendarEvents(updatedEvents);

      // Process recurring calendar events in background
      if (datesToSave.length > 1) {
        setTimeout(async () => {
          const recurringEvents = { ...updatedEvents };
          for (let i = 1; i < datesToSave.length; i++) {
            const dateToSave = datesToSave[i];
            const recurringExistingEvents = calendarEvents[dateToSave] || [];
            const recurringEventIndex = recurringExistingEvents.findIndex(e => e.isDayConfig === true);

            if (recurringEventIndex !== null && recurringEventIndex >= 0) {
              const eventToUpdate = recurringExistingEvents[recurringEventIndex];
              if (eventToUpdate.id) {
                await updateDoc(doc(db, 'calendarEvents', eventToUpdate.id), {
                  title: eventTitle,
                  description: addForm.note || '',
                  isDayConfig: true
                });
              }
              const updatedEventsList = [...recurringExistingEvents];
              updatedEventsList[recurringEventIndex] = {
                ...eventToUpdate,
                title: eventTitle,
                description: addForm.note || '',
                isDayConfig: true
              };
              recurringEvents[dateToSave] = updatedEventsList;
            } else {
              const newEvent = {
                title: eventTitle,
                type: 'event',
                description: addForm.note || '',
                date: dateToSave,
                companyId: 'default',
                isDayConfig: true,
                createdAt: new Date()
              };
              const eventDocRef = await addDoc(collection(db, 'calendarEvents'), newEvent);
              recurringEvents[dateToSave] = [...recurringExistingEvents, { id: eventDocRef.id, ...newEvent }];
            }
          }
          setCalendarEvents(recurringEvents);
        }, 0);
      }

      // Notify all employees if holiday
      if (addForm.status === 'holiday') {
        setNotifying(true);
        // Only notify for the original date or future dates to avoid spam
        const currentYear = new Date().getFullYear();
        const notifyDates = datesToSave.filter(d => new Date(d).getFullYear() >= currentYear);

        for (const dateToNotify of notifyDates) {
          const dateObj = new Date(dateToNotify);
          for (const emp of employees) {
            await addDoc(collection(db, 'employeeNotifications'), {
              employeeId: emp.id,
              type: 'holiday',
              message: `📢 Holiday: ${addForm.note} on ${dateObj.toLocaleDateString('en-GB')}`,
              date: dateToNotify,
              companyId: 'default',
              createdAt: new Date(),
              read: false
            });
          }
        }
        setNotifying(false);
      }

      setSuccess('✅ Day configuration saved!');
      setShowAddDialog(false);
      setAddForm({
        date: new Date().toISOString().split('T')[0],
        status: 'working',
        hours: 8,
        note: ''
      });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error:', err);
      setError('Error saving configuration');
      setNotifying(false);
    }
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const getEmployeeWeeklyHours = (employeeId) => {
    const weekData = {};
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentWeek = getWeekDates(new Date());

    for (let i = 0; i < 6; i++) {
      const date = currentWeek[i];
      const dateStr = formatDate(date);
      const log = workingHours.find(h => h.employeeId === employeeId && h.date === dateStr);
      weekData[dayLabels[i]] = log ? log.hoursWorked : 0;
    }

    const total = Object.values(weekData).reduce((a, b) => a + b, 0);
    return { ...weekData, total };
  };

  const currentWeek = getWeekDates(new Date());
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const days = Array(firstDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  const getColorForDay = (date) => {
    const dateStr = formatDate(date);
    const status = getDayStatus(dateStr);
    if (status.status === 'holiday') return 'bg-red-100 text-red-900';
    if (status.status === 'weekend') return 'bg-orange-100 text-orange-900';
    return 'bg-green-100 text-green-900';
  };

  const getStatusEmoji = (status) => {
    if (status === 'holiday') return '🔴';
    if (status === 'weekend') return '🟠';
    return '🟢';
  };

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

      {/* Attendance Tab Content */}
      {activeTab === 'attendance' && (
      <>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">📊 Attendance Management</h2>
          <p className="text-gray-600 text-sm">Weekly employee logs with calendar management</p>
        </div>
        <button
          onClick={() => setShowCalendarModal(true)}
          className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-lg"
          title="Open Calendar Management"
        >
          <Calendar size={24} />
        </button>
      </div>

      {employees.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-12 text-center">
          <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Employees</h3>
          <p className="text-gray-600">Add employees first to manage attendance</p>
        </div>
      ) : (
        <>
      {/* Weekly Summary Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Users size={20} /> Weekly Summary (Week of {currentWeek[0].toLocaleDateString('en-GB')})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-3 px-4 font-bold text-gray-900">Employee</th>
                <th className="text-center py-3 px-4 font-bold text-gray-900">Mon</th>
                <th className="text-center py-3 px-4 font-bold text-gray-900">Tue</th>
                <th className="text-center py-3 px-4 font-bold text-gray-900">Wed</th>
                <th className="text-center py-3 px-4 font-bold text-gray-900">Thu</th>
                <th className="text-center py-3 px-4 font-bold text-gray-900">Fri</th>
                <th className="text-center py-3 px-4 font-bold text-gray-900">Sat</th>
                <th className="text-center py-3 px-4 font-bold text-gray-900 bg-blue-50">Total</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => {
                const weekHours = getEmployeeWeeklyHours(emp.id);
                return (
                  <tr
                    key={emp.id}
                    onClick={() => setDetailedEmployeeView(emp.id)}
                    className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition"
                  >
                    <td className="py-3 px-4 font-semibold text-gray-900">{emp.name}</td>
                    <td className="text-center py-3 px-4 text-gray-700">{weekHours.Mon}h</td>
                    <td className="text-center py-3 px-4 text-gray-700">{weekHours.Tue}h</td>
                    <td className="text-center py-3 px-4 text-gray-700">{weekHours.Wed}h</td>
                    <td className="text-center py-3 px-4 text-gray-700">{weekHours.Thu}h</td>
                    <td className="text-center py-3 px-4 text-gray-700">{weekHours.Fri}h</td>
                    <td className="text-center py-3 px-4 text-gray-700">{weekHours.Sat}h</td>
                    <td className="text-center py-3 px-4 font-bold text-blue-600 bg-blue-50">
                      {weekHours.total}h
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}
      </>
      )}

      {/* Holidays & Events Tab Content */}
      {activeTab === 'holidays-events' && (
      <>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Holidays & Events</h2>
          <div className="flex gap-2 items-end justify-end">
            {/* Search Bar */}
            <input
              type="text"
              placeholder="Search holidays..."
              value={holidaySearch}
              onChange={(e) => setHolidaySearch(e.target.value)}
              className="w-48 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />

            {/* Date Filter */}
            {!showDatePicker && !dateFilterApplied && (
              <button
                onClick={() => setShowDatePicker(true)}
                className="p-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                title="Date Range"
              >
                📅
              </button>
            )}
            {showDatePicker && (
              <div className="flex gap-2 items-end">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  title="From Date"
                />
                <span className="text-gray-500 text-sm">to</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  title="To Date"
                />
                {!dateFilterApplied ? (
                  <button
                    onClick={() => {
                      setAppliedFromDate(fromDate);
                      setAppliedToDate(toDate);
                      setDateFilterApplied(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap"
                  >
                    Apply
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setFromDate(new Date().toISOString().split('T')[0]);
                      setToDate(new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]);
                      setAppliedFromDate(new Date().toISOString().split('T')[0]);
                      setAppliedToDate(new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]);
                      setDateFilterApplied(false);
                      setShowDatePicker(false);
                    }}
                    className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
            {dateFilterApplied && !showDatePicker && (
              <button
                onClick={() => setShowDatePicker(true)}
                className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap"
              >
                Clear
              </button>
            )}

            {/* Add Button */}
            <button
              onClick={() => setShowHolidayFormModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition flex items-center gap-2"
            >
              <Plus size={18} />
              Add
            </button>

            {/* Working Calendar Button */}
            <button
              onClick={() => setShowCalendarModal(true)}
              className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-lg"
              title="Calendar View"
            >
              <Calendar size={24} />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b border-gray-300">
          <button
            onClick={() => setActiveFilter('holidays')}
            className={`px-4 py-2 font-semibold text-sm transition border-b-2 ${
              activeFilter === 'holidays'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            Holidays
          </button>
          <button
            onClick={() => setActiveFilter('events')}
            className={`px-4 py-2 font-semibold text-sm transition border-b-2 ${
              activeFilter === 'events'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            Events & Working Days
          </button>
        </div>
      </div>

      {/* Content */}
      <div>
        {/* Holiday Form - Compact inline */}
        {showHolidayFormModal && (
          <div className="mb-6 bg-blue-50 p-4 rounded-lg border-2 border-blue-200 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Plus className="text-blue-600" size={24} />
                Add Holiday / Working Day
              </h3>
              <button
                onClick={() => {
                  setShowHolidayFormModal(false);
                  setAddForm({
                    date: new Date().toISOString().split('T')[0],
                    status: 'working',
                    hours: 8,
                    note: '',
                    holidayType: 'national',
                    isRecurring: false
                  });
                }}
                className="p-1 hover:bg-blue-100 rounded transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            {success && (
              <div className="mb-3 bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded text-sm flex items-center gap-2">
                <CheckCircle size={16} /> {success}
              </div>
            )}
            {error && (
              <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm flex items-center gap-2">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            {/* Date and Status Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">📅 Date</label>
                <input
                  type="date"
                  value={addForm.date}
                  onChange={(e) => setAddForm({ ...addForm, date: e.target.value })}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
                <select
                  value={addForm.status}
                  onChange={(e) => {
                    const newStatus = e.target.value;
                    setAddForm({
                      ...addForm,
                      status: newStatus,
                      hours: newStatus === 'weekend' ? 0 : (newStatus === 'holiday' ? 0 : addForm.hours)
                    });
                  }}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
                >
                  <option value="working">🟢 Working</option>
                  <option value="weekend">🟠 Weekend</option>
                  <option value="holiday">🔴 Holiday</option>
                </select>
              </div>
            </div>

            {/* Holiday Type and Holiday Name Row */}
            {addForm.status === 'holiday' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">🎯 Holiday Type</label>
                  <select
                    value={addForm.holidayType}
                    onChange={(e) => setAddForm({ ...addForm, holidayType: e.target.value })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
                  >
                    <option value="national">National</option>
                    <option value="regional">Regional</option>
                    <option value="company">Company</option>
                    <option value="optional">Optional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">🏆 Holiday Name</label>
                  <input
                    type="text"
                    placeholder="Holiday name"
                    value={addForm.note}
                    onChange={(e) => setAddForm({ ...addForm, note: e.target.value })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
                  />
                </div>
              </div>
            )}

            {/* Note and Hours Row */}
            {addForm.status !== 'holiday' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">📝 Note</label>
                  <input
                    type="text"
                    placeholder="Note"
                    value={addForm.note}
                    onChange={(e) => setAddForm({ ...addForm, note: e.target.value })}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
                  />
                </div>

                {addForm.status === 'working' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">⏱️ Hours</label>
                    <select
                      value={addForm.hours}
                      onChange={(e) => setAddForm({ ...addForm, hours: parseInt(e.target.value) })}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
                    >
                      <option value={1}>1h</option>
                      <option value={2}>2h</option>
                      <option value={3}>3h</option>
                      <option value={4}>4h</option>
                      <option value={5}>5h</option>
                      <option value={6}>6h</option>
                      <option value={7}>7h</option>
                      <option value={8}>8h</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Apply for all years */}
            {addForm.status === 'holiday' && (
              <div className="mb-3">
                <div className="flex items-center gap-2 bg-white p-2 rounded border border-blue-300">
                  <input
                    type="checkbox"
                    id="isRecurring"
                    checked={addForm.isRecurring}
                    onChange={(e) => setAddForm({ ...addForm, isRecurring: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                  <label htmlFor="isRecurring" className="text-xs font-semibold text-gray-700 cursor-pointer flex-1">
                    🔄 Apply for all years
                  </label>
                </div>
                <p className="text-xs text-gray-600 mt-1 ml-6">
                  {addForm.isRecurring
                    ? `Repeats on ${new Date(addForm.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })} every year`
                    : 'Only for selected year'}
                </p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  await saveDayConfig();
                  if (!error) {
                    setShowHolidayFormModal(false);
                  }
                }}
                disabled={notifying}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1.5 rounded text-sm transition disabled:opacity-50"
              >
                {notifying ? 'Saving...' : '✅ Save'}
              </button>
              <button
                onClick={() => {
                  setShowHolidayFormModal(false);
                  setAddForm({
                    date: new Date().toISOString().split('T')[0],
                    status: 'working',
                    hours: 8,
                    note: '',
                    holidayType: 'national',
                    isRecurring: false
                  });
                }}
                className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-semibold py-1.5 rounded text-sm transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Holidays Table */}
        {activeFilter === 'holidays' && (
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-3 mb-4">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              Holidays
            </h3>
            <div className="border border-gray-300 rounded overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-300">
                    <th className="text-left px-6 py-3 font-semibold text-gray-700 text-sm">Date</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-700 text-sm">Holiday Name</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-700 text-sm">Type</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-700 text-sm">Recurring</th>
                    <th className="text-right px-6 py-3 font-semibold text-gray-700 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(dayConfigs)
                    .filter(([_, config]) => {
                      const matchesStatus = config.status === 'holiday';
                      const matchesDate = config.date >= appliedFromDate && config.date <= appliedToDate;
                      const matchesSearch = config.note.toLowerCase().includes(holidaySearch.toLowerCase());
                      return matchesStatus && matchesDate && matchesSearch;
                    })
                    .sort((a, b) => new Date(a[1].date) - new Date(b[1].date))
                    .map(([dateKey, config]) => (
                      <tr key={dateKey} className="border-b border-gray-200 hover:bg-gray-50 transition">
                        <td className="px-6 py-3 text-gray-600 text-sm">
                          {new Date(config.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-3 text-gray-900 font-medium">{config.note}</td>
                        <td className="px-6 py-3 text-gray-600 text-sm">
                          {config.holidayType ? (config.holidayType.charAt(0).toUpperCase() + config.holidayType.slice(1)) : 'National'}
                        </td>
                        <td className="px-6 py-3 text-gray-600 text-sm">
                          {config.isRecurring ? '🔄 Yes' : 'No'}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <button
                            onClick={() => {
                              setAddForm({
                                date: config.date,
                                status: config.status,
                                hours: config.hours,
                                note: config.note,
                                holidayType: config.holidayType || 'national',
                                isRecurring: config.isRecurring || false
                              });
                              setShowHolidayFormModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-700 mr-4 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                if (config.id) {
                                  await deleteDoc(doc(db, 'dayConfigs', config.id));
                                }
                                setDayConfigs(prev => {
                                  const updated = { ...prev };
                                  delete updated[dateKey];
                                  return updated;
                                });
                                setSuccess('✅ Holiday deleted!');
                              } catch (error) {
                                console.error('Error deleting:', error);
                                setError('Error deleting holiday');
                              }
                            }}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {Object.entries(dayConfigs).filter(([_, config]) => {
                const matchesStatus = config.status === 'holiday';
                const matchesDate = config.date >= appliedFromDate && config.date <= appliedToDate;
                const matchesSearch = config.note.toLowerCase().includes(holidaySearch.toLowerCase());
                return matchesStatus && matchesDate && matchesSearch;
              }).length === 0 && (
                <div className="px-6 py-8 text-center text-gray-500 text-sm">
                  {holidaySearch ? `No holidays matching "${holidaySearch}"` : 'No holidays found'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Events Table */}
        {activeFilter === 'events' && (
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              Events
            </h3>
            <div className="border border-gray-300 rounded overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-300">
                    <th className="text-left px-6 py-3 font-semibold text-gray-700 text-sm">Date</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-700 text-sm">Event Name</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-700 text-sm">Type</th>
                    <th className="text-right px-6 py-3 font-semibold text-gray-700 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(calendarEvents)
                    .flatMap(([date, events]) => events.map(e => ({ ...e, date, type: e.type || 'event' })))
                    .filter((item) => {
                      return item.type !== 'holiday' && item.date >= appliedFromDate && item.date <= appliedToDate;
                    })
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .map((event, idx) => (
                      <tr key={`event-${idx}`} className="border-b border-gray-200 hover:bg-gray-50 transition">
                        <td className="px-6 py-3 text-gray-600 text-sm">
                          {new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-3 text-gray-900 font-medium">{event.title}</td>
                        <td className="px-6 py-3 text-gray-600 text-sm">
                          {event.type === 'working' ? 'Working Day' : event.type === 'weekend' ? 'Weekend' : 'Event'}
                        </td>
                        <td className="px-6 py-3 text-right space-x-3">
                          <button
                            onClick={() => {
                              setEventForm({
                                title: event.title,
                                type: event.type,
                                date: event.date,
                                description: event.description || ''
                              });
                              setEditingEventIndex(0);
                              setShowEventForm(true);
                              setSelectedDateDetail(new Date(event.date));
                            }}
                            className="text-blue-600 hover:text-blue-700 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                if (event.id) {
                                  await deleteDoc(doc(db, 'calendarEvents', event.id));
                                }
                                const updatedEvents = { ...calendarEvents };
                                updatedEvents[event.date] = (updatedEvents[event.date] || []).filter(e => e.id !== event.id);
                                if (updatedEvents[event.date].length === 0) {
                                  delete updatedEvents[event.date];
                                }
                                setCalendarEvents(updatedEvents);
                                setSuccess('✅ Event deleted!');
                              } catch (error) {
                                console.error('Error deleting:', error);
                                setError('Error deleting event');
                              }
                            }}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {Object.entries(calendarEvents).flatMap(([date, events]) => events).filter((event) => {
                const date = new Date(event.date);
                const fromD = new Date(appliedFromDate);
                const toD = new Date(appliedToDate);
                return event.type !== 'holiday' && date >= fromD && date <= toD;
              }).length === 0 && (
                <div className="px-6 py-8 text-center text-gray-500 text-sm">
                  No events found
                </div>
              )}
            </div>
          </div>
        )}

        {/* Working Days Table */}
        {activeFilter === 'events' && (
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              Working Days
            </h3>
            <div className="border border-gray-300 rounded overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-300">
                    <th className="text-left px-6 py-3 font-semibold text-gray-700 text-sm">Date</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-700 text-sm">Name</th>
                    <th className="text-left px-6 py-3 font-semibold text-gray-700 text-sm">Type</th>
                    <th className="text-right px-6 py-3 font-semibold text-gray-700 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(dayConfigs)
                    .filter(([_, config]) => {
                      return config.status === 'working' && config.date >= appliedFromDate && config.date <= appliedToDate;
                    })
                    .sort((a, b) => new Date(a[1].date) - new Date(b[1].date))
                    .map(([dateKey, config]) => (
                      <tr key={`working-${dateKey}`} className="border-b border-gray-200 hover:bg-gray-50 transition">
                        <td className="px-6 py-3 text-gray-600 text-sm">
                          {new Date(config.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-3 text-gray-900 font-medium">
                          {config.note || new Date(config.date).toLocaleDateString('en-GB', { weekday: 'long' })}
                        </td>
                        <td className="px-6 py-3 text-gray-600 text-sm">
                          {config.hours}h Working Day
                        </td>
                        <td className="px-6 py-3 text-right">
                          <button
                            onClick={async () => {
                              try {
                                if (config.id) {
                                  await deleteDoc(doc(db, 'dayConfigs', config.id));
                                }
                                setDayConfigs(prev => {
                                  const updated = { ...prev };
                                  delete updated[dateKey];
                                  return updated;
                                });
                                setSuccess('✅ Working day deleted!');
                              } catch (error) {
                                console.error('Error deleting:', error);
                                setError('Error deleting working day');
                              }
                            }}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {Object.entries(dayConfigs).filter(([_, config]) => {
                const date = new Date(config.date);
                const fromD = new Date(appliedFromDate);
                const toD = new Date(appliedToDate);
                return config.status === 'working' && date >= fromD && date <= toD;
              }).length === 0 && (
                <div className="px-6 py-8 text-center text-gray-500 text-sm">
                  No working days found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      </>
      )}

      {/* Detailed View Modal */}
      {detailedEmployeeView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900">
                📋 {employees.find(e => e.id === detailedEmployeeView)?.name}
              </h3>
              <button
                onClick={() => setDetailedEmployeeView(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <h4 className="font-bold text-gray-900 mb-4">Detailed Logs</h4>
              <div className="space-y-3">
                {workingHours
                  .filter(h => h.employeeId === detailedEmployeeView)
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .slice(0, 15)
                  .map(log => (
                    <div key={log.id} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-900">{new Date(log.date).toLocaleDateString('en-GB')}</p>
                          <p className="text-sm text-gray-600">{log.workDescription}</p>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">{log.hoursWorked}h</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Management Modal with Tabs */}
      {showCalendarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-gray-200">

            {/* Header */}
            <div className="bg-white flex items-center justify-between px-6 py-4 rounded-t-2xl border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-900">📅 Working Calendar</h2>
                <p className="text-xs text-gray-600">{selectedDateDetail ? selectedDateDetail.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric' }) : months[currentMonth]} {currentYear}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <button onClick={() => setCurrentMonth(currentMonth - 1 < 0 ? 11 : currentMonth - 1)} className="p-2 hover:bg-gray-100 rounded transition">
                    <ChevronLeft size={18} className="text-gray-600" />
                  </button>
                  <select
                    value={currentMonth}
                    onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
                    className="px-3 py-1.5 border border-gray-300 rounded font-semibold text-gray-900 bg-white cursor-pointer hover:bg-gray-50"
                  >
                    {months.map((m, idx) => (
                      <option key={idx} value={idx}>{m}</option>
                    ))}
                  </select>
                  <div className="relative">
                    <button
                      onClick={() => setShowYearPicker(!showYearPicker)}
                      className="px-3 py-1.5 border border-gray-300 rounded font-semibold text-gray-900 bg-white cursor-pointer hover:bg-gray-50"
                    >
                      {currentYear}
                    </button>
                    {showYearPicker && (
                      <div className="absolute top-full left-0 mt-2 bg-white border-2 border-gray-300 rounded-xl shadow-xl p-6 z-50 w-80">
                        <div className="flex items-center justify-between mb-6">
                          <button
                            onClick={() => setYearRangeStart(yearRangeStart - 12)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                            title="Previous"
                          >
                            <ChevronLeft size={20} className="text-gray-600" />
                          </button>
                          <p className="font-bold text-lg text-gray-900">{yearRangeStart} - {yearRangeStart + 11}</p>
                          <button
                            onClick={() => setYearRangeStart(yearRangeStart + 12)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                            title="Next"
                          >
                            <ChevronRight size={20} className="text-gray-600" />
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {Array.from({ length: 12 }, (_, i) => yearRangeStart + i).map((year) => (
                            <button
                              key={year}
                              onClick={() => {
                                setCurrentYear(year);
                                setShowYearPicker(false);
                              }}
                              className={`py-3 px-2 rounded-lg font-bold text-base transition ${
                                year === currentYear
                                  ? 'bg-blue-600 text-white shadow-md'
                                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                              }`}
                            >
                              {year}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <button onClick={() => setCurrentMonth(currentMonth + 1 > 11 ? 0 : currentMonth + 1)} className="p-2 hover:bg-gray-100 rounded transition">
                    <ChevronRight size={18} className="text-gray-600" />
                  </button>
                  <button onClick={() => {
                    setShowCalendarModal(false);
                    setSelectedDateDetail(null);
                  }} className="p-2 hover:bg-gray-100 rounded text-gray-600 transition">
                    <X size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Calendar Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              {/* Week Day Headers */}
              <div className="grid grid-cols-7 gap-3 mb-4">
                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, idx) => (
                  <div key={day} className={`text-center font-bold text-sm py-3 rounded-lg ${
                    idx === 0 || idx === 6
                      ? 'bg-orange-100 text-orange-900'
                      : 'bg-blue-100 text-blue-900'
                  }`}>
                    {day.substring(0, 3)}
                  </div>
                ))}
              </div>

              {/* Calendar Grid with Events */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, idx) => {
                  const date = day ? new Date(currentYear, currentMonth, day) : null;
                  const dateStr = date ? formatDate(date) : null;
                  const dayOfWeek = date ? date.getDay() : null;
                  const dayEvents = dateStr ? (calendarEvents[dateStr] || []) : [];
                  const isSelected = selectedDateDetail && formatDate(selectedDateDetail) === dateStr;
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                  // Check if day has a configuration
                  const dayConfig = dayConfigs[dateStr];

                  // Determine cell color based on day config, event type, or default
                  let bgColor = 'bg-white';
                  let borderColor = 'border-gray-200';
                  let textColor = 'text-gray-900';
                  let configNote = '';

                  if (dayConfig && dayConfig.status) {
                    // Priority: Day config > Events > Default
                    if (dayConfig.status === 'holiday') {
                      bgColor = 'bg-rose-50';
                      borderColor = 'border-rose-300';
                      textColor = 'text-rose-900';
                      configNote = dayConfig.note ? dayConfig.note : 'Holiday';
                    } else if (dayConfig.status === 'working') {
                      bgColor = 'bg-blue-50';
                      borderColor = 'border-blue-300';
                      textColor = 'text-blue-900';
                      configNote = dayConfig.note ? `Working (${dayConfig.hours}h)` : `Working (${dayConfig.hours}h)`;
                    } else if (dayConfig.status === 'special') {
                      bgColor = 'bg-violet-50';
                      borderColor = 'border-violet-300';
                      textColor = 'text-violet-900';
                      configNote = dayConfig.note || 'Special';
                    } else if (dayConfig.status === 'weekend') {
                      bgColor = 'bg-gray-50';
                      borderColor = 'border-gray-300';
                      textColor = 'text-gray-500';
                      configNote = 'Weekend';
                    }
                  } else if (dayEvents.length > 0) {
                    const eventType = dayEvents[0].type;
                    if (eventType === 'holiday') {
                      bgColor = 'bg-rose-50';
                      borderColor = 'border-rose-300';
                      textColor = 'text-rose-900';
                    } else if (eventType === 'working') {
                      bgColor = 'bg-blue-50';
                      borderColor = 'border-blue-300';
                      textColor = 'text-blue-900';
                    } else if (eventType === 'special') {
                      bgColor = 'bg-violet-50';
                      borderColor = 'border-violet-300';
                      textColor = 'text-violet-900';
                    } else {
                      bgColor = 'bg-amber-50';
                      borderColor = 'border-amber-300';
                      textColor = 'text-amber-900';
                    }
                  } else if (day) {
                    // Default colors for weekdays
                    if (dayOfWeek === 0) {
                      // Sunday - Holiday
                      bgColor = 'bg-rose-50';
                      borderColor = 'border-rose-300';
                    } else if (dayOfWeek === 6) {
                      // Saturday - Working day (6 hours)
                      bgColor = 'bg-blue-50';
                      borderColor = 'border-blue-300';
                    } else {
                      // Monday-Friday - Working days (8 hours)
                      bgColor = 'bg-blue-50';
                      borderColor = 'border-blue-300';
                    }
                  }

                  return (
                    <div
                      key={`day-${idx}`}
                      onClick={() => {
                        if (day) {
                          const events = calendarEvents[dateStr] || [];
                          if (events.length > 0) {
                            setSelectedDateDetail(date);
                            setSelectedEventDate(dateStr);
                          } else {
                            setSelectedDateDetail(date);
                            setEventForm({ title: '', type: 'event', date: dateStr });
                            setShowEventForm(true);
                          }
                        }
                      }}
                      className={`h-20 p-1.5 rounded-lg border-2 transition-all overflow-hidden ${
                        !day
                          ? 'bg-transparent border-transparent'
                          : `${bgColor} ${borderColor} cursor-pointer hover:shadow-lg ${isSelected ? 'ring-2 ring-gray-900 shadow-xl' : ''}`
                      }`}
                    >
                      {day && (
                        <div className="h-full flex flex-col">
                          {/* Date - Always visible first */}
                          <p className="text-base font-bold text-gray-900 mb-1">{day}</p>

                          {/* Events & Config - Compact Text Display */}
                          <div className="flex-1 overflow-hidden text-xs font-medium space-y-0.5">
                            {dayEvents.map((event, eventIdx) => (
                              <p key={eventIdx} className={`truncate ${textColor}`}>
                                {event.title}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              </div>

            {/* Event Form Modal */}
            {showEventForm && selectedDateDetail && (
                <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-gray-900">
                        {editingEventIndex !== null ? 'Edit Event' : 'Add Event'}
                      </h3>
                      <button
                        onClick={() => {
                          setShowEventForm(false);
                          setEditingEventIndex(null);
                        }}
                        className="p-1 hover:bg-gray-100 rounded text-gray-600"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <p className="text-sm text-gray-600">
                      {selectedDateDetail.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>

                    {/* Event Title */}
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">Event Title</label>
                      <input
                        type="text"
                        placeholder="e.g., Holiday, Meeting, etc."
                        value={eventForm.title}
                        onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>

                    {/* Event Description/Note */}
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">Description (Optional)</label>
                      <textarea
                        placeholder="Add any notes or details..."
                        value={eventForm.description || ''}
                        onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        rows="3"
                      />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={async () => {
                          if (eventForm.title) {
                            const dateStr = eventForm.date || formatDate(selectedDateDetail);
                            try {
                              if (editingEventIndex !== null && eventForm.date) {
                                // Update existing event - use the event's original date
                                const eventToUpdate = (calendarEvents[eventForm.date] || [])[editingEventIndex];
                                if (eventToUpdate && eventToUpdate.id) {
                                  await updateDoc(doc(db, 'calendarEvents', eventToUpdate.id), {
                                    title: eventForm.title,
                                    description: eventForm.description || ''
                                  });
                                }
                                const updatedEvents = [...(calendarEvents[eventForm.date] || [])];
                                updatedEvents[editingEventIndex] = {
                                  ...updatedEvents[editingEventIndex],
                                  title: eventForm.title,
                                  description: eventForm.description || ''
                                };
                                setCalendarEvents({
                                  ...calendarEvents,
                                  [eventForm.date]: updatedEvents
                                });
                                setEditingEventIndex(null);
                              } else {
                                // Add new event
                                const newEvent = {
                                  title: eventForm.title,
                                  type: 'event',
                                  description: eventForm.description || '',
                                  date: dateStr,
                                  companyId: 'default',
                                  createdAt: new Date()
                                };
                                const docRef = await addDoc(collection(db, 'calendarEvents'), newEvent);
                                setCalendarEvents({
                                  ...calendarEvents,
                                  [dateStr]: [...(calendarEvents[dateStr] || []), { id: docRef.id, ...newEvent }]
                                });
                              }
                              setShowEventForm(false);
                              setEventForm({ title: '', type: 'event', date: null, description: '' });
                              setSuccess('✅ Event saved!');
                            } catch (error) {
                              console.error('Error saving event:', error);
                              setError('Error saving event');
                            }
                          }
                        }}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition text-sm"
                      >
                        {editingEventIndex !== null ? 'Update Event' : 'Add Event'}
                      </button>
                      <button
                        onClick={() => {
                          setShowEventForm(false);
                          setEventForm({ title: '', type: 'event', date: null });
                          setEditingEventIndex(null);
                        }}
                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold py-2 rounded-lg transition text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}



              {/* Event Details Modal */}
              {selectedEventDate && (calendarEvents[selectedEventDate] || []).length > 0 && (
                <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg text-gray-900">
                        📅 {selectedDateDetail ? selectedDateDetail.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Events'}
                      </h3>
                      <button
                        onClick={() => setSelectedEventDate(null)}
                        className="text-gray-400 hover:text-gray-600 transition"
                      >
                        <X size={24} />
                      </button>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {(calendarEvents[selectedEventDate] || []).map((event, idx) => {
                        let eventBg = 'bg-blue-50';
                        let eventBorder = 'border-blue-300';
                        let eventText = 'text-blue-900';
                        let eventIcon = '📌';

                        if (event.type === 'holiday') {
                          eventBg = 'bg-rose-50';
                          eventBorder = 'border-rose-300';
                          eventText = 'text-rose-900';
                          eventIcon = '🎉';
                        } else if (event.type === 'special') {
                          eventBg = 'bg-violet-50';
                          eventBorder = 'border-violet-300';
                          eventText = 'text-violet-900';
                          eventIcon = '⭐';
                        } else if (event.type === 'event') {
                          eventBg = 'bg-amber-50';
                          eventBorder = 'border-amber-300';
                          eventText = 'text-amber-900';
                          eventIcon = '📋';
                        }

                        return (
                          <div key={idx} className={`${eventBg} border-2 ${eventBorder} rounded-lg p-4 flex items-start justify-between gap-3 shadow-sm`}>
                            <div className="flex-1 min-w-0">
                              <p className={`font-bold text-base ${eventText}`}>{eventIcon} {event.title}</p>
                              {event.description && (
                                <p className="text-sm text-gray-700 mt-2">{event.description}</p>
                              )}
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <button
                                onClick={() => {
                                  setEventForm({
                                    title: event.title,
                                    type: event.type,
                                    date: selectedEventDate,
                                    description: event.description || ''
                                  });
                                  setEditingEventIndex(idx);
                                  setShowEventForm(true);
                                  setSelectedEventDate(null);
                                }}
                                className={`p-2 rounded-lg transition hover:opacity-80 ${eventText}`}
                                title="Edit"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    const eventToDelete = (calendarEvents[selectedEventDate] || [])[idx];
                                    if (eventToDelete && eventToDelete.id) {
                                      await deleteDoc(doc(db, 'calendarEvents', eventToDelete.id));
                                    }
                                    const updatedEvents = (calendarEvents[selectedEventDate] || []).filter((_, i) => i !== idx);
                                    if (updatedEvents.length === 0) {
                                      const newEvents = { ...calendarEvents };
                                      delete newEvents[selectedEventDate];
                                      setCalendarEvents(newEvents);
                                      setSelectedEventDate(null);
                                    } else {
                                      setCalendarEvents({
                                        ...calendarEvents,
                                        [selectedEventDate]: updatedEvents
                                      });
                                    }
                                    setSuccess('✅ Event deleted!');
                                  } catch (error) {
                                    console.error('Error deleting event:', error);
                                    setError('Error deleting event');
                                  }
                                }}
                                className={`p-2 rounded-lg transition hover:bg-red-100 text-red-600 hover:text-red-800`}
                                title="Delete"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
}
