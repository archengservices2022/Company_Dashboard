import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Calendar } from 'lucide-react';

export default function Holidays() {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'holidays'), where('companyId', '==', 'default'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      setHolidays(data);
    } catch (error) {
      console.error('Error fetching holidays:', error);
    } finally {
      setLoading(false);
    }
  };

  const isUpcoming = (date) => {
    const today = new Date();
    const holidayDate = new Date(date);
    return holidayDate >= today;
  };

  const upcomingHolidays = holidays.filter(h => isUpcoming(h.date));
  const pastHolidays = holidays.filter(h => !isUpcoming(h.date));

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Company Holidays</h2>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {upcomingHolidays.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                Upcoming Holidays
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingHolidays.map((holiday) => (
                  <div
                    key={holiday.id}
                    className="border-2 border-green-200 rounded-lg p-4 bg-green-50 hover:shadow-lg transition"
                  >
                    <div className="flex items-start gap-3">
                      <Calendar className="text-green-600 mt-1" size={24} />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{holiday.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(holiday.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        {holiday.description && (
                          <p className="text-sm text-gray-700 mt-2">{holiday.description}</p>
                        )}
                        <span className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-semibold bg-green-200 text-green-800">
                          {holiday.type.charAt(0).toUpperCase() + holiday.type.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pastHolidays.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
                Past Holidays
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pastHolidays.map((holiday) => (
                  <div
                    key={holiday.id}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50 opacity-75"
                  >
                    <div className="flex items-start gap-3">
                      <Calendar className="text-gray-400 mt-1" size={24} />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-700">{holiday.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(holiday.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {holidays.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No holidays found. Check back soon!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
