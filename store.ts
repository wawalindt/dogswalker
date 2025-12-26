
import { create } from 'zustand';
import { Dog, Team, WalkGroup, User, ValidationIssue, ActiveModal } from './types';
import { INITIAL_DOGS, INITIAL_GROUPS, TEAMS, VOLUNTEERS } from './mockData';

const API_URL = 'https://script.google.com/macros/s/AKfycbxKNV2BSNuPd_mm7MsRXAWyKBQM4yqC5JDyscmzdaK9Y80FkXw-2DeeExdGLVllU5d1/exec'; 

type Theme = 'light' | 'dark';
type SidebarFilter = 'all' | 'available';
type SortOrder = 'id' | 'name' | 'row';

interface AppState {
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  syncVersion: number;

  currentTeamId: string | null;
  currentUser: string | null;
  currentUserId: string | null;
  dogs: Dog[];
  groups: WalkGroup[];
  teams: Team[];
  volunteers: User[];
  theme: Theme;
  editingGroupId: string | null;
  
  walkDuration: number;
  autoAddFriends: boolean;

  activeModal: ActiveModal;
  infoDogId: string | null;
  sidebarFilter: SidebarFilter;
  sortOrder: SortOrder; 

  fetchData: (isBackground?: boolean) => Promise<void>;
  checkForUpdates: () => Promise<void>; 
  initTelegram: () => void;
  login: (user: User) => void;
  setTeam: (teamId: string) => void;
  toggleTheme: () => void;
  setActiveModal: (modal: ActiveModal) => void;
  setInfoDogId: (id: string | null) => void;
  toggleSidebarFilter: () => void;
  setSortOrder: (order: SortOrder) => void; 
  setWalkDuration: (minutes: number) => void;
  setAutoAddFriends: (value: boolean) => void;
  
  createGroup: (volunteerName: string) => void;
  moveDog: (dogId: string | string[], targetGroupId: string | null) => void;
  startWalk: (groupId: string) => void;
  finishWalk: (groupId: string) => void;
  deleteGroup: (groupId: string) => void;
  setEditingGroup: (groupId: string | null) => void;
  updateGroupVolunteer: (groupId: string, user: User) => void;
  validateGroup: (groupId: string) => ValidationIssue[];
  addDog: (dog: Dog) => void;
  updateDog: (id: string, updates: Partial<Dog>) => void;
  toggleDogVisibility: (dogId: string) => void;
  resetWalks: () => void;
  addVolunteer: (user: User) => void;
  updateVolunteer: (id: string, updates: Partial<User>) => void;
  deactivateVolunteer: (id: string) => void;
  logSystemAction: (message: string, data?: any) => void;
  saveSetting: (key: string, value: string | number | boolean) => void;
}

const sendAction = async (action: string, payload: any) => {
    if (!API_URL || API_URL.includes('YOUR_SCRIPT_ID_HERE')) return;
    try {
        console.log(`[SYNC] Action: ${action}`, payload);
        fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors', 
            body: JSON.stringify({ action, payload }),
            redirect: 'follow',
            credentials: 'omit'
        }).catch(err => console.debug("SendAction background update sent"));
    } catch (e) {
        console.error('Failed to sync with Google Sheets:', e);
    }
};

const parseList = (input: any): string[] => {
    if (!input) return [];
    if (Array.isArray(input)) return input.map(String);
    // Поддержка и запятых, и пробелов как разделителей
    return String(input).replace(/,/g, ' ').split(/\s+/).map(s => s.trim()).filter(s => s !== '');
};

const getHHMM = (date: Date): string => {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
};

