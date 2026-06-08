import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../config/firebase';
import AdminDashboard from '../components/admin/AdminDashboard';
import EmployeeDashboard from '../components/employee/EmployeeDashboard';
import { LogOut, Building2, Clock } from 'lucide-react';

export default function Dashboard() {
  const { user, userRole, logout, loading, isCreatingEmployee } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = React.useState('');
  const [displayRole, setDisplayRole] = React.useState('');

  React.useEffect(() => {
    if (user && userRole) {
      fetchUserDetails();
    }
  }, [user, userRole]);

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 w-full flex-grow">
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
