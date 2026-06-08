import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebase';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { Clipboard, AlertCircle, CheckCircle, Clock, Upload, MessageCircle } from 'lucide-react';

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [progressUpdate, setProgressUpdate] = useState('');

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      // Search for employee by email to get the employee ID
      const { getDoc, getDocs, query, collection, where } = await import('firebase/firestore');

      const employeesQuery = query(
        collection(db, 'employees'),
        where('email', '==', user.email)
      );
      const employeeSnapshot = await getDocs(employeesQuery);

      if (employeeSnapshot.docs.length === 0) {
        console.log('No employee found for email:', user.email);
        setTasks([]);
        setLoading(false);
        return;
      }

      const employeeId = employeeSnapshot.docs[0].id;
      console.log('Found employee ID:', employeeId);

      // Fetch only tasks assigned to this employee
      const q = query(
        collection(db, 'tasks'),
        where('companyId', '==', 'default'),
        where('assignedTo', '==', employeeId)
      );
      const querySnapshot = await getDocs(q);
      const employeeTasks = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log('Found tasks:', employeeTasks.length);
      setTasks(employeeTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        status: newStatus,
        updatedAt: new Date()
      });
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const addProgressUpdate = async (taskId) => {
    if (!progressUpdate.trim()) return;
    try {
      const task = tasks.find(t => t.id === taskId);
      const updates = task.progressUpdates || [];
      updates.push({
        timestamp: new Date(),
        message: progressUpdate,
        status: task.status
      });

      await updateDoc(doc(db, 'tasks', taskId), {
        progressUpdates: updates,
        updatedAt: new Date()
      });

      setProgressUpdate('');
      fetchTasks();
    } catch (error) {
      console.error('Error adding progress:', error);
    }
  };

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-orange-50 border-l-4 border-orange-500',
      'in-progress': 'bg-blue-50 border-l-4 border-blue-500',
      completed: 'bg-green-50 border-l-4 border-green-500'
    };
    return colors[status] || 'bg-gray-50';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <AlertCircle className="text-orange-600" size={20} />,
      'in-progress': <Clock className="text-blue-600" size={20} />,
      completed: <CheckCircle className="text-green-600" size={20} />
    };
    return icons[status];
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      high: '🔴 High',
      medium: '🟡 Medium',
      low: '🟢 Low'
    };
    return badges[priority] || priority;
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Tasks</h2>
        <p className="text-gray-600">Track your assigned work and update progress</p>
      </div>

      {/* Task Statistics */}
      <div className="grid grid-cols-3 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg">
          <p className="text-gray-600 text-sm font-medium">Pending</p>
          <p className="text-3xl font-bold text-orange-600">{pendingTasks.length}</p>
        </div>
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
          <p className="text-gray-600 text-sm font-medium">In Progress</p>
          <p className="text-3xl font-bold text-blue-600">{inProgressTasks.length}</p>
        </div>
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
          <p className="text-gray-600 text-sm font-medium">Completed</p>
          <p className="text-3xl font-bold text-green-600">{completedTasks.length}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your tasks...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pending Tasks */}
          {pendingTasks.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircle className="text-orange-600" size={24} />
                Pending Tasks ({pendingTasks.length})
              </h3>
              <div className="space-y-4">
                {pendingTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    getStatusColor={getStatusColor}
                    getStatusIcon={getStatusIcon}
                    getPriorityBadge={getPriorityBadge}
                    updateTaskStatus={updateTaskStatus}
                    onSelectTask={setSelectedTask}
                  />
                ))}
              </div>
            </div>
          )}

          {/* In Progress Tasks */}
          {inProgressTasks.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="text-blue-600" size={24} />
                In Progress ({inProgressTasks.length})
              </h3>
              <div className="space-y-4">
                {inProgressTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    getStatusColor={getStatusColor}
                    getStatusIcon={getStatusIcon}
                    getPriorityBadge={getPriorityBadge}
                    updateTaskStatus={updateTaskStatus}
                    onSelectTask={setSelectedTask}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="text-green-600" size={24} />
                Completed ({completedTasks.length})
              </h3>
              <div className="space-y-4">
                {completedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    getStatusColor={getStatusColor}
                    getStatusIcon={getStatusIcon}
                    getPriorityBadge={getPriorityBadge}
                    updateTaskStatus={updateTaskStatus}
                    onSelectTask={setSelectedTask}
                  />
                ))}
              </div>
            </div>
          )}

          {tasks.length === 0 && (
            <div className="text-center py-16 bg-white rounded-lg">
              <Clipboard size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg font-semibold">No tasks assigned yet</p>
              <p className="text-gray-400">Your admin will assign tasks here</p>
            </div>
          )}
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onStatusChange={updateTaskStatus}
          onAddProgress={addProgressUpdate}
          progressUpdate={progressUpdate}
          setProgressUpdate={setProgressUpdate}
        />
      )}
    </div>
  );
}

