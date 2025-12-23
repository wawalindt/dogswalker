
import React, { useState } from 'react';
import { useAppStore } from '../store';

export const LoginScreen: React.FC = () => {
    const { volunteers, login, fetchData, isSyncing, error } = useAppStore();
    const [logoError, setLogoError] = useState(false);
    
    const activeVolunteers = volunteers.filter(v => v.status === 'active');

    return (
        <div className="fixed inset-0 bg-[#0f172a] flex items-center justify-center p-4 z-[999] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 to-[#020617]">
            <div className="bg-[#e2e8f0] dark:bg-[#1e293b] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] w-full max-w-md p-6 border-4 border-slate-400 dark:border-slate-600 relative overflow-hidden">
                {/* Bolts in corners */}
                <div className="absolute top-3 left-3 w-3 h-3 rounded-full bg-gradient-to-br from-white to-slate-500 shadow-md border border-slate-400"></div>
                <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-gradient-to-br from-white to-slate-500 shadow-md border border-slate-400"></div>
                <div className="absolute bottom-3 left-3 w-3 h-3 rounded-full bg-gradient-to-br from-white to-slate-500 shadow-md border border-slate-400"></div>
                <div className="absolute bottom-3 right-3 w-3 h-3 rounded-full bg-gradient-to-br from-white to-slate-500 shadow-md border border-slate-400"></div>

                <div className="text-center mb-6 relative z-10 mt-2">
                    {!logoError ? (
                        <img 
                            src="logo.png" 
                            onError={() => setLogoError(true)}
                            className="w-24 h-24 rounded-full object-cover shadow-plate mx-auto mb-4 border-4 border-amber-500/50" 
                            alt="Logo" 
                        />
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-amber-700 flex items-center justify-center text-6xl shadow-plate mx-auto mb-4 border-4 border-amber-300">
                            🐕‍🦺
                        </div>
                    )}
                    <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 drop-shadow-md tracking-tight uppercase text-engraved">Кто вы?</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-bold mt-1">Выберите профиль для доступа</p>
                </div>
                
                {activeVolunteers.length > 0 ? (
                    <div className="space-y-3 max-h-[50vh] overflow-y-auto no-scrollbar px-1 py-1 relative z-10 bg-black/5 dark:bg-black/20 rounded-xl shadow-inner border border-white/50 dark:border-white/5">
                        {activeVolunteers.map(v => (
                            <button 
                                key={v.id}
                                onClick={() => login(v)}
                                className="w-full p-4 rounded-xl bg-gradient-to-b from-white to-gray-200 dark:from-slate-700 dark:to-slate-800 hover:from-blue-50 hover:to-blue-100 dark:hover:from-slate-600 dark:hover:to-slate-700 border-t border-white dark:border-slate-500 border-b border-gray-400 dark:border-black shadow-md active:shadow-inner active:translate-y-px transition-all flex items-center justify-between group"
                            >
                                <div className="text-left">
                                    <div className="font-black text-slate-800 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-300 text-lg leading-none mb-1 text-engraved">
                                        {v.name}
                                    </div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                                        {v.role === 'coordinator' ? 'Координатор' : 'Волонтер'}
                                    </div>
                                </div>
                                <span className="text-2xl text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 font-black">→</span>
                            </button>
                        ))}
                    </div>
                ) : (
                     <div className="text-center py-10 text-slate-500 flex flex-col gap-2">
                        <span>{isSyncing ? 'Загрузка списка...' : 'Список волонтеров пуст'}</span>
                        {!isSyncing && (
                             <button 
                                onClick={() => login({ id: 'u_guest', name: 'Гость', role: 'volunteer', status: 'active' })}
                                className="text-blue-600 hover:text-blue-800 underline text-sm font-bold"
                            >
                                Войти как гость
                            </button>
                        )}
                     </div>
                )}
                
                <div className="mt-6 pt-4 border-t border-slate-300 dark:border-slate-700 flex justify-center relative z-10">
                    <button onClick={() => fetchData()} className="text-slate-500 hover:text-blue-600 text-xs font-black uppercase tracking-widest hover:underline flex items-center gap-1 transition-colors">
                        {isSyncing && <span className="animate-spin">♻️</span>}
                        {isSyncing ? 'Обновление...' : 'Обновить список'}
                    </button>
                </div>
                 {error && (
                     <div className="mt-2 text-red-600 text-xs text-center font-bold bg-red-100 py-1 rounded border border-red-200 shadow-sm">{error}</div>
                 )}
            </div>
        </div>
    );
};
