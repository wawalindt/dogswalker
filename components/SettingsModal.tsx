
import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Team } from '../types';

export const SettingsModal: React.FC = () => {
  const { setActiveModal, theme, teams, setTeams, walkDuration, setWalkDuration, resetWalks, autoAddFriends, setAutoAddFriends } = useAppStore();
  const [isEditingTeams, setIsEditingTeams] = useState(false);
  const [newTeam, setNewTeam] = useState<Team>({ id: '', name: '', location: '', coordinatorName: '', membersCount: 0 });

  const handleAddTeam = () => {
      if (!newTeam.id || !newTeam.name) return alert("Заполните ID и название команды");
      if (teams.some(t => t.id === newTeam.id)) return alert("Команда с таким ID уже существует");
      setTeams([...teams, newTeam]);
      setNewTeam({ id: '', name: '', location: '', coordinatorName: '', membersCount: 0 });
  };

  const handleRemoveTeam = (id: string) => {
      if (teams.length <= 1) return alert("Нельзя удалить последнюю команду");
      if (confirm(`Удалить команду ${id}? Это может повлиять на привязанных к ней волонтеров.`)) {
          setTeams(teams.filter(t => t.id !== id));
      }
  };

  return (
    <div className={`fixed inset-0 z-[1100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 ${theme}`}>
      <div className="bg-[#e2e8f0] dark:bg-[#1e293b] rounded-2xl shadow-2xl w-full max-w-sm flex flex-col border-2 border-slate-300 dark:border-slate-600 overflow-hidden">
        
        <div className="p-4 border-b border-slate-300 dark:border-slate-600 flex justify-between items-center bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight text-engraved">Настройки</h2>
          <button onClick={() => setActiveModal('none')} className="text-2xl leading-none text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-colors">&times;</button>
        </div>

        <div className="p-4 space-y-6 overflow-y-auto max-h-[70vh] no-scrollbar">
            
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
            </div>

            <div className="space-y-3">
                 <div className="flex justify-between items-center">
                    <span className="block font-bold text-slate-700 dark:text-slate-300 text-xs uppercase ml-1">Управление командами</span>
                    <button onClick={() => setIsEditingTeams(!isEditingTeams)} className="text-[10px] text-blue-600 font-bold uppercase hover:underline">{isEditingTeams ? 'Скрыть' : 'Настроить'}</button>
                 </div>
                 
                 {isEditingTeams && (
                     <div className="space-y-2 p-3 bg-white/30 dark:bg-black/20 rounded-xl border border-dashed border-slate-400">
                        {teams.map(t => (
                            <div key={t.id} className="flex items-center justify-between text-xs bg-white dark:bg-slate-800 p-2 rounded shadow-sm">
                                <span className="font-bold truncate max-w-[150px]">{t.name} <span className="text-[9px] opacity-40">({t.id})</span></span>
                                <button onClick={() => handleRemoveTeam(t.id)} className="text-red-500 font-black px-2 text-sm">&times;</button>
                            </div>
                        ))}
                        <div className="pt-2 border-t border-slate-400 space-y-2">
                            <input 
                                placeholder="ID (например, team_2)" 
                                value={newTeam.id} 
                                onChange={e => setNewTeam({...newTeam, id: e.target.value})}
                                className="w-full p-2 text-xs rounded border dark:bg-slate-900 dark:text-white"
                            />
                            <input 
                                placeholder="Название (Сектор Б)" 
                                value={newTeam.name} 
                                onChange={e => setNewTeam({...newTeam, name: e.target.value})}
                                className="w-full p-2 text-xs rounded border dark:bg-slate-900 dark:text-white"
                            />
                            <button onClick={handleAddTeam} className="w-full py-2 bg-blue-600 text-white text-[10px] font-bold rounded uppercase shadow-metal">+ Добавить команду</button>
                        </div>
                     </div>
                 )}
            </div>
            
            <div className="pt-2 border-t border-slate-300 dark:border-slate-700">
                <button 
                    onClick={resetWalks}
                    className="w-full py-3 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400 text-xs font-black rounded-xl flex items-center justify-center gap-2 transition-colors border border-red-200 dark:border-red-900/50 uppercase shadow-sm"
                >
                    🗑 Сбросить счетчик прогулок
                </button>
            </div>

            <button 
                onClick={() => setActiveModal('debug')}
                className="w-full py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs font-mono font-bold rounded flex items-center justify-center gap-2"
            >
                <span>🛠</span> DB DEBUG
            </button>

        </div>
      </div>
    </div>
  );
};
