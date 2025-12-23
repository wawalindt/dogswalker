import React from 'react';
import { useAppStore } from '../store';

export const TeamSelector: React.FC = () => {
  const { teams, setTeam } = useAppStore();

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
            <span className="text-6xl">🐕</span>
            <h1 className="mt-4 text-3xl font-bold text-white tracking-tight">Координатор</h1>
            <p className="mt-2 text-zinc-400">Выберите команду для начала работы</p>
        </div>

        <div className="space-y-4">
          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() => setTeam(team.id)}
              className="w-full group bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-blue-500/50 p-5 rounded-2xl transition-all duration-200 text-left relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                 <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{team.name}</h3>
              <div className="mt-2 flex items-center space-x-4 text-sm text-zinc-400">
                <span className="flex items-center">
                    📍 {team.location}
                </span>
                <span className="flex items-center">
                   👤 {team.membersCount} онлайн
                </span>
              </div>
            </button>
          ))}
        </div>
        
        <div className="text-center text-xs text-zinc-600 mt-12">
            v2.4 • Team Architecture
        </div>
      </div>
    </div>
  );
};