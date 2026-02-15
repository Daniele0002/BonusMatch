import React, { useRef } from "react";
import { motion, Variants } from "framer-motion";
import ProfileForm from "./ProfileForm";
import { UserProfile } from "../types";

interface LandingPageProps {
  onSubmit: (profile: UserProfile) => void;
  onShowPremium: () => void;
}

// Animazione per elementi che appaiono in scroll
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

// Icone SVG
const Icons = {
  search: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />,
  sparkles: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />,
  check: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />,
  clock: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
  document: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  users: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />,
  shield: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
  euro: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 15.536c-1.171 1.952-3.07 1.952-4.242 0-1.172-1.953-1.172-5.119 0-7.072 1.171-1.952 3.07-1.952 4.242 0M8 10.5h4m-4 3h4" />,
  lightning: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />,
  heart: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />,
  star: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />,
  arrowDown: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />,
};

const Icon: React.FC<{ path: React.ReactNode; className?: string }> = ({ path, className = "h-6 w-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">{path}</svg>
);

// Dati delle feature
const FEATURES = [
  { icon: Icons.sparkles, title: "AI Intelligente", description: "Il nostro algoritmo analizza il tuo profilo e trova i bonus più adatti a te in pochi secondi." },
  { icon: Icons.clock, title: "Risparmia Tempo", description: "Niente più ore a cercare tra siti governativi. Tutto quello che ti serve in un unico posto." },
  { icon: Icons.euro, title: "Massimizza i Benefici", description: "Non perdere nessuna opportunità. Ti mostriamo tutti i bonus a cui hai diritto." },
  { icon: Icons.document, title: "Guide Step-by-Step", description: "Istruzioni chiare e dettagliate per ogni bonus, dalla domanda all'erogazione." },
  { icon: Icons.shield, title: "Dati Sicuri", description: "I tuoi dati sono al sicuro. Non condividiamo mai le tue informazioni con terzi." },
  { icon: Icons.users, title: "Family Mode", description: "Gestisci i bonus per tutta la famiglia da un unico account Premium." },
];

const STEPS = [
  { num: "01", title: "Compila il Profilo", description: "Inserisci i tuoi dati: età, reddito, situazione familiare e lavorativa." },
  { num: "02", title: "Analisi AI", description: "Il nostro algoritmo analizza oltre 100 bonus statali e regionali in tempo reale." },
  { num: "03", title: "Risultati Personalizzati", description: "Ricevi la lista dei bonus compatibili con il tuo profilo, ordinati per importanza." },
  { num: "04", title: "Richiedi i Bonus", description: "Segui le guide passo-passo per presentare domanda e ottenere i tuoi benefici." },
];

const PREMIUM_FEATURES = [
  "Accesso illimitato a tutti i bonus",
  "Family Mode - gestisci tutta la famiglia",
  "Calendario scadenze personalizzato",
  "Notifiche nuovi bonus",
  "Guide PDF scaricabili",
  "Supporto prioritario",
];

const FAQ = [
  { q: "BonusMatch è gratuito?", a: "Sì! Puoi usare BonusMatch gratuitamente per scoprire i bonus a cui hai diritto. La versione Premium offre funzionalità aggiuntive come il Family Mode e il calendario scadenze." },
  { q: "I miei dati sono al sicuro?", a: "Assolutamente. Usiamo crittografia di livello bancario e non condividiamo mai i tuoi dati con terze parti. I dati servono solo per calcolare i bonus compatibili." },
  { q: "Quanto tempo ci vuole per vedere i risultati?", a: "L'analisi richiede pochi secondi. Una volta compilato il profilo, vedrai immediatamente tutti i bonus disponibili per te." },
  { q: "BonusMatch fa domanda per me?", a: "No, BonusMatch ti guida nel processo ma non presenta domande per tuo conto. Ti forniamo tutte le informazioni e i link ufficiali per procedere autonomamente." },
];

const LandingPage: React.FC<LandingPageProps> = ({ onSubmit, onShowPremium }) => {
  const formRef = useRef<HTMLDivElement>(null);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pb-20">
        {/* Background decorations */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto text-center pt-8 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-bold mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Oltre 100 bonus analizzati
            </span>

            <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-6">
              I tuoi <span className="text-blue-600">Bonus</span>.
              <br />
              Semplificati.
            </h1>

            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Scopri in pochi secondi tutti i bonus statali e regionali a cui hai diritto. 
              L'intelligenza artificiale al servizio della burocrazia italiana.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={scrollToForm}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-lg shadow-xl shadow-blue-500/30 hover:shadow-blue-500/40 transition-all hover:scale-105"
              >
                Scopri i tuoi Bonus
              </button>
              <button
                onClick={onShowPremium}
                className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-yellow-950 font-bold rounded-2xl text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105"
              >
                Prova Premium
              </button>
            </div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="mt-16"
          >
            <button onClick={scrollToForm} className="animate-bounce text-slate-400 dark:text-slate-500 hover:text-blue-500 transition-colors">
              <Icon path={Icons.arrowDown} className="h-8 w-8 mx-auto" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* COS'È BONUSMATCH */}
      <section className="py-20 bg-slate-100 dark:bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.span variants={fadeInUp} className="text-blue-600 font-bold text-sm uppercase tracking-widest">
              Perché BonusMatch
            </motion.span>
            <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mt-4 tracking-tight">
              La burocrazia non è mai stata così semplice
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-slate-600 dark:text-slate-400 mt-4 max-w-2xl mx-auto">
              In Italia esistono centinaia di bonus e agevolazioni, ma trovarli richiede ore di ricerca. 
              BonusMatch fa il lavoro pesante per te.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {FEATURES.map((feature, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-slate-200 dark:border-slate-700"
              >
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                  <Icon path={feature.icon} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* COME FUNZIONA */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.span variants={fadeInUp} className="text-blue-600 font-bold text-sm uppercase tracking-widest">
              Come Funziona
            </motion.span>
            <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mt-4 tracking-tight">
              4 semplici passi
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {STEPS.map((step, i) => (
              <motion.div key={i} variants={fadeInUp} className="relative">
                <div className="text-7xl font-black text-slate-100 dark:text-slate-800 absolute -top-4 -left-2">{step.num}</div>
                <div className="relative pt-8 pl-4">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{step.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">{step.description}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-slate-200 dark:bg-slate-700" />
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FORM SECTION */}
      <section ref={formRef} className="py-20 bg-gradient-to-b from-blue-50 to-white dark:from-slate-900 dark:to-slate-950">
        <div className="max-w-3xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
              Scopri i tuoi <span className="text-blue-600">Bonus</span>
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Compila il form per ricevere la tua analisi personalizzata gratuita
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <ProfileForm onSubmit={onSubmit} />
          </motion.div>
        </div>
      </section>

      {/* PREMIUM SECTION */}
      <section className="py-20 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            <motion.div variants={fadeInUp}>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
                <Icon path={Icons.star} className="h-4 w-4" />
                Premium
              </span>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
                Sblocca tutto il potenziale di <span className="text-yellow-400">BonusMatch</span>
              </h2>
              <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                Con Premium hai accesso a funzionalità esclusive per massimizzare i tuoi benefici e gestire i bonus di tutta la famiglia.
              </p>
              
              <ul className="space-y-3 mb-8">
                {PREMIUM_FEATURES.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                      <Icon path={Icons.check} className="h-3 w-3 text-green-400" />
                    </div>
                    <span className="text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={onShowPremium}
                className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-yellow-950 font-bold rounded-2xl text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105"
              >
                Scopri Premium - 24,99€/anno
              </button>
            </motion.div>

            <motion.div variants={fadeInUp} className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-3xl blur-2xl" />
              <div className="relative bg-slate-800/80 backdrop-blur rounded-3xl p-8 border border-slate-700">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center">
                    <Icon path={Icons.star} className="h-8 w-8 text-yellow-950" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Premium</h3>
                    <p className="text-slate-400">Accesso completo</p>
                  </div>
                </div>
                <div className="mb-6">
                  <span className="text-5xl font-black">24,99€</span>
                  <span className="text-slate-400 text-lg">/anno</span>
                </div>
                <p className="text-sm text-amber-400 font-bold uppercase tracking-wider mb-4">
                  🚀 Beta - Abbonamenti in arrivo!
                </p>
                <p className="text-slate-400 text-sm">
                  Stiamo preparando qualcosa di speciale. Registrati per essere tra i primi ad accedere.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.span variants={fadeInUp} className="text-blue-600 font-bold text-sm uppercase tracking-widest">
              FAQ
            </motion.span>
            <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mt-4 tracking-tight">
              Domande Frequenti
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="space-y-4"
          >
            {FAQ.map((item, i) => (
              <motion.details
                key={i}
                variants={fadeInUp}
                className="group bg-white dark:bg-slate-800 rounded-2xl shadow-md hover:shadow-lg transition-shadow border border-slate-200 dark:border-slate-700"
              >
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <h3 className="font-bold text-slate-900 dark:text-white">{item.q}</h3>
                  <span className="ml-4 shrink-0 w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center group-open:rotate-180 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <div className="px-6 pb-6 text-slate-600 dark:text-slate-400">
                  {item.a}
                </div>
              </motion.details>
            ))}
          </motion.div>
        </div>
      </section>

      {/* SOCIAL & CTA FINALE */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-6">
              Pronto a scoprire i tuoi bonus?
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-slate-600 dark:text-slate-400 mb-10">
              Unisciti a migliaia di italiani che hanno già scoperto i bonus a cui hanno diritto.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <button
                onClick={scrollToForm}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-lg shadow-xl shadow-blue-500/30 hover:shadow-blue-500/40 transition-all hover:scale-105"
              >
                Inizia Ora - È Gratis
              </button>
            </motion.div>

            {/* Social Links */}
            <motion.div variants={fadeInUp}>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Seguici</p>
              <div className="flex justify-center gap-4">
                <a href="https://instagram.com/bonusmatch.it" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-all">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <a href="https://tiktok.com/@bonusmatch" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 hover:text-black dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/></svg>
                </a>
                <a href="https://linkedin.com/company/bonusmatch" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </a>
                <a href="mailto:info@bonusmatch.it" className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </a>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
