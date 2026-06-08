import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebase';
import { getDocs, query, where, collection } from 'firebase/firestore';
import { Briefcase, Calendar, CheckSquare, DollarSign, User, FolderOpen } from 'lucide-react';
import Profile from './Profile';
import Tasks from './Tasks';
import Holidays from './Holidays';
import Attendance from './Attendance';
import Salary from './Salary';
import Projects from './Projects';

export default function EmployeeDashboard() {
  const [activeTab, setActiveTab] = useState('tasks');

  const menuItems = [
    { id: 'tasks', label: 'Tasks', icon: Briefcase },
    { id: 'projects', label: 'Projects', icon: FolderOpen },
    { id: 'attendance', label: 'Attendance', icon: CheckSquare },
    { id: 'holidays', label: 'Holidays', icon: Calendar },
    { id: 'salary', label: 'Salary', icon: DollarSign },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Sidebar Navigation */}
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-48 flex-shrink-0">
            <nav className="space-y-2">
              {/* Profile Section */}
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${
                  activeTab === 'profile'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                <User className="inline mr-2" size={18} />
                My Profile
              </button>

              {/* Menu Items */}
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${
                      activeTab === item.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="inline mr-2" size={18} />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              {activeTab === 'profile' && <Profile />}
              {activeTab === 'tasks' && <Tasks />}
              {activeTab === 'projects' && <Projects />}
              {activeTab === 'attendance' && <Attendance />}
              {activeTab === 'holidays' && <Holidays />}
              {activeTab === 'salary' && <Salary />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
