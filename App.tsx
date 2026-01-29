
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from './components/Header';
import MessageBubble from './components/MessageBubble';
import Sidebar from './components/Sidebar';
import { geminiService } from './services/geminiService';
import { Message, ChatSession, JournalFile } from './types';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [journalFiles, setJournalFiles] = useState<JournalFile[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<JournalFile | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Background Summary Function
  const triggerAutoSummary = async (session: ChatSession) => {
    const hasUserMessages = session.messages.some(m => m.role === 'user');
    const alreadySummarized = journalFiles.some(j => j.sessionId === session.id);
    
    if (hasUserMessages && !alreadySummarized) {
      try {
        const summary = await geminiService.summarizeSession(session.messages);
        if (summary) {
          const newJournal: JournalFile = {
            id: 'journal-' + Date.now(),
            sessionId: session.id,
            title: session.title,
            summary: summary,
            createdAt: new Date().toISOString(),
          };
          setJournalFiles(prev => [...prev, newJournal]);
        }
      } catch (e) {
        console.error("Silent summary failed", e);
      }
    }
  };

  const lockSession = (id: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, isLocked: true } : s));
  };

  const startNewChat = useCallback(() => {
    // Before starting new, check if we need to summarize current
    const currentActive = sessions.find(s => s.id === activeSessionId);
    if (currentActive && !currentActive.isLocked) {
      triggerAutoSummary(currentActive);
      lockSession(currentActive.id);
    }

    const id = Date.now().toString();
    const newSession: ChatSession = {
      id,
      title: 'New Reflection',
      messages: [
        {
          id: 'initial-' + id,
          role: 'assistant',
          content: 'How is your day going today?',
          timestamp: new Date().toISOString(),
        }
      ],
      updatedAt: new Date().toISOString(),
      isLocked: false,
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(id);
    setIsSidebarOpen(false);
    setSelectedJournal(null);
  }, [activeSessionId, sessions, journalFiles]);

  // Initial load logic: Always start a NEW session on mount
  useEffect(() => {
    const savedSessions = localStorage.getItem('serenity_sessions');
    const savedJournals = localStorage.getItem('serenity_journals');
    
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        // All loaded sessions from history must be locked
        const lockedHistory = parsed.map((s: ChatSession) => ({ ...s, isLocked: true }));
        setSessions(lockedHistory);
      } catch (e) { console.error("Error loading sessions history"); }
    }

    if (savedJournals) {
      try {
        setJournalFiles(JSON.parse(savedJournals));
      } catch (e) { console.error("Error loading journals"); }
    }

    // MANDATORY: Always start a new session on open
    const id = Date.now().toString();
    const freshSession: ChatSession = {
      id,
      title: 'New Reflection',
      messages: [
        {
          id: 'initial-' + id,
          role: 'assistant',
          content: 'How is your day going today?',
          timestamp: new Date().toISOString(),
        }
      ],
      updatedAt: new Date().toISOString(),
      isLocked: false,
    };
    setSessions(prev => [freshSession, ...prev]);
    setActiveSessionId(id);
  }, []); // Run once on mount

  useEffect(() => {
    localStorage.setItem('serenity_sessions', JSON.stringify(sessions));
    localStorage.setItem('serenity_journals', JSON.stringify(journalFiles));
  }, [sessions, journalFiles]);

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const messages = activeSession?.messages || [];
  const isReadOnly = activeSession?.isLocked || false;

  const handleSwitchSession = (id: string) => {
    const currentActive = sessions.find(s => s.id === activeSessionId);
    if (currentActive && !currentActive.isLocked) {
      triggerAutoSummary(currentActive);
      lockSession(currentActive.id);
    }
    setActiveSessionId(id);
    setSelectedJournal(null);
    setIsSidebarOpen(false);
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSessionId === id) setActiveSessionId(null);
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading || !activeSessionId || isReadOnly) return;

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

    const currentHistory = [...messages];
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
      setError("I'm having trouble connecting right now.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
        onDeleteSession={deleteSession}
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
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-serif font-bold text-slate-800 tracking-tight">{selectedJournal.title}</h2>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Session Summary Archive</p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <pre className="text-slate-600 leading-relaxed font-sans text-sm whitespace-pre-wrap break-words italic">
                    {selectedJournal.summary}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={{ ...msg, timestamp: new Date(msg.timestamp) }} />
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

                {isReadOnly && messages.length > 0 && (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-100 rounded-full text-slate-400 text-xs font-medium">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span>This historical session is locked</span>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm text-center border border-red-100 italic">{error}</div>
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
                placeholder={isReadOnly ? "This session has ended..." : "Share what's on your mind..."}
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
