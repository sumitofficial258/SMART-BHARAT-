import { useState, useEffect } from "react";
import { auth, logOut } from "./lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getTranslation, LanguageCode, languages } from "./lib/languages";
import { Globe, LogOut, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Views
import AuthView from "./components/AuthView";
import HomeView from "./components/HomeView";
import CompanionView from "./components/CompanionView";
import SchemesView from "./components/SchemesView";
import ReportView from "./components/ReportView";
import TrackView from "./components/TrackView";
import CommunityView from "./components/CommunityView";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("home");
  const [lang, setLang] = useState<LanguageCode>("en");
  
  // Transition state to carry search query from Home to Companion view
  const [initialChatQuery, setInitialChatQuery] = useState("");

  useEffect(() => {
    // Listen to Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        setUser(null);
      }
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  const handleNavigate = (tab: string, initialQuery?: string) => {
    if (initialQuery) {
      setInitialChatQuery(initialQuery);
    }
    setActiveTab(tab);
  };

  const handleLogout = async () => {
    try {
      await logOut();
      setUser(null);
      setActiveTab("home");
    } catch (err) {
      console.error("Logout failed:", err);
      // fallback
      setUser(null);
      setActiveTab("home");
    }
  };

  if (!authChecked) {
    return (
      <div id="app-loading-state" className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <h2 className="text-sm font-extrabold text-slate-800">Initializing Smart Bharat...</h2>
        <p className="text-xs text-slate-400 mt-1">Connecting to Secure Firebase Portal</p>
      </div>
    );
  }

  if (!user) {
    return <AuthView onAuthSuccess={(u) => setUser(u)} lang={lang} />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case "home":
        return (
          <HomeView 
            userName={user.displayName || "Citizen"} 
            lang={lang} 
            onNavigate={handleNavigate} 
          />
        );
      case "chat":
        return (
          <CompanionView 
            userId={user.uid} 
            lang={lang} 
            initialQuery={initialChatQuery}
            onClearInitialQuery={() => setInitialChatQuery("")}
          />
        );
      case "schemes":
        return <SchemesView lang={lang} />;
      case "report":
        return <ReportView userId={user.uid} lang={lang} />;
      case "track":
        return <TrackView userId={user.uid} lang={lang} />;
      case "community":
        return <CommunityView userId={user.uid} userName={user.displayName || "Citizen"} lang={lang} />;
      default:
        return <HomeView userName={user.displayName || "Citizen"} lang={lang} onNavigate={handleNavigate} />;
    }
  };

  return (
    <div id="smart-bharat-root" className="min-h-screen bg-[#F3F4F6] text-slate-800 font-sans flex flex-col">
      {/* Persistent Sticky Navigation Header Bar */}
      <header id="sticky-header-navbar" className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-18">
          
          {/* Logo Brand Brand Identity */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => handleNavigate("home")}>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md transform active:scale-95 transition-transform">
              <span className="text-white font-extrabold text-lg">s</span>
            </div>
            <div>
              <h1 className="text-md font-black tracking-tight leading-none text-slate-900">
                {getTranslation(lang, "appName")}
              </h1>
              <p className="text-[9px] font-bold text-indigo-600/90 tracking-wide mt-0.5">
                CIVIC COMPANION
              </p>
            </div>
          </div>

          {/* Navigation Links tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 shadow-inner">
            {[
              { id: "home", labelKey: "navHome" },
              { id: "chat", labelKey: "navCompanion" },
              { id: "schemes", labelKey: "navSchemes" },
              { id: "report", labelKey: "navReport" },
              { id: "track", labelKey: "navTrack" },
              { id: "community", labelKey: "navCommunity" }
            ].map((tab) => (
              <button
                id={`tab-link-${tab.id}`}
                key={tab.id}
                onClick={() => handleNavigate(tab.id)}
                className={`px-4 py-2 text-xs font-extrabold rounded-xl transition cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-white text-indigo-600 shadow-sm border border-slate-100/50 font-black"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {getTranslation(lang, tab.labelKey)}
              </button>
            ))}
          </nav>

          {/* Right Action Panel: Language dropdown + User Profile */}
          <div className="flex items-center gap-4">
            
            {/* Global Language Selector Dropdown */}
            <div id="language-dropdown-wrapper" className="relative group flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-xl border border-slate-100 transition cursor-pointer">
              <Globe className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">
                {languages[lang].nativeName}
              </span>
              <select
                id="global-lang-dropdown"
                value={lang}
                onChange={(e) => setLang(e.target.value as LanguageCode)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                title="Select Language"
              >
                {Object.entries(languages).map(([code, data]) => (
                  <option key={code} value={code}>
                    {data.name} ({data.nativeName})
                  </option>
                ))}
              </select>
            </div>

            {/* Profile Avatar & Actions */}
            <div className="flex items-center gap-3 border-l border-slate-100 pl-4">
              <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-800 flex items-center justify-center font-extrabold text-xs shadow-sm">
                {(user.displayName || "C").charAt(0).toUpperCase()}
              </div>
              <button
                id="signout-btn"
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile-only Navigation bar */}
      <div className="md:hidden sticky top-18 z-30 bg-white border-b border-slate-100 shadow-sm px-4 py-2 overflow-x-auto flex gap-1 scrollbar-none">
        {[
          { id: "home", labelKey: "navHome" },
          { id: "chat", labelKey: "navCompanion" },
          { id: "schemes", labelKey: "navSchemes" },
          { id: "report", labelKey: "navReport" },
          { id: "track", labelKey: "navTrack" },
          { id: "community", labelKey: "navCommunity" }
        ].map((tab) => (
          <button
            id={`mobile-tab-${tab.id}`}
            key={tab.id}
            onClick={() => handleNavigate(tab.id)}
            className={`px-3 py-1.5 text-[11px] font-extrabold rounded-lg shrink-0 transition ${
              activeTab === tab.id
                ? "bg-indigo-50 text-indigo-600 border border-indigo-100"
                : "text-slate-500"
            }`}
          >
            {getTranslation(lang, tab.labelKey)}
          </button>
        ))}
      </div>

      {/* Content Canvas */}
      <main id="main-content-canvas" className="flex-grow">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {renderActiveView()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
