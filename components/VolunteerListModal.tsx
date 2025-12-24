
import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store';
import { User } from '../types';

const EmptyUser: User = {
    id: '',
    name: '',
    telegramId: '',
    telegramUsername: '',
    role: 'volunteer',
    status: 'active',
    experience: 'novice',
    teamId: ''
};

export const VolunteerListModal: React.FC = () => {
    const { volunteers, addVolunteer, updateVolunteer, setActiveModal, theme, currentTeamId } = useAppStore();
    const [view, setView] = useState<'list' | 'form'>('list');
    const [formData, setFormData] = useState<User>(EmptyUser);
    const [isEditing, setIsEditing] = useState(false);

    const teamVolunteers = useMemo(() => {
        return volunteers.filter(v => v.teamId === currentTeamId || !v.teamId);
    }, [volunteers, currentTeamId]);

    const handleEdit = (user: User) => {
        setFormData({ ...user });
        setIsEditing(true);
        setView('form');
    };

    const handleAdd = () => {
        setFormData({ ...EmptyUser, id: `u${Date.now()}`, teamId: currentTeamId || '' });
        setIsEditing(false);
        setView('form');
    };

    const handleSave = () => {
        if (!formData.name) return alert('Введите имя');
        
        if (isEditing) {
            updateVolunteer(formData.id, formData);
        } else {
            addVolunteer(formData);
        }
        setView('list');
    };

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 ${theme}`}>
            <div className="bg-[#e2e8f0] dark:bg-[#1e293b] rounded-2xl shadow-2xl w-full max-w-lg h-[80vh] flex flex-col border-2 border-slate-300 dark:border-slate-600 overflow-hidden">
                
                {/* Header */}
                <div className="p-4 border-b border-slate-300 dark:border-slate-600 flex justify-between items-center bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight text-engraved">
                        {view === 'list' ? 'Команда' : (isEditing ? 'Редактирование' : 'Новый волонтёр')}
                    </h2>
                    <div className="flex gap-2">
                        {view === 'list' && (
                            <button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm font-bold shadow-md active:scale-95 transition-transform border-t border-blue-400 border-b border-blue-800 uppercase">
                                + Добавить
                            </button>
                        )}
                        <button onClick={() => view === 'form' ? setView('list') : setActiveModal('none')} className="text-2xl leading-none text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-colors">
                            &times;
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto bg-[#f1f5f9] dark:bg-[#0f172a] p-4">
                    
                    {view === 'list' ? (
                        <div className="space-y-3">
                            {teamVolunteers.map(user => (
                                <div key={user.id} onClick={() => handleEdit(user)} className="flex flex-col p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 active:scale-[0.99] transition-transform cursor-pointer shadow-sm hover:border-blue-400 dark:hover:border-blue-600">
                                     <div className="flex justify-between items-start mb-1">
                                        <div>
                                            <div className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                                {user.name}
                                                {user.role === 'coordinator' && <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200 text-[9px] uppercase font-black">Coord</span>}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-mono">TG ID: {user.telegramId || '—'}</div>
                                            {user.telegramUsername && <div className="text-[10px] text-slate-400 font-mono">@{user.telegramUsername}</div>}
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase border shadow-sm ${user.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                                {user.status === 'active' ? 'ACTIVE' : 'INACTIVE'}
                                            </span>
                                            <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wide">{user.experience || 'novice'}</span>
                                        </div>
                                     </div>
                                </div>
                            ))}
                            {teamVolunteers.length === 0 && <div className="text-center py-10 text-slate-400 text-sm">В этой команде пока нет волонтеров</div>}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Form */}
                             <div>
                                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mb-1 tracking-wider">User ID</label>
                                <input disabled value={formData.id} className="w-full p-2 bg-slate-200 dark:bg-slate-900 rounded-lg text-slate-500 text-sm font-mono shadow-inner border border-transparent" />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mb-1 tracking-wider">Имя *</label>
                                <input 
                                    value={formData.name} 
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold shadow-sm" 
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mb-1 tracking-wider">Telegram ID</label>
                                    <input 
                                        value={formData.telegramId || ''} 
                                        onChange={e => setFormData({...formData, telegramId: e.target.value})}
                                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mb-1 tracking-wider">Telegram Username</label>
                                    <input 
                                        value={formData.telegramUsername || ''} 
                                        onChange={e => setFormData({...formData, telegramUsername: e.target.value})}
                                        placeholder="без @"
                                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm" 
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mb-1 tracking-wider">Роль</label>
                                    <select 
                                        value={formData.role} 
                                        onChange={e => setFormData({...formData, role: e.target.value as 'volunteer' | 'coordinator'})}
                                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                                    >
                                        <option value="volunteer">Волонтёр</option>
                                        <option value="coordinator">Координатор</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mb-1 tracking-wider">Опыт</label>
                                    <select 
                                        value={formData.experience || 'novice'} 
                                        onChange={e => setFormData({...formData, experience: e.target.value as any})}
                                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                                    >
                                        <option value="novice">Новичок</option>
                                        <option value="experienced">Опытный</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mb-1 tracking-wider">Статус</label>
                                    <select 
                                        value={formData.status} 
                                        onChange={e => setFormData({...formData, status: e.target.value as 'active' | 'inactive'})}
                                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                                    >
                                        <option value="active">Активен</option>
                                        <option value="inactive">Неактивен</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mb-1 tracking-wider">Команда (ID)</label>
                                    <input 
                                        value={formData.teamId || ''} 
                                        onChange={e => setFormData({...formData, teamId: e.target.value})}
                                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm" 
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button onClick={() => setView('list')} className="flex-1 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors uppercase text-sm">Отмена</button>
                                <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-black shadow-metal hover:brightness-110 transition-all active:scale-[0.98] border-t border-blue-400 border-b border-blue-800 uppercase text-sm">Сохранить</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
