'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bonus } from '../../../types';
import { generateSlug, getCategoryUrl, getBonusUrl } from '../../../utils/seo';
import SimpleHeader from '../../../components/SimpleHeader';
import SimpleFooter from '../../../components/SimpleFooter';
import ShareButtons from '../../../components/ShareButtons';

interface BonusPageClientProps {
  bonus: Bonus;
  allBonuses: Bonus[];
}

// Icone SVG
const Icons = {
  check: (
    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  document: (
    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  clock: (
    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  external: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  ),
  arrow: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
};

// Badge per lo stato
const StatusBadge = ({ status }: { status: string }) => {
  const colors = {
    attivo: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    scaduto: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    'in arrivo': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  };
  
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[status as keyof typeof colors] || colors.attivo}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// Badge difficoltà
const DifficultyBadge = ({ difficulty }: { difficulty: string }) => {
  const colors = {
    bassa: 'bg-green-100 text-green-800',
    media: 'bg-amber-100 text-amber-800',
    alta: 'bg-red-100 text-red-800',
  };
  
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[difficulty as keyof typeof colors] || colors.media}`}>
      Difficoltà: {difficulty}
    </span>
  );
};

export default function BonusPageClient({ bonus, allBonuses }: BonusPageClientProps) {
  // Trova bonus simili della stessa categoria
  const similarBonuses = allBonuses
    .filter(b => b.categoria === bonus.categoria && b.id !== bonus.id)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <SimpleHeader />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <li>
              <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
            </li>
            <li>{Icons.arrow}</li>
            <li>
              <Link href={getCategoryUrl(bonus.categoria)} className="hover:text-blue-600 transition-colors">
                {bonus.categoria}
              </Link>
            </li>
            <li>{Icons.arrow}</li>
            <li className="text-slate-900 dark:text-white font-medium" aria-current="page">
              {bonus.titolo}
            </li>
          </ol>
        </nav>

        {/* Header del bonus */}
        <header className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm mb-8">
          <div className="flex flex-wrap gap-3 mb-4">
            <StatusBadge status={bonus.status} />
            <DifficultyBadge difficulty={bonus.difficolta} />
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {bonus.categoria}
            </span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            {bonus.titolo}
          </h1>
          
          <p className="text-lg text-slate-600 dark:text-slate-300 mb-6">
            {bonus.descrizione}
          </p>

          {/* Social Share */}
          <ShareButtons
            title={bonus.titolo}
            description={bonus.descrizione}
            url={`https://bonusmatch.it${getBonusUrl(bonus.titolo)}`}
            className="mb-6"
          />

          {/* Valore stimato */}
          {bonus.valoreEsimato && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-700 dark:text-green-300 mb-1">Valore stimato</p>
              <p className="text-4xl font-bold text-green-700 dark:text-green-400">
                €{bonus.valoreEsimato.toLocaleString('it-IT')}
              </p>
            </div>
          )}

          {/* Scadenza */}
          {bonus.scadenza && (
            <div className="mt-4 flex items-center gap-2 text-amber-700 dark:text-amber-400">
              {Icons.clock}
              <span>Scadenza: {new Date(bonus.scadenza).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          )}
        </header>

        {/* Sezioni */}
        <div className="space-y-8">
          {/* Requisiti */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
              {Icons.check}
              Requisiti
            </h2>
            <ul className="space-y-4">
              {bonus.requisiti.map((req, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 flex items-center justify-center text-sm font-bold">
                    {i + 1}
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">{req}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Documenti necessari */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
              {Icons.document}
              Documenti Necessari
            </h2>
            <ul className="grid md:grid-cols-2 gap-4">
              {bonus.documenti.map((doc, i) => (
                <li key={i} className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <span className="text-blue-600 dark:text-blue-400">
                    {Icons.document}
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">{doc}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Procedura */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
              <span className="text-2xl">📋</span>
              Come Richiederlo
            </h2>
            <ol className="space-y-4">
              {bonus.procedura.map((step, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                    {i + 1}
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 pt-1">{step}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* Tempistica */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
              {Icons.clock}
              Tempistica
            </h2>
            <p className="text-lg text-slate-700 dark:text-slate-300">
              {bonus.tempistica}
            </p>
          </section>

          {/* Link ufficiale */}
          {bonus.linkPortale && (
            <section className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
              <h2 className="text-2xl font-bold mb-4">Richiedi il Bonus</h2>
              <p className="mb-6 opacity-90">
                Accedi al portale ufficiale per presentare la tua domanda.
              </p>
              <a
                href={bonus.linkPortale}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
              >
                Vai al Portale Ufficiale
                {Icons.external}
              </a>
            </section>
          )}
        </div>

        {/* Bonus correlati */}
        {similarBonuses.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              Altri Bonus {bonus.categoria}
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {similarBonuses.map((b) => (
                <Link
                  key={b.id}
                  href={getBonusUrl(b.titolo)}
                  className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                    {b.titolo}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                    {b.descrizione}
                  </p>
                  {b.valoreEsimato && (
                    <p className="mt-3 text-green-600 dark:text-green-400 font-bold">
                      €{b.valoreEsimato.toLocaleString('it-IT')}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="mt-12 bg-slate-900 dark:bg-slate-800 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Scopri se hai diritto a questo bonus
          </h2>
          <p className="text-slate-300 mb-6">
            Completa il tuo profilo e scopri tutti i bonus a cui hai diritto in pochi minuti.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold transition-colors"
          >
            Analizza il tuo Profilo
            {Icons.arrow}
          </Link>
        </section>
      </main>

      <SimpleFooter />
    </div>
  );
}
