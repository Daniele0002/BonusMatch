import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";

interface ForgotPasswordFormProps {
  onCancel: () => void;
  onLoginClick: () => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onCancel,
  onLoginClick,
}) => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const result = await resetPassword(email);
      if (result.success) {
        setMessage(
          "Se l'email è registrata, riceverai un link per reimpostare la password.",
        );
      } else {
        setError(result.error || "Errore durante l'invio della richiesta.");
      }
    } catch (err: any) {
      setError(err.message || "Errore imprevisto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">
            Recupera Password
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
            Reimposta la tua chiave d'accesso
          </p>
        </div>
        <button
          onClick={onCancel}
          className="p-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold rounded-2xl border border-red-100 dark:border-red-900/50 flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
            <span className="text-xl">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm font-bold rounded-2xl border border-green-100 dark:border-green-900/50 flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
            <span className="text-xl">✅</span>
            <span>{message}</span>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
            Email
          </label>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none text-slate-900 dark:text-white font-bold transition-all"
            placeholder="mario@esempio.it"
            required
            disabled={isSubmitting}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5 text-white"
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
              Invio...
            </span>
          ) : (
            "Invia Link di Reset"
          )}
        </button>

        <div className="text-center mt-8">
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
            Ti sei ricordato la password?{" "}
            <button
              type="button"
              onClick={onLoginClick}
              className="text-blue-600 dark:text-blue-400 font-black hover:underline underline-offset-4"
            >
              Accedi
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};

export default ForgotPasswordForm;
