import React, { useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { AUTH_STYLES, FormHeader, MessageBox, FormField, FormFooterLink, Spinner } from "./authStyles";

// ═══════════════════════════════════════════════════════════════════════
// TIPI
// ═══════════════════════════════════════════════════════════════════════
interface ForgotPasswordFormProps {
  onCancel: () => void;
  onLoginClick: () => void;
}

// ═══════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPALE
// ═══════════════════════════════════════════════════════════════════════
const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onCancel, onLoginClick }) => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const result = await resetPassword(email);
      
      if (result.success) {
        setMessage("Se l'email è registrata, riceverai un link per reimpostare la password.");
      } else {
        setError(result.error || "Errore durante l'invio della richiesta.");
      }
    } catch (err: any) {
      setError(err.message || "Errore imprevisto.");
    } finally {
      setIsSubmitting(false);
    }
  }, [email, resetPassword]);

  return (
    <div className={AUTH_STYLES.container}>
      <FormHeader title="Recupera Password" subtitle="Reimposta la tua chiave d'accesso" onClose={onCancel} />

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <MessageBox type="error" message={error} />}
        {message && <MessageBox type="success" message={message} />}

        <FormField
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="mario@esempio.it"
          autoComplete="email"
          required
          disabled={isSubmitting}
        />

        <button type="submit" disabled={isSubmitting} className={AUTH_STYLES.submitBtn}>
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner />
              Invio...
            </span>
          ) : "Invia Link di Reset"}
        </button>

        <FormFooterLink text="Ti sei ricordato la password?" linkText="Accedi" onClick={onLoginClick} />
      </form>
    </div>
  );
};

export default ForgotPasswordForm;
