import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserProfile, Bonus, MatchResult } from "../types";

// ═══════════════════════════════════════════════════════════════════════════════
// TIPI E COSTANTI
// ═══════════════════════════════════════════════════════════════════════════════
interface FamilyMember {
  id: string;
  nome: string;
  relazione: "coniuge" | "figlio" | "genitore" | "altro";
  eta: number;
  condizione: string;
  isee?: number;
}

interface FamilyModeViewProps {
  profile?: UserProfile;
  bonuses: Bonus[];
  results: MatchResult[];
  isPremium?: boolean;
  onUpgrade: () => void;
  onSelectBonus: (id: string) => void;
}

const RELAZIONI = [
  { value: "coniuge", label: "Coniuge/Partner" },
  { value: "figlio", label: "Figlio/a" },
  { value: "genitore", label: "Genitore" },
  { value: "altro", label: "Altro familiare" },
] as const;

const CONDIZIONI = [
  { value: "lavoratore_dipendente", label: "Lavoratore dipendente" },
  { value: "lavoratore_autonomo", label: "Lavoratore autonomo" },
  { value: "disoccupato", label: "Disoccupato" },
  { value: "pensionato", label: "Pensionato" },
  { value: "studente", label: "Studente" },
  { value: "casalingo", label: "Casalingo/a" },
  { value: "minore", label: "Minore" },
] as const;

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPALE
// ═══════════════════════════════════════════════════════════════════════════════
const FamilyModeView: React.FC<FamilyModeViewProps> = ({
  profile,
  bonuses,
  results,
  isPremium,
  onUpgrade,
  onSelectBonus,
}) => {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [newMember, setNewMember] = useState<Partial<FamilyMember>>({
    relazione: "figlio",
    condizione: "studente",
  });

  // Calcola bonus per membro famiglia (semplificato)
  const getBonusesForMember = (member: FamilyMember): Bonus[] => {
    return bonuses.filter((bonus) => {
      // Logica semplificata per demo - in produzione usare AI/matching reale
      if (member.condizione === "studente" && bonus.categoria === "Studio") return true;
      if (member.condizione === "disoccupato" && bonus.categoria === "Lavoro") return true;
      if (member.eta < 18 && bonus.titolo.toLowerCase().includes("minori")) return true;
      if (member.eta >= 65 && bonus.categoria === "Salute") return true;
      if (member.condizione === "minore" && bonus.categoria === "Famiglia") return true;
      return false;
    }).slice(0, 3);
  };

  // Bonus condivisi per tutta la famiglia
  const sharedBonuses = bonuses.filter((b) => 
    b.categoria === "Famiglia" || 
    b.titolo.toLowerCase().includes("famiglia") ||
    b.titolo.toLowerCase().includes("nucleo")
  ).slice(0, 5);

  const handleAddMember = () => {
    if (!newMember.nome || !newMember.eta) return;
    
    const member: FamilyMember = {
      id: Date.now().toString(),
      nome: newMember.nome,
      relazione: newMember.relazione as FamilyMember["relazione"],
      eta: newMember.eta,
      condizione: newMember.condizione || "altro",
    };
    
    setFamilyMembers([...familyMembers, member]);
    setNewMember({ relazione: "figlio", condizione: "studente" });
    setShowAddForm(false);
  };

  const handleRemoveMember = (id: string) => {
    setFamilyMembers(familyMembers.filter((m) => m.id !== id));
    if (selectedMemberId === id) setSelectedMemberId(null);
  };

  const getRelazioneIcon = (relazione: string) => {
    switch (relazione) {
      case "coniuge": return "💑";
      case "figlio": return "👶";
      case "genitore": return "👴";
      default: return "👤";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Sezione */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        
        <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight mb-2">
          Bonus per tutta la Famiglia
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xl mx-auto">
          Aggiungi i membri del tuo nucleo familiare e scopri tutti i bonus a cui avete diritto insieme
        </p>
      </motion.div>

      {/* Premium Gate - Solo per utenti non premium con più di 1 membro */}
      {!isPremium && familyMembers.length >= 2 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-yellow-200 dark:border-yellow-800"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-yellow-400 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-400/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-900" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-yellow-900 dark:text-yellow-200">Sblocca Family Mode completo</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-400">Aggiungi membri illimitati e accedi all'analisi AI personalizzata per ogni familiare</p>
            </div>
            <button
              onClick={onUpgrade}
              className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-md"
            >
              Upgrade
            </button>
          </div>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Colonna Membri Famiglia */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <span className="text-lg">👥</span>
                Nucleo Familiare
              </h3>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                {familyMembers.length + 1} membri
              </span>
            </div>

            <div className="p-4 space-y-3">
              {/* Utente principale */}
              <motion.div
                onClick={() => setSelectedMemberId(null)}
                className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedMemberId === null
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-slate-200 dark:border-slate-700 hover:border-blue-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {profile?.nome?.charAt(0) || "TU"}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white text-sm">
                      {profile?.nome || "Tu"} {profile?.cognome || ""}
                    </p>
                    <p className="text-xs text-slate-500">Titolare</p>
                  </div>
                  <div className="ml-auto bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">
                      {results.length} bonus
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Membri aggiunti */}
              <AnimatePresence>
                {familyMembers.map((member) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    onClick={() => setSelectedMemberId(member.id)}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all group ${
                      selectedMemberId === member.id
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                        : "border-slate-200 dark:border-slate-700 hover:border-purple-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-xl">
                        {getRelazioneIcon(member.relazione)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 dark:text-white text-sm truncate">
                          {member.nome}
                        </p>
                        <p className="text-xs text-slate-500 capitalize">
                          {RELAZIONI.find((r) => r.value === member.relazione)?.label} • {member.eta} anni
                        </p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveMember(member.id); }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-all"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Form Aggiungi Membro */}
              <AnimatePresence>
                {showAddForm ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 space-y-3"
                  >
                    <input
                      type="text"
                      placeholder="Nome"
                      value={newMember.nome || ""}
                      onChange={(e) => setNewMember({ ...newMember, nome: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Età"
                        value={newMember.eta || ""}
                        onChange={(e) => setNewMember({ ...newMember, eta: parseInt(e.target.value) })}
                        className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                      <select
                        value={newMember.relazione}
                        onChange={(e) => setNewMember({ ...newMember, relazione: e.target.value as any })}
                        className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                      >
                        {RELAZIONI.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </div>
                    <select
                      value={newMember.condizione}
                      onChange={(e) => setNewMember({ ...newMember, condizione: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    >
                      {CONDIZIONI.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddMember}
                        className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                      >
                        Aggiungi
                      </button>
                      <button
                        onClick={() => setShowAddForm(false)}
                        className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                      >
                        Annulla
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => {
                      if (!isPremium && familyMembers.length >= 2) {
                        onUpgrade();
                      } else {
                        setShowAddForm(true);
                      }
                    }}
                    className="w-full p-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400 transition-all flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs font-bold uppercase tracking-wider">Aggiungi Membro</span>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Colonna Bonus */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bonus del membro selezionato */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <span className="text-lg">🎯</span>
                {selectedMemberId 
                  ? `Bonus per ${familyMembers.find((m) => m.id === selectedMemberId)?.nome}`
                  : "I tuoi Bonus personali"
                }
              </h3>
            </div>
            <div className="p-4">
              {selectedMemberId ? (
                <div className="grid gap-3">
                  {getBonusesForMember(familyMembers.find((m) => m.id === selectedMemberId)!).length > 0 ? (
                    getBonusesForMember(familyMembers.find((m) => m.id === selectedMemberId)!).map((bonus) => (
                      <BonusCard key={bonus.id} bonus={bonus} onClick={() => onSelectBonus(bonus.id)} />
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      <span className="text-4xl mb-2 block">🔍</span>
                      <p className="text-sm font-medium">Nessun bonus specifico trovato</p>
                      <p className="text-xs">Prova a modificare i dati del membro</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid gap-3">
                  {results.slice(0, 4).map((result) => {
                    const bonus = bonuses.find((b) => b.id === result.bonusId);
                    if (!bonus) return null;
                    return <BonusCard key={bonus.id} bonus={bonus} eligible={result.eligible} onClick={() => onSelectBonus(bonus.id)} />;
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Bonus Famiglia Condivisi */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl border border-purple-200 dark:border-purple-800 overflow-hidden">
            <div className="p-4 border-b border-purple-100 dark:border-purple-800">
              <h3 className="font-bold text-purple-800 dark:text-purple-200 flex items-center gap-2">
                <span className="text-lg">👨‍👩‍👧‍👦</span>
                Bonus per tutto il Nucleo Familiare
              </h3>
            </div>
            <div className="p-4 grid sm:grid-cols-2 gap-3">
              {sharedBonuses.map((bonus) => (
                <BonusCard key={bonus.id} bonus={bonus} variant="family" onClick={() => onSelectBonus(bonus.id)} />
              ))}
              {sharedBonuses.length === 0 && (
                <div className="col-span-2 text-center py-8 text-purple-400">
                  <span className="text-4xl mb-2 block">📋</span>
                  <p className="text-sm font-medium">Nessun bonus famiglia disponibile</p>
                </div>
              )}
            </div>
          </div>

          {/* Statistiche Famiglia */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard 
              icon="💰" 
              label="Valore Totale Potenziale" 
              value={`€${(results.length * 500 + familyMembers.length * 300).toLocaleString()}`}
              color="green"
            />
            <StatCard 
              icon="📊" 
              label="Bonus Totali Disponibili" 
              value={`${results.length + familyMembers.length * 2}`}
              color="blue"
            />
            <StatCard 
              icon="✅" 
              label="Bonus Compatibili" 
              value={`${results.filter(r => r.eligible).length}`}
              color="purple"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTI AUSILIARI
// ═══════════════════════════════════════════════════════════════════════════════

interface BonusCardProps {
  bonus: Bonus;
  eligible?: boolean;
  variant?: "default" | "family";
  onClick: () => void;
}

const BonusCard: React.FC<BonusCardProps> = ({ bonus, eligible, variant = "default", onClick }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`w-full p-4 rounded-xl border text-left transition-all ${
      variant === "family"
        ? "bg-white/80 dark:bg-slate-900/80 border-purple-200 dark:border-purple-700 hover:border-purple-400"
        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400"
    }`}
  >
    <div className="flex items-start gap-3">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-lg shrink-0 ${
        variant === "family" ? "bg-purple-100 dark:bg-purple-900/30" : "bg-blue-100 dark:bg-blue-900/30"
      }`}>
        {bonus.categoria === "Famiglia" ? "👨‍👩‍👧" : bonus.categoria === "Studio" ? "📚" : bonus.categoria === "Lavoro" ? "💼" : "💶"}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-slate-800 dark:text-white text-sm truncate">{bonus.titolo}</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{bonus.descrizione}</p>
      </div>
      {eligible !== undefined && (
        <div className={`px-2 py-1 rounded-full text-[10px] font-bold ${
          eligible ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
          "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
        }`}>
          {eligible ? "Idoneo" : "Non idoneo"}
        </div>
      )}
    </div>
  </motion.button>
);

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  color: "green" | "blue" | "purple";
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => {
  const colors = {
    green: "from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800",
    blue: "from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800",
    purple: "from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800",
  };
  
  const textColors = {
    green: "text-green-700 dark:text-green-400",
    blue: "text-blue-700 dark:text-blue-400",
    purple: "text-purple-700 dark:text-purple-400",
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-xl border p-4 text-center`}>
      <span className="text-2xl block mb-1">{icon}</span>
      <p className={`text-lg font-black ${textColors[color]}`}>{value}</p>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
    </div>
  );
};

export default FamilyModeView;
