import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export default function AttendanceApproval() {
  const [approvalRequests, setApprovalRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('pending');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchApprovalRequests();
  }, [filter]);

  const fetchApprovalRequests = async () => {
    try {
      let query_obj = query(
        collection(db, 'checkInOut'),
        where('companyId', '==', 'default')
      );

      const snapshot = await getDocs(query_obj);
      let requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter by status
      if (filter !== 'all') {
        requests = requests.filter(r => r.status === filter);
      }

      // Sort by date desc
      requests.sort((a, b) => new Date(b.date) - new Date(a.date));

      setApprovalRequests(requests);
    } catch (error) {
      console.error('Error fetching approval requests:', error);
    }
  };

  const handleApprove = async (requestId, status) => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'checkInOut', requestId), {
        status: status,
        approvalTime: new Date(),
        approvedBy: 'Admin'
      });

      setSuccess(`✅ Request ${status} successfully!`);
      setTimeout(() => setSuccess(''), 3000);
      await fetchApprovalRequests();
    } catch (error) {
      console.error('Error updating request:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Attendance Approval</h2>
        <p className="text-gray-600 text-sm">Approve or reject employee check-in/out records</p>
      </div>

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2 border-b border-gray-200">
        {['pending', 'approved', 'rejected', 'all'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-3 font-medium text-sm transition ${
              filter === status
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Approval Requests Table */}
      {approvalRequests.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Check In</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Check Out</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {approvalRequests.map((request) => (
                  <tr key={request.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {new Date(request.date).toLocaleDateString('en-GB', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <div>
                        <p className="font-medium text-gray-900">{request.name}</p>
                        <p className="text-gray-500 text-xs">{request.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                      {request.checkInTime}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                      {request.checkOutTime || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {request.checkOutTime ? (
                        (() => {
                          const parseTime = (timeStr) => {
                            const [time, period] = timeStr.split(' ');
                            let [hours, minutes] = time.split(':').map(Number);
                            if (period === 'PM' && hours !== 12) hours += 12;
                            if (period === 'AM' && hours === 12) hours = 0;
                            return hours * 60 + minutes;
                          };

                          const checkInMinutes = parseTime(request.checkInTime);
                          const checkOutMinutes = parseTime(request.checkOutTime);
                          const diffMinutes = checkOutMinutes - checkInMinutes;
                          const hours = Math.floor(diffMinutes / 60);
                          const mins = diffMinutes % 60;

                          return `${hours}h ${mins}m`;
                        })()
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(request.status)}`}>
                        {request.status === 'pending' && '⏳ Pending'}
                        {request.status === 'approved' && '✅ Approved'}
                        {request.status === 'rejected' && '❌ Rejected'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {request.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(request.id, 'approved')}
                            disabled={loading}
                            className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition text-sm font-medium disabled:opacity-50"
                          >
                            <CheckCircle size={16} />
                            Approve
                          </button>
                          <button
                            onClick={() => handleApprove(request.id, 'rejected')}
                            disabled={loading}
                            className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm font-medium disabled:opacity-50"
                          >
                            <XCircle size={16} />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">
                          {request.approvalTime
                            ? new Date(request.approvalTime.toDate?.() || request.approvalTime).toLocaleDateString()
                            : '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Clock size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg font-semibold">No {filter} records found</p>
        </div>
      )}
    </div>
  );
}
