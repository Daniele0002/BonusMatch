import React, { useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { AUTH_STYLES, FormHeader, MessageBox, FormField, FormFooterLink, Spinner } from "./authStyles";

// ═══════════════════════════════════════════════════════════════════════
// TIPI
// ═══════════════════════════════════════════════════════════════════════
interface RegisterFormProps {
  onSuccess: () => void;
  onLoginClick: () => void;
  onCancel: () => void;
}

// ═══════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPALE
// ═══════════════════════════════════════════════════════════════════════
const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onLoginClick, onCancel }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validazione password
    if (password !== confirmPassword) {
      setError("Le password non coincidono.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Registrazione su Supabase Auth
      const result = await register(email, password);
      if (!result.success) {
        throw new Error(result.error || "Errore durante la creazione dell'account.");
      }

      // 2. Salva profilo con nome/cognome
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from("profiles").upsert({
          id: session.user.id,
          email,
          nome: firstName,
          cognome: lastName,
        });
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Registrazione fallita");
    } finally {
      setIsSubmitting(false);
    }
  }, [firstName, lastName, email, password, confirmPassword, register, onSuccess]);

  return (
    <div className={AUTH_STYLES.container}>
      <FormHeader title="Crea Account" onClose={onCancel} />

      <form onSubmit={handleSubmit} className="space-y-3">
        {error && <MessageBox type="error" message={error} />}

        {/* Nome e Cognome in griglia */}
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Nome" value={firstName} onChange={setFirstName} placeholder="Mario" required />
          <FormField label="Cognome" value={lastName} onChange={setLastName} placeholder="Rossi" required />
        </div>

        <FormField label="Email" type="email" value={email} onChange={setEmail} placeholder="nome@esempio.com" autoComplete="email" required />
        <FormField label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" autoComplete="new-password" required minLength={6} />
        <FormField label="Conferma Password" type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="••••••••" autoComplete="new-password" required minLength={6} />

        <button type="submit" disabled={isSubmitting} className={AUTH_STYLES.submitBtn}>
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner />
              Creazione account...
            </span>
          ) : "Registrati"}
        </button>

        <FormFooterLink text="Hai già un account?" linkText="Accedi qui" onClick={onLoginClick} />
      </form>
    </div>
  );
};

export default RegisterForm;
