import React from 'react';
import { Users, Shield, Search, Filter, MoreVertical, Mail } from 'lucide-react';
import { motion } from 'motion/react';

export default function UserManagement() {
  const users = [
    { id: 1, name: 'John Doe', email: 'john@example.com', plan: 'PRO', status: 'Active', joined: '2024-03-15' },
    { id: 2, name: 'Alice Smith', email: 'alice@example.com', plan: 'BASIC', status: 'Active', joined: '2024-04-01' },
    { id: 3, name: 'Bob Wilson', email: 'bob@example.com', plan: 'STANDARD', status: 'Inactive', joined: '2024-02-10' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500 mt-1">Manage and monitor all platform users.</p>
        </div>
        <button className="px-5 py-2.5 bg-red-600 text-white font-semibold rounded-xl shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all">
          Add New User
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
            />
          </div>
          <button className="flex items-center gap-2 text-slate-600 font-medium hover:text-slate-900">
            <Filter size={18} /> Filters
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">User</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Plan</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Joined</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 font-bold">
                        {user.name[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{user.name}</div>
                        <div className="text-sm text-slate-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      user.plan === 'PRO' ? 'bg-amber-100 text-amber-700' : 
                      user.plan === 'STANDARD' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {user.plan}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <span className="text-sm font-medium text-slate-600">{user.status}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-sm text-slate-500">{user.joined}</td>
                  <td className="px-8 py-5">
                    <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
