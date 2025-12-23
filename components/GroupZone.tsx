
import React, { useState, useMemo, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Dog, WalkGroup, ValidationIssue } from '../types';
import { DogCard } from './DogCard';
import { useAppStore } from '../store';
import { WarningModal } from './WarningModal';

interface GroupZoneProps {
  group: WalkGroup;
  dogs: Dog[];
}

export const GroupZone: React.FC<GroupZoneProps> = ({ group, dogs }) => {
  const { setNodeRef, isOver } = useDroppable({ id: group.id });
  const { startWalk, finishWalk, deleteGroup, updateGroupVolunteer, setEditingGroup, editingGroupId, validateGroup, volunteers } = useAppStore();
  const [isSelectingVolunteer, setIsSelectingVolunteer] = useState(false);
  const [showWarnings, setShowWarnings] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => { if (confirmDelete) { const t = setTimeout(() => setConfirmDelete(false), 3000); return () => clearTimeout(t); } }, [confirmDelete]);

  const isEditingThisGroup = editingGroupId === group.id;
  const allIssues = useMemo(() => validateGroup(group.id), [dogs, group.id, validateGroup]);
  const criticalIssues = allIssues.filter(i => i.type === 'critical');
  const hasConflict = criticalIssues.length > 0;

  let borderColor = 'border-gray-400 dark:border-zinc-600 bg-white dark:bg-zinc-900 shadow-md';
  
  if (isOver) {
    borderColor = 'border-blue-500 bg-blue-100 dark:bg-blue-900/40 ring-2 ring-blue-500';
  } else if (hasConflict && (group.status === 'forming' || isEditingThisGroup)) {
    borderColor = 'border-red-500 bg-red-50 dark:bg-red-900/20 animate-pulse ring-2 ring-red-500';
  } else if (group.status === 'active' && !isEditingThisGroup) {
    borderColor = 'border-green-600 bg-green-50 dark:bg-green-900/20 shadow-lg';
  }

  // Логика цвета заголовка
  const getHeaderColor = () => {
    // Редактируемая группа - Янтарный градиент как в хедере
    if (isEditingThisGroup) {
        return 'bg-amber-600 border-amber-600 dark:border-amber-900 text-amber-50';
        //return 'bg-gradient-to-r from-amber-700 via-amber-500 to-amber-700 dark:from-amber-800 dark:via-amber-400 dark:to-amber-800 border-amber-600 dark:border-amber-900 text-amber-50';        
    }
    if (hasConflict && group.status === 'forming') return 'bg-red-200 dark:bg-red-900/60 border-red-300 dark:border-red-800 text-gray-900 dark:text-white';
    if (group.status === 'active') return 'bg-green-200 dark:bg-green-900/50 border-green-300 dark:border-green-800 text-gray-900 dark:text-white';
    return 'bg-gray-300 dark:bg-zinc-800 border-gray-400 dark:border-zinc-700 text-gray-900 dark:text-white';
  };

  const handleStartClick = () => {
      if (allIssues.length > 0) setShowWarnings(true);
      else startWalk(group.id);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!confirmDelete) setConfirmDelete(true);
      else deleteGroup(group.id);
  };

  return (
    <>
    <div ref={setNodeRef} className={`flex flex-col rounded-xl border-2 ${group.status === 'active' ? 'border-solid' : 'border-dashed'} ${borderColor} transition-all duration-200 overflow-hidden h-fit min-h-[140px] relative`}>
      {/* Header */}
      <div className={`p-2.5 border-b flex justify-between items-center relative overflow-hidden ${getHeaderColor()}`}>
        {isEditingThisGroup && <div className="absolute inset-0 bg-brushed opacity-10 pointer-events-none mix-blend-overlay"></div>}
        
        <div className="flex items-center gap-2 relative z-10">
          <span className="font-bold text-sm text-shadow-sm">{group.volunteerName}</span>
          <button onClick={(e) => { e.stopPropagation(); setIsSelectingVolunteer(true); }} className={`${isEditingThisGroup ? 'text-amber-100/70 hover:text-white' : 'text-gray-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400'} transition-colors px-1 font-bold`}>✎</button>
        </div>

        {(group.status === 'forming' || isEditingThisGroup) && (
             <button type="button" onClick={handleDeleteClick} onPointerDown={(e) => e.stopPropagation()} className={`flex items-center gap-1 px-2 py-1 rounded transition-all z-[60] relative font-black uppercase text-[10px] ${confirmDelete ? 'bg-red-600 text-white animate-pulse scale-105 shadow-lg' : (isEditingThisGroup ? 'text-amber-100/50 hover:text-white hover:bg-black/10' : 'text-gray-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 hover:bg-black/5')}`}>
                {confirmDelete ? <span>Удалить?</span> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>}
             </button>
        )}
        {group.status === 'active' && !isEditingThisGroup && <span className="text-xs font-mono font-bold text-green-800 dark:text-green-300 relative z-10">{group.startTime}</span>}
      </div>

      {/* Warning Area */}
      {hasConflict && (group.status === 'forming' || isEditingThisGroup) && (
        <div className="bg-red-600 text-white px-3 py-1.5 space-y-0.5 shadow-inner">
           {criticalIssues.map((issue, idx) => (
             <div key={idx} className="text-[10px] font-black uppercase flex items-center gap-1.5 animate-in slide-in-from-left duration-200">
                <span className="text-xs">⚡️</span>
                <span>{issue.message}</span>
             </div>
           ))}
        </div>
      )}

      {/* Dogs List */}
      <div className="flex-1 p-2 space-y-2 flex flex-col">
        {dogs.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center text-gray-400 text-sm text-center font-medium">
            <span>Перетащите собак сюда</span>
          </div>
        ) : (
          dogs.map((dog) => <DogCard key={dog.id} dog={dog} compact />)
        )}
      </div>

      {/* Footer Controls */}
      <div className="p-2 border-t border-gray-300 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800">
        {isEditingThisGroup ? (
          <button onClick={(e) => { e.stopPropagation(); setEditingGroup(null); }} className="w-full py-2 rounded-lg text-xs font-black bg-blue-600 hover:bg-blue-700 text-white transition-colors uppercase shadow-sm">
            💾 Сохранить
          </button>
        ) : group.status === 'forming' ? (
          <button onClick={handleStartClick} disabled={dogs.length === 0} className={`w-full py-2 rounded-lg text-s font-black transition-colors uppercase shadow-sm ${dogs.length === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'}`}>
            🐕‍🦺🦮  Начать
          </button>
        ) : (
          <button onClick={() => finishWalk(group.id)} className="w-full py-2 rounded-lg text-xs font-black bg-gray-700 hover:bg-gray-800 text-white transition-colors flex items-center justify-center gap-2 uppercase shadow-sm">
            🏁 Завершить
          </button>
        )}
      </div>
    </div>

    {/* Volunteer Selection Overlay */}
    {isSelectingVolunteer && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setIsSelectingVolunteer(false)}>
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-sm overflow-hidden flex flex-col max-h-[70vh] border border-gray-200 dark:border-zinc-700" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center bg-gray-100 dark:bg-zinc-950">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100">Выберите волонтера</h3>
                  <button onClick={() => setIsSelectingVolunteer(false)} className="text-2xl text-gray-500 hover:text-black">&times;</button>
                </div>
                <div className="overflow-y-auto p-2 space-y-1 bg-white dark:bg-zinc-900">
                  {volunteers.filter(v => v.status === 'active').map(v => (
                    <button key={v.id} onClick={() => { updateGroupVolunteer(group.id, v); setIsSelectingVolunteer(false); }} className="w-full text-left p-3 rounded-lg hover:bg-blue-50 dark:hover:bg-zinc-800 flex items-center justify-between transition-colors group">
                      <div>
                        <div className="font-bold text-sm text-gray-900 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-400">{v.name}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">{v.role === 'coordinator' ? 'Координатор' : 'Волонтер'}</div>
                      </div>
                      {group.volunteerId === v.id && <span className="text-green-600 font-bold text-lg">✓</span>}
                    </button>
                  ))}
                </div>
            </div>
        </div>
    )}
    
    {showWarnings && <WarningModal issues={allIssues} onCancel={() => setShowWarnings(false)} onConfirm={() => { setShowWarnings(false); startWalk(group.id); }} />}
    </>
  );
};
