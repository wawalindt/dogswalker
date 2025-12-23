
import React from 'react';
import { useAppStore } from '../store';

export const SettingsModal: React.FC = () => {
  const { setActiveModal, theme, toggleTheme, currentTeamId, teams, setTeam, walkDuration, setWalkDuration, resetWalks, autoAddFriends, setAutoAddFriends } = useAppStore();

  return (
    <div className={`fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 ${theme}`}>
      <div className="bg-[#e2e8f0] dark:bg-[#1e293b] rounded-2xl shadow-2xl w-full max-w-sm flex flex-col border-2 border-slate-300 dark:border-slate-600 overflow-hidden">
        
        {/* Header - Metal Gradient */}
        <div className="p-4 border-b border-slate-300 dark:border-slate-600 flex justify-between items-center bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight text-engraved">Настройки</h2>
          <button onClick={() => setActiveModal('none')} className="text-2xl leading-none text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-colors">&times;</button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
            
            {/* Auto Add Friends Toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800/50 rounded-xl shadow-inner border border-white/50 dark:border-white/5">
                <div className="flex flex-col">
                    <span className="font-bold text-slate-700 dark:text-slate-300 text-sm uppercase">Авто-сбор друзей</span>
                    <span className="text-[10px] text-slate-500">Добавлять пару через 1 сек</span>
                </div>
                <button 
                    onClick={() => setAutoAddFriends(!autoAddFriends)}
                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all shadow-sm border ${autoAddFriends ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 border-slate-300 dark:border-slate-600'}`}
                >
                    {autoAddFriends ? 'ВКЛ' : 'ВЫКЛ'}
                </button>
            </div>

            {/* Duration Slider */}
            <div className="p-3 bg-slate-100 dark:bg-slate-800/50 rounded-xl shadow-inner border border-white/50 dark:border-white/5">
                 <div className="flex justify-between mb-2">
                     <span className="font-bold text-slate-700 dark:text-slate-300 text-sm uppercase">Длительность</span>
                     <span className="font-black text-blue-600 dark:text-blue-400">{walkDuration} мин.</span>
                 </div>
                 <input 
                    type="range" 
                    min="3" 
                    max="60" 
                    step="30"
                    value={walkDuration}
                    onChange={(e) => setWalkDuration(Number(e.target.value))}
                    className="w-full h-2 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                 />
                 <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                     <span>3 мин</span>
                     <span>60 мин</span>
                 </div>
            </div>

            {/* Team Selection */}
            <div>
                 <span className="block font-bold text-slate-700 dark:text-slate-300 text-xs uppercase mb-2 ml-1">Активная команда</span>
                 <select 
                    value={currentTeamId || ''} 
                    onChange={(e) => setTeam(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
                 >
                    {teams.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                 </select>
            </div>
            
            <div className="pt-2 border-t border-slate-300 dark:border-slate-700">
                <button 
                    onClick={resetWalks}
                    className="w-full py-3 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400 text-xs font-black rounded-xl flex items-center justify-center gap-2 transition-colors border border-red-200 dark:border-red-900/50 uppercase shadow-sm"
                >
                    🗑 Сбросить счетчик "Прогулки сегодня"
                </button>
            </div>

            <div className="pt-2 border-t border-dashed border-slate-300 dark:border-slate-700">
                <button 
                    onClick={() => setActiveModal('debug')}
                    className="w-full py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs font-mono font-bold rounded flex items-center justify-center gap-2"
                >
                    <span>🛠</span> DB DEBUG
                </button>
            </div>

        </div>
      </div>
    </div>
  );
};
