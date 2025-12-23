
// Add React to the import statement to resolve the namespace error
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DndContext, DragOverlay, DragStartEvent, DragEndEvent, useDroppable, PointerSensor, useSensor, useSensors, pointerWithin, CollisionDetection, MeasuringStrategy } from '@dnd-kit/core';
import { useAppStore } from '../store';
import { DogCard, DogCardOverlay } from './DogCard';
import { GroupZone } from './GroupZone';
import { SettingsModal } from './SettingsModal';
import { DogListModal } from './DogListModal';
import { VolunteerListModal } from './VolunteerListModal';
import { DebugModal } from './DebugModal';
import { Timer } from './Timer';
import { InfoPopup } from './InfoPopup';
import { LoginScreen } from './LoginScreen';

export const Dashboard: React.FC = () => {
  const { currentTeamId, dogs, groups, moveDog, createGroup, currentUser, currentUserId, setTeam, teams, finishWalk, theme, toggleTheme, editingGroupId, setEditingGroup, activeModal, setActiveModal, fetchData, checkForUpdates, initTelegram, isLoading, isSyncing, error, sidebarFilter, toggleSidebarFilter, sortOrder, autoAddFriends } = useAppStore();
  const [activeDogId, setActiveDogId] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevFormingCount = useRef(0);
  const isDraggingRef = useRef(false);
  const prevModalRef = useRef(activeModal);

  const { setNodeRef: setSidebarRef } = useDroppable({ 
      id: 'sidebar',
      data: { type: 'sidebar' }
  });

  useEffect(() => {
    fetchData().then(() => {
        // После загрузки данных пробуем авторизовать через Telegram
        initTelegram();
    });
  }, []);

  useEffect(() => {
    if (prevModalRef.current !== 'none' && activeModal === 'none') {
        fetchData(true);
    }
    prevModalRef.current = activeModal;
  }, [activeModal, fetchData]);

  useEffect(() => {
    if (!currentUserId || activeModal !== 'none' || isDraggingRef.current) return;
    const syncInterval = setInterval(() => { checkForUpdates(); }, 60000); 
    return () => clearInterval(syncInterval);
  }, [currentUserId, activeModal, checkForUpdates]);

  useEffect(() => {
    const interval = setInterval(() => {
      const state = useAppStore.getState();
      const activeGroups = state.groups.filter(g => g.status === 'active');
      if (activeGroups.length === 0) return;
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      
      activeGroups.forEach(group => {
         // КРИТИЧНО: Если группа редактируется, не завершаем ее автоматически
         if (group.id === state.editingGroupId) return;
         
         if (!group.endTime) return;
         const [eH, eM] = group.endTime.split(':').map(Number);
         if (isNaN(eH) || isNaN(eM)) return;
         const endMinutes = eH * 60 + eM;
         if (currentMinutes >= endMinutes) state.finishWalk(group.id); 
      });
    }, 10000); 
    return () => clearInterval(interval);
  }, []); 

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: { x: 15 } } }));

  const customCollisionDetection: CollisionDetection = (args) => { return pointerWithin(args); };

  const teamDogs = dogs.filter((d) => d.teamId === currentTeamId);
  const teamGroups = groups.filter((g) => g.id !== undefined && g.teamId === currentTeamId);
  const currentTeam = teams.find(t => t.id === currentTeamId);

  const sidebarDogs = teamDogs.filter((d) => {
      if (d.groupId || d.isHidden) return false;
      if (sidebarFilter === 'available') {
          if (d.health !== 'OK') return false;
          if (d.complexity === 'red') return false;
      }
      return true;
  });

  const conflictIdsInSidebar = useMemo(() => {
      const formingGroups = teamGroups.filter(g => g.status === 'forming');
      if (formingGroups.length === 0) return new Set<string>();
      const conflicts = new Set<string>();
      sidebarDogs.forEach(dog => {
          const hasSafeGroup = formingGroups.some(group => {
              const dogsInGroup = teamDogs.filter(d => String(d.groupId) === String(group.id));
              const hasEnemyInGroup = dogsInGroup.some(member => 
                  dog.conflicts.includes(member.id) || member.conflicts.includes(dog.id)
              );
              return !hasEnemyInGroup;
          });
          if (!hasSafeGroup) conflicts.add(dog.id);
      });
      return conflicts;
  }, [teamDogs, teamGroups, sidebarDogs]);
  
  const sortedSidebarDogs = [...sidebarDogs].sort((a, b) => {
    const isUnavailableA = a.health !== 'OK' || a.complexity === 'red';
    const isUnavailableB = b.health !== 'OK' || b.complexity === 'red';
    if (isUnavailableA !== isUnavailableB) return isUnavailableA ? 1 : -1;
    const aWalked = a.walksToday > 0;
    const bWalked = b.walksToday > 0;
    if (aWalked !== bWalked) return aWalked ? 1 : -1;
    if (sortOrder === 'name') return a.name.localeCompare(b.name);
    if (sortOrder === 'id') {
        const aIdNum = parseInt(a.id);
        const bIdNum = parseInt(b.id);
        if (!isNaN(aIdNum) && !isNaN(bIdNum)) return aIdNum - bIdNum;
        return a.id.localeCompare(b.id);
    }
    if (sortOrder === 'row') {
        const aRow = a.row || 'zzzz';
        const bRow = b.row || 'zzzz';
        return aRow.localeCompare(bRow, undefined, { numeric: true });
    }
    return 0;
  });

  const formingGroups = teamGroups.filter(g => g.status === 'forming');
  const activeGroups = teamGroups.filter(g => g.status === 'active');
  
  useEffect(() => {
    if (formingGroups.length > prevFormingCount.current) {
        setTimeout(() => { if (scrollContainerRef.current) scrollContainerRef.current.scrollTo({ top: scrollContainerRef.current.scrollHeight, behavior: 'smooth' }); }, 150);
    }
    prevFormingCount.current = formingGroups.length;
  }, [formingGroups.length]);

  const editingGroup = editingGroupId ? teamGroups.find(g => String(g.id) === String(editingGroupId)) : null;

  const handleDragStart = (event: DragStartEvent) => { setActiveDogId(event.active.id as string); isDraggingRef.current = true; };
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDogId(null);
    isDraggingRef.current = false;
    const dogId = active.id as string;
    const draggedDog = dogs.find(d => d.id === dogId);
    if (!draggedDog) return;
    const pointerX = (event.activatorEvent as any).clientX + (event.delta?.x || 0);
    const splitPoint = window.innerWidth / 2;
    const isOverSidebar = over && over.id === 'sidebar';
    if (pointerX < splitPoint || isOverSidebar) { if (draggedDog.groupId) moveDog(dogId, null); return; }
    if (!over) return;
    const targetGroup = teamGroups.find(g => String(g.id) === String(over.id));
    if (targetGroup) {
      const dogsInTarget = dogs.filter(d => String(d.groupId) === String(targetGroup.id));
      let partnersToMove: string[] = [];
      if (draggedDog.pairs.length > 0) {
          draggedDog.pairs.forEach(partnerId => {
              const partnerDog = dogs.find(d => d.id === partnerId);
              if (!partnerDog || partnerDog.teamId !== currentTeamId) return;
              if (partnerDog.health === 'OK' && partnerDog.complexity !== 'red' && partnerDog.walksToday === 0 && !partnerDog.groupId) {
                  if (!dogsInTarget.some(member => partnerDog.conflicts.includes(member.id) || member.conflicts.includes(dogId))) partnersToMove.push(partnerId);
              }
          });
      }
      if (autoAddFriends && partnersToMove.length > 0) {
          moveDog([dogId], targetGroup.id);
          window.setTimeout(() => { useAppStore.getState().moveDog(partnersToMove, targetGroup.id); }, 800);
      } else {
          let dogsToMove = [dogId];
          if (partnersToMove.length > 0) {
              const names = partnersToMove.map(id => dogs.find(d => d.id === id)?.name).join(', ');
              if (window.confirm(`Добавить друзей (${names})?`)) dogsToMove = [...dogsToMove, ...partnersToMove];
          }
          moveDog(dogsToMove, targetGroup.id);
      }
    }
  };

  const activeDog = activeDogId ? dogs.find((d) => d.id === activeDogId) : null;
  const bottomPaddingValue = activeGroups.length > 0 ? 55 + 30 + (Math.min(activeGroups.length, 3) * 64) + 15 : 70;

  if (isLoading) return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#d1d5db] dark:bg-[#1f2937]">
          <div className="w-12 h-12 rounded-full border-4 border-t-amber-500 border-b-amber-700 border-l-transparent border-r-transparent animate-spin"></div>
          <div className="mt-4 text-sm font-black uppercase text-engraved opacity-60">Загрузка данных...</div>
      </div>
  );

  if (!currentUserId) return <LoginScreen />;

  return (
    <DndContext sensors={sensors} collisionDetection={customCollisionDetection} measuring={{ droppable: { strategy: MeasuringStrategy.Always } }} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className={`${theme} fixed inset-0 w-full h-full overscroll-none overflow-hidden touch-none`}>
      <div className="h-full flex flex-col bg-[#e5e7eb] dark:bg-[#111827] text-slate-800 dark:text-slate-200 font-sans transition-colors duration-500">
        
        {error && (
            <div className="bg-red-800 text-white text-[10px] py-1.5 px-4 text-center font-black relative z-[60] shadow-md border-b-2 border-red-900 animate-in slide-in-from-top duration-300">
                <span className="mr-2">⚠️ {error}</span>
                <button onClick={() => fetchData()} className="underline decoration-white/30 hover:decoration-white transition-all uppercase ml-1">Повторить</button>
            </div>
        )}

        <header className="h-12 shrink-0 relative z-20 shadow-lg border-b border-[#78350f] bg-gradient-to-r from-amber-700 via-amber-500 to-amber-700 flex items-center justify-between px-3">
          <div className="absolute inset-0 bg-brushed opacity-20 pointer-events-none mix-blend-overlay"></div>
          <div className="flex items-center gap-3 relative z-10">
             {!logoError ? <img src="logo.png" onError={() => setLogoError(true)} className="w-9 h-9 rounded-full object-cover shadow-plate border-2 border-amber-300/50" alt="Logo" /> : <div className="w-9 h-9 rounded-full bg-amber-900/40 border-2 border-amber-300/30 flex items-center justify-center text-lg shadow-inner text-amber-100">🐕</div>}
             <h1 className="font-black text-base leading-tight text-amber-50 text-shadow-md">
                {currentTeamId ? currentTeam?.name : 'Приют'} <span className="text-amber-200 ml-1 font-mono text-[9px] opacity-70">v0.56</span>
             </h1>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-bold text-amber-100 relative z-10">
             <button onClick={() => fetchData()} className="p-2 bg-gradient-to-b from-white/10 to-black/10 rounded-full hover:brightness-125 transition-all shadow-chrome border border-white/20"><span className={`inline-block text-lg leading-none ${isSyncing ? 'animate-spin' : ''}`}>♻️</span></button>
             <button onClick={() => setActiveModal('settings')} className="p-2 bg-gradient-to-b from-white/10 to-black/10 rounded-full hover:brightness-125 transition-all shadow-chrome border border-white/20"><span className="text-lg none">⚙️</span></button>
          </div>
        </header>

        <main className="flex-1 w-full overflow-hidden grid grid-cols-2 relative overscroll-none">
            <div ref={setSidebarRef} className="col-span-1 shrink-0 border-r border-slate-400 dark:border-slate-700 bg-gradient-to-b from-[#d1d5db] to-[#9ca3af] dark:from-[#1f2937] dark:to-[#111827] flex flex-col overflow-hidden relative z-0 shadow-[inset_-5px_0_15px_rgba(0,0,0,0.15)]" style={{ paddingBottom: `${bottomPaddingValue}px` }}>
                <div className="absolute inset-0 bg-brushed opacity-20 pointer-events-none"></div>
                <div className="px-3 py-2 border-b border-slate-400 dark:border-slate-700 bg-white/10 backdrop-blur-sm sticky top-0 z-10 shrink-0 flex items-center justify-between shadow-sm">
                    <h2 className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest text-engraved">Доступно собак</h2>
                    <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 font-bold bg-black/10 px-1.5 rounded shadow-inner">{sortedSidebarDogs.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar px-2 py-3 space-y-3 touch-pan-y relative z-0">
                    {sortedSidebarDogs.map((dog) => <DogCard key={dog.id} dog={dog} isSidebar={true} hasConflict={conflictIdsInSidebar.has(dog.id)} />)}
                </div>
            </div>

            <section className="col-span-1 shrink-0 bg-[#f3f4f6] dark:bg-[#0f172a] flex flex-col overflow-hidden relative z-0 shadow-[inset_5px_0_15px_rgba(0,0,0,0.1)]" style={{ paddingBottom: `${bottomPaddingValue}px` }}>
                <div className="flex justify-between items-center px-3 py-2 border-b border-gray-300 dark:border-slate-800 sticky top-0 bg-[#f3f4f6]/90 dark:bg-[#0f172a]/90 backdrop-blur-md z-10 shrink-0 shadow-sm">
                     <h2 className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest text-engraved">Выгул</h2>
                     <button onClick={() => createGroup(currentUser!)} className="bg-gradient-to-b from-blue-500 to-blue-700 border-t border-blue-400 text-white text-[11px] font-black px-3 py-1.5 rounded shadow-metal uppercase flex items-center gap-1"><span>+ Группа</span></button>
                </div>
                <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar px-2 py-3 space-y-4 touch-pan-y relative z-0">
                    {editingGroup && <div className="mb-6 animate-in slide-in-from-right-4 duration-300"><GroupZone group={editingGroup} dogs={teamDogs.filter(d => String(d.groupId) === String(editingGroup.id))} /></div>}
                    {formingGroups.map(group => <GroupZone key={group.id} group={group} dogs={teamDogs.filter(d => String(d.groupId) === String(group.id))} />)}
                    
                    {formingGroups.length === 0 && !editingGroup && (
                        <div className="flex flex-col items-center justify-center py-24 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700 cursor-pointer group" onClick={() => createGroup(currentUser!)}>
                            <div className="text-6xl mb-4 group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500 drop-shadow-lg">🦴</div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-2">Групп пока нет</p>
                            <button className="text-blue-500 dark:text-blue-400 font-black text-[11px] uppercase tracking-wider hover:underline underline-offset-4 decoration-2">Идем гулять?</button>
                        </div>
                    )}
                </div>
            </section>
        </main>
        
        {/* Footer Navigation */}
        <div className="absolute bottom-0 w-full z-50 flex flex-col bg-transparent pointer-events-none">
            {activeGroups.length > 0 && (
                <div className="pointer-events-auto border-t-2 border-slate-400 dark:border-slate-600 bg-[#e2e8f0]/95 dark:bg-[#1e293b]/95 backdrop-blur-xl">
                    <div className="px-4 py-1.5 text-[10px] font-black text-orange-800 dark:text-orange-400 uppercase tracking-widest border-b border-slate-300 dark:border-slate-700 flex justify-between items-center">
                        <span>Активные выгулы ({activeGroups.length})</span>
                        {/* Восстановлены пульсирующие кружки, выровнены по правой стороне */}
                        <div className="flex gap-1 ml-auto">
                            {activeGroups.map((_, i) => (
                                <div key={i} className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shadow-[0_0_5px_rgba(249,115,22,0.8)]" />
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col max-h-[192px] overflow-y-auto no-scrollbar">
                        {activeGroups.map(g => {
                            const groupDogs = teamDogs.filter(d => String(d.groupId) === String(g.id));
                            return (
                                <div key={g.id} className="w-full flex bg-slate-100 dark:bg-slate-900 h-[64px] items-center border-b border-slate-200 dark:border-slate-800">
                                    <div className="flex-1 p-2 overflow-hidden">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-base font-black text-slate-800 dark:text-slate-200 truncate">{g.volunteerName}</span>
                                            <div className="ml-auto text-sm text-blue-800 dark:text-blue-300 font-mono font-black">{g.startTime && <Timer startTimeStr={g.startTime} />}</div>
                                        </div>
                                        <div className="text-[11px] truncate flex items-center gap-1.5">
                                            {groupDogs.length > 0 
                                                ? <>
                                                    <span className="opacity-60 text-[10px]">🐕</span>
                                                    <span className="font-black text-blue-700 dark:text-blue-400">
                                                        {groupDogs.map(d => d.name).join(', ')}
                                                    </span>
                                                  </>
                                                : <span className="text-[10px] text-slate-500 opacity-40 italic">Собаки не определены</span>
                                            }
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 h-full border-l border-slate-300 dark:border-slate-700">
                                        <button onClick={() => setEditingGroup(g.id)} className="w-[60px] h-full flex flex-col items-center justify-center opacity-70 hover:opacity-100"><span>✎</span></button>
                                        <button onClick={() => finishWalk(g.id)} className="w-[60px] h-full flex flex-col items-center justify-center border-l border-slate-300 dark:border-slate-700 opacity-70 hover:opacity-100"><span>🏁</span></button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            <nav className="h-[60px] pointer-events-auto border-t border-slate-500 dark:border-slate-600 bg-gradient-to-b from-[#e5e7eb] to-[#9ca3af] dark:from-[#1e293b] dark:to-[#0f172a] grid grid-cols-4 items-center shrink-0 shadow-[0_-5px_15px_rgba(0,0,0,0.4)] relative z-50">
                <button onClick={toggleTheme} className="flex flex-col items-center justify-center gap-1 h-full border-r border-slate-400/50 dark:border-slate-700/50"><span className="text-2xl leading-none">{theme === 'dark' ? '☀️' : '🌙'}</span><span className="text-[9px] font-black uppercase tracking-tighter">Тема</span></button>
                <button onClick={toggleSidebarFilter} className="flex flex-col items-center justify-center gap-1 h-full border-r border-slate-400/50 dark:border-slate-700/50"><span className={`text-2xl leading-none ${sidebarFilter === 'available' ? 'text-orange-500' : 'grayscale'}`}>{sidebarFilter === 'available' ? '📯' : '💯'}</span><span className="text-[9px] font-black uppercase tracking-tighter">{sidebarFilter === 'available' ? 'Доступные' : 'Все'}</span></button>
                <button onClick={() => setActiveModal('volunteers')} className="flex flex-col items-center justify-center gap-1 h-full border-r border-slate-400/50 dark:border-slate-700/50"><span className="text-2xl leading-none">👼😇</span><span className="text-[9px] font-black uppercase tracking-tighter">Команда</span></button>
                <button onClick={() => setActiveModal('dogs')} className="flex flex-col items-center justify-center gap-1 h-full"><span className="text-2xl leading-none">🐕</span><span className="text-[9px] font-black uppercase tracking-tighter">Собаки</span></button>
            </nav>
        </div>
        {activeModal === 'settings' && <SettingsModal />}
        {activeModal === 'dogs' && <DogListModal />}
        {activeModal === 'volunteers' && <VolunteerListModal />}
        {activeModal === 'debug' && <DebugModal />}
        <InfoPopup />
        <DragOverlay className="z-[100]"><DogCardOverlay dog={activeDog!} /></DragOverlay>
      </div>
      </div>
    </DndContext>
  );
};
