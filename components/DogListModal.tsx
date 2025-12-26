
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAppStore } from '../store';
import { Dog, DogComplexity, HealthStatus } from '../types';

const EmptyDog: Dog = {
    id: '',
    name: '',
    age: 0,
    weight: 0,
    health: 'OK',
    complexity: 'green',
    pairs: [],
    conflicts: [],
    teamId: 'team_1',
    walksToday: 0,
    groupId: null,
    isHidden: false,
    notes: '',
    row: ''
};

// --- Вспомогательный компонент для выбора собак ---
interface DogSelectorProps {
    label: string;
    selectedIds: string[];
    otherSelectedIds: string[]; 
    onToggle: (id: string) => void;
    type: 'pair' | 'conflict';
    allDogs: Dog[];
    currentDogId: string;
}

const DogSelector: React.FC<DogSelectorProps> = ({ label, selectedIds, otherSelectedIds, onToggle, type, allDogs, currentDogId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && containerRef.current) {
            setTimeout(() => {
                containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }, [isOpen]);

    const filteredDogs = useMemo(() => {
        const query = search.toLowerCase();
        return allDogs
            .filter(d => d.id !== currentDogId && !d.isHidden)
            .filter(d => {
                const name = String(d.name || '').toLowerCase();
                const id = String(d.id || '').toLowerCase();
                return name.includes(query) || id.includes(query);
            });
    }, [allDogs, currentDogId, search]);

    const themeColors = type === 'pair' 
        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-800' 
        : 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-200 dark:border-red-800';

    return (
        <div className="relative" ref={containerRef}>
            <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mb-1 tracking-wider">{label}</label>
            
            {/* Chips Area - Recessed Look */}
            <div 
                className="flex flex-wrap gap-1.5 p-2 min-h-[42px] border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-200 dark:bg-slate-900/50 cursor-pointer shadow-inner"
                onClick={() => setIsOpen(!isOpen)}
            >
                {selectedIds.length === 0 && !isOpen && (
                    <span className="text-slate-400 text-xs italic py-1 px-1">Нажмите, чтобы выбрать...</span>
                )}
                {selectedIds.map(id => {
                    const dog = allDogs.find(d => d.id === id);
                    return (
                        <div 
                            key={id} 
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold border shadow-sm ${themeColors}`}
                        >
                            <span>{dog ? dog.name : id}</span>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onToggle(id); }}
                                className="hover:scale-125 transition-transform ml-1 opacity-70 hover:opacity-100"
                            >
                                &times;
                            </button>
                        </div>
                    );
                })}
                <div className="ml-auto flex items-center pr-1">
                     <svg className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {/* Dropdown List */}
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[105]" onClick={() => setIsOpen(false)} />
                    <div className="absolute z-[110] mt-1 w-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl shadow-2xl flex flex-col max-h-[300px] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="p-2 border-b border-slate-300 dark:border-slate-600 bg-slate-200 dark:bg-slate-900">
                            <input 
                                placeholder="Поиск собаки..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full p-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div className="overflow-y-auto p-1 space-y-0.5 no-scrollbar">
                            {filteredDogs.map(dog => {
                                const isSelected = selectedIds.includes(dog.id);
                                const isInOther = otherSelectedIds.includes(dog.id);
                                return (
                                    <button
                                        key={dog.id}
                                        onClick={() => onToggle(dog.id)}
                                        className={`w-full flex items-center justify-between p-2.5 rounded-lg text-sm transition-colors border border-transparent ${
                                            isSelected 
                                                ? (type === 'pair' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-100 border-emerald-200 dark:border-emerald-800' : 'bg-red-100 dark:bg-red-900/40 text-red-900 dark:text-red-100 border-red-200 dark:border-red-800')
                                                : 'hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                                        }`}
                                    >
                                        <div className="flex flex-col items-start">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold">{dog.name}</span>
                                                {isInOther && (
                                                    <span className="text-[8px] bg-yellow-100 text-yellow-700 px-1 rounded uppercase font-black">В другом списке</span>
                                                )}
                                            </div>
                                            <span className="text-[10px] opacity-60 font-mono">
                                                ID: {dog.id} {dog.row ? `• ${dog.row}` : ''}
                                            </span>
                                        </div>
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                            isSelected 
                                                ? (type === 'pair' ? 'bg-emerald-500 border-emerald-500' : 'bg-red-500 border-red-500')
                                                : 'border-slate-300 dark:border-slate-600'
                                        }`}>
                                            {isSelected && <span className="text-white text-xs font-black">✓</span>}
                                        </div>
                                    </button>
                                );
                            })}
                            {filteredDogs.length === 0 && (
                                <div className="p-4 text-center text-xs text-slate-500 italic">Ничего не найдено</div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export const DogListModal: React.FC = () => {
    const { dogs, addDog, updateDog, setActiveModal, theme, sortOrder, setSortOrder } = useAppStore();
    const [view, setView] = useState<'list' | 'form'>('list');
    const [formData, setFormData] = useState<Dog>(EmptyDog);
    const [isEditing, setIsEditing] = useState(false);

    // Sorting logic for the Modal List
    const sortedDogs = useMemo(() => {
        return [...dogs].sort((a, b) => {
            if (sortOrder === 'name') {
                return String(a.name).localeCompare(String(b.name));
            } else if (sortOrder === 'id') {
                const aIdNum = parseInt(a.id);
                const bIdNum = parseInt(b.id);
                if (!isNaN(aIdNum) && !isNaN(bIdNum)) return aIdNum - bIdNum;
                return String(a.id).localeCompare(String(b.id));
            } else if (sortOrder === 'row') {
                const aRow = a.row || 'zzzz';
                const bRow = b.row || 'zzzz';
                return String(aRow).localeCompare(String(bRow), undefined, { numeric: true });
            }
            return 0;
        });
    }, [dogs, sortOrder]);

    const handleEdit = (dog: Dog) => {
        setFormData({ ...dog });
        setIsEditing(true);
        setView('form');
    };

    const handleAdd = () => {
        // Логика: находим максимальный числовой ID и прибавляем 1. Минимум 100.
        const numericIds = dogs
            .map(d => parseInt(d.id))
            .filter(n => !isNaN(n));
        const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 99;
        const nextId = (maxId + 1).toString();
        
        setFormData({ ...EmptyDog, id: nextId }); 
        setIsEditing(false);
        setView('form');
    };

    const handleToggleRelation = (field: 'pairs' | 'conflicts', id: string) => {
        setFormData(prev => {
            const oppositeField = field === 'pairs' ? 'conflicts' : 'pairs';
            const isRemoving = prev[field].includes(id);

            let nextOpposite = prev[oppositeField];
            if (!isRemoving && nextOpposite.includes(id)) {
                nextOpposite = nextOpposite.filter(item => item !== id);
            }

            const nextCurrent = isRemoving
                ? prev[field].filter(item => item !== id)
                : [...prev[field], id];

            return { 
                ...prev, 
                [field]: nextCurrent,
                [oppositeField]: nextOpposite
            };
        });
    };

    const handleSave = () => {
        if (!formData.name) return alert('Введите кличку');
        
        const currentId = formData.id;
        const originalDog = dogs.find(d => d.id === currentId);
        const oldPairs = originalDog ? originalDog.pairs : [];
        const oldConflicts = originalDog ? originalDog.conflicts : [];

        // Logic to sync pairs/conflicts symmetrically
        const newPairs = formData.pairs;
        newPairs.filter(id => !oldPairs.includes(id)).forEach(targetId => {
            const targetDog = dogs.find(d => d.id === targetId);
            if (targetDog && !targetDog.pairs.includes(currentId)) {
                updateDog(targetId, { pairs: [...targetDog.pairs, currentId] });
            }
        });
        oldPairs.filter(id => !newPairs.includes(id)).forEach(targetId => {
            const targetDog = dogs.find(d => d.id === targetId);
            if (targetDog) {
                updateDog(targetId, { pairs: targetDog.pairs.filter(id => id !== currentId) });
            }
        });

        const newConflicts = formData.conflicts;
        newConflicts.filter(id => !oldConflicts.includes(id)).forEach(targetId => {
            const targetDog = dogs.find(d => d.id === targetId);
            if (targetDog && !targetDog.conflicts.includes(currentId)) {
                updateDog(targetId, { conflicts: [...targetDog.conflicts, currentId] });
            }
        });
        oldConflicts.filter(id => !newConflicts.includes(id)).forEach(targetId => {
            const targetDog = dogs.find(d => d.id === targetId);
            if (targetDog) {
                updateDog(targetId, { conflicts: targetDog.conflicts.filter(id => id !== currentId) });
            }
        });

        if (isEditing) {
            updateDog(formData.id, formData);
        } else {
            addDog(formData);
        }
        setView('list');
    };

    const cycleSortOrder = () => {
        if (sortOrder === 'name') setSortOrder('id');
        else if (sortOrder === 'id') setSortOrder('row');
        else setSortOrder('name');
    };

    const sortLabel = {
        'name': 'По Алфавиту',
        'id': 'По ID',
        'row': 'По вольеру'
    }[sortOrder];

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 ${theme}`}>
            <div className="bg-[#e2e8f0] dark:bg-[#1e293b] rounded-2xl shadow-2xl w-full max-lg h-[85vh] flex flex-col border-2 border-slate-300 dark:border-slate-600 overflow-hidden">
                
                {/* Header */}
                <div className="p-4 border-b border-slate-300 dark:border-slate-600 flex justify-between items-center bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight text-engraved">
                        {view === 'list' ? 'Список животных' : (isEditing ? 'Редактирование' : 'Новая собака')}
                    </h2>
                    <div className="flex gap-2 items-center">
                        {view === 'list' && (
                            <>
                                <button 
                                    onClick={cycleSortOrder} 
                                    className="px-2 py-1 bg-slate-300 dark:bg-slate-700 rounded text-xs font-bold text-slate-700 dark:text-slate-300 mr-2 shadow-sm border border-slate-400 dark:border-slate-600"
                                    title="Сменить сортировку"
                                >
                                    ⇅ {sortLabel}
                                </button>
                                <button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm font-bold shadow-md active:scale-95 transition-transform border-t border-blue-400 border-b border-blue-800">
                                    Добавить
                                </button>
                            </>
                        )}
                        <button onClick={() => view === 'form' ? setView('list') : setActiveModal('none')} className="text-2xl leading-none text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-colors">
                            &times;
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto bg-[#f1f5f9] dark:bg-[#0f172a] p-4 no-scrollbar">
                    
                    {view === 'list' ? (
                        <div className="space-y-2">
                            {sortedDogs.map(dog => (
                                <div key={dog.id} onClick={() => handleEdit(dog)} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 active:scale-[0.99] transition-transform cursor-pointer shadow-sm hover:border-blue-400 dark:hover:border-blue-600">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="flex flex-col items-center min-w-[30px]">
                                            <span className="text-lg leading-none filter drop-shadow-sm">
                                                {dog.complexity === 'green' && '🟢'}
                                                {dog.complexity === 'yellow' && '🟡'}
                                                {dog.complexity === 'orange' && '🟠'}
                                                {dog.complexity === 'red' && '⚠️'}
                                            </span>
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <div className="font-bold text-lg text-slate-800 dark:text-slate-200 truncate flex gap-2 items-center">
                                                {dog.name}
                                                {dog.notes && <span className="text-base opacity-70">💬</span>}
                                                {dog.health === 'Лечение' && <span className="text-base animate-pulse" title="Лечение">💊</span>}
                                                {dog.health === 'Не гуляет' && <span className="text-base" title="Не гуляет">⛔</span>}
                                                {dog.isHidden && <span className="text-[10px] bg-slate-200 text-slate-600 px-1 rounded border border-slate-300">Hidden</span>}
                                            </div>
                                            <div className="text-sm text-gray-400 truncate">
                                                ID: {dog.id} {dog.row ? `• 🏛 № ${dog.row}` : ''} {dog.pairs.length > 0 && `• 🧩  ${dog.pairs.length}`} {dog.conflicts.length > 0 && `• ⚡️  ${dog.conflicts.length}`}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-slate-400 text-lg">›</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-6 pb-4">
                             <div>
                                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mb-1 tracking-wider">Заметки / Особенности:</label>
                                <textarea 
                                    value={formData.notes || ''} 
                                    onChange={e => setFormData({...formData, notes: e.target.value})}
                                    placeholder="Боится громких звуков..."
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm h-20 shadow-inner focus:ring-2 focus:ring-blue-500 outline-none" 
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mb-1 tracking-wider">Кличка *</label>
                                    <input 
                                        value={formData.name} 
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold shadow-sm" 
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mb-1 tracking-wider">ID</label>
                                    <input disabled value={formData.id} className="w-full p-2 bg-slate-200 dark:bg-slate-900 rounded-lg text-slate-500 text-sm font-mono shadow-inner border border-transparent" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mb-1 tracking-wider">Характер</label>
                                    <select 
                                        value={formData.complexity} 
                                        onChange={e => setFormData({...formData, complexity: e.target.value as DogComplexity})}
                                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                                    >
                                        <option value="green">🟢 Спокойный</option>
                                        <option value="yellow">🟡 С особенностями</option>
                                        <option value="orange">🟠 Сложный</option>
                                        <option value="red">⚠️ Опасный</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mb-1 tracking-wider">Здоровье</label>
                                    <select 
                                        value={formData.health} 
                                        onChange={e => setFormData({...formData, health: e.target.value as HealthStatus})}
                                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                                    >
                                        <option value="OK">OK</option>
                                        <option value="Лечение">Лечение</option>
                                        <option value="Не гуляет">Не гуляет</option>
                                    </select>
                                </div>
                            </div>

                            <DogSelector 
                                label="Друзья"
                                type="pair"
                                selectedIds={formData.pairs}
                                otherSelectedIds={formData.conflicts}
                                onToggle={(id) => handleToggleRelation('pairs', id)}
                                allDogs={dogs}
                                currentDogId={formData.id}
                            />

                            <DogSelector 
                                label="Конфликты"
                                type="conflict"
                                selectedIds={formData.conflicts}
                                otherSelectedIds={formData.pairs}
                                onToggle={(id) => handleToggleRelation('conflicts', id)}
                                allDogs={dogs}
                                currentDogId={formData.id}
                            />

                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-1">
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mb-1 tracking-wider truncate">Вольер</label>
                                    <input 
                                        value={formData.row || ''} 
                                        onChange={e => setFormData({...formData, row: e.target.value})}
                                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mb-1 tracking-wider truncate">Возраст</label>
                                    <input 
                                        type="number"
                                        value={formData.age} 
                                        onChange={e => setFormData({...formData, age: Number(e.target.value)})}
                                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mb-1 tracking-wider truncate">Вес</label>
                                    <input 
                                        type="number"
                                        value={formData.weight} 
                                        onChange={e => setFormData({...formData, weight: Number(e.target.value)})}
                                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm" 
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-200 dark:bg-slate-800/50 rounded-xl border border-slate-300 dark:border-slate-600 shadow-inner">
                                <div>
                                    <span className="block text-sm font-bold text-slate-800 dark:text-slate-200">Архивация</span>
                                    <span className="text-[10px] text-slate-500">Скрыть из главного списка</span>
                                </div>
                                <button 
                                    onClick={() => setFormData({...formData, isHidden: !formData.isHidden})}
                                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all shadow-sm border ${
                                        formData.isHidden 
                                            ? 'bg-red-100 text-red-700 border-red-300' 
                                            : 'bg-emerald-100 text-emerald-700 border-emerald-300'
                                    }`}
                                >
                                    {formData.isHidden ? 'Скрыт' : 'Виден'}
                                </button>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button 
                                    onClick={() => setView('list')} 
                                    className="flex-1 py-3.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors uppercase text-sm"
                                >
                                    Отмена
                                </button>
                                <button 
                                    onClick={handleSave} 
                                    className="flex-1 py-3.5 rounded-xl bg-blue-600 text-white font-black shadow-metal hover:brightness-110 transition-all active:scale-[0.98] border-t border-blue-400 border-b border-blue-800 uppercase text-sm"
                                >
                                    Сохранить
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