const parseTime = (input: any): string | undefined => {
    if (!input) return undefined;
    const d = new Date(input);
    if (!isNaN(d.getTime())) {
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
    const str = String(input).replace(/['"]/g, '').trim();
    const match = str.match(/(\d{1,2}):(\d{2})/);
    if (match) return `${match[1].padStart(2, '0')}:${match[2]}`;
    return undefined;
};

export const useAppStore = create<AppState>((set, get) => ({
  isLoading: false,
  isSyncing: false,
  error: null,
  syncVersion: 0,
  currentTeamId: 'team_1', 
  currentUser: null,
  currentUserId: null,
  dogs: [], 
  groups: [], 
  teams: TEAMS,
  volunteers: [], 
  theme: (localStorage.getItem('app-theme') as Theme) || 'dark',
  editingGroupId: null,
  activeModal: 'none',
  infoDogId: null,
  sidebarFilter: 'available',
  sortOrder: 'id', 
  walkDuration: 30, 
  autoAddFriends: true,

  logSystemAction: (message, data) => {
      const timestamp = new Date().toLocaleString('ru-RU');
      sendAction('log', { timestamp, message, data: data ? JSON.stringify(data) : '' });
  },

  saveSetting: (key, value) => {
      if (key === 'theme') return; // Больше не сохраняем тему на сервере
      sendAction('saveSetting', { key, value });
  },

  checkForUpdates: async () => {
      const state = get();
      if (!API_URL || API_URL.includes('YOUR_SCRIPT_ID_HERE') || state.activeModal !== 'none') return;
      try {
          const response = await fetch(`${API_URL}?_t=${Date.now()}`, { 
              redirect: 'follow', 
              cache: 'no-store',
              credentials: 'omit'
          });
          if (!response.ok) return;
          const data = await response.json();
          if (data && data.settings) {
              const versionKey = `db_version_${state.currentTeamId}`;
              const remote = data.settings.find((s: any) => s.key === versionKey)?.value;
              const remoteVersion = Number(remote || 0);
              
              if (remoteVersion > state.syncVersion) {
                  console.log(`[SYNC] Found new version on server: ${remoteVersion}`);
                  await state.fetchData(true);
              }
          }
      } catch (e) {
          // Background error, ignore
      }
  },

  fetchData: async (isBackground = false) => {
      const state = get();
      if (!API_URL || API_URL.includes('YOUR_SCRIPT_ID_HERE')) return;
      if (!isBackground) set({ isSyncing: true, error: null });
      else set({ isSyncing: true });

      try {
          const response = await fetch(`${API_URL}?_t=${Date.now()}`, { 
              cache: 'no-store',
              redirect: 'follow',
              credentials: 'omit'
          });
          
          if (!response.ok) {
              throw new Error(`HTTP ${response.status}: Google Script не отвечает.`);
          }
          
          const text = await response.text();
          let data;
          try {
              data = JSON.parse(text);
          } catch (pe) {
              throw new Error("Скрипт вернул HTML вместо JSON. Убедитесь, что он опубликован как 'Anyone'.");
          }

          if (data && data.status === 'success') {
              const sanitizedDogs = (data.dogs || []).map((d: any) => ({
                  ...d,
                  id: String(d.id), 
                  groupId: (!d.groupId || d.groupId === 'null' || d.groupId === '') ? null : String(d.groupId),
                  walksToday: Number(d.walksToday || 0),
                  age: Number(d.age || 0),
                  weight: Number(d.weight || 0),
                  isHidden: (d.isHidden === true || String(d.isHidden) === "true"),
                  teamId: d.teamId || 'team_1',
                  pairs: parseList(d.pairs),
                  conflicts: parseList(d.conflicts),
                  complexity: d.complexity || 'green',
                  lastWalkTime: parseTime(d.lastWalkTime),
                  row: String(d.row || '')
              }));

              const sanitizedGroups = (data.groups || [])
                  .filter((g: any) => g.status === 'forming' || g.status === 'active')
                  .map((g: any) => ({
                      ...g,
                      id: String(g.id),
                      startTime: parseTime(g.startTime),
                      endTime: parseTime(g.endTime),
                      status: g.status || 'forming',
                      durationMinutes: Number(g.durationMinutes || 0)
                  }));

              const sanitizedVolunteers = (data.volunteers || []).map((v: any) => ({
                  ...v,
                  id: String(v.id),
                  teamId: v.teamId || ''
              }));

              let remoteVersion = 0;
              const settingsUpdates: any = {};
              const versionKey = `db_version_${state.currentTeamId}`;
              
              if (data.settings && Array.isArray(data.settings)) {
                  data.settings.forEach((s: any) => {
                      if (s.key === 'walkDuration') settingsUpdates.walkDuration = Number(s.value);
                      if (s.key === 'autoAddFriends') settingsUpdates.autoAddFriends = String(s.value) === 'true';
                      if (s.key === 'currentTeamId') settingsUpdates.currentTeamId = s.value;
                      if (s.key === versionKey) remoteVersion = Number(s.value);
                  });
              }

              set({ 
                  dogs: sanitizedDogs,
                  volunteers: sanitizedVolunteers,
                  groups: sanitizedGroups,
                  syncVersion: Math.max(state.syncVersion, remoteVersion),
                  ...settingsUpdates,
                  isSyncing: false,
                  error: null
              });
          }
      } catch (e: any) {
          set({ isSyncing: false, error: e.message || 'Ошибка подключения к БД.' });
      }
  },

  initTelegram: () => {
    console.log('🔍 [TG] initTelegram called');
    const tg = (window as any).Telegram?.WebApp;
    const volunteers = get().volunteers;
    
    const urlParams = new URLSearchParams(window.location.search);
    const debugUserId = urlParams.get('tg_user_id');
    const debugUsername = urlParams.get('tg_username');

    if (tg) {
        tg.ready(); 
        if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
            const tgUser = tg.initDataUnsafe.user;
            let found = volunteers.find(v => 
                (v.telegramId && String(v.telegramId).trim() === String(tgUser.id)) ||
                (v.telegramUsername && tgUser.username && v.telegramUsername.toLowerCase().trim() === tgUser.username.toLowerCase().trim())
            );
            if (found) {
                console.log(`✅ [TG] Авторизован через WebApp: ${found.name}`);
                get().login(found);
                tg.expand();
                return;
            }
        }
    }

    // Вход через параметры URL (имитация "командной строки" или внешнего вызова)
    if (debugUserId) {
        const found = volunteers.find(v => String(v.telegramId).trim() === String(debugUserId).trim());
        if (found) {
            console.log(`✅ [TG] Авторизован через URL ID: ${found.name}`);
            get().login(found);
            return;
        }
    }

    if (debugUsername) {
        // Убираем @ если пользователь ввел его в параметре
        const cleanUsername = debugUsername.replace(/^@/, '').toLowerCase().trim();
        const found = volunteers.find(v => v.telegramUsername && v.telegramUsername.toLowerCase().trim() === cleanUsername);
        if (found) {
            console.log(`✅ [TG] Авторизован через URL Username: ${found.name}`);
            get().login(found);
            return;
        }
    }
  },

  login: (user) => set({ currentUser: user.name, currentUserId: user.id }),
  setTeam: (teamId) => { set({ currentTeamId: teamId }); get().saveSetting('currentTeamId', teamId); },
  toggleTheme: () => {
      set((state) => {
          const newTheme = state.theme === 'dark' ? 'light' : 'dark';
          localStorage.setItem('app-theme', newTheme);
          return { theme: newTheme };
      });
  },
  setActiveModal: (modal) => set({ activeModal: modal }),
  setInfoDogId: (id) => set({ infoDogId: id }),
  toggleSidebarFilter: () => set(state => ({ sidebarFilter: state.sidebarFilter === 'all' ? 'available' : 'all' })),
  setSortOrder: (order) => set({ sortOrder: order }),
  setWalkDuration: (minutes) => { set({ walkDuration: minutes }); get().saveSetting('walkDuration', minutes); },
  setAutoAddFriends: (value) => { set({ autoAddFriends: value }); get().saveSetting('autoAddFriends', value); },
  setEditingGroup: (groupId) => set({ editingGroupId: groupId }),
  updateGroupVolunteer: (groupId, user) => {
      set((state) => ({ 
          groups: state.groups.map(g => String(g.id) === String(groupId) ? { ...g, volunteerName: user.name, volunteerId: user.id } : g),
          syncVersion: state.syncVersion + 1 
      }));
      sendAction('updateGroup', { id: groupId, updates: { volunteerName: user.name, volunteerId: user.id } });
  },
  createGroup: (volunteerName) => {
    const state = get();
    const newGroup: WalkGroup = { 
        id: `group_${Date.now()}`, 
        teamId: state.currentTeamId!, 
        volunteerName, 
        volunteerId: state.currentUserId || undefined,
        status: 'forming', 
        durationMinutes: 0 
    };
    set((state) => ({ 
        groups: [...state.groups, newGroup],
        syncVersion: state.syncVersion + 1 
    }));
    sendAction('createGroup', newGroup);
  },
  deleteGroup: (groupId) => {
     const matchId = String(groupId);
     set((state) => {
        const updatedGroups = state.groups.filter(g => String(g.id) !== matchId);
        const updatedDogs = state.dogs.map(dog => 
            String(dog.groupId) === matchId ? { ...dog, groupId: null } : dog
        );
        return { 
            dogs: updatedDogs, 
            groups: updatedGroups, 
            syncVersion: state.syncVersion + 1,
            editingGroupId: state.editingGroupId === groupId ? null : state.editingGroupId 
        };
     });
     sendAction('deleteGroup', { id: groupId });
  },
  moveDog: (dogIds, targetGroupId) => {
    const ids = Array.isArray(dogIds) ? dogIds : [dogIds];
    const state = get();
    const tGid = targetGroupId ? String(targetGroupId) : null;

    set((state) => ({ 
        dogs: state.dogs.map((dog) => ids.includes(dog.id) ? { ...dog, groupId: tGid } : dog),
        syncVersion: state.syncVersion + 1 
    }));
    
    ids.forEach(id => sendAction('updateDog', { id, updates: { groupId: tGid || "" } }));
  },
  startWalk: (groupId) => {
    const now = new Date();
    const startTime = getHHMM(now);
    const endMinutes = (now.getHours() * 60 + now.getMinutes()) + get().walkDuration;
    const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;
    set((state) => ({ 
        groups: state.groups.map((g) => String(g.id) === String(groupId) ? { ...g, status: 'active', startTime, endTime } : g),
        syncVersion: state.syncVersion + 1 
    }));
    sendAction('updateGroup', { id: groupId, updates: { status: 'active', startTime, endTime } });
  },
  finishWalk: (groupId) => {
    const now = new Date();
    const endTime = getHHMM(now);
    const state = get();
    const matchId = String(groupId);
    
    const finishingDogIds = state.dogs
        .filter(d => String(d.groupId) === matchId)
        .map(d => d.id);
        
    set((state) => ({
        groups: state.groups.filter(g => String(g.id) !== matchId),
        dogs: state.dogs.map(dog => String(dog.groupId) === matchId ? { ...dog, walksToday: dog.walksToday + 1, lastWalkTime: endTime, groupId: null } : dog),
        syncVersion: state.syncVersion + 1 
    }));
    
    sendAction('finishWalk', { 
        groupId: matchId, 
        dogIds: finishingDogIds, 
        endTime 
    });
  },
  validateGroup: (groupId) => {
    const state = get();
    const matchId = String(groupId);
    const groupDogs = state.dogs.filter(d => String(d.groupId) === matchId);
    const groupDogIds = new Set(groupDogs.map(d => d.id));
    const issues: ValidationIssue[] = [];

    if (groupDogs.length === 0) return [{ type: 'warning', message: 'Группа пуста.' }];

    groupDogs.forEach(dog => {
        const enemiesInGroup = groupDogs.filter(other => dog.conflicts.includes(other.id) || other.conflicts.includes(dog.id));
        if (enemiesInGroup.length > 0) {
            enemiesInGroup.forEach(enemy => { 
                if (dog.id < enemy.id) {
                    issues.push({ type: 'critical', message: `Конфликт: ${dog.name} и ${enemy.name}!` }); 
                }
            });
        }

        if (dog.pairs && dog.pairs.length > 0) {
            dog.pairs.forEach(friendId => {
                if (!groupDogIds.has(friendId)) {
                    const friendDog = state.dogs.find(d => d.id === friendId);
                    if (!friendDog) return;
                    const friendGroup = friendDog.groupId ? state.groups.find(g => String(g.id) === String(friendDog.groupId)) : null;
                    const isFriendActive = friendGroup && friendGroup.status === 'active';
                    if (!friendDog.isHidden && 
                        friendDog.health === 'OK' && 
                        friendDog.walksToday === 0 && 
                        !isFriendActive &&
                        friendDog.teamId === dog.teamId) {
                        const msg = `${dog.name} и ${friendDog.name} обычно гуляют вместе.`;
                        if (!issues.some(i => i.message === msg)) {
                            issues.push({ type: 'warning', message: msg });
                        }
                    }
                }
            });
        }
    });
    return issues; 
  },
  addDog: (dog) => {
      set((state) => ({ 
          dogs: [...state.dogs, dog],
          syncVersion: state.syncVersion + 1 
      }));
      // Для Google Sheets объединяем списки через ПРОБЕЛ
      sendAction('addDog', { 
          ...dog, 
          complexity: dog.complexity, 
          pairs: dog.pairs.join(' '), 
          conflicts: dog.conflicts.join(' ') 
      });
  },
  updateDog: (id, updates) => {
      // Подготовка данных для сервера: массивы в строку через пробел
      const sanitizedUpdates = { ...updates };
      if (sanitizedUpdates.pairs && Array.isArray(sanitizedUpdates.pairs)) {
          sanitizedUpdates.pairs = (sanitizedUpdates.pairs as string[]).join(' ') as any;
      }
      if (sanitizedUpdates.conflicts && Array.isArray(sanitizedUpdates.conflicts)) {
          sanitizedUpdates.conflicts = (sanitizedUpdates.conflicts as string[]).join(' ') as any;
      }

      set((state) => ({ 
          dogs: state.dogs.map(d => d.id === id ? { ...d, ...updates } : d),
          syncVersion: state.syncVersion + 1 
      }));
      sendAction('updateDog', { id, updates: sanitizedUpdates });
  },
  toggleDogVisibility: (dogId) => {
      const dog = get().dogs.find(d => d.id === dogId);
      if (dog) get().updateDog(dogId, { isHidden: !dog.isHidden });
  },
  resetWalks: () => {
      if (confirm("Сбросить счетчик прогулок?")) {
        set((state) => ({ 
            dogs: state.dogs.map(d => ({ ...d, walksToday: 0, lastWalkTime: undefined, groupId: null })), 
            groups: [],
            syncVersion: state.syncVersion + 1 
        }));
        sendAction('resetWalks', {});
      }
  },
  addVolunteer: (user) => { 
      const userWithTeam = { ...user, teamId: get().currentTeamId || '' };
      set((state) => ({ volunteers: [...state.volunteers, userWithTeam] })); 
      sendAction('addVolunteer', userWithTeam); 
  },
  updateVolunteer: (id, updates) => { 
      set((state) => ({ volunteers: state.volunteers.map(v => v.id === id ? { ...v, ...updates } : v) })); 
      sendAction('updateVolunteer', { id, updates }); 
  },
  deactivateVolunteer: (id) => get().updateVolunteer(id, { status: 'inactive' }),
}));
