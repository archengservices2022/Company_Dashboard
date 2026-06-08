import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, DollarSign, Calendar, User, TrendingUp } from 'lucide-react';
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

export default function FinanceTab() {
  const [transactions, setTransactions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [formData, setFormData] = useState({
    type: 'salary',
    description: '',
    amount: '',
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    category: 'salary'
  });

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      const transactionsQuery = query(
        collection(db, 'finance'),
        where('companyId', '==', 'default')
      );
      const transactionsSnapshot = await getDocs(transactionsQuery);
      const transactionsData = transactionsSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransactions(transactionsData);

      const employeesQuery = query(collection(db, 'employees'), where('companyId', '==', 'default'));
      const employeesSnapshot = await getDocs(employeesQuery);
      const employeesData = employeesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEmployees(employeesData);
    } catch (error) {
      console.error('Error fetching finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'finance', editingId), {
          ...formData,
          updatedAt: new Date()
        });
      } else {
        await addDoc(collection(db, 'finance'), {
          ...formData,
          companyId: 'default',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      setFormData({
        type: 'salary',
        description: '',
        amount: '',
        employeeId: '',
        date: new Date().toISOString().split('T')[0],
        category: 'salary'
      });
      setEditingId(null);
      setShowForm(false);
      fetchFinanceData();
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this transaction?')) {
      try {
        await deleteDoc(doc(db, 'finance', id));
        fetchFinanceData();
      } catch (error) {
        console.error('Error deleting transaction:', error);
      }
    }
  };

  const handleEdit = (transaction) => {
    setFormData(transaction);
    setEditingId(transaction.id);
    setShowForm(true);
  };

  // Calculate totals
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

  const totalSalary = transactions
    .filter(t => t.category === 'salary')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

  const filteredTransactions = filterType === 'all'
    ? transactions
    : transactions.filter(t => t.type === filterType);

  const getCategoryIcon = (category) => {
    const icons = {
      salary: '💰',
      project: '📊',
      expense: '💸',
      bonus: '🎁',
      other: '📝'
    };
    return icons[category] || '📝';
  };

  const getTypeColor = (type) => {
    return type === 'income'
      ? 'bg-green-50 border-l-4 border-green-500'
      : 'bg-red-50 border-l-4 border-red-500';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Finance & Payments</h2>
          <p className="text-gray-600 text-sm mt-1">Manage company finances and transactions</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({
              type: 'salary',
              description: '',
              amount: '',
              employeeId: '',
              date: new Date().toISOString().split('T')[0],
              category: 'salary'
            });
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition font-semibold shadow-md"
        >
          <Plus size={20} />
          Add Transaction
        </button>
      </div>

      {/* Finance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded-lg shadow border-l-4 border-green-500">
          <p className="text-gray-600 text-sm font-medium">Total Income</p>
          <p className="text-3xl font-bold text-green-600">${totalIncome.toLocaleString()}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg shadow border-l-4 border-red-500">
          <p className="text-gray-600 text-sm font-medium">Total Expenses</p>
          <p className="text-3xl font-bold text-red-600">${totalExpense.toLocaleString()}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg shadow border-l-4 border-blue-500">
          <p className="text-gray-600 text-sm font-medium">Total Salary Paid</p>
          <p className="text-3xl font-bold text-blue-600">${totalSalary.toLocaleString()}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg shadow border-l-4 border-purple-500">
          <p className="text-gray-600 text-sm font-medium">Net Balance</p>
          <p className={`text-3xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
            ${(totalIncome - totalExpense).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-blue-50 p-6 rounded-lg mb-6 border-2 border-blue-200 shadow-md">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            {editingId ? '✏️ Edit Transaction' : '➕ Add New Transaction'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>

              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="salary">Salary</option>
                <option value="project">Project Income</option>
                <option value="expense">Expense</option>
                <option value="bonus">Bonus</option>
                <option value="other">Other</option>
              </select>

              <input
                type="number"
                placeholder="Amount"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
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
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 col-span-2"
              >
                <option value="">Select Employee (Optional)</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>

            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="2"
            />

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition font-semibold"
              >
                {editingId ? '💾 Update' : '✅ Add Transaction'}
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

      {/* Filter */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilterType('all')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filterType === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterType('income')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filterType === 'income'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Income
        </button>
        <button
          onClick={() => setFilterType('expense')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            filterType === 'expense'
              ? 'bg-red-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Expenses
        </button>
      </div>

      {/* Transactions List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((transaction) => {
              const employee = employees.find(e => e.id === transaction.employeeId);
              return (
                <div key={transaction.id} className={`p-4 rounded-lg shadow hover:shadow-lg transition ${getTypeColor(transaction.type)}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{getCategoryIcon(transaction.category)}</span>
                        <h4 className="text-lg font-bold text-gray-900">{transaction.description}</h4>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="flex items-center gap-1 text-gray-700">
                          <DollarSign size={16} />
                          <span className="font-bold">${parseFloat(transaction.amount).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-700">
                          <Calendar size={16} />
                          <span>{new Date(transaction.date).toLocaleDateString()}</span>
                        </div>
                        {employee && (
                          <div className="flex items-center gap-1 text-gray-700">
                            <User size={16} />
                            <span>{employee.name}</span>
                          </div>
                        )}
                        <span className="inline-block px-2 py-1 bg-white bg-opacity-60 rounded text-xs font-semibold">
                          {transaction.category}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(transaction)}
                        className="text-blue-600 hover:text-blue-800 p-2 hover:bg-white hover:bg-opacity-50 rounded"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="text-red-600 hover:text-red-800 p-2 hover:bg-white hover:bg-opacity-50 rounded"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 bg-white rounded-lg">
              <TrendingUp size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">No transactions found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
