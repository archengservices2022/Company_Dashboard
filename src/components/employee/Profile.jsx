import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebase';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { User, Mail, Phone, Briefcase, Building2, Calendar, DollarSign, Edit2, Save, X } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchEmployeeData();
    }
  }, [user]);

  const fetchEmployeeData = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'employees'),
        where('email', '==', user.email)
      );
      const querySnapshot = await getDocs(q);
      if (querySnapshot.docs.length > 0) {
        const data = querySnapshot.docs[0].data();
        const fullData = {
          id: querySnapshot.docs[0].id,
          ...data
        };
        setEmployeeData(fullData);
        setEditData(fullData);
      }
    } catch (error) {
      console.error('Error fetching employee data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditData(employeeData);
    setError('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(employeeData);
    setError('');
  };

  const handleSave = async () => {
    try {
      setError('');
      await updateDoc(doc(db, 'employees', employeeData.id), {
        phone: editData.phone,
        updatedAt: new Date()
      });
      setEmployeeData(editData);
      setIsEditing(false);
    } catch (err) {
      setError('Error updating profile: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your profile...</p>
      </div>
    );
  }

  if (!employeeData) {
    return (
      <div className="text-center py-12 bg-white rounded-lg">
        <User size={48} className="mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">No profile data found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900">My Profile</h2>
        {!isEditing && (
          <button
            onClick={handleEdit}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Edit2 size={18} />
            Edit Phone
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
          ⚠️ {error}
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-8 text-white mb-8">
        <div className="flex items-start gap-6">
          <div className="bg-white bg-opacity-20 p-6 rounded-lg">
            <User size={48} />
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-2">{employeeData.name}</h1>
            <p className="text-blue-100 text-lg">{employeeData.position}</p>
            <p className="text-blue-100">{employeeData.department}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Mail size={24} className="text-blue-600" />
            Contact Information
          </h3>
          <div className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email Address</label>
              <p className="text-lg font-semibold text-gray-900 mt-2">{employeeData.email}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                <Phone size={14} /> Phone Number
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-lg font-semibold text-gray-900 mt-2">{employeeData.phone || 'Not provided'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Employment Information */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Briefcase size={24} className="text-green-600" />
            Employment Details
          </h3>
          <div className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                <Building2 size={14} /> Department
              </label>
              <p className="text-lg font-semibold text-gray-900 mt-2">{employeeData.department || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Position / Designation</label>
              <p className="text-lg font-semibold text-gray-900 mt-2">{employeeData.position || '-'}</p>
            </div>
          </div>
        </div>

        {/* Compensation Information */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <DollarSign size={24} className="text-yellow-600" />
            Compensation & Benefits
          </h3>
          <div className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Monthly Remuneration</label>
              <p className="text-2xl font-bold text-gray-900 mt-2">${parseInt(employeeData.salary || 0).toLocaleString()}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Annual Remuneration</label>
              <p className="text-lg font-semibold text-gray-900 mt-2">${(parseInt(employeeData.salary || 0) * 12).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Employment Timeline */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Calendar size={24} className="text-purple-600" />
            Tenure & Status
          </h3>
          <div className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date of Joining</label>
              <p className="text-lg font-semibold text-gray-900 mt-2">
                {employeeData.joinDate
                  ? new Date(employeeData.joinDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : '-'}
              </p>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Employment Status</label>
              <span className={`inline-block mt-2 px-4 py-2 rounded-full text-sm font-bold ${
                employeeData.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {employeeData.status === 'active' ? '✅ Active' : '❌ Inactive'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="mt-8 flex gap-3 justify-end">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 bg-gray-400 hover:bg-gray-500 text-white px-6 py-3 rounded-lg transition font-semibold"
          >
            <X size={18} />
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition font-semibold"
          >
            <Save size={18} />
            Save Changes
          </button>
        </div>
      )}

      <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6">
        <p className="text-sm text-blue-700">
          <strong>📋 Note:</strong> You can edit your phone number above. For other details like position, department, or salary changes, please contact your HR administrator.
        </p>
      </div>
    </div>
  );
}
