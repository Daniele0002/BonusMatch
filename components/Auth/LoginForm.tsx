import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient"; // Assicurati che il percorso sia corretto

interface LoginFormProps {
  onSuccess: () => void;
  onRegisterClick: () => void;
  onForgotPasswordClick: () => void;
  onCancel: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onRegisterClick,
  onForgotPasswordClick,
  onCancel,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    // 1. Pulizia dell'email per evitare l'errore "invalid format"
    const cleanEmail = email.trim().toLowerCase();

    try {
      // 2. Chiamata alla funzione login del tuo AuthContext
      // Assicurati che nel contesto la funzione login usi supabase.auth.signInWithPassword
      const result = await login(cleanEmail, password);

      if (result.success) {
        onSuccess();
      } else {
        if (result.error?.includes("Invalid login credentials")) {
          setError("Account inesistente o password errata.");
        } else if (result.error?.includes("Email not confirmed")) {
          setError("Email non confermata. Controlla la tua casella di posta.");
        } else {
          setError(result.error || "Errore durante l'accesso.");
        }
      }
    } catch (err: any) {
      setError(err.message || "Errore imprevisto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-sm w-full mx-auto bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
            Accedi
          </h2>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            Bentornato su Bonus Match
          </p>
        </div>
        <button
          onClick={onCancel}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl border border-red-100 dark:border-red-900/50 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
            <span className="text-base">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">
            Email
          </label>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-blue-500 rounded-xl outline-none text-slate-900 dark:text-white text-sm font-medium transition-all"
            placeholder="mario@esempio.it"
            required
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center px-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em]">
              Password
            </label>
            <button
              type="button"
              onClick={onForgotPasswordClick}
              className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Ho dimenticato la password
            </button>
          </div>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-blue-500 rounded-xl outline-none text-slate-900 dark:text-white text-sm font-medium transition-all"
            placeholder="••••••••"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm uppercase tracking-widest rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-4 w-4 text-white"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Accesso...
            </span>
          ) : (
            "Entra"
          )}
        </button>

        <div className="text-center mt-5">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
            Non hai ancora un account?{" "}
            <button
              type="button"
              onClick={onRegisterClick}
              className="text-blue-600 dark:text-blue-400 font-bold hover:underline underline-offset-4"
            >
              Registrati
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
