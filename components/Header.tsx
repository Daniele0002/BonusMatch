'use client';

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import AccountSettingsModal from "./AccountSettingsModal";

// ═══════════════════════════════════════════════════════════════════════════════
// TIPI E COSTANTI
// ═══════════════════════════════════════════════════════════════════════════════
interface HeaderProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  activeTab?: "dashboard" | "search" | "settings" | "calendar" | "documents" | "family";
  onTabChange: (tab: "dashboard" | "search" | "settings" | "calendar" | "documents" | "family") => void;
  onLogoClick: () => void;
  onLogin: () => void;
  onLogout: () => void;
  onShowPremium: () => void;
}

/** Icone SVG riutilizzabili - evita duplicazione */
const Icons = {
  home: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
  search: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />,
  calendar: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
  document: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  user: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
  bookmark: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />,
  logout: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />,
  close: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />,
  star: <path fillRule="evenodd" d="M10 2l2.5 7h7.5l-6 4.5 2.5 7-6-4.5-6 4.5 2.5-7-6-4.5h7.5z" clipRule="evenodd" />,
  family: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></>,
  moon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />,
  sun: <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />,
} as const;

/** Componente SVG base per evitare ripetizione */
const Icon: React.FC<{ path: React.ReactNode; className?: string; fill?: boolean }> = ({ path, className = "h-5 w-5", fill }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill={fill ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">{path}</svg>
);

/** Configurazione tabs navigazione */
const TABS = [
  { id: "dashboard", label: "Dashboard", icon: Icons.home, premium: false },
  { id: "search", label: "Cerca", icon: Icons.search, premium: false },
  { id: "family", label: "Famiglia", icon: Icons.family, premium: true },
  { id: "calendar", label: "Calendario", icon: Icons.calendar, premium: true },
  { id: "documents", label: "Documenti", icon: Icons.document, premium: true },
  { id: "settings", label: "Profilo", icon: Icons.user, premium: false },
] as const;

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE HEADER
// ═══════════════════════════════════════════════════════════════════════════════
const Header: React.FC<HeaderProps> = ({ theme, onToggleTheme, activeTab, onTabChange, onLogoClick, onLogin, onLogout, onShowPremium }) => {
  const { user, isAuthenticated } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);

  /** Gestisce azioni menu utente con chiusura automatica */
  const handleMenuAction = (action: () => void) => () => { action(); setShowUserMenu(false); };

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white dark:bg-slate-900 border-b-2 border-slate-100 dark:border-slate-800 sticky top-0 z-[100] transition-all shadow-md"
      >
        {/* Container principale */}
        <div className="container mx-auto px-4 py-4 flex justify-between items-center max-w-screen-2xl h-20">
          {/* Logo & Brand */}
          <button onClick={onLogoClick} className="flex items-center gap-3 group transition-all active:scale-95 outline-none" aria-label="Torna alla Home">
            <div className="flex flex-col text-left">
              <h1 className="text-xl md:text-xl text-slate-800 dark:text-white uppercase leading-none group-hover:text-[#FF8235] transition-colors" style={{ fontFamily: '"Special Gothic Expanded One", sans-serif' }}>
                Bonus Match
              </h1>
              <span className="text-[9px] font-black text-[#263D4D] dark:text-slate-300 uppercase tracking-[0.2em] leading-none mt-1 hidden xs:block">Smart Finder</span>
            </div>
          </button>

          {/* Navbar Desktop - Solo se tab attiva */}
          {activeTab && (
            <nav className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${activeTab === tab.id ? "bg-white dark:bg-slate-700 text-[#FF8235] dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-600" : "text-slate-600 dark:text-slate-300 hover:text-[#FF8235] dark:hover:text-white"}`}
                >
                  {tab.label}
                  {tab.premium && !user?.isPremium && (
                    <span className="px-1.5 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-400 text-[7px] font-black text-yellow-900 rounded-full">PRO</span>
                  )}
                </button>
              ))}
            </nav>
          )}

          {/* Azioni Header */}
          <div className="flex items-center gap-3">
            {/* CTA Premium - Solo desktop e utenti non premium */}
            {!user?.isPremium && (
              <button onClick={onShowPremium} className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-950 text-[10px] font-black uppercase tracking-wider hover:scale-105 transition-transform shadow-md shadow-yellow-400/20 mr-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">{Icons.star}</svg>
                Premium
              </button>
            )}

            {isAuthenticated && user ? (
              <div className="relative">
                {/* Avatar utente */}
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`flex items-center gap-2.5 p-1 sm:pl-1.5 sm:pr-4 sm:py-1.5 rounded-full border-2 transition-all hover:scale-[1.03] active:scale-95 ${
                    user.isPremium 
                      ? "bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-400 dark:border-yellow-600 shadow-lg shadow-yellow-400/20 dark:shadow-yellow-900/30" 
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 shadow-md hover:shadow-lg"
                  }`}
                >
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center text-white font-black text-xs uppercase ${
                    user.isPremium 
                      ? "bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 ring-2 ring-yellow-300 dark:ring-yellow-700 shadow-md shadow-orange-400/30" 
                      : "bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 ring-2 ring-blue-200 dark:ring-blue-800 shadow-md shadow-blue-400/20"
                  }`}>
                    {user.firstName?.charAt(0) || user.email.charAt(0)}{user.lastName?.charAt(0) || ""}
                  </div>
                  <div className="hidden sm:flex flex-col items-start">
                    <span className={`text-xs font-black ${user.isPremium ? "text-yellow-800 dark:text-yellow-300" : "text-slate-800 dark:text-slate-100"}`}>{user.firstName}</span>
                    {user.isPremium && (
                      <span className="text-[8px] uppercase font-black tracking-[0.2em] leading-none bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">Premium ★</span>
                    )}
                  </div>
                  {/* Chevron */}
                  <svg xmlns="http://www.w3.org/2000/svg" className={`hidden sm:block h-3.5 w-3.5 transition-transform ${showUserMenu ? "rotate-180" : ""} ${user.isPremium ? "text-yellow-500" : "text-slate-400"}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Menu dropdown utente */}
                {showUserMenu && (
                  <>
                    {/* Overlay per chiudere il menu */}
                    <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-slate-200/50 dark:shadow-black/30 border border-slate-200 dark:border-slate-700 overflow-hidden z-20">
                      {/* User info header */}
                      <div className={`px-4 py-4 ${user.isPremium ? "bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/10" : "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/10"}`}>
                        <p className="text-sm font-black text-slate-900 dark:text-white">{user.firstName} {user.lastName}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{user.email}</p>
                        {user.isPremium && (
                          <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-[8px] font-black text-white uppercase tracking-wider">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor">{Icons.star}</svg>
                            Premium
                          </div>
                        )}
                      </div>
                      {/* Voci menu */}
                      <div className="p-1.5">
                        {[
                          { icon: Icons.user, label: "Il mio Profilo", desc: "Gestisci account", action: () => setShowAccountModal(true) },
                          { icon: Icons.bookmark, label: "Bonus Salvati", desc: "I tuoi preferiti", action: () => onTabChange("saved" as any) },
                        ].map((item) => (
                          <button key={item.label} onClick={handleMenuAction(item.action)} className="w-full text-left px-3 py-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-3 group/item">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover/item:bg-blue-100 dark:group-hover/item:bg-blue-900/30 flex items-center justify-center transition-colors">
                              <Icon path={item.icon} className="h-4 w-4 text-slate-500 group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400 transition-colors" />
                            </div>
                            <div>
                              <p className="text-xs font-bold">{item.label}</p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500">{item.desc}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                      {/* Logout */}
                      <div className="border-t border-slate-100 dark:border-slate-800 p-1.5">
                        <button onClick={handleMenuAction(() => { onLogout(); })} className="w-full text-left px-3 py-2.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center gap-3 group/logout">
                          <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 group-hover/logout:bg-red-100 dark:group-hover/logout:bg-red-900/30 flex items-center justify-center transition-colors">
                            <Icon path={Icons.logout} className="h-4 w-4" />
                          </div>
                          <p className="text-xs font-bold">Disconnetti</p>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                {/* Login mobile */}
                <button onClick={onLogin} className="sm:hidden p-2.5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95 shadow-md" title="Accedi">
                  <Icon path={Icons.user} className="h-5 w-5" />
                </button>
                {/* Login desktop */}
                <button onClick={onLogin} className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 dark:from-white dark:to-slate-100 text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-[0.15em] hover:from-blue-600 hover:to-indigo-600 dark:hover:from-blue-100 dark:hover:to-blue-200 transition-all shadow-lg shadow-slate-900/20 dark:shadow-white/10 hover:shadow-blue-500/30 active:scale-95">
                  <Icon path={Icons.user} className="h-3.5 w-3.5" />
                  Accedi
                </button>
              </>
            )}

            <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

            {/* Toggle tema */}
            <button onClick={onToggleTheme} className={`hidden sm:flex items-center justify-center w-10 h-10 rounded-xl transition-all border shadow-sm active:scale-90 ${
              theme === "light" 
                ? "bg-slate-100 border-slate-200 text-slate-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600" 
                : "bg-slate-800 border-slate-700 text-yellow-400 hover:bg-yellow-900/30 hover:border-yellow-700"
            }`} title="Cambia Tema">
              <Icon path={theme === "light" ? Icons.moon : Icons.sun} className="h-5 w-5 transition-transform hover:rotate-12" fill={theme === "dark"} />
            </button>
          </div>
        </div>

        {/* Navbar Mobile - Solo se tab attiva */}
        {activeTab && (
          <div className="lg:hidden border-t border-slate-100 dark:border-slate-800 flex justify-around p-2 bg-white dark:bg-slate-900">
            {TABS.map((tab) => (
              <button key={tab.id} onClick={() => onTabChange(tab.id)} className={`flex flex-col items-center flex-1 py-2 rounded-xl transition-all relative ${activeTab === tab.id ? "text-[#FF8235]" : "text-slate-500 dark:text-slate-400"}`}>
                <div className={`p-1 rounded-lg ${activeTab === tab.id ? "bg-orange-50 dark:bg-orange-900/20" : ""}`}>
                  <Icon path={tab.icon} />
                  {tab.premium && !user?.isPremium && (
                    <span className="absolute -top-0.5 -right-0.5 px-1 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-400 text-[6px] font-black text-yellow-900 rounded-full leading-none">PRO</span>
                  )}
                </div>
                <span className="text-[9px] font-black uppercase tracking-tighter mt-1">{tab.label}</span>
              </button>
            ))}
          </div>
        )}
      </motion.header>

      {isAuthenticated && <AccountSettingsModal isOpen={showAccountModal} onClose={() => setShowAccountModal(false)} />}
    </>
  );
};

export default Header;
