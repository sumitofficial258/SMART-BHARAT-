import React, { useState, useEffect, useRef } from "react";
import { getTranslation, LanguageCode } from "../lib/languages";
import { db } from "../lib/firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { generateCivicResponse } from "../lib/gemini";
import { 
  Plus, 
  MessageSquare, 
  Mic, 
  Paperclip, 
  Send, 
  Sparkles, 
  AlertCircle,
  FileText,
  Loader2,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CompanionViewProps {
  userId: string;
  lang: LanguageCode;
  initialQuery?: string;
  onClearInitialQuery?: () => void;
}

interface ChatMessage {
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: string;
}

export default function CompanionView({ userId, lang, initialQuery, onClearInitialQuery }: CompanionViewProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [speechError, setSpeechError] = useState("");
  
  // Attached file state
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    mimeType: string;
    base64: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Load chat sessions from Firestore
  useEffect(() => {
    if (!userId) return;

    const userChatRef = doc(db, "chat_histories", userId);
    
    const unsubscribe = onSnapshot(userChatRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.sessions && Array.isArray(data.sessions)) {
          // Sort sessions by updatedAt descending
          const sorted = [...data.sessions].sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
          setSessions(sorted);
          
          // Set active session if none selected
          setActiveSessionId((prev) => {
            if (prev) return prev;
            return sorted.length > 0 ? sorted[0].id : "";
          });
        }
      } else {
        // Initialize an empty collection with a default session if nothing exists
        const defaultSessionId = "session-" + Date.now();
        const initialSessions: ChatSession[] = [{
          id: defaultSessionId,
          title: "General Civic Query",
          messages: [
            {
              sender: "ai",
              text: "Namaste! I am your Smart Bharat AI Civic Companion. I can help you find government schemes, track your requests, or file new public issues. How can I assist you today?",
              timestamp: new Date().toISOString()
            }
          ],
          updatedAt: new Date().toISOString()
        }];
        setDoc(userChatRef, { uid: userId, sessions: initialSessions });
        setSessions(initialSessions);
        setActiveSessionId(defaultSessionId);
      }
    });

    return () => unsubscribe();
  }, [userId]);

  // Handle initial query from Search Bar on Home
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      handleInitialQuerySubmit(initialQuery.trim());
    }
  }, [initialQuery]);

  const handleInitialQuerySubmit = async (queryText: string) => {
    if (!userId) return;
    
    // Create new session or find active one
    const newSessionId = "session-" + Date.now();
    const newSession: ChatSession = {
      id: newSessionId,
      title: queryText.slice(0, 30) + (queryText.length > 30 ? "..." : ""),
      messages: [
        {
          sender: "user",
          text: queryText,
          timestamp: new Date().toISOString()
        }
      ],
      updatedAt: new Date().toISOString()
    };

    const userChatRef = doc(db, "chat_histories", userId);
    
    // Fetch latest sessions from Firestore to prevent overwriting
    let existingSessions = [...sessions];
    try {
      const docSnap = await getDoc(userChatRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.sessions && Array.isArray(data.sessions)) {
          existingSessions = data.sessions;
        }
      }
    } catch (e) {
      console.error("Failed to fetch existing sessions before initial query:", e);
    }

    const updatedSessions = [newSession, ...existingSessions];
    
    // Optimistically update React states
    setSessions(updatedSessions);
    setActiveSessionId(newSessionId);
    
    await setDoc(userChatRef, { uid: userId, sessions: updatedSessions });
    
    if (onClearInitialQuery) onClearInitialQuery();
    
    // Call AI API for this query
    triggerAiResponse(queryText, newSessionId, updatedSessions);
  };

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessions, activeSessionId, loading]);

  // Web Speech API Initialization
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = lang === "hi" ? "hi-IN" : lang === "bn" ? "bn-IN" : lang === "ta" ? "ta-IN" : lang === "te" ? "te-IN" : "en-IN";

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => prev + " " + transcript);
        setIsRecording(false);
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setSpeechError("Voice input is limited in some iframe preview environments.");
        setIsRecording(false);
        setTimeout(() => setSpeechError(""), 4000);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }
  }, [lang]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      setSpeechError("Speech recognition is not fully supported in this browser environment.");
      setTimeout(() => setSpeechError(""), 4000);
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setIsRecording(true);
      setSpeechError("");
      recognitionRef.current.start();
    }
  };

  const handleCreateNewChat = async () => {
    if (!userId) return;
    const newSessionId = "session-" + Date.now();
    const newSession: ChatSession = {
      id: newSessionId,
      title: "New Chat Session",
      messages: [
        {
          sender: "ai",
          text: "Namaste! What can I help you understand or apply for today?",
          timestamp: new Date().toISOString()
        }
      ],
      updatedAt: new Date().toISOString()
    };

    const userChatRef = doc(db, "chat_histories", userId);
    const updatedSessions = [newSession, ...sessions];
    
    // Optimistic state updates
    setSessions(updatedSessions);
    setActiveSessionId(newSessionId);
    
    await setDoc(userChatRef, { uid: userId, sessions: updatedSessions });
  };

  const handleDeleteSession = async (sessionIdToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) return;
    
    const updatedSessions = sessions.filter(s => s.id !== sessionIdToDelete);
    const userChatRef = doc(db, "chat_histories", userId);
    await setDoc(userChatRef, { uid: userId, sessions: updatedSessions });

    if (activeSessionId === sessionIdToDelete && updatedSessions.length > 0) {
      setActiveSessionId(updatedSessions[0].id);
    } else if (updatedSessions.length === 0) {
      handleCreateNewChat();
    }
  };

  // Convert files to base64 for vision OCR parsing on Gemini
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = (reader.result as string).split(",")[1];
      setAttachedFile({
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        base64: base64String
      });
    };
    reader.readAsDataURL(file);
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !attachedFile) return;

    const textToSend = inputText.trim() || `Uploaded document: ${attachedFile?.name}`;
    setInputText("");
    
    // Copy attached file to pass and clear it locally
    const fileToSend = attachedFile;
    setAttachedFile(null);

    // Create user message object
    const userMsg: ChatMessage = {
      sender: "user",
      text: textToSend,
      timestamp: new Date().toISOString()
    };

    let sessId = activeSessionId;
    let currentSession = sessions.find(s => s.id === sessId);
    let updatedSessionsList = [...sessions];

    if (!currentSession) {
      sessId = "session-" + Date.now();
      currentSession = {
        id: sessId,
        title: textToSend.slice(0, 30) + (textToSend.length > 30 ? "..." : ""),
        messages: [userMsg],
        updatedAt: new Date().toISOString()
      };
      updatedSessionsList = [currentSession, ...sessions];
    } else {
      const updatedMessages = [...currentSession.messages, userMsg];
      
      // Give it a dynamic name if it was a generic name
      const sessionTitle = (currentSession.title === "New Chat Session" || currentSession.title === "General Civic Query")
        ? (textToSend.length > 25 ? textToSend.slice(0, 25) + "..." : textToSend)
        : currentSession.title;

      const updatedSession: ChatSession = {
        ...currentSession,
        title: sessionTitle,
        messages: updatedMessages,
        updatedAt: new Date().toISOString()
      };

      updatedSessionsList = sessions.map(s => s.id === activeSessionId ? updatedSession : s);
    }

    // Optimistic state updates
    setSessions(updatedSessionsList);
    setActiveSessionId(sessId);
    setLoading(true);
    
    const userChatRef = doc(db, "chat_histories", userId);
    setDoc(userChatRef, { uid: userId, sessions: updatedSessionsList }).catch(err => {
      console.error("Failed to write optimistic user message to Firestore:", err);
    });

    // Call AI instantly without awaiting the Firestore save to ensure instant UI responsiveness
    triggerAiResponse(textToSend, sessId, updatedSessionsList, fileToSend);
  };

  const triggerAiResponse = async (
    promptText: string, 
    sessId: string, 
    allSessions: ChatSession[], 
    fileObj?: typeof attachedFile
  ) => {
    setLoading(true);
    try {
      const targetSession = allSessions.find(s => s.id === sessId);
      if (!targetSession) return;

      const aiText = await generateCivicResponse(targetSession.messages, fileObj);

      const aiMsg: ChatMessage = {
        sender: "ai",
        text: aiText,
        timestamp: new Date().toISOString()
      };

      // Update local state instantly and write back in the background without blocking the UI
      setSessions((prevSessions) => {
        const updated = prevSessions.map(s => {
          if (s.id === sessId) {
            return {
              ...s,
              messages: [...s.messages, aiMsg],
              updatedAt: new Date().toISOString()
            };
          }
          return s;
        });

        const userChatRef = doc(db, "chat_histories", userId);
        setDoc(userChatRef, { uid: userId, sessions: updated }).catch(err => {
          console.error("Failed to save AI response to Firestore:", err);
        });

        return updated;
      });
    } catch (err: any) {
      console.error("AI Generation Error in CompanionView:", err);
      
      const cleanError = err.message || String(err);
      let userFriendlyError = "Namaste, I am having trouble connecting to my server right now.";
      
      if (cleanError.includes("GEMINI_API_KEY")) {
        userFriendlyError = "⚠️ **GEMINI_API_KEY Required**\n\nThe AI Civic Companion cannot start because the Google Gemini API Key is missing or invalid on the server.\n\n**How to resolve this:**\n1. Click on the **Settings** (gear icon) in the top-right corner of Google AI Studio.\n2. Navigate to **Secrets**.\n3. Add a new secret named `GEMINI_API_KEY` and set its value to your Gemini API Key.\n4. Send another message here to start chatting instantly!";
      } else {
        userFriendlyError = `⚠️ **Connection Error**\n\nI was unable to retrieve a response from the server.\n\n**Details:** ${cleanError}\n\nPlease check your internet connection and verify that the ` + "`GEMINI_API_KEY`" + ` in Settings is active and valid.`;
      }

      const errMessage: ChatMessage = {
        sender: "ai",
        text: userFriendlyError,
        timestamp: new Date().toISOString()
      };

      setSessions((prevSessions) => {
        const updated = prevSessions.map(s => {
          if (s.id === sessId) {
            return {
              ...s,
              messages: [...s.messages, errMessage],
              updatedAt: new Date().toISOString()
            };
          }
          return s;
        });

        const userChatRef = doc(db, "chat_histories", userId);
        setDoc(userChatRef, { uid: userId, sessions: updated }).catch(e => {
          console.error("Failed to save error state to Firestore:", e);
        });

        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePromptChipClick = (chipText: string) => {
    setInputText(chipText);
  };

  const promptChips = [
    "Check scheme eligibility",
    "Find nearest government hospital",
    "How to file a public complaint?",
    "Ration card status correction"
  ];

  return (
    <div id="chat-companion-portal" className="max-w-7xl mx-auto px-4 md:px-8 py-8 h-[calc(100vh-140px)] flex flex-col md:flex-row gap-6 font-sans">
      {/* Left Sidebar: Past Conversations History (Gemini-style) */}
      <div id="chat-history-sidebar" className="w-full md:w-80 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between shrink-0">
        <div>
          <button
            onClick={handleCreateNewChat}
            className="w-full py-2.5 px-4 bg-indigo-50 text-indigo-700 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-indigo-100 transition-colors mb-6 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Consultation</span>
          </button>

          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2 mb-4">
            Recent Chats
          </h3>

          <div className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-380px)] pr-1">
            {sessions.map((session) => (
              <div
                id={`session-item-${session.id}`}
                key={session.id}
                onClick={() => setActiveSessionId(session.id)}
                className={`flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition group border-l-2 ${
                  session.id === activeSessionId
                    ? "bg-slate-100 text-indigo-700 border-indigo-500 font-semibold"
                    : "hover:bg-slate-50 text-slate-500 hover:text-slate-800 border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <MessageSquare className={`w-4 h-4 shrink-0 ${session.id === activeSessionId ? "text-indigo-600" : "text-slate-400"}`} />
                  <span className="text-sm truncate">
                    {session.title}
                  </span>
                </div>
                <button
                  onClick={(e) => handleDeleteSession(session.id, e)}
                  className="opacity-0 group-hover:opacity-100 hover:text-red-600 p-1 rounded-md transition shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-extrabold text-sm shadow-sm">
            AI
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-800 leading-none mb-1">
              Smart Companion
            </h4>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] text-slate-500 font-medium">Online & Ready to help</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Active Rolling Chat Stream */}
      <div id="chat-active-window" className="flex-grow bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col justify-between overflow-hidden relative">
        {/* Active conversation message list */}
        <div className="flex-grow p-6 md:p-8 overflow-y-auto space-y-6">
          <AnimatePresence initial={false}>
            {activeSession?.messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.sender === "ai" && (
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                    <Sparkles className="w-5 h-5" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] p-4 rounded-2xl ${
                    msg.sender === "user"
                      ? "bg-indigo-600 text-white rounded-tr-none font-semibold shadow-sm"
                      : "bg-slate-50 text-slate-800 rounded-tl-none font-semibold leading-relaxed border border-slate-100 shadow-sm whitespace-pre-line"
                  }`}
                >
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <div className="flex gap-4 justify-start">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="bg-slate-50 text-slate-400 font-semibold p-4 rounded-2xl rounded-tl-none border border-slate-100 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span>Companion is thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom controls panel */}
        <div className="p-4 md:p-6 bg-slate-50/50 border-t border-slate-200">
          {speechError && (
            <div className="mb-3 px-4 py-2 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{speechError}</span>
            </div>
          )}

          {/* Prompt chips suggestions */}
          <div className="flex gap-2 pb-4 overflow-x-auto scrollbar-none">
            {promptChips.map((chip, index) => (
              <button
                id={`chip-item-${index}`}
                key={index}
                onClick={() => handlePromptChipClick(chip)}
                className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-full shadow-sm cursor-pointer whitespace-nowrap shrink-0 transition"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* File attachment preview */}
          {attachedFile && (
            <div className="mb-3 p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs font-bold text-slate-600 max-w-sm animate-fade-in shadow-sm">
              <div className="flex items-center gap-2 truncate">
                <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="truncate">{attachedFile.name}</span>
              </div>
              <button
                onClick={() => setAttachedFile(null)}
                className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}

          {/* Form input */}
          <form onSubmit={handleSendMessage} className="flex items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,application/pdf"
            />
            <button
              id="attachment-btn"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-white hover:bg-slate-100 border border-slate-200 p-3.5 rounded-2xl text-slate-500 hover:text-slate-800 transition cursor-pointer shadow-sm relative group"
              title="Attach Document/Photo"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <button
              id="microphone-btn"
              type="button"
              onClick={toggleRecording}
              className={`p-3.5 rounded-2xl transition cursor-pointer shadow-sm relative ${
                isRecording 
                  ? "bg-red-600 text-white animate-pulse" 
                  : "bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800"
              }`}
              title={isRecording ? "Listening... Click to stop" : "Speak to write"}
            >
              <Mic className="w-5 h-5" />
            </button>

            <div className="flex-grow bg-white border border-slate-200 rounded-2xl px-4 py-1 shadow-sm flex items-center focus-within:border-indigo-500 transition-colors">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your query here..."
                className="w-full bg-transparent text-slate-800 font-semibold placeholder-slate-400 focus:outline-none py-3 text-sm"
              />
            </div>

            <button
              id="send-chat-btn"
              type="submit"
              disabled={loading || (!inputText.trim() && !attachedFile)}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white p-3.5 rounded-2xl transition shadow-md cursor-pointer disabled:cursor-not-allowed shrink-0 flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
