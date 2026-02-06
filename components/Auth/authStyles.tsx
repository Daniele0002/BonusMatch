/**
 * Stili e costanti condivise per i componenti Auth
 * Centralizza classi CSS ripetute tra Login, Register, ForgotPassword
 */

// ═══════════════════════════════════════════════════════════════════════
// STILI CSS CONDIVISI
// ═══════════════════════════════════════════════════════════════════════
export const AUTH_STYLES = {
  // Container principale
  container: "max-w-sm w-full mx-auto bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200",
  
  // Input field
  input: "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-blue-500 rounded-xl outline-none text-slate-900 dark:text-white text-sm font-medium transition-all",
  
  // Label
  label: "text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1",
  
  // Pulsante primario
  submitBtn: "w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm uppercase tracking-widest rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed",
  
  // Box errore
  errorBox: "p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl border border-red-100 dark:border-red-900/50 flex items-center gap-2 animate-in fade-in slide-in-from-top-1",
  
  // Box successo
  successBox: "p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs font-bold rounded-xl border border-green-100 dark:border-green-900/50 flex items-center gap-2 animate-in fade-in slide-in-from-top-1",
  
  // Link testuale
  textLink: "text-blue-600 dark:text-blue-400 font-bold hover:underline underline-offset-4",
  
  // Pulsante chiusura
  closeBtn: "p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400",
} as const;

// ═══════════════════════════════════════════════════════════════════════
// ICONE SVG - Percorsi centralizzati
// ═══════════════════════════════════════════════════════════════════════
export const AUTH_ICONS = {
  close: "M6 18L18 6M6 6l12 12",
  // Spinner circolare (viene usato come componente, non path)
} as const;

// ═══════════════════════════════════════════════════════════════════════
// COMPONENTI RIUTILIZZABILI
// ═══════════════════════════════════════════════════════════════════════
import React from "react";

/** Icona SVG riutilizzabile */
export const Icon: React.FC<{ d: string; className?: string }> = ({ d, className = "h-5 w-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

/** Spinner di caricamento */
export const Spinner: React.FC<{ size?: string }> = ({ size = "h-4 w-4" }) => (
  <svg className={`animate-spin ${size} text-white`} viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

/** Header form con titolo e pulsante chiusura */
export const FormHeader: React.FC<{ 
  title: string; 
  subtitle?: string; 
  onClose: () => void 
}> = ({ title, subtitle, onClose }) => (
  <div className="flex justify-between items-center mb-5">
    <div>
      <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">{title}</h2>
      {subtitle && <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{subtitle}</p>}
    </div>
    <button onClick={onClose} className={AUTH_STYLES.closeBtn}>
      <Icon d={AUTH_ICONS.close} />
    </button>
  </div>
);

/** Box messaggio (errore o successo) */
export const MessageBox: React.FC<{ 
  type: "error" | "success"; 
  message: string 
}> = ({ type, message }) => (
  <div className={type === "error" ? AUTH_STYLES.errorBox : AUTH_STYLES.successBox}>
    <span className="text-base">{type === "error" ? "⚠️" : "✅"}</span>
    <span>{message}</span>
  </div>
);

/** Campo input con label */
export const FormField: React.FC<{
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  disabled?: boolean;
  rightLabel?: React.ReactNode;
}> = ({ label, type = "text", value, onChange, placeholder, autoComplete, required, minLength, disabled, rightLabel }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between items-center px-1">
      <label className={AUTH_STYLES.label}>{label}</label>
      {rightLabel}
    </div>
    <input
      type={type}
      autoComplete={autoComplete}
      value={value}
      onChange={e => onChange(e.target.value)}
      className={AUTH_STYLES.input}
      placeholder={placeholder}
      required={required}
      minLength={minLength}
      disabled={disabled}
    />
  </div>
);

/** Link di navigazione tra form */
export const FormFooterLink: React.FC<{
  text: string;
  linkText: string;
  onClick: () => void;
}> = ({ text, linkText, onClick }) => (
  <div className="text-center mt-5">
    <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
      {text}{" "}
      <button type="button" onClick={onClick} className={AUTH_STYLES.textLink}>
        {linkText}
      </button>
    </p>
  </div>
);
