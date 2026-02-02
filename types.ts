export type Condition =
  | "studente"
  | "lavoratore"
  | "disoccupato"
  | "pensionato";
export type Housing = "affitto" | "proprietà" | "genitori";
export type Children = "si" | "no";
export type FamilyComposition =
  | "solo"
  | "coppia_senza_figli"
  | "coppia_con_figli"
  | "genitore_single"
  | "con_genitori";
export type ChildAgeRange = "0-3" | "4-17" | "18-25";
export type StudentType = "scuola" | "universita" | "its_afam";
export type WorkerType =
  | "indeterminato"
  | "determinato"
  | "piva"
  | "apprendistato";

export type CivilStatus =
  | "celibe_nubile"
  | "coniugato"
  | "separato"
  | "divorziato"
  | "vedovo";

export interface UserProfile {
  email: string;
  password: string;
  nome: string;
  cognome: string;
  eta: number;
  residenza: string;
  componentiNucleo: number;
  isee?: number;
  regione?: string;
  condizione: Condition;
  tipoStudente?: StudentType;
  tipoContratto?: WorkerType;
  abitazione: Housing;
  figli?: Children;
  numeroFigli?: number;
  composizione?: FamilyComposition;
  fasceEtaFigli?: ChildAgeRange[];
  // Campi avanzati
  iban?: string;
  statoCivile?: CivilStatus;
  cittadinanza?: string;
  patrimonioImmobiliare?: number;
  targaAuto?: string;
  speseSostenute?: string;
}

export type BonusStatus = "attivo" | "in arrivo" | "ottenuto" | "scaduto";

export type BonusCategory =
  | "Studio"
  | "Casa"
  | "Energia"
  | "Famiglia"
  | "Lavoro"
  | "Giovani"
  | "Salute"
  | "Mobilità"
  | "Sostegno al reddito"
  | "Sport";

export interface Bonus {
  id: string;
  titolo: string;
  descrizione: string;
  valoreEsimato: number;
  status: BonusStatus;
  scadenza?: string;
  difficolta: "bassa" | "media" | "alta";
  requisiti: string[];
  documenti: string[];
  linkPortale: string;
  tempistica: string;
  procedura: string[]; // Nuovo campo per descrivere il processo di richiesta
  categoria: BonusCategory;
}

export interface MatchResult {
  bonusId: string;
  eligible: boolean;
  reason: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  profile?: UserProfile;
  results?: MatchResult[];
  isPremium?: boolean;
}

export type AppView =
  | { type: "form" }
  | { type: "dashboard"; profile: UserProfile; results: MatchResult[] }
  | { type: "search"; profile: UserProfile; results: MatchResult[] }
  | { type: "settings"; profile: UserProfile; results: MatchResult[] }
  | { type: "calendar"; profile: UserProfile }
  | { type: "documents"; profile: UserProfile }
  | { type: "saved"; profile: UserProfile; results: MatchResult[] }
  | {
      type: "detail";
      bonusId: string;
      profile: UserProfile;
      results: MatchResult[];
      prevView: "dashboard" | "search" | "saved";
    }
  | { type: "login" }
  | { type: "register" }
  | { type: "post-register" }
  | { type: "forgot-password" };
