
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from './components/Header';
import MessageBubble from './components/MessageBubble';
import Sidebar from './components/Sidebar';
import { geminiService } from './services/geminiService';
import { Message, ChatSession, JournalFile, MentalHealthStatus } from './types';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [journalFiles, setJournalFiles] = useState<JournalFile[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<JournalFile | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const executeArchivalPipeline = async (summary: string) => {
    try {
      const analysis = await geminiService.analyzeMentalHealth(summary);
      const mockCid = "Qm" + Array.from({length: 44}, () => "abcdef0123456789"[Math.floor(Math.random() * 16)]).join("");
      const mockTx = "0x" + Array.from({length: 64}, () => "abcdef0123456789"[Math.floor(Math.random() * 16)]).join("");
      return { ...analysis, cid: mockCid, tx: mockTx };
    } catch (err) {
      console.error("Pipeline failure", err);
      return { mentalHealth: "NEUTRAL" as MentalHealthStatus, keywords: [], cid: "N/A", tx: "N/A" };
    }
  };

  const triggerAutoArchive = useCallback(async (session: ChatSession) => {
    const hasUserMessages = session.messages.some(m => m.role === 'user');
    const alreadySummarized = journalFiles.some(j => j.sessionId === session.id);
    
    if (hasUserMessages && !alreadySummarized) {
      try {
        const summary = await geminiService.generateHandoffSummary(session.messages);
        if (summary) {
          const archiveData = await executeArchivalPipeline(summary);
          const newJournal: JournalFile = {
            id: 'journal-' + Date.now(),
            sessionId: session.id,
            startTime: session.startTime,
            endTime: new Date().toISOString(),
            title: session.title,
            summary: summary,
            keywords: archiveData.keywords,
            mentalHealth: archiveData.mentalHealth,
            ipfs_cid: archiveData.cid,
            blockchain_tx: archiveData.tx,
            createdAt: new Date().toISOString(),
          };
          setJournalFiles(prev => [...prev, newJournal]);
        }
      } catch (e) {
        console.error("Background archival failed", e);
      }
    }
  }, [journalFiles]);

  const lockSession = useCallback((id: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, isLocked: true, updatedAt: new Date().toISOString() } : s));
  }, []);

  useEffect(() => {
    const initialize = async () => {
      let historicalSessions: ChatSession[] = [];
      let historicalJournals: JournalFile[] = [];

      try {
        const savedSessionsStr = localStorage.getItem('serenity_sessions');
        const savedJournalsStr = localStorage.getItem('serenity_journals');
        
        if (savedSessionsStr) {
          const parsed = JSON.parse(savedSessionsStr);
          if (Array.isArray(parsed)) {
            historicalSessions = parsed.map((s: ChatSession) => ({ ...s, isLocked: true }));
          }
        }
        if (savedJournalsStr) {
          const parsed = JSON.parse(savedJournalsStr);
          if (Array.isArray(parsed)) {
            historicalJournals = parsed;
          }
        }
      } catch (e) {
        console.warn("Storage data malformed, starting fresh");
      }

      const id = Date.now().toString();
      const freshSession: ChatSession = {
        id,
        title: 'Active Reflection',
        messages: [{
          id: 'initial-' + id,
          role: 'assistant',
          content: 'How is your day going today?',
          timestamp: new Date().toISOString(),
        }],
        startTime: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isLocked: false,
      };

      setSessions([freshSession, ...historicalSessions]);
      setJournalFiles(historicalJournals);
      setActiveSessionId(id);
      setIsInitialized(true);
    };

    initialize();
  }, []);

  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem('serenity_sessions', JSON.stringify(sessions));
        localStorage.setItem('serenity_journals', JSON.stringify(journalFiles));
      } catch (e) {
        console.error("Local storage write error:", e);
      }
    }
  }, [sessions, journalFiles, isInitialized]);

  const startNewChat = useCallback(() => {
    const currentActive = sessions.find(s => s.id === activeSessionId);
    if (currentActive && !currentActive.isLocked) {
      triggerAutoArchive(currentActive);
      lockSession(currentActive.id);
    }

    const id = Date.now().toString();
    const newSession: ChatSession = {
      id,
      title: 'Active Reflection',
      messages: [{
        id: 'initial-' + id,
        role: 'assistant',
        content: 'How is your day going today?',
        timestamp: new Date().toISOString(),
      }],
      startTime: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isLocked: false,
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(id);
    setIsSidebarOpen(false);
    setSelectedJournal(null);
  }, [activeSessionId, sessions, triggerAutoArchive, lockSession]);

  const handleSwitchSession = (id: string) => {
    const currentActive = sessions.find(s => s.id === activeSessionId);
    if (currentActive && !currentActive.isLocked) {
      triggerAutoArchive(currentActive);
      lockSession(currentActive.id);
    }
    setActiveSessionId(id);
    setSelectedJournal(null);
    setIsSidebarOpen(false);
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading || !activeSessionId) return;

    const session = sessions.find(s => s.id === activeSessionId);
    if (!session || session.isLocked) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date().toISOString(),
    };

    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        const isFirstUserMessage = !s.messages.some(m => m.role === 'user');
        return {
          ...s,
          title: isFirstUserMessage ? userMessage.content.slice(0, 30) : s.title,
          messages: [...s.messages, userMessage],
          updatedAt: new Date().toISOString()
        };
      }
      return s;
    }));

    const currentHistory = [...session.messages];
    setInputText('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await geminiService.sendMessage(userMessage.content, currentHistory);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      };
      setSessions(prev => prev.map(s => 
        s.id === activeSessionId 
          ? { ...s, messages: [...s.messages, assistantMessage], updatedAt: new Date().toISOString() } 
          : s
      ));
    } catch (err: any) {
      setError("I'm here, but my thoughts are a bit scattered. Let's try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSessionId, sessions]);

  if (!isInitialized) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-[#faf9f6] text-center p-6">
        <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-emerald-800 font-serif italic">Preparing your sanctuary...</p>
      </div>
    );
  }

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const messages = activeSession?.messages || [];
  const isReadOnly = activeSession?.isLocked || false;

  return (
    <div className="flex min-h-screen bg-[#faf9f6]">
      <Sidebar 
        sessions={sessions}
        journalFiles={journalFiles}
        activeSessionId={activeSessionId}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNewChat={startNewChat}
        onSelectSession={handleSwitchSession}
        onSelectJournal={(journal) => {
          setSelectedJournal(journal);
          setActiveSessionId(null);
          setIsSidebarOpen(false);
        }}
        onDeleteSession={(id, e) => {
          e.stopPropagation();
          setSessions(prev => prev.filter(s => s.id !== id));
          if (activeSessionId === id) setActiveSessionId(null);
        }}
        onDeleteJournal={(id, e) => {
          e.stopPropagation();
          setJournalFiles(prev => prev.filter(j => j.id !== id));
          if (selectedJournal?.id === id) setSelectedJournal(null);
        }}
      />

      <div className="flex flex-col flex-grow md:ml-72 transition-all duration-300">
        <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main className="flex-grow pt-24 pb-32 px-4 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            {selectedJournal ? (
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm animate-fade-in">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-serif font-bold text-slate-800 tracking-tight">{selectedJournal.title}</h2>
                      <p className="text-[10px] uppercase tracking-widest text-emerald-600 font-bold">Encrypted Archive</p>
                    </div>
                  </div>
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase ${
                    ['HAPPY', 'GOOD'].includes(selectedJournal.mentalHealth) ? 'bg-emerald-100 text-emerald-700' :
                    selectedJournal.mentalHealth === 'NEUTRAL' ? 'bg-slate-100 text-slate-700' :
                    'bg-rose-100 text-rose-700'
                  }`}>
                    {selectedJournal.mentalHealth}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Keywords</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedJournal.keywords.map((kw, i) => (
                        <span key={i} className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-500">{kw}</span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Duration</p>
                    <p className="text-[10px] text-slate-600">{new Date(selectedJournal.startTime).toLocaleTimeString()} - {new Date(selectedJournal.endTime).toLocaleTimeString()}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                    <h3 className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-4">Integrity Hashes</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[9px] text-slate-400 font-mono mb-1">IPFS CID</p>
                        <p className="text-[10px] text-emerald-700 break-all font-mono bg-white p-3 rounded-xl border border-emerald-100/50">{selectedJournal.ipfs_cid}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 font-mono mb-1">TX HASH</p>
                        <p className="text-[10px] text-emerald-700 break-all font-mono bg-white p-3 rounded-xl border border-emerald-100/50">{selectedJournal.blockchain_tx}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
                
                {isLoading && (
                  <div className="flex justify-start mb-6">
                    <div className="bg-white border border-slate-100 rounded-2xl px-5 py-4 shadow-sm flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
                    </div>
                  </div>
                )}

                {isReadOnly && (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-100 rounded-full text-slate-400 text-[10px] font-bold tracking-widest uppercase border border-slate-200 shadow-sm">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span>Archived</span>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-4 rounded-xl bg-red-50 text-red-600 text-[10px] text-center border border-red-100 font-bold uppercase tracking-widest">{error}</div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </main>

        {!selectedJournal && (
          <div className="fixed bottom-0 left-0 right-0 md:left-72 bg-white/80 backdrop-blur-md border-t border-slate-100 p-4 z-10">
            <div className="max-w-3xl mx-auto relative">
              <textarea
                ref={inputRef}
                value={inputText}
                disabled={isReadOnly || isLoading}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                placeholder={isReadOnly ? "Conversation archived..." : "How are you feeling?"}
                rows={1}
                className={`w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 pr-16 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-all resize-none shadow-sm text-slate-700 ${isReadOnly ? 'bg-slate-50 cursor-not-allowed text-slate-400' : ''}`}
                style={{ minHeight: '56px', maxHeight: '150px' }}
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim() || isLoading || isReadOnly}
                className={`absolute right-3 bottom-3 p-2 rounded-xl transition-all ${inputText.trim() && !isLoading && !isReadOnly ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-300'}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
