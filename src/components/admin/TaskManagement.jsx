import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Calendar, User, AlertCircle, CheckCircle2, Clock, BarChart3, Briefcase, Filter } from 'lucide-react';
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

export default function TaskManagement() {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    projectId: '',
    dueDate: '',
    priority: 'medium',
    status: 'pending',
    category: 'development'
  });

  useEffect(() => {
    fetchTasksAndEmployees();
  }, []);

  const fetchTasksAndEmployees = async () => {
    setLoading(true);
    try {
      const tasksQuery = query(collection(db, 'tasks'), where('companyId', '==', 'default'));
      const tasksSnapshot = await getDocs(tasksQuery);
      const tasksData = tasksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(tasksData);

      const employeesQuery = query(collection(db, 'employees'), where('companyId', '==', 'default'));
      const employeesSnapshot = await getDocs(employeesQuery);
      const employeesData = employeesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEmployees(employeesData);

      const projectsQuery = query(collection(db, 'projects'), where('companyId', '==', 'default'));
      const projectsSnapshot = await getDocs(projectsQuery);
      const projectsData = projectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProjects(projectsData);
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
        await updateDoc(doc(db, 'tasks', editingId), {
          ...formData,
          updatedAt: new Date()
        });
      } else {
        await addDoc(collection(db, 'tasks'), {
          ...formData,
          companyId: 'default',
          createdAt: new Date(),
          updatedAt: new Date(),
          progress: 0
        });
      }
      resetForm();
      fetchTasksAndEmployees();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      assignedTo: '',
      projectId: '',
      dueDate: '',
      priority: 'medium',
      status: 'pending',
      category: 'development'
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this task? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'tasks', id));
        fetchTasksAndEmployees();
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const handleEdit = (task) => {
    setFormData(task);
    setEditingId(task.id);
    setShowForm(true);
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'bg-red-100 text-red-800 border-l-4 border-red-500',
      medium: 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500',
      low: 'bg-green-100 text-green-800 border-l-4 border-green-500'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      completed: <CheckCircle2 className="text-green-600" size={18} />,
      'in-progress': <Clock className="text-blue-600" size={18} />,
      pending: <AlertCircle className="text-orange-600" size={18} />
    };
    return icons[status];
  };

  // Statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;

  // Filtered tasks
  const filteredTasks = tasks.filter(task => {
    const statusMatch = filterStatus === 'all' || task.status === filterStatus;
    const priorityMatch = filterPriority === 'all' || task.priority === filterPriority;
    return statusMatch && priorityMatch;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Task Management</h2>
          <p className="text-gray-600 text-sm mt-1">Assign and track employee tasks</p>
        </div>
        <button
          onClick={() => !showForm && setShowForm(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg transition duration-200 font-semibold shadow-md hover:shadow-lg"
        >
          <Plus size={20} />
          Create Task
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm font-medium">Total Tasks</p>
          <p className="text-3xl font-bold text-blue-600">{totalTasks}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <p className="text-gray-600 text-sm font-medium">Completed</p>
          <p className="text-3xl font-bold text-green-600">{completedTasks}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-400">
          <p className="text-gray-600 text-sm font-medium">In Progress</p>
          <p className="text-3xl font-bold text-blue-400">{inProgressTasks}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
          <p className="text-gray-600 text-sm font-medium">Pending</p>
          <p className="text-3xl font-bold text-orange-600">{pendingTasks}</p>
        </div>
      </div>

      {/* Task Creation Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg mb-6 border-2 border-indigo-200 shadow-md">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            {editingId ? '✏️ Edit Task' : '➕ Create New Task'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Task Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <select
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Select Employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>

              <select
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Project (Optional)</option>
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>{proj.name}</option>
                ))}
              </select>

              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />

              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="low">🟢 Low Priority</option>
                <option value="medium">🟡 Medium Priority</option>
                <option value="high">🔴 High Priority</option>
              </select>

              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="development">Development</option>
                <option value="design">Design</option>
                <option value="testing">Testing</option>
                <option value="documentation">Documentation</option>
                <option value="other">Other</option>
              </select>

              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <textarea
              placeholder="Task Description (detailed requirements)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows="3"
            />

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition duration-200 font-semibold"
              >
                {editingId ? '💾 Update Task' : '✅ Create Task'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-2 rounded-lg transition duration-200 font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap items-center">
        <Filter size={20} className="text-gray-600" />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      {/* Task Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full">
            <thead className="bg-indigo-100 border-b border-indigo-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Task Title</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Assigned To</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Project</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Category</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Due Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Priority</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Days Left</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => {
                const assignedEmployee = employees.find(emp => emp.id === task.assignedTo);
                const assignedProject = projects.find(proj => proj.id === task.projectId);
                const daysLeft = task.dueDate ?
                  Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0;

                const getStatusBadgeColor = (status) => {
                  const colors = {
                    pending: 'bg-orange-100 text-orange-800',
                    'in-progress': 'bg-blue-100 text-blue-800',
                    completed: 'bg-green-100 text-green-800'
                  };
                  return colors[status] || 'bg-gray-100 text-gray-800';
                };

                const getPriorityBadgeColor = (priority) => {
                  const colors = {
                    low: 'bg-green-100 text-green-800',
                    medium: 'bg-yellow-100 text-yellow-800',
                    high: 'bg-red-100 text-red-800'
                  };
                  return colors[priority] || 'bg-gray-100 text-gray-800';
                };

                const getDaysLeftColor = (days) => {
                  if (days < 0) return 'text-red-600 font-bold bg-red-50 px-2 py-1 rounded';
                  if (days <= 3) return 'text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded';
                  return 'text-green-600 font-bold';
                };

                return (
                  <tr key={task.id} className="border-b hover:bg-indigo-50 transition">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 max-w-xs truncate" title={task.title}>{task.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{assignedEmployee?.name || 'Unassigned'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{assignedProject?.name || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">{task.category}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(task.dueDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityBadgeColor(task.priority)}`}>
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(task.status)}`}>
                        {task.status === 'in-progress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-sm ${getDaysLeftColor(daysLeft)}`}>
                      {daysLeft > 0 ? `${daysLeft} days` : daysLeft === 0 ? 'Due today' : `${Math.abs(daysLeft)} days overdue`}
                    </td>
                    <td className="px-6 py-4 text-sm text-center space-x-2">
                      <button
                        onClick={() => handleEdit(task)}
                        className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                      >
                        <Edit2 size={16} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(task.id)}
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

          {filteredTasks.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">No tasks found</p>
              <p className="text-sm">Click "Create Task" to assign work to employees</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
