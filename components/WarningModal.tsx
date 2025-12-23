
import React from 'react';
import { ValidationIssue } from '../types';

interface WarningModalProps {
  issues: ValidationIssue[];
  onCancel: () => void;
  onConfirm: () => void;
}

export const WarningModal: React.FC<WarningModalProps> = ({ issues, onCancel, onConfirm }) => {
  const criticalCount = issues.filter(i => i.type === 'critical').length;
  const hasCritical = criticalCount > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#e2e8f0] dark:bg-[#1e293b] rounded-2xl shadow-2xl max-w-sm w-full border-2 border-slate-300 dark:border-slate-600 overflow-hidden">
        
        {/* Header */}
        <div className={`p-4 border-b border-slate-300 dark:border-slate-600 ${hasCritical ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-slate-200 dark:bg-slate-800'}`}>
          <h3 className={`text-lg font-black uppercase tracking-tight ${hasCritical ? 'text-amber-700 dark:text-amber-400' : 'text-slate-700 dark:text-slate-200' }`}>
            {hasCritical ? '🚧 Предупреждение' : 'ℹ️ На всякий...'}
          </h3>
          <p className="text-xs opacity-80 mt-1 font-bold text-slate-600 dark:text-slate-400">
             Я просто хотел напомнить. Но вам, конечно, виднее...  
          </p>
        </div>

        {/* List */}
        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto bg-[#f1f5f9] dark:bg-[#0f172a] shadow-inner">
          {issues.map((issue, idx) => (
            <div key={idx} className="flex gap-3 items-start p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
               <span className="text-lg leading-none mt-0.5">
                   {issue.type === 'critical' ? '⚡️' : issue.type === 'warning' ? '🧐' : 'ℹ️'}
               </span>
               <span className={`text-sm leading-tight font-medium ${
                   issue.type === 'critical' ? 'text-amber-700 dark:text-amber-400' : 
                   issue.type === 'warning' ? 'text-slate-800 dark:text-slate-200' : 
                   'text-slate-500 dark:text-slate-400'
               }`}>
                 {issue.message}
               </span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-slate-300 dark:border-slate-600 flex gap-3 bg-slate-200 dark:bg-slate-900">
          <button 
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-slate-400 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-300 dark:hover:bg-slate-800 transition-colors uppercase"
          >
            Отмена
          </button>
          
          <button 
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-white font-black text-sm shadow-metal active:scale-[0.98] transition-transform uppercase border-t border-b ${
                hasCritical 
                ? 'bg-amber-500 hover:bg-amber-600 text-black border-amber-400 border-amber-700' 
                : 'bg-slate-600 hover:bg-slate-700 text-white border-slate-500 border-slate-800'
            }`}
          >
            {hasCritical ? 'Рискнуть' : 'Гуляем'}
          </button>
        </div>

      </div>
    </div>
  );
};
