import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebase';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { DollarSign, Bell, Download } from 'lucide-react';

export default function Salary() {
  const { user } = useAuth();
  const [employeeData, setEmployeeData] = useState(null);
  const [salarySlips, setSalarySlips] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchEmployeeData();
    }
  }, [user]);

  const fetchEmployeeData = async () => {
    setLoading(true);
    try {
      const employeesQuery = query(
        collection(db, 'employees'),
        where('email', '==', user.email)
      );
      const employeesSnapshot = await getDocs(employeesQuery);
      if (employeesSnapshot.docs.length > 0) {
        const employeeDoc = employeesSnapshot.docs[0];
        setEmployeeData({
          id: employeeDoc.id,
          ...employeeDoc.data()
        });
      }

      const salaryQuery = query(
        collection(db, 'salarySlips'),
        where('employeeEmail', '==', user.email)
      );
      const salarySnapshot = await getDocs(salaryQuery);
      const salaryData = salarySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      setSalarySlips(salaryData);

      const announcementsQuery = query(
        collection(db, 'announcements'),
        where('companyId', '==', 'default')
      );
      const announcementsSnapshot = await getDocs(announcementsQuery);
      const announcementsData = announcementsSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setAnnouncements(announcementsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Salary & Announcements</h2>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Salary Overview */}
          {employeeData && (
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <DollarSign size={24} />
                Current Salary Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white bg-opacity-10 rounded-lg p-4">
                  <p className="text-blue-100 text-sm mb-1">Monthly Salary</p>
                  <p className="text-2xl font-bold">${parseInt(employeeData.salary || 0).toLocaleString()}</p>
                </div>
                <div className="bg-white bg-opacity-10 rounded-lg p-4">
                  <p className="text-blue-100 text-sm mb-1">Annual Salary</p>
                  <p className="text-2xl font-bold">${(parseInt(employeeData.salary || 0) * 12).toLocaleString()}</p>
                </div>
                <div className="bg-white bg-opacity-10 rounded-lg p-4">
                  <p className="text-blue-100 text-sm mb-1">Position</p>
                  <p className="text-2xl font-bold">{employeeData.position}</p>
                </div>
              </div>
            </div>
          )}

          {/* Salary Slips */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Salary Slips</h3>
            {salarySlips.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {salarySlips.map((slip) => (
                  <div key={slip.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {new Date(slip.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </p>
                        <p className="text-sm text-gray-600">Salary Slip</p>
                      </div>
                      <button className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
                        <Download size={18} />
                        Download
                      </button>
                    </div>
                    <div className="border-t pt-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Basic Salary:</span>
                        <span className="font-semibold text-gray-900">${slip.basicSalary || slip.amount || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Deductions:</span>
                        <span className="font-semibold text-red-600">-${slip.deductions || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm border-t pt-2 mt-2">
                        <span className="text-gray-900 font-semibold">Net Salary:</span>
                        <span className="font-bold text-green-600">${(slip.amount || slip.basicSalary || 0) - (slip.deductions || 0)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <DollarSign size={40} className="mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">No salary slips available yet</p>
              </div>
            )}
          </div>

          {/* Announcements */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Bell size={24} />
              Company Announcements
            </h3>
            {announcements.length > 0 ? (
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg hover:shadow transition">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-900">{announcement.title}</h4>
                      <span className="text-xs text-gray-600">
                        {new Date(announcement.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm">{announcement.content}</p>
                    {announcement.category && (
                      <span className="inline-block mt-3 px-3 py-1 bg-blue-200 text-blue-800 text-xs font-semibold rounded-full">
                        {announcement.category}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Bell size={40} className="mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">No announcements at the moment</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
