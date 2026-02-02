import React, { useState, useEffect, useRef } from "react";
import { UserProfile } from "../types";
import { REGIONI, COMUNI_BY_REGIONE, ALL_COMUNI } from "../geoData";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabaseClient";

interface ProfileFormProps {
  onSubmit: (profile: UserProfile) => void;
  initialData?: UserProfile;
  buttonLabel?: string;
  mode?: "onboarding" | "update";
  isPremium?: boolean;
  onUpgrade?: () => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({
  onSubmit,
  initialData,
  buttonLabel = "Trova i miei Bonus →",
  mode = "onboarding",
  isPremium,
  onUpgrade,
}) => {
  // Inizializzazione sicura per evitare l'errore "controlled to uncontrolled"
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    email: "",
    nome: "",
    cognome: "",
    eta: 25,
    residenza: "",
    regione: "",
    componentiNucleo: undefined, // Era 1
    condizione: "lavoratore",
    abitazione: "affitto",
    composizione: "solo",
    numeroFigli: 0,
    fasceEtaFigli: [],
    iban: "",
    statoCivile: "celibe_nubile",
    cittadinanza: "Italiana",
    patrimonioImmobiliare: undefined, // Era 0
    targaAuto: "",
    speseSostenute: "",
    isee: undefined, // Era 0
  });

  const [filteredComuni, setFilteredComuni] = useState<string[]>([]);
  const [showComuniSuggestions, setShowComuniSuggestions] = useState(false);
  const [filteredRegioni, setFilteredRegioni] = useState<string[]>([]);
  const [showRegioniSuggestions, setShowRegioniSuggestions] = useState(false);

  const comuniRef = useRef<HTMLDivElement>(null);
  const regioniRef = useRef<HTMLDivElement>(null);

  // Sincronizza lo stato quando arrivano i dati iniziali (es. dopo il login)
  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        // Manteniamo i default di base (per evitare campi mancanti)
        ...prev,
        // Sovrascriviamo con i dati ricevuti
        ...initialData,
        // Forziamo i campi stringa per evitare null
        nome: initialData.nome || "",
        cognome: initialData.cognome || "",
        email: initialData.email || "",
        residenza: initialData.residenza || "",
        regione: initialData.regione || "",
      }));
    }
  }, [initialData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        comuniRef.current &&
        !comuniRef.current.contains(event.target as Node)
      ) {
        setShowComuniSuggestions(false);
      }
      if (
        regioniRef.current &&
        !regioniRef.current.contains(event.target as Node)
      ) {
        setShowRegioniSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalProfile = { ...formData } as UserProfile;

    try {
      // 1. Check Session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (session?.user) {
        // 2. Persist to Supabase
        const { error } = await supabase.from("profiles").upsert({
          id: session.user.id,
          email: session.user.email,
          nome: finalProfile.nome || "",
          cognome: finalProfile.cognome || "",
          eta: finalProfile.eta || 18,
          regione: finalProfile.regione || "",
          residenza: finalProfile.residenza || "",
          componenti_nucleo: finalProfile.componentiNucleo || 1,
          isee: finalProfile.isee || 0,
          condizione: finalProfile.condizione || "lavoratore",
          tipo_studente: finalProfile.tipoStudente || "",
          tipo_contratto: finalProfile.tipoContratto || "",
          abitazione: finalProfile.abitazione || "affitto",
          numero_figli: finalProfile.numeroFigli || 0,
          composizione: finalProfile.composizione || "solo",
          fasce_eta_figli: finalProfile.fasceEtaFigli || [],
          iban: finalProfile.iban || "",
          stato_civile: finalProfile.statoCivile || "celibe_nubile",
          cittadinanza: finalProfile.cittadinanza || "Italiana",
          patrimonio: finalProfile.patrimonioImmobiliare || 0,
          targa: finalProfile.targaAuto || "",
          spese: finalProfile.speseSostenute || "",
        });
      } else {
        localStorage.setItem("guest_profile", JSON.stringify(finalProfile));
      }
    } catch (err) {
      // Fallback to local
      localStorage.setItem("guest_profile", JSON.stringify(finalProfile));
    }

    onSubmit(finalProfile);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    let processedValue: any = value;

    if (
      [
        "eta",
        "componentiNucleo",
        "isee",
        "numeroFigli",
        "patrimonioImmobiliare",
      ].includes(name)
    ) {
      // Se vuoto torniamo undefined così l'input si svuota invece di segnare 0
      processedValue = value === "" ? undefined : Number(value);
    }

    setFormData((prev) => ({ ...prev, [name]: processedValue }));

    // Suggerimenti Geografici
    if (name === "residenza") {
      const sourceList =
        formData.regione && COMUNI_BY_REGIONE[formData.regione]
          ? COMUNI_BY_REGIONE[formData.regione]
          : ALL_COMUNI;
      if (value.length > 0) {
        const filtered = sourceList.filter((c) =>
          c.toLowerCase().includes(value.toLowerCase()),
        );
        setFilteredComuni(filtered.slice(0, 10)); // Limitiamo a 10 per performance
        setShowComuniSuggestions(true);
      } else setShowComuniSuggestions(false);
    }

    if (name === "regione") {
      if (value.length > 0) {
        const filtered = REGIONI.filter((r) =>
          r.toLowerCase().includes(value.toLowerCase()),
        );
        setFilteredRegioni(filtered);
        setShowRegioniSuggestions(true);
      } else setShowRegioniSuggestions(false);
    }
  };

  const handleAgeRangeToggle = (range: "0-3" | "4-17" | "18-25") => {
    setFormData((prev) => {
      const currentRanges = prev.fasceEtaFigli || [];
      return {
        ...prev,
        fasceEtaFigli: currentRanges.includes(range)
          ? currentRanges.filter((r) => r !== range)
          : [...currentRanges, range],
      };
    });
  };

  const handleSelectSuggestion = (name: string, value: string) => {
    if (name === "regione") {
      setFormData((prev) => ({ ...prev, regione: value, residenza: "" }));
      setShowRegioniSuggestions(false);
    } else if (name === "residenza") {
      setFormData((prev) => ({ ...prev, residenza: value }));
      setShowComuniSuggestions(false);
    }
  };

  const inputClasses =
    "w-full px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-left text-sm";
  const labelClasses =
    "block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-1.5 text-left ml-1";

  const showChildrenFields =
    formData.composizione === "coppia_con_figli" ||
    formData.composizione === "genitore_single";

  return (
    <motion.form
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
      onSubmit={handleSubmit}
      className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800/50 space-y-6 transition-colors"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 10 },
            show: { opacity: 1, y: 0 },
          }}
        >
          <label className={labelClasses}>Quanti anni hai?</label>
          <input
            type="number"
            name="eta"
            value={formData.eta ?? ""}
            onChange={handleChange}
            className={inputClasses}
            required
            min="14"
            max="120"
          />
        </motion.div>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 10 },
            show: { opacity: 1, y: 0 },
          }}
          className="relative"
          ref={regioniRef}
        >
          <label className={labelClasses}>Regione</label>
          <input
            type="text"
            name="regione"
            value={formData.regione || ""}
            onChange={handleChange}
            placeholder="Es. Lombardia"
            className={inputClasses}
            autoComplete="off"
            required
          />
          {showRegioniSuggestions && filteredRegioni.length > 0 && (
            <div className="absolute z-10 w-full mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 max-h-60 overflow-y-auto">
              {filteredRegioni.map((reg, index) => (
                <div
                  key={index}
                  onClick={() => handleSelectSuggestion("regione", reg)}
                  className="px-6 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  {reg}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 10 },
            show: { opacity: 1, y: 0 },
          }}
          className="relative"
          ref={comuniRef}
        >
          <label className={labelClasses}>Città di residenza</label>
          <input
            type="text"
            name="residenza"
            value={formData.residenza || ""}
            onChange={handleChange}
            placeholder="Es. Milano, Roma..."
            className={inputClasses}
            autoComplete="off"
            required
          />
          {showComuniSuggestions && filteredComuni.length > 0 && (
            <div className="absolute z-10 w-full mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 max-h-60 overflow-y-auto">
              {filteredComuni.map((com, index) => (
                <div
                  key={index}
                  onClick={() => handleSelectSuggestion("residenza", com)}
                  className="px-6 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  {com}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 10 },
            show: { opacity: 1, y: 0 },
          }}
        >
          <label className={labelClasses}>Composizione nucleo familiare</label>
          <select
            name="composizione"
            value={formData.composizione || "solo"}
            onChange={handleChange}
            placeholder="0"
            className={inputClasses}
            required
          >
            <option value="solo">Vivo da solo</option>
            <option value="coppia_senza_figli">Coppia senza figli</option>
            <option value="coppia_con_figli">Coppia con figli</option>
            <option value="genitore_single">Genitore single</option>
            <option value="con_genitori">Vivo con i genitori</option>
          </select>
        </motion.div>

        {showChildrenFields && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            <div>
              <label className={labelClasses}>Quanti figli hai?</label>
              <input
                type="number"
                name="numeroFigli"
                value={formData.numeroFigli ?? ""}
                onChange={handleChange}
                className={inputClasses}
                required={showChildrenFields}
                min="1"
              />
            </div>
            <div>
              <label className={labelClasses}>
                Fascia età figli (Seleziona tutte)
              </label>
              <div className="flex flex-wrap gap-3 mt-2">
                {["0-3", "4-17", "18-25"].map((range) => (
                  <button
                    type="button"
                    key={range}
                    onClick={() => handleAgeRangeToggle(range as any)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${(formData.fasceEtaFigli || []).includes(range as any) ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30" : "bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-50"}`}
                  >
                    {range} anni
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 10 },
            show: { opacity: 1, y: 0 },
          }}
        >
          <label className={labelClasses}>Componenti nucleo familiare</label>
          <input
            type="number"
            name="componentiNucleo"
            value={formData.componentiNucleo ?? ""}
            onChange={handleChange}
            className={inputClasses}
            placeholder="0"
            required
            min="0"
          />
        </motion.div>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 10 },
            show: { opacity: 1, y: 0 },
          }}
        >
          <label className={labelClasses}>ISEE (Valore stimato)</label>
          <input
            type="number"
            name="isee"
            value={formData.isee ?? ""}
            onChange={handleChange}
            placeholder="Opzionale"
            className={inputClasses}
            min=""
            max="100000"
          />
        </motion.div>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 10 },
            show: { opacity: 1, y: 0 },
          }}
        >
          <label className={labelClasses}>Condizione attuale</label>
          <select
            name="condizione"
            value={formData.condizione || "lavoratore"}
            onChange={handleChange}
            className={inputClasses}
          >
            <option value="studente">Studente</option>
            <option value="lavoratore">Lavoratore</option>
            <option value="disoccupato">Disoccupato</option>
            <option value="pensionato">Pensionato</option>
          </select>
        </motion.div>

        {formData.condizione === "studente" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <label className={labelClasses}>Che tipo di studente sei?</label>
            <select
              name="tipoStudente"
              value={formData.tipoStudente || ""}
              onChange={handleChange}
              className={inputClasses}
              required={formData.condizione === "studente"}
            >
              <option value="">Seleziona...</option>
              <option value="scuola">Scuola</option>
              <option value="universita">Università</option>
              <option value="its_afam">ITS / AFAM</option>
            </select>
          </motion.div>
        )}

        {formData.condizione === "lavoratore" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <label className={labelClasses}>Che tipo di contratto hai?</label>
            <select
              name="tipoContratto"
              value={formData.tipoContratto || ""}
              onChange={handleChange}
              className={inputClasses}
            >
              <option value="">Seleziona...</option>
              <option value="indeterminato">Tempo Indeterminato</option>
              <option value="determinato">Tempo Determinato</option>
              <option value="piva">Partita IVA</option>
              <option value="apprendistato">Apprendistato</option>
            </select>
          </motion.div>
        )}

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 10 },
            show: { opacity: 1, y: 0 },
          }}
        >
          <label className={labelClasses}>Situazione Casa</label>
          <select
            name="abitazione"
            value={formData.abitazione || "affitto"}
            onChange={handleChange}
            className={inputClasses}
          >
            <option value="affitto">In Affitto</option>
            <option value="proprietà">Di Proprietà</option>
            <option value="genitori">Con i Genitori</option>
          </select>
        </motion.div>

        {mode === "update" && (
          <>
            <div className="md:col-span-2 pt-8 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-3">
                Dati Aggiuntivi
                {!isPremium && (
                  <span className="bg-yellow-400/20 text-yellow-600 dark:text-yellow-400 text-[10px] px-2 py-0.5 rounded-md border border-yellow-400/30 uppercase tracking-widest">
                    Premium
                  </span>
                )}
              </h3>
            </div>
            <div className="md:col-span-2 relative">
              <div
                className={`grid grid-cols-1 md:grid-cols-2 gap-8 transition-all duration-500 ${!isPremium ? "filter blur-md opacity-40 pointer-events-none select-none" : ""}`}
              >
                <div>
                  <label className={labelClasses}>Stato Civile Legale</label>
                  <select
                    name="statoCivile"
                    value={formData.statoCivile || "celibe_nubile"}
                    onChange={handleChange}
                    className={inputClasses}
                  >
                    <option value="celibe_nubile">Celibe / Nubile</option>
                    <option value="coniugato">Coniugato/a</option>
                    <option value="separato">Separato/a</option>
                    <option value="divorziato">Divorziato/a</option>
                    <option value="vedovo">Vedovo/a</option>
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>Cittadinanza</label>
                  <input
                    type="text"
                    name="cittadinanza"
                    value={formData.cittadinanza || ""}
                    onChange={handleChange}
                    placeholder="Es. Italiana"
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses}>IBAN (Per accrediti)</label>
                  <input
                    type="text"
                    name="iban"
                    value={formData.iban || ""}
                    onChange={handleChange}
                    placeholder="IT00..."
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses}>Targa Auto</label>
                  <input
                    type="text"
                    name="targaAuto"
                    value={formData.targaAuto || ""}
                    onChange={handleChange}
                    placeholder="AA000AA"
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses}>
                    Patrimonio Immobiliare (€)
                  </label>
                  <input
                    type="number"
                    name="patrimonioImmobiliare"
                    value={formData.patrimonioImmobiliare ?? ""}
                    onChange={handleChange}
                    className={inputClasses}
                    min="0"
                  />
                </div>
              </div>
              {!isPremium && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center -mt-10">
                  <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 flex flex-col items-center max-w-sm text-center transform transition-transform hover:scale-105 duration-300">
                    <div className="h-14 w-14 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center mb-4">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-7 w-7 text-white"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <h4 className="text-xl font-black text-slate-800 dark:text-white mb-2">
                      Dati Avanzati Bloccati
                    </h4>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                      Sblocca IBAN, Targa, Patrimonio e altri campi per match
                      più precisi.
                    </p>
                    <button
                      type="button"
                      onClick={onUpgrade}
                      className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg"
                    >
                      Sblocca con Premium
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <motion.div
        variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
        className="pt-4 flex justify-center"
      >
        <button
          type="submit"
          className="w-full max-w-md bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-widest py-3 rounded-xl shadow-lg active:scale-95 text-sm"
        >
          {buttonLabel}
        </button>
      </motion.div>

      <div className="flex flex-col items-center justify-center gap-2 pt-3 border-t border-slate-50 dark:border-slate-800">
        <div className="flex items-center gap-1.5 text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-[0.1em]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <span>Privacy-First: I tuoi dati restano sul dispositivo</span>
        </div>
      </div>
    </motion.form>
  );
};

export default ProfileForm;
