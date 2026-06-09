import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, getDocs, query, where, setDoc, doc } from 'firebase/firestore';
import { Settings, Save, AlertCircle, CheckCircle } from 'lucide-react';

export default function WorkingDaysConfig() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const configQuery = query(
        collection(db, 'workingDaysConfig'),
        where('companyId', '==', 'default')
      );
      const snapshot = await getDocs(configQuery);

      if (snapshot.docs.length > 0) {
        setConfig(snapshot.docs[0].data());
      } else {
        // Set default config
        const defaultConfig = {
          companyId: 'default',
          monday: { isWorkingDay: true, hours: 8 },
          tuesday: { isWorkingDay: true, hours: 8 },
          wednesday: { isWorkingDay: true, hours: 8 },
          thursday: { isWorkingDay: true, hours: 8 },
          friday: { isWorkingDay: true, hours: 8 },
          saturday: { isWorkingDay: true, hours: 4 },
          sunday: { isWorkingDay: false, hours: 0 },
          createdAt: new Date()
        };
        setConfig(defaultConfig);
        await saveConfig(defaultConfig);
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      setError('Error loading configuration');
    }
  };

  const saveConfig = async (configData) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await setDoc(doc(db, 'workingDaysConfig', 'default'), {
        ...configData,
        updatedAt: new Date()
      });

      setSuccess('✅ Working days configuration saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving config:', err);
      setError('❌ Error saving configuration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDayChange = (day, field, value) => {
    const updatedConfig = {
      ...config,
      [day]: {
        ...config[day],
        [field]: value
      }
    };
    setConfig(updatedConfig);
  };

  const handleSave = () => {
    saveConfig(config);
  };

  const days = [
    { key: 'monday', label: 'Monday', default: true, defaultHours: 8 },
    { key: 'tuesday', label: 'Tuesday', default: true, defaultHours: 8 },
    { key: 'wednesday', label: 'Wednesday', default: true, defaultHours: 8 },
    { key: 'thursday', label: 'Thursday', default: true, defaultHours: 8 },
    { key: 'friday', label: 'Friday', default: true, defaultHours: 8 },
    { key: 'saturday', label: 'Saturday', default: true, defaultHours: 4 },
    { key: 'sunday', label: 'Sunday', default: false, defaultHours: 0 }
  ];

  if (!config) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Loading configuration...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2 mb-2">
          <Settings size={32} className="text-indigo-600" />
          Working Days Configuration
        </h2>
        <p className="text-gray-600 text-sm">Configure working days and expected hours per day for your organization</p>
      </div>

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle size={20} />
          {success}
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
        <h3 className="font-bold text-gray-900 mb-3">📋 Default MNC Standards</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <p className="font-semibold text-gray-900">Working Days:</p>
            <p className="text-gray-600">Monday - Friday: 8 hours</p>
            <p className="text-gray-600">Saturday: 4 hours (optional)</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Non-Working Days:</p>
            <p className="text-gray-600">Sunday (Holidays + Admin-marked days)</p>
            <p className="text-gray-600">Any day can be customized below</p>
          </div>
        </div>
      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {days.map((day) => (
          <div key={day.key} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{day.label}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                config[day.key]?.isWorkingDay
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {config[day.key]?.isWorkingDay ? '✅ Working Day' : '❌ Holiday'}
              </span>
            </div>

            <div className="space-y-4">
              {/* Working Day Toggle */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleDayChange(day.key, 'isWorkingDay', true)}
                    className={`flex-1 px-3 py-2 rounded-lg font-medium transition ${
                      config[day.key]?.isWorkingDay
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Working Day
                  </button>
                  <button
                    onClick={() => handleDayChange(day.key, 'isWorkingDay', false)}
                    className={`flex-1 px-3 py-2 rounded-lg font-medium transition ${
                      !config[day.key]?.isWorkingDay
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Holiday
                  </button>
                </div>
              </div>

              {/* Hours Input */}
              {config[day.key]?.isWorkingDay && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Expected Working Hours
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0.5"
                      max="24"
                      step="0.5"
                      value={config[day.key]?.hours || 0}
                      onChange={(e) => handleDayChange(day.key, 'hours', parseFloat(e.target.value))}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex items-center px-4 py-2 bg-gray-100 rounded-lg text-sm font-semibold text-gray-700">
                      hours
                    </div>
                  </div>
                </div>
              )}

              {/* Info */}
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
                {config[day.key]?.isWorkingDay ? (
                  <p>Expected: <strong>{config[day.key]?.hours} hours</strong></p>
                ) : (
                  <p>This day is marked as a holiday. No hours expected.</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h3 className="font-bold text-gray-900 mb-4">📊 Weekly Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-gray-600 text-sm font-medium">Working Days</p>
            <p className="text-3xl font-bold text-green-600">
              {days.filter(d => config[d.key]?.isWorkingDay).length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 text-sm font-medium">Holidays</p>
            <p className="text-3xl font-bold text-red-600">
              {days.filter(d => !config[d.key]?.isWorkingDay).length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 text-sm font-medium">Total Hours/Week</p>
            <p className="text-3xl font-bold text-blue-600">
              {days.reduce((sum, d) => sum + (config[d.key]?.isWorkingDay ? config[d.key]?.hours || 0 : 0), 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-600 text-sm font-medium">Avg Hours/Day</p>
            <p className="text-3xl font-bold text-purple-600">
              {(days.reduce((sum, d) => sum + (config[d.key]?.isWorkingDay ? config[d.key]?.hours || 0 : 0), 0) /
                days.filter(d => config[d.key]?.isWorkingDay).length).toFixed(1)}
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition disabled:opacity-50"
        >
          <Save size={20} />
          {loading ? 'Saving...' : 'Save Configuration'}
        </button>
        <button
          onClick={fetchConfig}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
        >
          Reset to Saved
        </button>
      </div>

      {/* Help Text */}
      <div className="mt-8 bg-gray-50 rounded-xl p-6">
        <h4 className="font-bold text-gray-900 mb-3">❓ How It Works</h4>
        <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
          <li><strong>Working Day:</strong> Employee is expected to work the specified hours</li>
          <li><strong>Holiday:</strong> Employee is not expected to work (no hours required)</li>
          <li><strong>Automatic Calculation:</strong> System calculates expected vs actual hours for each employee</li>
          <li><strong>Absent Days:</strong> Days with no log and not marked as holiday are considered absent</li>
          <li><strong>Leave Days:</strong> Admin can add holidays for specific dates in the Holiday List</li>
          <li><strong>Variance Report:</strong> Shows difference between expected and actual hours worked</li>
        </ul>
      </div>
    </div>
  );
}
