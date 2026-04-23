import React from 'react';
import { CreditCard, DollarSign, Download, ExternalLink, Search } from 'lucide-react';

export default function BillingManagement() {
  const transactions = [
    { id: 'TXN-9021', user: 'john@example.com', plan: 'PRO', amount: '₹2,999', date: '2024-04-10', status: 'Success' },
    { id: 'TXN-9022', user: 'alice@example.com', plan: 'BASIC', amount: '₹499', date: '2024-04-09', status: 'Success' },
    { id: 'TXN-9023', user: 'bob@example.com', plan: 'STANDARD', amount: '₹1,499', date: '2024-04-08', status: 'Failed' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Billing Management</h1>
        <p className="text-slate-500 mt-1">Review revenue, manage subscriptions, and process refunds.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl text-white shadow-xl">
           <div className="flex items-center gap-3 text-slate-400 mb-2">
             <DollarSign size={18} />
             <span className="text-sm font-semibold uppercase tracking-wider">Total Revenue (MRR)</span>
           </div>
           <div className="text-4xl font-bold">₹12,45,000</div>
           <div className="mt-4 text-emerald-400 text-sm font-bold">+2.4% from last month</div>
        </div>
        <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-xl">
           <div className="flex items-center gap-3 text-slate-400 mb-2">
             <CreditCard size={18} />
             <span className="text-sm font-semibold uppercase tracking-wider">Active Subscriptions</span>
           </div>
           <div className="text-4xl font-bold text-slate-900">4,289</div>
           <div className="mt-4 text-slate-500 text-sm font-medium">BASIC (60%), STD (30%), PRO (10%)</div>
        </div>
        <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-xl">
           <div className="flex items-center gap-3 text-slate-400 mb-2">
             <Download size={18} />
             <span className="text-sm font-semibold uppercase tracking-wider">Failed Payments</span>
           </div>
           <div className="text-4xl font-bold text-red-600">12</div>
           <div className="mt-4 text-red-500 text-sm font-bold underline cursor-pointer">Retry all failed</div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
           <h3 className="font-bold text-slate-900">Recent Transactions</h3>
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <input type="text" placeholder="TXN ID or User..." className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
           </div>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50/50">
            <tr>
              <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase">TXN ID</th>
              <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase">User</th>
              <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase">Amount</th>
              <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase">Status</th>
              <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase">Invoice</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {transactions.map((txn) => (
              <tr key={txn.id}>
                <td className="px-8 py-4 text-sm font-mono text-slate-600">{txn.id}</td>
                <td className="px-8 py-4 text-sm font-medium text-slate-900">{txn.user}</td>
                <td className="px-8 py-4 text-sm font-bold text-slate-900">{txn.amount}</td>
                <td className="px-8 py-4 text-sm">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${txn.status === 'Success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {txn.status}
                  </span>
                </td>
                <td className="px-8 py-4 text-sm">
                  <button className="text-red-600 hover:underline flex items-center gap-1">
                    <Download size={14} /> PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
