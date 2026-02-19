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
              <span className="text-[9px] font-black text-[#263D4D] dark:text-slate-400 uppercase tracking-[0.2em] leading-none mt-1 hidden xs:block">Smart Finder</span>
            </div>
          </button>

          {/* Navbar Desktop - Solo se tab attiva */}
          {activeTab && (
            <nav className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${activeTab === tab.id ? "bg-white dark:bg-slate-700 text-[#FF8235] dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-600" : "text-slate-500 dark:text-slate-400 hover:text-[#FF8235] dark:hover:text-white"}`}
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
                  className={`flex items-center gap-2 p-1 sm:pl-1 sm:pr-3 sm:py-1 rounded-full border transition-all ${user.isPremium ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700 shadow-[0_0_15px_rgba(250,204,21,0.3)]" : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700"}`}
                >
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-xs uppercase shadow-sm ${user.isPremium ? "bg-gradient-to-tr from-yellow-400 to-orange-500 text-yellow-50 ring-2 ring-yellow-200 dark:ring-yellow-900" : "bg-gradient-to-tr from-blue-500 to-indigo-500"}`}>
                    {user.firstName?.charAt(0) || user.email.charAt(0)}{user.lastName?.charAt(0) || ""}
                  </div>
                  <div className="hidden sm:flex flex-col items-start">
                    <span className={`text-xs font-bold ${user.isPremium ? "text-yellow-700 dark:text-yellow-400" : "text-slate-700 dark:text-slate-200"}`}>{user.firstName}</span>
                    {user.isPremium && <span className="text-[9px] uppercase font-black tracking-widest leading-none text-yellow-500">Premium</span>}
                  </div>
                </button>

                {/* Menu dropdown utente */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-4 py-3 border-b border-slate-50 dark:border-slate-800">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{user.firstName} {user.lastName}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                    </div>
                    {/* Voci menu */}
                    {[
                      { icon: Icons.user, label: "Profilo", action: () => setShowAccountModal(true) },
                      { icon: Icons.bookmark, label: "Bonus Salvati", action: () => onTabChange("saved" as any) },
                    ].map((item) => (
                      <button key={item.label} onClick={handleMenuAction(item.action)} className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2">
                        <Icon path={item.icon} className="h-4 w-4 text-slate-400" />
                        {item.label}
                      </button>
                    ))}
                    <button onClick={handleMenuAction(() => { onLogout(); })} className="w-full text-left px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2">
                      <Icon path={Icons.logout} className="h-4 w-4" />
                      Disconnetti
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Login mobile */}
                <button onClick={onLogin} className="sm:hidden p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-600 transition-all border border-slate-200 dark:border-slate-700 shadow-sm" title="Accedi">
                  <Icon path={Icons.user} className="h-6 w-6" />
                </button>
                {/* Login desktop */}
                <button onClick={onLogin} className="hidden sm:block px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black uppercase tracking-wider hover:bg-blue-600 dark:hover:bg-blue-200 transition-colors shadow-lg shadow-blue-500/20">
                  Accedi
                </button>
              </>
            )}

            <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

            {/* Toggle tema */}
            <button onClick={onToggleTheme} className="hidden sm:block p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-slate-700 hover:text-[#FF8235] transition-all border border-slate-200 dark:border-slate-700 shadow-sm group/theme" title="Cambia Tema">
              <Icon path={theme === "light" ? Icons.moon : Icons.sun} className="h-5 w-5 transition-transform group-hover/theme:rotate-12" fill={theme === "dark"} />
            </button>
          </div>
        </div>

        {/* Navbar Mobile - Solo se tab attiva */}
        {activeTab && (
          <div className="lg:hidden border-t border-slate-100 dark:border-slate-800 flex justify-around p-2 bg-white dark:bg-slate-900">
            {TABS.map((tab) => (
              <button key={tab.id} onClick={() => onTabChange(tab.id)} className={`flex flex-col items-center flex-1 py-2 rounded-xl transition-all relative ${activeTab === tab.id ? "text-[#FF8235]" : "text-slate-400 dark:text-slate-500"}`}>
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
