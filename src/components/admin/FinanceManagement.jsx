import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { TrendingUp, Users, DollarSign } from 'lucide-react';

export default function FinanceManagement() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalPayroll, setTotalPayroll] = useState(0);
  const [activeEmployees, setActiveEmployees] = useState(0);

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'employees'), where('companyId', '==', 'default'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEmployees(data);

      const total = data.reduce((sum, emp) => sum + (parseInt(emp.salary) || 0), 0);
      setTotalPayroll(total);
      setActiveEmployees(data.filter(emp => emp.status === 'active').length);
    } catch (error) {
      console.error('Error fetching finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Finance & P&L</h2>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm mb-1">Total Payroll</p>
                  <h3 className="text-3xl font-bold">${totalPayroll.toLocaleString()}</h3>
                  <p className="text-blue-100 text-xs mt-2">Monthly expense</p>
                </div>
                <DollarSign size={40} className="opacity-20" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm mb-1">Active Employees</p>
                  <h3 className="text-3xl font-bold">{activeEmployees}</h3>
                  <p className="text-green-100 text-xs mt-2">Currently employed</p>
                </div>
                <Users size={40} className="opacity-20" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm mb-1">Average Salary</p>
                  <h3 className="text-3xl font-bold">${(totalPayroll / (activeEmployees || 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
                  <p className="text-purple-100 text-xs mt-2">Per employee</p>
                </div>
                <TrendingUp size={40} className="opacity-20" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Employee Salary Details</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Employee Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Position</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Department</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Monthly Salary</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Annual Salary</th>
                  </tr>
                </thead>
                <tbody>
                  {employees
                    .sort((a, b) => (parseInt(b.salary) || 0) - (parseInt(a.salary) || 0))
                    .map((employee) => (
                      <tr key={employee.id} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{employee.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{employee.position}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{employee.department}</td>
                        <td className="px-6 py-4 text-sm text-right text-gray-900 font-semibold">
                          ${parseInt(employee.salary || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-gray-900 font-semibold">
                          ${(parseInt(employee.salary || 0) * 12).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {employees.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No employees found. Add employees to see finance details.
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Financial Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-600 text-sm mb-2">Total Monthly Payroll</p>
                <p className="text-3xl font-bold text-gray-900">${totalPayroll.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-2">Total Annual Payroll</p>
                <p className="text-3xl font-bold text-gray-900">${(totalPayroll * 12).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-2">Average Employee Cost</p>
                <p className="text-3xl font-bold text-gray-900">${(totalPayroll / (activeEmployees || 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-2">Cost per Department</p>
                <p className="text-gray-600 text-sm mt-4">View department-wise breakdown in the table above</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
