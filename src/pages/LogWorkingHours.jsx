import React, { useState } from 'react';
import { Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { db } from '../config/firebase';
import { collection, addDoc, query, getDocs, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function LogWorkingHours() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    date: new Date().toISOString().split('T')[0],
    hoursWorked: '',
    workDescription: '',
    status: 'completed'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validate email exists in employees
      const empQuery = query(
        collection(db, 'employees'),
        where('email', '==', formData.email)
      );
      const empSnapshot = await getDocs(empQuery);

      if (empSnapshot.docs.length === 0) {
        setError('❌ Email not found in system. Please enter a valid employee email.');
        setLoading(false);
        return;
      }

      const employee = empSnapshot.docs[0];
      const employeeId = employee.id;

      // Check if entry for this date already exists
      const existingQuery = query(
        collection(db, 'workingHours'),
        where('employeeId', '==', employeeId),
        where('date', '==', formData.date)
      );
      const existingSnapshot = await getDocs(existingQuery);

      if (existingSnapshot.docs.length > 0) {
        setError('⚠️ You have already logged hours for this date. Update your existing entry instead.');
        setLoading(false);
        return;
      }

      // Save working hours
      await addDoc(collection(db, 'workingHours'), {
        employeeId: employeeId,
        email: formData.email,
        name: employee.data().name,
        date: formData.date,
        hoursWorked: parseFloat(formData.hoursWorked),
        workDescription: formData.workDescription,
        status: formData.status,
        createdAt: new Date(),
        companyId: 'default'
      });

      setSuccess('✅ Working hours logged successfully! You can now proceed to login.');

      // Clear form
      setFormData({
        email: '',
        date: new Date().toISOString().split('T')[0],
        hoursWorked: '',
        workDescription: '',
        status: 'completed'
      });

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login?message=Hours logged successfully. Please login to continue.');
      }, 2000);
    } catch (err) {
      console.error('Error logging hours:', err);
      setError('❌ Error saving working hours. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img src="/skt-logo.png" alt="SKT Logo" className="h-16 w-16 object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-blue-900">SKT Innovations</h1>
            <p className="text-yellow-600 font-bold mt-1">Work Hours Log</p>
            <p className="text-gray-600 text-sm mt-3">📊 Log your daily working hours before login</p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <Clock className="text-blue-600 flex-shrink-0" size={20} />
              <div className="text-sm text-blue-900">
                <p className="font-semibold">Work From Home Hours Tracking</p>
                <p className="text-blue-800 mt-1">Log the hours you worked today. This helps us track productivity and ensure fair compensation.</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📧 Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📅 Work Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Hours Worked */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ⏱️ Hours Worked
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={formData.hoursWorked}
                    onChange={(e) => setFormData({ ...formData, hoursWorked: e.target.value })}
                    placeholder="e.g., 8.5"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <span className="flex items-center px-4 py-3 bg-gray-100 rounded-lg text-sm font-semibold text-gray-700">
                    hours
                  </span>
                </div>
              </div>

              {/* Work Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📝 Work Description / Tasks Completed
                </label>
                <textarea
                  value={formData.workDescription}
                  onChange={(e) => setFormData({ ...formData, workDescription: e.target.value })}
                  placeholder="Brief description of work done today (e.g., Completed Dashboard design, Fixed bugs, Attended meetings)"
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ✓ Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="completed">✅ Completed</option>
                  <option value="pending">⏳ Pending</option>
                  <option value="sick-leave">🏥 Sick Leave</option>
                  <option value="personal-leave">🏠 Personal Leave</option>
                </select>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex gap-2">
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex gap-2">
                <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition duration-200 disabled:opacity-50 shadow-md hover:shadow-lg"
              >
                {loading ? '⏳ Saving...' : '✅ Log Working Hours'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 rounded-lg transition duration-200 shadow-md"
              >
                🔐 Login Instead
              </button>
            </div>
          </form>

          {/* Footer */}
          <p className="text-center text-gray-600 text-xs mt-6">
            © 2026 SKT Innovations Pvt Ltd. All rights reserved. | 📧 info.sktinnovationspvtltd@gmail.com
          </p>
        </div>
      </div>
    </div>
  );
}
