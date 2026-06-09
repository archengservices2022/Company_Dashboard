import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Mail, User } from 'lucide-react';
import { db, auth } from '../../config/firebase';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [newEmployeeId, setNewEmployeeId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    salary: '',
    joinDate: '',
    status: 'active'
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'employees'), where('companyId', '==', 'default'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEmployees(data);
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    try {
      if (editingId) {
        // Update existing employee
        await updateDoc(doc(db, 'employees', editingId), {
          name: formData.name,
          department: formData.department,
          position: formData.position,
          salary: formData.salary,
          joinDate: formData.joinDate,
          status: formData.status,
          phone: formData.phone,
          updatedAt: new Date()
        });
        setSuccessMessage('✅ Employee updated successfully!');
      } else {
        // Create new employee with Firebase Auth + Firestore
        const defaultPassword = '123456';

        try {
          // Step 1: Create Firebase Auth user
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            formData.email,
            defaultPassword
          );
          const uid = userCredential.user.uid;

          // Step 2: Create employee record in Firestore
          const docRef = await addDoc(collection(db, 'employees'), {
            uid: uid,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            department: formData.department,
            position: formData.position,
            salary: formData.salary,
            joinDate: formData.joinDate,
            status: formData.status,
            role: 'employee',
            companyId: 'default',
            loginSetup: false,
            createdAt: new Date(),
            updatedAt: new Date()
          });

          setNewEmployeeId(docRef.id);
          setSuccessMessage(`✅ Employee created successfully!\n📧 Email: ${formData.email}\n🔐 Password: ${defaultPassword}\n\n📌 Share these credentials with the employee for login`);

          // Refresh employee list
          setTimeout(() => {
            fetchEmployees();
          }, 500);

          // Clear success message and highlight after 5 seconds
          setTimeout(() => {
            setSuccessMessage('');
            setNewEmployeeId(null);
          }, 5000);

        } catch (createError) {
          console.error('Error creating employee:', createError);
          if (createError.code === 'auth/email-already-in-use') {
            setError('❌ Error: Email already registered. Use a different email.');
          } else if (createError.code === 'auth/weak-password') {
            setError('❌ Error: Default password too weak. Contact support.');
          } else {
            setError('Error creating employee: ' + createError.message);
          }
        }
      }

      // Reset form data immediately
      setFormData({
        name: '',
        email: '',
        phone: '',
        department: '',
        position: '',
        salary: '',
        joinDate: '',
        status: 'active'
      });

      setEditingId(null);
      setShowForm(false);

      // Fetch updated employee list
      await fetchEmployees();

      // Clear success message and highlight after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
        setNewEmployeeId(null);
      }, 3000);

    } catch (err) {
      console.error('Error saving employee:', err);
      setError(err.message || 'Error saving employee');
    }
  };

  const handleDelete = async (id, employee) => {
    if (window.confirm('⚠️ Delete this employee permanently? This action cannot be undone.\n\n✓ Removes login access\n✓ Deletes all employee details')) {
      setError('');
      setLoading(true);
      try {
        // Delete from users collection (removes login access)
        if (employee.userId) {
          try {
            await deleteDoc(doc(db, 'users', employee.userId));
            console.log('Deleted user document for:', employee.userId);
          } catch (userErr) {
            console.warn('User document may not exist, continuing...', userErr);
          }
        }

        // Delete employee record completely
        await deleteDoc(doc(db, 'employees', id));

        setSuccessMessage('✅ Employee deleted permanently from the system.');
        await fetchEmployees();

        // Clear message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        console.error('Error deleting employee:', err);
        setError('❌ Error: ' + (err.message || 'Failed to delete employee'));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = (employee) => {
    setFormData(employee);
    setEditingId(employee.id);
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Employee Management</h2>
          <p className="text-gray-600 text-sm mt-1">Add and manage employee records</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({
              name: '',
              email: '',
              phone: '',
              department: '',
              position: '',
              salary: '',
              joinDate: '',
              status: 'active'
            });
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition duration-200 font-semibold shadow-md"
        >
          <Plus size={20} />
          Add Employee
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-lg text-sm mb-6 flex justify-between items-start">
          <div className="whitespace-pre-line">
            {successMessage}
          </div>
          <button
            onClick={() => setSuccessMessage('')}
            className="text-green-600 hover:text-green-800 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-blue-50 p-6 rounded-lg mb-6 border-2 border-blue-200 shadow-md">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            {editingId ? '✏️ Edit Employee' : '➕ Add New Employee'}
          </h3>
          {!editingId && (
            <p className="text-sm text-blue-700 mb-4">
              💡 Default Password: <strong>123456</strong> (Employee can change it using "Forgot Password")
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {!editingId && (
                <input
                  type="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              )}
              <input
                type="tel"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Monthly Salary"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={formData.joinDate}
                onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                ⚠️ {error}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition font-semibold"
              >
                {editingId ? '💾 Update Employee' : '✅ Create Employee'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-2 rounded-lg transition font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Employee List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full">
            <thead className="bg-blue-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Phone</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Department</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Position</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Salary</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr
                  key={employee.id}
                  className={`border-b transition-all ${
                    newEmployeeId === employee.id
                      ? 'bg-green-100 hover:bg-green-150 animate-pulse'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{employee.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{employee.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{employee.phone || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{employee.department}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{employee.position}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">${employee.salary}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      employee.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {employee.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <button
                      onClick={() => handleEdit(employee)}
                      className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                    >
                      <Edit2 size={16} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(employee.id, employee)}
                      className="text-red-600 hover:text-red-800 inline-flex items-center gap-1"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {employees.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <User size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">No employees found</p>
              <p className="text-sm">Click "Add Employee" to create the first employee record</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
