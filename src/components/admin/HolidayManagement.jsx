import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { db } from '../../config/firebase';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where
} from 'firebase/firestore';

export default function HolidayManagement() {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    description: '',
    type: 'national'
  });

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'holidays'), where('companyId', '==', 'default'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => new Date(a.date) - new Date(b.date));
      setHolidays(data);
    } catch (error) {
      console.error('Error fetching holidays:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'holidays'), {
        ...formData,
        companyId: 'default',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      setFormData({
        name: '',
        date: '',
        description: '',
        type: 'national'
      });
      setShowForm(false);
      fetchHolidays();
    } catch (error) {
      console.error('Error adding holiday:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this holiday?')) {
      try {
        await deleteDoc(doc(db, 'holidays', id));
        fetchHolidays();
      } catch (error) {
        console.error('Error deleting holiday:', error);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Holiday List</h2>
        <button
          onClick={() => {
            setFormData({
              name: '',
              date: '',
              description: '',
              type: 'national'
            });
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200"
        >
          <Plus size={20} />
          Add Holiday
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 p-6 rounded-lg mb-6 border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Holiday Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="national">National</option>
                <option value="company">Company</option>
                <option value="regional">Regional</option>
              </select>
            </div>
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
            />

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition duration-200"
              >
                Add Holiday
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-2 rounded-lg transition duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {holidays.map((holiday) => (
            <div key={holiday.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{holiday.name}</h3>
                  <p className="text-sm text-gray-600">{new Date(holiday.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <button
                  onClick={() => handleDelete(holiday.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-2">{holiday.description}</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                holiday.type === 'national'
                  ? 'bg-red-100 text-red-800'
                  : holiday.type === 'company'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {holiday.type.charAt(0).toUpperCase() + holiday.type.slice(1)}
              </span>
            </div>
          ))}
        </div>
      )}

      {!loading && holidays.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No holidays found. Click "Add Holiday" to get started.
        </div>
      )}
    </div>
  );
}
