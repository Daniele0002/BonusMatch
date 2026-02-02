import React from 'react';
import ProfileForm from '../ProfileForm';
import { UserProfile } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

interface PostRegistrationFormProps {
  onComplete: (profile: UserProfile) => void;
}

const PostRegistrationForm: React.FC<PostRegistrationFormProps> = ({ onComplete }) => {
  const { user } = useAuth();

  // Prepariamo i dati iniziali recuperandoli dal contesto Auth
  // In questo modo Nome e Cognome inseriti in fase di registrazione sono già nel form
  const initialData: Partial<UserProfile> = {
    nome: user?.firstName || '',
    cognome: user?.lastName || '',
    email: user?.email || '',
  };

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="text-center mb-10">
        <div className="inline-block px-5 py-2 mb-6 rounded-full bg-green-50 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-[10px] font-black uppercase tracking-widest border border-green-100 dark:border-green-800">
            Account Creato con Successo
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-slate-800 dark:text-white mb-6 tracking-tighter leading-tight">
          Benvenuto! <br/> <span className="text-blue-600">Completa il tuo profilo.</span>
        </h2>
        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-xl mx-auto font-medium leading-relaxed">
           Inserisci i tuoi dati per permettere alla nostra AI di trovare subito i bonus su misura per te.
        </p>
      </div>

      <ProfileForm 
        onSubmit={onComplete} 
        initialData={initialData as UserProfile} // Passiamo i dati iniziali
        buttonLabel="Salva e vai alla Dashboard →"
        mode="onboarding"
      />
      
      <div className="mt-8 text-center">
        <p className="text-sm text-slate-400 font-medium italic">
          Puoi aggiornare questi dati in qualsiasi momento dalle impostazioni.
        </p>
      </div>
    </div>
  );
};

export default PostRegistrationForm;