function TaskCard({ task, getStatusColor, getStatusIcon, getPriorityBadge, updateTaskStatus, onSelectTask }) {
  const daysLeft = task.dueDate ? Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className={`p-5 rounded-lg shadow hover:shadow-lg transition cursor-pointer ${getStatusColor(task.status)}`} onClick={() => onSelectTask(task)}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {getStatusIcon(task.status)}
            <h4 className="text-lg font-bold text-gray-900">{task.title}</h4>
            <span className="text-xs font-semibold bg-white bg-opacity-60 px-2 py-1 rounded">
              {getPriorityBadge(task.priority)}
            </span>
          </div>
          <p className="text-gray-700 text-sm mb-3">{task.description}</p>
          <div className="flex gap-4 text-xs text-gray-600">
            <span>📅 Due: {new Date(task.dueDate).toLocaleDateString()}</span>
            <span>{daysLeft > 0 ? `⏳ ${daysLeft} days left` : '⚠️ Overdue'}</span>
            {task.category && <span>📂 {task.category}</span>}
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {task.status !== 'completed' && (
          <>
            {task.status === 'pending' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateTaskStatus(task.id, 'in-progress');
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 rounded font-semibold transition"
              >
                Start Task
              </button>
            )}
            {task.status === 'in-progress' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateTaskStatus(task.id, 'completed');
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm py-2 rounded font-semibold transition"
              >
                Mark Complete
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function TaskDetailModal({ task, onClose, onStatusChange, onAddProgress, progressUpdate, setProgressUpdate }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-96 overflow-y-auto">
        <div className="sticky top-0 bg-indigo-600 text-white p-6 flex justify-between items-center">
          <h3 className="text-2xl font-bold">{task.title}</h3>
          <button onClick={onClose} className="text-2xl hover:bg-indigo-700 p-1 rounded">×</button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
            <p className="text-gray-700">{task.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 font-semibold">Priority</p>
              <p className="text-gray-900">{task.priority}</p>
            </div>
            <div>
              <p className="text-gray-600 font-semibold">Due Date</p>
              <p className="text-gray-900">{new Date(task.dueDate).toLocaleDateString()}</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <MessageCircle size={18} />
              Add Progress Update
            </h4>
            <div className="flex gap-2">
              <textarea
                value={progressUpdate}
                onChange={(e) => setProgressUpdate(e.target.value)}
                placeholder="Share your progress..."
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows="2"
              />
              <button
                onClick={() => onAddProgress(task.id)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
              >
                <Upload size={18} />
                Update
              </button>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Update Status</h4>
            <div className="flex gap-2">
              {task.status !== 'pending' && (
                <button
                  onClick={() => {
                    onStatusChange(task.id, 'pending');
                    onClose();
                  }}
                  className="flex-1 bg-orange-100 text-orange-800 py-2 rounded-lg hover:bg-orange-200 transition font-semibold"
                >
                  Back to Pending
                </button>
              )}
              {task.status !== 'in-progress' && (
                <button
                  onClick={() => {
                    onStatusChange(task.id, 'in-progress');
                    onClose();
                  }}
                  className="flex-1 bg-blue-100 text-blue-800 py-2 rounded-lg hover:bg-blue-200 transition font-semibold"
                >
                  In Progress
                </button>
              )}
              {task.status !== 'completed' && (
                <button
                  onClick={() => {
                    onStatusChange(task.id, 'completed');
                    onClose();
                  }}
                  className="flex-1 bg-green-100 text-green-800 py-2 rounded-lg hover:bg-green-200 transition font-semibold"
                >
                  Mark Complete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
