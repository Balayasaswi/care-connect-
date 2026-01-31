import React from 'react';
import { ChatSession, JournalFile } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  journalFiles: JournalFile[];
  activeSessionId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectSession: (id: string) => void;
  onSelectJournal: (journal: JournalFile) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onDeleteJournal: (id: string, e: React.MouseEvent) => void;
  isArchiving?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  journalFiles,
  activeSessionId,
  isOpen,
  onClose,
  onSelectSession,
  onSelectJournal,
  onNewChat,
  onDeleteSession,
  onDeleteJournal,
  isArchiving
}) => {
  const activeSession = sessions.find(s => !s.isLocked && s.id === activeSessionId);
  const pastSessions = sessions.filter(s => s.isLocked);

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`fixed top-0 left-0 bottom-0 w-72 bg-[#f1f5f9] border-r border-slate-200 z-30 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 overflow-y-auto`}>
        <div className="flex flex-col h-full p-4">
          <button
            onClick={onNewChat}
            disabled={isArchiving}
            className="flex items-center space-x-3 w-full bg-white hover:bg-emerald-50 text-slate-700 font-medium px-4 py-3 rounded-xl border border-slate-200 transition-colors shadow-sm mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>New Reflection</span>
          </button>

          <div className="space-y-6 flex-grow">
            {/* Active Session */}
            {activeSession && (
              <div>
                <h3 className="text-[10px] uppercase tracking-widest font-bold text-emerald-600 px-2 mb-2 flex items-center justify-between">
                  <span>Active Reflection</span>
                  {isArchiving && (
                    <span className="flex space-x-0.5">
                      <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce"></span>
                      <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </span>
                  )}
                </h3>
                <div
                  onClick={() => !isArchiving && onSelectSession(activeSession.id)}
                  className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg cursor-pointer bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm ${isArchiving ? 'opacity-70 cursor-wait' : ''}`}
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <svg className="w-4 h-4 flex-shrink-0 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <span className="text-sm font-semibold truncate">{activeSession.title}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Past Sessions - Read Only */}
            {pastSessions.length > 0 && (
              <div>
                <h3 className="text-[10px] uppercase tracking-widest font-bold text-slate-400 px-2 mb-2">Past Reflections</h3>
                <div className="space-y-1">
                  {pastSessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map((session) => (
                    <div
                      key={session.id}
                      onClick={() => onSelectSession(session.id)}
                      className={`group flex items-center justify-between w-full px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                        activeSessionId === session.id
                          ? 'bg-slate-200 text-slate-800 border border-slate-300'
                          : 'hover:bg-white text-slate-500 border border-transparent hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <svg className="w-4 h-4 flex-shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="text-sm font-medium truncate">{session.title}</span>
                      </div>
                      <button
                        onClick={(e) => onDeleteSession(session.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Journal Archive */}
            {journalFiles.length > 0 && (
              <div>
                <h3 className="text-[10px] uppercase tracking-widest font-bold text-slate-400 px-2 mb-2">Web3 Journals</h3>
                <div className="space-y-1">
                  {journalFiles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((file) => (
                    <div
                      key={file.id}
                      onClick={() => onSelectJournal(file)}
                      className="group flex items-center justify-between w-full px-3 py-2 rounded-lg cursor-pointer hover:bg-white border border-transparent hover:border-slate-200 transition-all"
                    >
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <div className={`w-1.5 h-1.5 rounded-full ${file.blockchain_tx.startsWith('0x') ? 'bg-emerald-400' : 'bg-slate-300'}`}></div>
                        <span className="text-xs font-medium truncate text-slate-500">{file.title}</span>
                      </div>
                      <button
                        onClick={(e) => onDeleteJournal(file.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-auto pt-4 border-t border-slate-200">
            <p className="text-[10px] text-slate-400 text-center italic font-serif">Encrypted by Design.</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;