import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { FolderOpen, Target, Calendar, DollarSign, TrendingUp } from 'lucide-react';

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchEmployeeProjects();
    }
  }, [user]);

  const fetchEmployeeProjects = async () => {
    setLoading(true);
    try {
      // Get current employee's ID from Firestore
      const employeesQuery = query(
        collection(db, 'employees'),
        where('email', '==', user.email)
      );
      const employeeSnapshot = await getDocs(employeesQuery);

      if (employeeSnapshot.docs.length === 0) {
        setProjects([]);
        return;
      }

      const employeeId = employeeSnapshot.docs[0].id;

      // Fetch only projects assigned to this employee
      const q = query(
        collection(db, 'projects'),
        where('companyId', '==', 'default'),
        where('assignedTo', '==', employeeId)
      );
      const querySnapshot = await getDocs(q);
      const employeeProjects = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setProjects(employeeProjects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800 border border-yellow-300',
      'active': 'bg-blue-100 text-blue-800 border border-blue-300',
      'completed': 'bg-green-100 text-green-800 border border-green-300',
      'on-hold': 'bg-red-100 text-red-800 border border-red-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'pending': '⏳',
      'active': '🔄',
      'completed': '✅',
      'on-hold': '⏸️'
    };
    return icons[status] || '📋';
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Projects</h2>
        <p className="text-gray-600">View projects assigned to you</p>
      </div>

      {/* Project Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
          <p className="text-gray-600 text-sm font-medium">Total Projects</p>
          <p className="text-3xl font-bold text-blue-600">{projects.length}</p>
        </div>
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
          <p className="text-gray-600 text-sm font-medium">Completed</p>
          <p className="text-3xl font-bold text-green-600">{projects.filter(p => p.status === 'completed').length}</p>
        </div>
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
          <p className="text-gray-600 text-sm font-medium">Active</p>
          <p className="text-3xl font-bold text-yellow-600">{projects.filter(p => p.status === 'active').length}</p>
        </div>
        <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-lg">
          <p className="text-gray-600 text-sm font-medium">Total Budget</p>
          <p className="text-3xl font-bold text-purple-600">${projects.reduce((sum, p) => sum + (parseFloat(p.budget) || 0), 0).toLocaleString()}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your projects...</p>
        </div>
      ) : (
        <>
          {projects.length > 0 ? (
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <table className="w-full">
                <thead className="bg-blue-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Project Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Client</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Start Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">End Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Budget</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Progress</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr key={project.id} className="border-b hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        <div className="flex items-center gap-2">
                          <FolderOpen size={16} className="text-blue-600" />
                          {project.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{project.client || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {project.startDate ? new Date(project.startDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {project.endDate ? new Date(project.endDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">${parseFloat(project.budget || 0).toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${project.progress || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-semibold text-gray-700">{project.progress || 0}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(project.status)}`}>
                          {getStatusIcon(project.status)} {project.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-lg">
              <FolderOpen size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg font-semibold">No projects assigned yet</p>
              <p className="text-gray-400">Your admin will assign projects here</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
