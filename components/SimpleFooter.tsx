'use client';

import Link from 'next/link';
import { MOCK_BONUSES } from '../constants';
import { getCategoryUrl } from '../utils/seo';

/**
 * Footer semplificato per le pagine statiche dei bonus
 */
export default function SimpleFooter() {
  const categories = [...new Set(MOCK_BONUSES.map(b => b.categoria))];

  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-12 mt-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          {/* Logo e descrizione */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg overflow-hidden">
                <img src="/logo sfondo.png" alt="BonusMatch" className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-slate-900 dark:text-white uppercase text-sm tracking-wide">
                Bonus Match
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm max-w-md">
              Scopri tutti i bonus e le agevolazioni a cui hai diritto. 
              Analisi personalizzata basata sul tuo profilo familiare e ISEE.
            </p>
          </div>

          {/* Categorie */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4 text-sm uppercase tracking-wide">
              Categorie
            </h3>
            <ul className="space-y-2">
              {categories.slice(0, 6).map((cat) => (
                <li key={cat}>
                  <Link
                    href={getCategoryUrl(cat)}
                    className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4 text-sm uppercase tracking-wide">
              Risorse
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Analizza Profilo
                </Link>
              </li>
              <li>
                <a href="https://www.inps.it" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Sito INPS
                </a>
              </li>
              <li>
                <a href="https://www.agenziaentrate.gov.it" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Agenzia Entrate
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
          <p className="text-center text-sm text-slate-500 dark:text-slate-500">
            © {new Date().getFullYear()} Bonus Match. Tutti i diritti riservati.
          </p>
        </div>
      </div>
    </footer>
  );
}
