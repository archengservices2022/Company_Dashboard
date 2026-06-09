import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../config/firebase';
import AdminDashboard from '../components/admin/AdminDashboard';
import EmployeeDashboard from '../components/employee/EmployeeDashboard';
import { LogOut, Building2, Clock, Bell, X } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';

export default function Dashboard() {
  const { user, userRole, logout, loading, isCreatingEmployee } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = React.useState('');
  const [displayRole, setDisplayRole] = React.useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationInput, setNotificationInput] = useState('');

  React.useEffect(() => {
    if (user && userRole) {
      fetchUserDetails();
      if (userRole === 'admin') {
        fetchNotifications();
      }
    }
  }, [user, userRole]);

  const fetchNotifications = async () => {
    try {
      const notifQuery = query(
        collection(db, 'notifications'),
        where('companyId', '==', 'default')
      );
      const notifSnapshot = await getDocs(notifQuery);
      const notifList = notifSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => b.createdAt - a.createdAt);
      setNotifications(notifList);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const addNotification = async () => {
    if (!notificationInput.trim()) return;
    try {
      const { addDoc } = await import('firebase/firestore');
      await addDoc(collection(db, 'notifications'), {
        message: notificationInput,
        createdAt: new Date(),
        companyId: 'default',
        type: 'general'
      });
      setNotificationInput('');
      await fetchNotifications();
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  };

  const deleteNotification = async (notifId) => {
    try {
      const { deleteDoc, doc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'notifications', notifId));
      await fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const fetchUserDetails = async () => {
    try {
      if (userRole === 'admin') {
        setDisplayName('Admin');
        setDisplayRole('Administrator');
      } else {
        // Fetch employee details
        const { getDocs, query, collection, where } = await import('firebase/firestore');
        const employeesQuery = query(
          collection(db, 'employees'),
          where('email', '==', user.email)
        );
        const querySnapshot = await getDocs(employeesQuery);
        if (querySnapshot.docs.length > 0) {
          const employeeData = querySnapshot.docs[0].data();
          setDisplayName(employeeData.name || user.email);
          setDisplayRole(employeeData.position || 'Employee');
        }
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      setDisplayName(user.email);
      setDisplayRole(userRole);
    }
  };

  // Debug logging
  useEffect(() => {
    console.log('Dashboard - User:', user?.email);
    console.log('Dashboard - UserRole:', userRole);
    console.log('Dashboard - Loading:', loading);
    console.log('Dashboard - IsCreatingEmployee:', isCreatingEmployee);
  }, [user, userRole, loading, isCreatingEmployee]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Check if just created employee
  useEffect(() => {
    if (localStorage.getItem('justCreatedEmployee')) {
      localStorage.removeItem('justCreatedEmployee');
      navigate('/login?message=Employee created successfully! Please log back in as admin.');
    }
  }, [navigate]);

  if (!user) {
    navigate('/login');
    return null;
  }

  // Ensure role is loaded before rendering
  if (!userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your role...</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-3 sm:px-4 lg:px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Left: Company Logo & Title */}
            <div className="flex items-center gap-3">
              <img src="/skt-logo.png" alt="SKT" className="h-12 w-12 object-contain" />
              <div>
                <h1 className="text-2xl font-bold text-blue-900">SKT Innovations</h1>
                <p className={`text-sm font-bold ${
                  userRole === 'admin' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {userRole === 'admin' ? '👨‍💼 ADMIN PANEL' : '👤 EMPLOYEE PORTAL'}
                </p>
              </div>
            </div>

            {/* Right: User Info & Controls */}
            <div className="flex items-center gap-6">
              {/* Time Display */}
              <div className="hidden md:flex items-center gap-2 text-gray-600">
                <Clock size={18} />
                <span className="text-sm font-medium">{currentTime}</span>
              </div>

              {/* Notification Bell - Admin Only */}
              {userRole === 'admin' && (
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 hover:bg-gray-100 rounded-lg transition text-gray-700"
                  >
                    <Bell size={20} />
                    {notifications.length > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50">
                      <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <h3 className="font-bold text-gray-900">Notifications</h3>
                      </div>

                      {/* Add Notification */}
                      <div className="p-4 border-b border-gray-200">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={notificationInput}
                            onChange={(e) => setNotificationInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addNotification()}
                            placeholder="Add notification..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={addNotification}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                          >
                            Add
                          </button>
                        </div>
                      </div>

                      {/* Notifications List */}
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                          <div className="divide-y divide-gray-200">
                            {notifications.map((notif) => (
                              <div key={notif.id} className="p-4 hover:bg-gray-50 transition flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <p className="text-gray-900 text-sm font-medium">{notif.message}</p>
                                  <p className="text-gray-500 text-xs mt-1">
                                    {notif.createdAt?.toDate?.().toLocaleString() || 'Just now'}
                                  </p>
                                </div>
                                <button
                                  onClick={() => deleteNotification(notif.id)}
                                  className="text-gray-400 hover:text-red-600 transition"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-8 text-center">
                            <p className="text-gray-500 text-sm">No notifications yet</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* User Section */}
              <div className="border-l border-gray-200 pl-6">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{displayName}</p>
                  <p className="text-xs text-indigo-600 font-bold uppercase tracking-wide">{displayRole}</p>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition duration-200 font-medium shadow-md hover:shadow-lg"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full flex-grow">
        {userRole && userRole.toLowerCase() === 'admin' ? <AdminDashboard /> : <EmployeeDashboard />}
      </main>

      {/* Footer */}
      <footer className="bg-blue-900 mt-auto w-full py-4">
        <div className="w-full text-center">
          <p className="text-blue-100 text-sm">
            © 2026 SKT Innovations Pvt Ltd. All rights reserved. | 📧 info.sktinnovationspvtltd@gmail.com
          </p>
        </div>
      </footer>
    </div>
  );
}
