import React, { useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { AUTH_STYLES, FormHeader, MessageBox, FormField, FormFooterLink, Spinner } from "./authStyles";

// ═══════════════════════════════════════════════════════════════════════
// TIPI
// ═══════════════════════════════════════════════════════════════════════
interface LoginFormProps {
  onSuccess: () => void;
  onRegisterClick: () => void;
  onForgotPasswordClick: () => void;
  onCancel: () => void;
}

// ═══════════════════════════════════════════════════════════════════════
// MAPPATURA ERRORI - Traduce errori Supabase in messaggi user-friendly
// ═══════════════════════════════════════════════════════════════════════
const ERROR_MAP: Record<string, string> = {
  "Invalid login credentials": "Account inesistente o password errata.",
  "Email not confirmed": "Email non confermata. Controlla la tua casella di posta.",
};

const getErrorMessage = (error?: string): string => {
  if (!error) return "Errore durante l'accesso.";
  for (const [key, msg] of Object.entries(ERROR_MAP)) {
    if (error.includes(key)) return msg;
  }
  return error;
};

// ═══════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPALE
// ═══════════════════════════════════════════════════════════════════════
const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onRegisterClick, onForgotPasswordClick, onCancel }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const result = await login(email.trim().toLowerCase(), password);
      
      if (result.success) {
        onSuccess();
      } else {
        setError(getErrorMessage(result.error));
      }
    } catch (err: any) {
      setError(err.message || "Errore imprevisto.");
    } finally {
      setIsSubmitting(false);
    }
  }, [email, password, login, onSuccess]);

  return (
    <div className={AUTH_STYLES.container}>
      <FormHeader title="Accedi" subtitle="Bentornato su Bonus Match" onClose={onCancel} />

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <MessageBox type="error" message={error} />}

        <FormField
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="mario@esempio.it"
          autoComplete="email"
          required
        />

        <FormField
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          autoComplete="current-password"
          required
          rightLabel={
            <button type="button" onClick={onForgotPasswordClick} className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline">
              Ho dimenticato la password
            </button>
          }
        />

        <button type="submit" disabled={isSubmitting} className={AUTH_STYLES.submitBtn}>
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner />
              Accesso...
            </span>
          ) : "Entra"}
        </button>

        <FormFooterLink text="Non hai ancora un account?" linkText="Registrati" onClick={onRegisterClick} />
      </form>
    </div>
  );
};

export default LoginForm;
