import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { TrendingDown, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

export default function AttendanceReport() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().split('T')[0].slice(0, 7));
  const [employees, setEmployees] = useState([]);
  const [workingHours, setWorkingHours] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [workingDaysConfig, setWorkingDaysConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    fetchAllData();
  }, [selectedMonth]);

  const fetchAllData = async () => {
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
      const hoursQuery = query(collection(db, 'workingHours'), where('companyId', '==', 'default'));
      const hoursSnapshot = await getDocs(hoursQuery);
      const filteredHours = hoursSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(h => h.date.slice(0, 7) === selectedMonth);
      setWorkingHours(filteredHours);

      // Fetch holidays
      const holidayQuery = query(collection(db, 'holidays'), where('companyId', '==', 'default'));
      const holidaySnapshot = await getDocs(holidayQuery);
      const holidayDates = holidaySnapshot.docs.map(doc => doc.data().date);
      setHolidays(holidayDates);

      // Fetch working days config
      const configQuery = query(collection(db, 'workingDaysConfig'), where('companyId', '==', 'default'));
      const configSnapshot = await getDocs(configQuery);
      if (configSnapshot.docs.length > 0) {
        setWorkingDaysConfig(configSnapshot.docs[0].data());
      }

      // Generate reports after data is fetched
      generateReports(empData, filteredHours, holidayDates);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const isWeekend = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.getDay() === 0 || date.getDay() === 6;
  };

  const getDayOfWeek = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()].toLowerCase();
  };

  const getExpectedHours = (dateString) => {
    if (!workingDaysConfig) return 0;

    const dayOfWeek = getDayOfWeek(dateString);
    const dayConfig = workingDaysConfig[dayOfWeek];

    if (!dayConfig || !dayConfig.isWorkingDay) return 0;
    return dayConfig.hours;
  };

  const getDaysInMonth = (monthStr) => {
    const [year, month] = monthStr.split('-');
    return new Date(year, parseInt(month), 0).getDate();
  };

  const generateReports = (empData, hoursData, holidayDates) => {
    const daysInMonth = getDaysInMonth(selectedMonth);
    const reportsData = [];

    empData.forEach(employee => {
      let totalExpectedHours = 0;
      let totalActualHours = 0;
      let daysLogged = 0;
      let daysAbsent = 0;
      let daysOnLeave = 0;
      const dayDetails = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${selectedMonth}-${String(day).padStart(2, '0')}`;
        const expectedHours = getExpectedHours(dateStr);
        const isHoliday = holidayDates.includes(dateStr);

        const log = hoursData.find(h => h.employeeId === employee.id && h.date === dateStr);

        let dayStatus = 'absent';
        let actualHours = 0;

        if (log) {
          dayStatus = 'logged';
          actualHours = log.hoursWorked;
          daysLogged++;
          totalActualHours += actualHours;
        } else if (isHoliday || expectedHours === 0) {
          dayStatus = 'holiday';
          daysOnLeave++;
        } else {
          dayStatus = 'absent';
          daysAbsent++;
        }

        totalExpectedHours += expectedHours;

        dayDetails.push({
          date: dateStr,
          dayOfWeek: getDayOfWeek(dateStr),
          expectedHours,
          actualHours,
          status: dayStatus
        });
      }

      const variance = totalActualHours - totalExpectedHours;
      const variancePercent = totalExpectedHours > 0 ? ((variance / totalExpectedHours) * 100).toFixed(1) : 0;

      reportsData.push({
        employeeId: employee.id,
        name: employee.name,
        position: employee.position,
        totalExpectedHours: totalExpectedHours.toFixed(1),
        totalActualHours: totalActualHours.toFixed(1),
        variance: variance.toFixed(1),
        variancePercent,
        daysLogged,
        daysAbsent,
        daysOnLeave,
        dayDetails
      });
    });

    setReports(reportsData.sort((a, b) => a.name.localeCompare(b.name)));
  };

  const getVarianceColor = (variance) => {
    if (variance > 5) return 'bg-green-100 text-green-800';
    if (variance > -5) return 'bg-blue-100 text-blue-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Generating attendance reports...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Professional Attendance Report</h2>
        <p className="text-gray-600 text-sm">Comprehensive working hours analysis with expected vs actual hours</p>
      </div>

      {/* Month Selection */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow border border-gray-200">
        <label className="block text-sm font-semibold text-gray-700 mb-2">📅 Select Month</label>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Employee Reports */}
      {reports.length > 0 ? (
        <div className="space-y-6">
          {reports.map((report) => {
            const variance = parseFloat(report.variance);
            const isOverworked = variance > 5;
            const isUnderworked = variance < -5;

            return (
              <div key={report.employeeId} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow hover:shadow-lg transition-shadow">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-lg font-bold text-gray-900">{report.name}</p>
                      <p className="text-sm text-gray-600">{report.position}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isOverworked && (
                        <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                          <TrendingUp size={14} /> Overworked
                        </span>
                      )}
                      {isUnderworked && (
                        <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full">
                          <TrendingDown size={14} /> Underworked
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 p-6 border-b border-gray-200">
                  <div>
                    <p className="text-gray-600 text-xs font-medium uppercase">Expected Hours</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{report.totalExpectedHours}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs font-medium uppercase">Actual Hours</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{report.totalActualHours}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs font-medium uppercase">Variance</p>
                    <div className={`text-2xl font-bold mt-1 ${
                      variance > 0 ? 'text-green-600' : variance < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {variance > 0 ? '+' : ''}{report.variance}
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs font-medium uppercase">Days Logged</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">{report.daysLogged}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs font-medium uppercase">Absent Days</p>
                    <p className="text-2xl font-bold text-orange-600 mt-1">{report.daysAbsent}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs font-medium uppercase">Leave Days</p>
                    <p className="text-2xl font-bold text-purple-600 mt-1">{report.daysOnLeave}</p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                  <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${getVarianceColor(variance)}`}>
                    {isOverworked
                      ? `✅ Exceeding by ${report.variancePercent}%`
                      : isUnderworked
                      ? `⚠️ Short by ${Math.abs(report.variancePercent)}%`
                      : `✓ On Target (${report.variancePercent}%)`}
                  </span>
                </div>

                {/* Daily Breakdown (Summary) */}
                <div className="px-6 py-4">
                  <p className="text-sm font-semibold text-gray-900 mb-3">Daily Summary</p>
                  <div className="flex flex-wrap gap-2">
                    {report.dayDetails.slice(0, 10).map((day, idx) => (
                      <div key={idx} className="flex flex-col items-center text-center text-xs">
                        <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-white ${
                          day.status === 'logged' ? 'bg-green-600' :
                          day.status === 'holiday' ? 'bg-purple-600' :
                          day.status === 'absent' ? 'bg-red-600' : 'bg-gray-400'
                        }`}>
                          {parseInt(day.date.split('-')[2])}
                        </div>
                        <span className="text-gray-600 text-xs mt-1">{day.dayOfWeek.slice(0, 3)}</span>
                      </div>
                    ))}
                    {report.dayDetails.length > 10 && (
                      <div className="flex items-center text-gray-600 text-xs px-2">
                        +{report.dayDetails.length - 10} more
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg font-semibold">No data available for this period</p>
        </div>
      )}

      {/* Legend */}
      <div className="mt-8 bg-gray-50 rounded-xl p-6">
        <h3 className="font-bold text-gray-900 mb-4">📋 Report Terminology</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="font-semibold text-gray-900 text-sm mb-2">📊 Metrics:</p>
            <ul className="text-sm text-gray-700 space-y-1">
              <li><strong>Expected Hours:</strong> Total hours employee should work in month</li>
              <li><strong>Actual Hours:</strong> Total hours employee actually worked</li>
              <li><strong>Variance:</strong> Difference (Positive = more worked, Negative = less worked)</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm mb-2">📅 Day Status:</p>
            <ul className="text-sm text-gray-700 space-y-1">
              <li><span className="bg-green-600 text-white px-2 py-0.5 rounded text-xs">●</span> Logged: Work hours recorded</li>
              <li><span className="bg-purple-600 text-white px-2 py-0.5 rounded text-xs">●</span> Holiday: Approved leave/holiday</li>
              <li><span className="bg-red-600 text-white px-2 py-0.5 rounded text-xs">●</span> Absent: No log, no holiday</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
