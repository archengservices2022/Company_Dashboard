import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Building2, ArrowLeft } from 'lucide-react';
import { auth, db } from '../config/firebase';
import { sendPasswordResetEmail, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if there's a success message from URL
    const message = searchParams.get('message');
    if (message) {
      setSuccess(message);
      // Clear message after 5 seconds
      setTimeout(() => setSuccess(''), 5000);
    }
  }, [searchParams]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Try to login first
      try {
        await login(email, password);
      } catch (loginErr) {
        // If login fails, check if this is a first-time employee login
        const employeesQuery = query(
          collection(db, 'employees'),
          where('email', '==', email)
        );
        const employeesSnapshot = await getDocs(employeesQuery);

        if (employeesSnapshot.docs.length === 0) {
          setError('❌ Invalid email or password. Please try again.');
          setLoading(false);
          return;
        }

        const employeeData = employeesSnapshot.docs[0].data();
        const employeeId = employeesSnapshot.docs[0].id;

        // Check if employee is inactive
        if (employeeData.status === 'inactive') {
          setError('❌ Your account has been deactivated. Please contact your HR administrator for access.');
          setLoading(false);
          return;
        }

        // Check if this is first-time login (no Firebase Auth user yet)
        if (!employeeData.loginSetup && password === employeeData.defaultPassword) {
          try {
            // Create Firebase Auth user on first login
            const userCredential = await createUserWithEmailAndPassword(
              auth,
              email,
              password
            );

            const userId = userCredential.user.uid;

            // Update employee record with userId
            await updateDoc(doc(db, 'employees', employeeId), {
              userId: userId,
              loginSetup: true,
              updatedAt: new Date()
            });

            // Create user document in Firestore
            const { setDoc } = await import('firebase/firestore');
            await setDoc(doc(db, 'users', userId), {
              email: email,
              role: 'employee',
              createdAt: new Date(),
              updatedAt: new Date()
            }).catch(async () => {
              await updateDoc(doc(db, 'users', userId), {
                email: email,
                role: 'employee',
                updatedAt: new Date()
              });
            });

            navigate('/dashboard');
            return;
          } catch (createErr) {
            setError('❌ Account setup failed: ' + createErr.message);
            setLoading(false);
            return;
          }
        } else {
          setError('❌ Invalid email or password. Please try again.');
          setLoading(false);
          return;
        }
      }

      // Login successful - navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setResetLoading(true);

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setSuccess('Password reset email sent! Check your inbox to reset your password.');
      setResetEmail('');
      setTimeout(() => {
        setShowForgotPassword(false);
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setResetLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <img src="/skt-logo.png" alt="SKT Logo" className="h-16 w-16 object-contain" />
              </div>
              <h1 className="text-3xl font-bold text-blue-900">Reset Password</h1>
              <p className="text-gray-500 text-sm mt-2">Enter your email to receive a password reset link</p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 text-blue-400" size={20} />
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
                  ⚠️ {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm font-medium">
                  ✅ {success}
                </div>
              )}

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition duration-200 disabled:opacity-50 shadow-md hover:shadow-lg"
              >
                {resetLoading ? 'Sending...' : 'Send Reset Link'}
              </button>

              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="w-full flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 font-semibold py-2"
              >
                <ArrowLeft size={18} />
                Back to Login
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          {/* Company Logo/Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img src="/skt-logo.png" alt="SKT Logo" className="h-16 w-16 object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-blue-900">SKT Innovations</h1>
            <p className="text-yellow-600 font-bold mt-1">Management Portal</p>
            <p className="text-gray-500 text-sm mt-2">Professional HR & Task Management System</p>
            <p className="text-gray-400 text-xs mt-3">
              📧 info.sktinnovationspvtltd@gmail.com
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-blue-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-blue-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition duration-200 disabled:opacity-50 shadow-md hover:shadow-lg"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setShowForgotPassword(true)}
              className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
            >
              Forgot Password?
            </button>
          </div>

          <p className="text-center text-gray-500 text-xs mt-6">
            © 2026 SKT Innovations Pvt Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
