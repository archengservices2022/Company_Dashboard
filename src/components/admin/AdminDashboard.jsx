import React, { useState } from 'react';
import { Users, Calendar, Clipboard, DollarSign, Briefcase, TrendingUp, UserCheck } from 'lucide-react';
import EmployeeManagement from './EmployeeManagement';
import HolidayManagement from './HolidayManagement';
import TaskManagement from './TaskManagement';
import ProjectsManagement from './ProjectsManagement';
import AttendanceManagement from './AttendanceManagement';
import FinanceTab from './FinanceTab';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('employees');

  const tabs = [
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'attendance', label: 'Attendance', icon: UserCheck },
    { id: 'holidays', label: 'Holidays', icon: Calendar },
    { id: 'tasks', label: 'Tasks', icon: Clipboard },
    { id: 'projects', label: 'Projects', icon: Briefcase },
    { id: 'finance', label: 'Finance', icon: TrendingUp },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`p-3 rounded-lg shadow transition duration-200 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:shadow-lg'
              }`}
            >
              <Icon className="w-5 h-5 mx-auto mb-1" />
              <p className="font-semibold text-xs">{tab.label}</p>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {activeTab === 'employees' && <EmployeeManagement />}
        {activeTab === 'attendance' && <AttendanceManagement />}
        {activeTab === 'holidays' && <HolidayManagement />}
        {activeTab === 'tasks' && <TaskManagement />}
        {activeTab === 'projects' && <ProjectsManagement />}
        {activeTab === 'finance' && <FinanceTab />}
      </div>
    </div>
  );
}
