import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";

interface RegisterFormProps {
  onSuccess: () => void;
  onLoginClick: () => void;
  onCancel: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  onLoginClick,
  onCancel,
}) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const { register } = useAuth(); // Questa funzione deve accettare email e password
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Le password non coincidono.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Registrazione su Supabase Auth tramite il contesto
      const result = await register(email, password);

      if (!result.success) {
        throw new Error(
          result.error || "Errore durante la creazione dell'account.",
        );
      }

      // 2. Salvataggio immediato di Nome e Cognome nella tabella profiles
      // Recuperiamo l'utente appena creato
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: session.user.id,
          email: email,
          nome: firstName,
          cognome: lastName,
        });

        if (profileError) {
          // Non blocchiamo l'onSuccess perché l'account è comunque creato
        }
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Registrazione fallita");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-sm w-full mx-auto bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
          Crea Account
        </h2>
        <button
          onClick={onCancel}
          className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-slate-400"
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

      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <div className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-lg border border-red-100 flex items-center gap-2">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-600 dark:text-slate-400 ml-0.5 uppercase tracking-wide">
              Nome
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:border-blue-500 text-slate-900 dark:text-white text-sm outline-none transition-colors"
              placeholder="Mario"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-600 dark:text-slate-400 ml-0.5 uppercase tracking-wide">
              Cognome
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:border-blue-500 text-slate-900 dark:text-white text-sm outline-none transition-colors"
              placeholder="Rossi"
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-600 dark:text-slate-400 ml-0.5 uppercase tracking-wide">
            Email
          </label>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:border-blue-500 text-slate-900 dark:text-white text-sm outline-none transition-colors"
            placeholder="nome@esempio.com"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-600 dark:text-slate-400 ml-0.5 uppercase tracking-wide">
            Password
          </label>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:border-blue-500 text-slate-900 dark:text-white text-sm outline-none transition-colors"
            placeholder="••••••••"
            required
            minLength={6}
          />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-600 dark:text-slate-400 ml-0.5 uppercase tracking-wide">
            Conferma Password
          </label>
          <input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:border-blue-500 text-slate-900 dark:text-white text-sm outline-none transition-colors"
            placeholder="••••••••"
            required
            minLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm rounded-lg shadow-lg active:scale-[0.98] disabled:opacity-70 transition-all"
        >
          {isSubmitting ? "Creazione account..." : "Registrati"}
        </button>

        <div className="text-center mt-4">
          <p className="text-slate-500 dark:text-slate-400 text-xs">
            Hai già un account?{" "}
            <button
              type="button"
              onClick={onLoginClick}
              className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
            >
              Accedi qui
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;
