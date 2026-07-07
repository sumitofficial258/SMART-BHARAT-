import React, { useState } from "react";
import { getTranslation, LanguageCode } from "../lib/languages";
import { MessageSquare, ShieldCheck, MapPin, ClipboardList, Users, Search, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

interface HomeViewProps {
  userName: string;
  lang: LanguageCode;
  onNavigate: (tab: string, initialQuery?: string) => void;
}

export default function HomeView({ userName, lang, onNavigate }: HomeViewProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate("chat", searchQuery.trim());
    }
  };

  const navCards = [
    {
      id: "chat",
      titleKey: "homeChatCard",
      descKey: "homeChatDesc",
      icon: MessageSquare,
      color: "bg-indigo-50 text-indigo-600 border-indigo-100",
      iconBg: "bg-indigo-600 text-white"
    },
    {
      id: "schemes",
      titleKey: "homeSchemesCard",
      descKey: "homeSchemesDesc",
      icon: ShieldCheck,
      color: "bg-blue-50 text-blue-600 border-blue-100",
      iconBg: "bg-blue-600 text-white"
    },
    {
      id: "report",
      titleKey: "homeReportCard",
      descKey: "homeReportDesc",
      icon: MapPin,
      color: "bg-slate-50 text-slate-600 border-slate-200",
      iconBg: "bg-slate-600 text-white"
    },
    {
      id: "track",
      titleKey: "homeTrackCard",
      descKey: "homeTrackDesc",
      icon: ClipboardList,
      color: "bg-indigo-50 text-indigo-600 border-indigo-100",
      iconBg: "bg-indigo-600 text-white"
    },
    {
      id: "community",
      titleKey: "homeCommunityCard",
      descKey: "homeCommunityDesc",
      icon: Users,
      color: "bg-sky-50 text-sky-600 border-sky-100",
      iconBg: "bg-sky-600 text-white"
    }
  ];

  return (
    <div id="home-view-container" className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      {/* Welcome Message Card */}
      <div className="mb-10">
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          {getTranslation(lang, "welcomeBack")}, {userName}
        </h2>
        <p className="text-slate-500 font-medium mt-1">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Hero Search Box Card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 bg-white rounded-3xl p-8 md:p-12 shadow-md border border-slate-200 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-100/30 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-100/30 rounded-full blur-3xl -ml-20 -mb-20"></div>

        <div className="relative z-10 max-w-3xl mx-auto text-center md:text-left">
          <form onSubmit={handleSearchSubmit} className="mt-4 flex flex-col md:flex-row items-center gap-4 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 shadow-inner">
            <div className="flex items-center gap-3 flex-grow w-full px-4">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={getTranslation(lang, "heroPrompt")}
                className="w-full bg-transparent text-slate-800 font-medium placeholder-slate-400 focus:outline-none py-3"
              />
            </div>
            <button
              type="submit"
              className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-8 py-3.5 rounded-xl shadow-lg shadow-indigo-100 transition-all duration-150 transform hover:scale-[1.01] active:scale-95 shrink-0 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{getTranslation(lang, "askAiButton")}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </motion.div>

      {/* Navigation Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {navCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              id={`nav-card-${card.id}`}
              key={card.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onNavigate(card.id)}
              className="bg-white hover:bg-slate-50 border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 group flex flex-col justify-between"
            >
              <div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${card.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-slate-900 mb-2">
                  {getTranslation(lang, card.titleKey)}
                </h3>
                <p className="text-slate-500 font-medium text-sm leading-relaxed mb-6">
                  {getTranslation(lang, card.descKey)}
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm font-extrabold text-slate-800 self-start group-hover:translate-x-1 transition-transform">
                <span>Open Portal</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-800" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
