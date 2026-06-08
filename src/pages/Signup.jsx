import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Building2, UserCheck, Shield } from 'lucide-react';
import { db } from '../config/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';

export default function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'employee'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRoleSelect = (role) => {
    setFormData(prev => ({
      ...prev,
      role: role
    }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const userId = userCredential.user.uid;

      // Create user document in Firestore with role
      await setDoc(doc(db, 'users', userId), {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        createdAt: new Date(),
        updatedAt: new Date(),
        companyId: 'default'
      });

      // If admin role, create in a separate admins collection for tracking
      if (formData.role === 'admin') {
        await setDoc(doc(db, 'admins', userId), {
          name: formData.name,
          email: formData.email,
          createdAt: new Date()
        });
      }

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img src="/skt-logo.png" alt="SKT Logo" className="h-16 w-16 object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-blue-900">SKT Innovations</h1>
            <p className="text-yellow-600 font-bold mt-1">Create Account</p>
            <p className="text-gray-500 text-sm mt-2">Join our management system</p>
            <p className="text-gray-400 text-xs mt-3">
              📧 info.sktinnovationspvtltd@gmail.com
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            {/* Name Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 text-indigo-400" size={20} />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  required
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-indigo-400" size={20} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@sktinnovation.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-indigo-400" size={20} />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  required
                />
              </div>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-indigo-400" size={20} />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  required
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Select Your Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* Employee Role */}
                <button
                  type="button"
                  onClick={() => handleRoleSelect('employee')}
                  className={`p-4 rounded-lg border-2 transition text-center ${
                    formData.role === 'employee'
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                >
                  <UserCheck className={`mx-auto mb-2 ${
                    formData.role === 'employee' ? 'text-indigo-600' : 'text-gray-600'
                  }`} size={24} />
                  <p className={`font-semibold text-sm ${
                    formData.role === 'employee' ? 'text-indigo-600' : 'text-gray-700'
                  }`}>
                    Employee
                  </p>
                  <p className="text-xs text-gray-500 mt-1">View tasks & attendance</p>
                </button>

                {/* Admin Role */}
                <button
                  type="button"
                  onClick={() => handleRoleSelect('admin')}
                  className={`p-4 rounded-lg border-2 transition text-center ${
                    formData.role === 'admin'
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                >
                  <Shield className={`mx-auto mb-2 ${
                    formData.role === 'admin' ? 'text-indigo-600' : 'text-gray-600'
                  }`} size={24} />
                  <p className={`font-semibold text-sm ${
                    formData.role === 'admin' ? 'text-indigo-600' : 'text-gray-700'
                  }`}>
                    Admin
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Manage company & tasks</p>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
                ⚠️ {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg transition duration-200 disabled:opacity-50 shadow-md hover:shadow-lg"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-600 font-bold hover:text-indigo-700">
                Sign In
              </Link>
            </p>
          </div>

          <p className="text-center text-gray-500 text-xs mt-6">
            © 2026 SKT Innovation. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
