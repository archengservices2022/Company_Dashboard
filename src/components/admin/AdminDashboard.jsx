import React, { useState, useEffect } from 'react';
import { Users, Calendar, Clipboard, DollarSign, Briefcase, TrendingUp, UserCheck, Menu, X, Home, Settings, ChevronRight } from 'lucide-react';
import { db } from '../../config/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import EmployeeManagement from './EmployeeManagement';
import TaskManagement from './TaskManagement';
import ProjectsManagement from './ProjectsManagement';
import AttendanceManagementNew from './AttendanceManagementNew';
import FinanceTab from './FinanceTab';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState({
    employees: 0,
    tasks: 0,
    projects: 0,
    activeProjects: 0
  });

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'attendance', label: 'Attendance Management', icon: Calendar },
    { id: 'holidays', label: 'Holidays & Events', icon: Users },
    { id: 'tasks', label: 'Tasks', icon: Clipboard },
    { id: 'projects', label: 'Projects', icon: Briefcase },
    { id: 'finance', label: 'Finance', icon: TrendingUp },
  ];

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const empQuery = query(collection(db, 'employees'), where('companyId', '==', 'default'));
      const empSnapshot = await getDocs(empQuery);

      const tasksQuery = query(collection(db, 'tasks'), where('companyId', '==', 'default'));
      const tasksSnapshot = await getDocs(tasksQuery);

      const projQuery = query(collection(db, 'projects'), where('companyId', '==', 'default'));
      const projSnapshot = await getDocs(projQuery);
      const activeProjects = projSnapshot.docs.filter(p => p.data().status === 'active').length;

      setStats({
        employees: empSnapshot.size,
        tasks: tasksSnapshot.size,
        projects: projSnapshot.size,
        activeProjects
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const KPICard = ({ icon: Icon, title, value, change, color }) => (
    <div className={`group rounded-xl border border-gray-200 p-5 transition-all duration-300 hover:shadow-xl hover:border-gray-300 ${
      color === 'blue' ? 'bg-gradient-to-br from-blue-50 to-blue-50' :
      color === 'green' ? 'bg-gradient-to-br from-green-50 to-green-50' :
      color === 'purple' ? 'bg-gradient-to-br from-purple-50 to-purple-50' :
      'bg-gradient-to-br from-amber-50 to-amber-50'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-lg ${
          color === 'blue' ? 'bg-blue-100' :
          color === 'green' ? 'bg-green-100' :
          color === 'purple' ? 'bg-purple-100' :
          'bg-amber-100'
        }`}>
          <Icon size={20} color={
            color === 'blue' ? '#2563eb' :
            color === 'green' ? '#16a34a' :
            color === 'purple' ? '#9333ea' :
            '#d97706'
          } strokeWidth={2} />
        </div>
        {change && (
          <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded">
            {change}
          </span>
        )}
      </div>
      <p className="text-gray-600 text-sm font-medium">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
    </div>
  );

  const DashboardOverview = () => (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 text-sm mt-1">Monitor your organization's performance and metrics</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={Users}
          title="Total Employees"
          value={stats.employees}
          change={`+${Math.floor(stats.employees * 0.1)} this month`}
          color="blue"
        />
        <KPICard
          icon={Clipboard}
          title="Active Tasks"
          value={stats.tasks}
          change="+5 today"
          color="green"
        />
        <KPICard
          icon={Briefcase}
          title="Total Projects"
          value={stats.projects}
          change={`${stats.activeProjects} active`}
          color="purple"
        />
        <KPICard
          icon={DollarSign}
          title="Total Budget"
          value="₹ 0"
          color="amber"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2 Units */}
        <div className="lg:col-span-2 space-y-6">
          {/* Employees Overview */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Employees Overview</h2>
              <button onClick={() => setActiveTab('employees')} className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                View All <ChevronRight size={16} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <p className="text-gray-600 text-xs font-medium uppercase">Total</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">{stats.employees}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <p className="text-gray-600 text-xs font-medium uppercase">Active</p>
                <p className="text-2xl font-bold text-green-600 mt-2">{Math.round(stats.employees * 0.95)}</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                <p className="text-gray-600 text-xs font-medium uppercase">On Leave</p>
                <p className="text-2xl font-bold text-amber-600 mt-2">{Math.round(stats.employees * 0.05)}</p>
              </div>
            </div>
          </div>

          {/* Tasks Overview */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Tasks Overview</h2>
              <button onClick={() => setActiveTab('tasks')} className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                View All <ChevronRight size={16} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
                <p className="text-gray-600 text-xs font-medium uppercase">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 mt-2">{Math.round(stats.tasks * 0.3)}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <p className="text-gray-600 text-xs font-medium uppercase">In Progress</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">{Math.round(stats.tasks * 0.5)}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <p className="text-gray-600 text-xs font-medium uppercase">Completed</p>
                <p className="text-2xl font-bold text-green-600 mt-2">{Math.round(stats.tasks * 0.2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar Info */}
        <div className="space-y-6">
          {/* Projects */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Projects Status</h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Total Projects</span>
                  <span className="text-xl font-bold text-purple-600">{stats.projects}</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-600 rounded-full" style={{width: '100%'}}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Active</span>
                  <span className="text-xl font-bold text-green-600">{stats.activeProjects}</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-600 rounded-full" style={{width: `${stats.projects > 0 ? (stats.activeProjects / stats.projects) * 100 : 0}%`}}></div>
                </div>
              </div>
            </div>
            <button onClick={() => setActiveTab('projects')} className="w-full mt-4 bg-purple-50 hover:bg-purple-100 text-purple-600 font-medium py-2 rounded-lg transition">
              View Projects
            </button>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Links</h2>
            <div className="space-y-2">
              <button onClick={() => setActiveTab('employees')} className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition text-left">
                <span className="text-gray-700 text-sm font-medium">Manage Employees</span>
                <ChevronRight size={16} className="text-gray-400" />
              </button>
              <button onClick={() => setActiveTab('holidays')} className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition text-left">
                <span className="text-gray-700 text-sm font-medium">Holiday Calendar</span>
                <ChevronRight size={16} className="text-gray-400" />
              </button>
              <button onClick={() => setActiveTab('attendance')} className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition text-left">
                <span className="text-gray-700 text-sm font-medium">Working Hours</span>
                <ChevronRight size={16} className="text-gray-400" />
              </button>
              <button onClick={() => setActiveTab('finance')} className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition text-left">
                <span className="text-gray-700 text-sm font-medium">Finance Data</span>
                <ChevronRight size={16} className="text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Timeline Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex gap-4 pb-4 border-b border-gray-200 last:border-0">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="text-gray-900 font-medium text-sm">New Employee Added</p>
              <p className="text-gray-600 text-xs mt-1">John Doe joined the organization</p>
              <p className="text-gray-400 text-xs mt-2">2 hours ago</p>
            </div>
          </div>
          <div className="flex gap-4 pb-4 border-b border-gray-200 last:border-0">
            <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="text-gray-900 font-medium text-sm">Task Completed</p>
              <p className="text-gray-600 text-xs mt-1">Dashboard UI - Frontend Design project</p>
              <p className="text-gray-400 text-xs mt-2">5 hours ago</p>
            </div>
          </div>
          <div className="flex gap-4 pb-4 border-b border-gray-200 last:border-0">
            <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="text-gray-900 font-medium text-sm">Project Started</p>
              <p className="text-gray-600 text-xs mt-1">Mobile App Redesign - New Budget Allocated</p>
              <p className="text-gray-400 text-xs mt-2">1 day ago</p>
            </div>
          </div>
          <div className="flex gap-4 pb-4 border-b border-gray-200 last:border-0">
            <div className="w-2 h-2 bg-amber-600 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="text-gray-900 font-medium text-sm">Holiday Added</p>
              <p className="text-gray-600 text-xs mt-1">Annual vacation period created for Q3</p>
              <p className="text-gray-400 text-xs mt-2">3 days ago</p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Performance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Top Performers</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">JD</span>
                </div>
                <div>
                  <p className="text-gray-900 text-sm font-medium">John Doe</p>
                  <p className="text-gray-600 text-xs">Product Manager</p>
                </div>
              </div>
              <span className="text-emerald-600 font-bold text-sm">95%</span>
            </div>
            <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-bold text-sm">SA</span>
                </div>
                <div>
                  <p className="text-gray-900 text-sm font-medium">Sarah Anderson</p>
                  <p className="text-gray-600 text-xs">Senior Developer</p>
                </div>
              </div>
              <span className="text-emerald-600 font-bold text-sm">92%</span>
            </div>
            <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <span className="text-amber-600 font-bold text-sm">MP</span>
                </div>
                <div>
                  <p className="text-gray-900 text-sm font-medium">Mike Peterson</p>
                  <p className="text-gray-600 text-xs">Designer</p>
                </div>
              </div>
              <span className="text-emerald-600 font-bold text-sm">89%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Department Overview</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700 text-sm font-medium">Engineering</span>
                <span className="text-gray-900 font-bold text-sm">{Math.round(stats.employees * 0.4)}</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{width: '40%'}}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700 text-sm font-medium">Design</span>
                <span className="text-gray-900 font-bold text-sm">{Math.round(stats.employees * 0.25)}</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-purple-600 rounded-full" style={{width: '25%'}}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700 text-sm font-medium">Management</span>
                <span className="text-gray-900 font-bold text-sm">{Math.round(stats.employees * 0.2)}</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full" style={{width: '20%'}}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700 text-sm font-medium">Operations</span>
                <span className="text-gray-900 font-bold text-sm">{Math.round(stats.employees * 0.15)}</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-amber-600 rounded-full" style={{width: '15%'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Performance Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <p className="text-gray-600 text-xs font-medium uppercase">Task Completion Rate</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">87%</p>
            <p className="text-xs text-gray-600 mt-2">↑ 5% from last month</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
            <p className="text-gray-600 text-xs font-medium uppercase">Employee Satisfaction</p>
            <p className="text-2xl font-bold text-green-600 mt-2">4.5/5</p>
            <p className="text-xs text-gray-600 mt-2">↑ 0.2 from last month</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
            <p className="text-gray-600 text-xs font-medium uppercase">Attendance Rate</p>
            <p className="text-2xl font-bold text-purple-600 mt-2">94%</p>
            <p className="text-xs text-gray-600 mt-2">↑ 2% from last month</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200">
            <p className="text-gray-600 text-xs font-medium uppercase">Budget Utilization</p>
            <p className="text-2xl font-bold text-amber-600 mt-2">72%</p>
            <p className="text-xs text-gray-600 mt-2">↑ 8% from last month</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex bg-gray-50 min-h-screen">
      {/* Sidebar */}
      <div className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700 transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 flex flex-col overflow-hidden h-screen md:h-auto`}>
        {/* Premium Gradient Background */}
        <style>{`
          @keyframes gradientShift {
            0%, 100% { opacity: 0.3; transform: translateY(0px); }
            50% { opacity: 0.5; transform: translateY(-4px); }
          }
          .gradient-accent {
            animation: gradientShift 6s ease-in-out infinite;
          }
        `}</style>
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-500 to-transparent rounded-full blur-3xl gradient-accent"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-purple-500 to-transparent rounded-full blur-3xl gradient-accent" style={{animationDelay: '2s'}}></div>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg"
        >
          <X size={24} />
        </button>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2 relative z-10">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Icon size={20} strokeWidth={2} />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700 relative z-10 bg-slate-800/50 backdrop-blur-sm">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition text-sm font-medium">
            <Settings size={20} strokeWidth={2} />
            Settings
          </button>
          <p className="text-xs text-slate-400 text-center mt-4 font-semibold">SKT Innovations</p>
          <p className="text-xs text-slate-500 text-center">Admin Portal v1.0.0</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full">
        <div className="p-6 lg:p-8 w-full">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden mb-6 p-2 hover:bg-gray-200 rounded-lg"
          >
            <Menu size={24} />
          </button>

          {activeTab === 'dashboard' && <DashboardOverview />}
          {activeTab === 'employees' && <EmployeeManagement />}
          {activeTab === 'attendance' && <AttendanceManagementNew activeTab="attendance" />}
          {activeTab === 'holidays' && <AttendanceManagementNew activeTab="holidays-events" />}
          {activeTab === 'tasks' && <TaskManagement />}
          {activeTab === 'projects' && <ProjectsManagement />}
          {activeTab === 'finance' && <FinanceTab />}
        </div>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-30"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}
