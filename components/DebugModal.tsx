import React from 'react';
import { useAppStore } from '../store';

export const DebugModal: React.FC = () => {
  const { groups, setActiveModal, theme } = useAppStore();

  return (
    <div className={`fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 ${theme}`}>
      <div className="bg-white dark:bg-zinc-950 rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col border border-red-500 overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-red-200 dark:border-red-900 flex justify-between items-center bg-red-50 dark:bg-red-900/20">
          <div>
              <h2 className="text-xl font-mono font-bold text-red-700 dark:text-red-400">🔧 DB DEBUGGER</h2>
              <p className="text-xs text-red-600 dark:text-red-300">Сравнение сырых данных (из Google Sheets) и обработанных приложением</p>
          </div>
          <button onClick={() => setActiveModal('none')} className="px-4 py-2 bg-red-600 text-white font-bold rounded hover:bg-red-700">
             Закрыть
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-zinc-900 p-2">
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-200 dark:bg-zinc-800 sticky top-0 z-10 text-xs uppercase text-gray-500 dark:text-gray-400">
                    <tr>
                        <th className="p-2 border dark:border-zinc-700">Group ID</th>
                        <th className="p-2 border dark:border-zinc-700">Status</th>
                        <th className="p-2 border dark:border-zinc-700 bg-blue-50 dark:bg-blue-900/20">RAW Start (From DB)</th>
                        <th className="p-2 border dark:border-zinc-700 font-bold">Parsed Start (App)</th>
                        <th className="p-2 border dark:border-zinc-700 bg-blue-50 dark:bg-blue-900/20">RAW End (From DB)</th>
                        <th className="p-2 border dark:border-zinc-700 font-bold">Parsed End (App)</th>
                    </tr>
                </thead>
                <tbody className="text-xs font-mono">
                    {groups.map(g => (
                        <tr key={g.id} className="border-b dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
                            <td className="p-2 border-r dark:border-zinc-800 text-gray-500">{g.id}</td>
                            <td className="p-2 border-r dark:border-zinc-800 font-bold">
                                <span className={`px-1 rounded ${
                                    g.status === 'active' ? 'bg-green-200 text-green-900' : 
                                    g.status === 'completed' ? 'bg-gray-200 text-gray-900' : 'bg-yellow-100'
                                }`}>
                                    {g.status}
                                </span>
                            </td>
                            
                            {/* RAW START */}
                            <td className="p-2 border-r dark:border-zinc-800 text-blue-700 dark:text-blue-300 break-all bg-blue-50/50 dark:bg-blue-900/10">
                                {JSON.stringify(g.rawStartTime)}
                            </td>
                            
                            {/* PARSED START */}
                            <td className="p-2 border-r dark:border-zinc-800 font-bold text-gray-900 dark:text-white text-lg">
                                {g.startTime || '—'}
                            </td>

                            {/* RAW END */}
                            <td className="p-2 border-r dark:border-zinc-800 text-blue-700 dark:text-blue-300 break-all bg-blue-50/50 dark:bg-blue-900/10">
                                {JSON.stringify(g.rawEndTime)}
                            </td>

                            {/* PARSED END */}
                            <td className="p-2 border-r dark:border-zinc-800 font-bold text-gray-900 dark:text-white text-lg">
                                {g.endTime || '—'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
            {groups.length === 0 && (
                <div className="p-10 text-center text-gray-400">Нет групп для отображения</div>
            )}
        </div>
      </div>
    </div>
  );
};
