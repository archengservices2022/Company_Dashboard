import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Calendar, User, DollarSign, TrendingUp } from 'lucide-react';
import { db } from '../../config/firebase';
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

export default function ProjectsManagement() {
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    client: '',
    assignedTo: '',
    startDate: '',
    endDate: '',
    budget: '',
    status: 'active',
    progress: 0
  });

  useEffect(() => {
    fetchProjectsAndEmployees();
  }, []);

  const fetchProjectsAndEmployees = async () => {
    setLoading(true);
    try {
      const projectsQuery = query(collection(db, 'projects'), where('companyId', '==', 'default'));
      const projectsSnapshot = await getDocs(projectsQuery);
      const projectsData = projectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProjects(projectsData);

      const employeesQuery = query(collection(db, 'employees'), where('companyId', '==', 'default'));
      const employeesSnapshot = await getDocs(employeesQuery);
      const employeesData = employeesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEmployees(employeesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'projects', editingId), {
          ...formData,
          updatedAt: new Date()
        });
      } else {
        await addDoc(collection(db, 'projects'), {
          ...formData,
          companyId: 'default',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      setFormData({
        name: '',
        description: '',
        client: '',
        assignedTo: '',
        startDate: '',
        endDate: '',
        budget: '',
        status: 'active',
        progress: 0
      });
      setEditingId(null);
      setShowForm(false);
      fetchProjectsAndEmployees();
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this project?')) {
      try {
        await deleteDoc(doc(db, 'projects', id));
        fetchProjectsAndEmployees();
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  };

  const handleEdit = (project) => {
    setFormData(project);
    setEditingId(project.id);
    setShowForm(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-blue-100 text-blue-800 border-blue-300',
      completed: 'bg-green-100 text-green-800 border-green-300',
      onhold: 'bg-yellow-100 text-yellow-800 border-yellow-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusBadgeStyle = (status) => {
    const colors = {
      active: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      onhold: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Projects Management</h2>
          <p className="text-gray-600 text-sm mt-1">View and manage all company projects</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({
              name: '',
              description: '',
              client: '',
              assignedTo: '',
              startDate: '',
              endDate: '',
              budget: '',
              status: 'active',
              progress: 0
            });
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition font-semibold shadow-md"
        >
          <Plus size={20} />
          New Project
        </button>
      </div>

      {/* Project Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm font-medium">Total Projects</p>
          <p className="text-3xl font-bold text-blue-600">{projects.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <p className="text-gray-600 text-sm font-medium">Completed</p>
          <p className="text-3xl font-bold text-green-600">{projects.filter(p => p.status === 'completed').length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <p className="text-gray-600 text-sm font-medium">Active</p>
          <p className="text-3xl font-bold text-yellow-600">{projects.filter(p => p.status === 'active').length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <p className="text-gray-600 text-sm font-medium">Total Budget</p>
          <p className="text-2xl font-bold text-purple-600">${projects.reduce((sum, p) => sum + (parseInt(p.budget) || 0), 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-blue-50 p-6 rounded-lg mb-6 border-2 border-blue-200 shadow-md">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            {editingId ? '✏️ Edit Project' : '➕ Create New Project'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Project Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="text"
                placeholder="Client Name"
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Budget Amount"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Assign to Employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="onhold">On Hold</option>
              </select>
              <input
                type="number"
                min="0"
                max="100"
                placeholder="Progress (%)"
                value={formData.progress}
                onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <textarea
              placeholder="Project Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
            />

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition font-semibold"
              >
                {editingId ? '💾 Update Project' : '✅ Create Project'}
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

      {/* Projects Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full">
            <thead className="bg-blue-100 border-b border-blue-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Project Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Client</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Assigned To</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Start Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">End Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Budget</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Progress</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => {
                const assignedEmployee = employees.find(emp => emp.id === project.assignedTo);
                return (
                  <tr key={project.id} className="border-b hover:bg-blue-50 transition">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{project.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{project.client || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{assignedEmployee?.name || 'Unassigned'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(project.startDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{project.endDate ? new Date(project.endDate).toLocaleDateString() : '-'}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">${parseInt(project.budget || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-700 w-8">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeStyle(project.status)}`}>
                        {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-center space-x-2">
                      <button
                        onClick={() => handleEdit(project)}
                        className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                      >
                        <Edit2 size={16} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(project.id)}
                        className="text-red-600 hover:text-red-800 inline-flex items-center gap-1"
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {projects.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">No projects found</p>
              <p className="text-sm">Click "New Project" to create the first project</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
