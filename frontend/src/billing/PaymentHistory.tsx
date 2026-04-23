import React from 'react';
import { Download, CreditCard, ExternalLink, Calendar, ReceiptText } from 'lucide-react';

export default function PaymentHistory() {
  const history = [
    { id: 'INV-001', date: 'Apr 10, 2024', amount: '₹1,499', status: 'Paid', plan: 'Standard' },
    { id: 'INV-002', date: 'Mar 10, 2024', amount: '₹1,499', status: 'Paid', plan: 'Standard' },
    { id: 'INV-003', date: 'Feb 10, 2024', amount: '₹499', status: 'Paid', plan: 'Basic' },
  ];

  return (
    <div className="max-w-5xl mx-auto py-12 px-6">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <ReceiptText className="text-red-600" size={32} />
          Payment History
        </h1>
        <p className="text-slate-500 mt-2">Manage your invoices and billing information.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Invoice</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Plan</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {history.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-8 py-5">
                    <span className="font-mono text-sm font-bold text-slate-900">{inv.id}</span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                      <Calendar size={14} />
                      {inv.date}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-sm font-semibold text-slate-700">{inv.plan}</span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-sm font-black text-slate-900">{inv.amount}</span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold">
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all">
                      <Download size={14} /> Download PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {history.length === 0 && (
          <div className="p-20 text-center text-slate-400 font-medium">
             No payment history found.
          </div>
        )}
      </div>

      <div className="mt-8 p-6 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
          <CreditCard size={20} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-amber-900">Auto-renewal is active</p>
          <p className="text-xs text-amber-700">Your next payment of ₹1,499 will be processed on May 10, 2024.</p>
        </div>
        <button className="text-sm font-bold text-red-600 hover:underline">Manage Settings</button>
      </div>
    </div>
  );
}
