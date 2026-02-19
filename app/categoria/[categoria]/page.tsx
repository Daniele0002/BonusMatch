import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MOCK_BONUSES } from '../../../constants';
import { generateSlug, getBonusUrl, getCategoryUrl } from '../../../utils/seo';
import SimpleHeader from '../../../components/SimpleHeader';
import SimpleFooter from '../../../components/SimpleFooter';

interface Props {
  params: Promise<{ categoria: string }>;
}

// Ottieni tutte le categorie uniche
const categories = [...new Set(MOCK_BONUSES.map(b => b.categoria))];

// Genera tutti i percorsi statici per le categorie
export async function generateStaticParams() {
  return categories.map((categoria) => ({
    categoria: generateSlug(categoria),
  }));
}

// Trova categoria originale dallo slug
function findCategoryBySlug(slug: string): string | undefined {
  return categories.find(c => generateSlug(c) === slug);
}

// Genera metadata dinamici per SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoria: categorySlug } = await params;
  const category = findCategoryBySlug(categorySlug);

  if (!category) {
    return {
      title: 'Categoria non trovata',
    };
  }

  const bonuses = MOCK_BONUSES.filter(b => b.categoria === category);
  const title = `Bonus ${category} 2025: Tutti i ${bonuses.length} Bonus Disponibili`;
  const description = `Scopri tutti i ${bonuses.length} bonus ${category.toLowerCase()} disponibili nel 2025. Requisiti, importi e come richiederli.`;

  return {
    title,
    description,
    keywords: [
      `bonus ${category.toLowerCase()}`,
      'bonus 2025',
      'agevolazioni',
      ...bonuses.slice(0, 5).map(b => b.titolo),
    ],
    alternates: {
      canonical: `/categoria/${categorySlug}/`,
    },
    openGraph: {
      title,
      description,
      url: `/categoria/${categorySlug}/`,
      siteName: 'Bonus Match',
      locale: 'it_IT',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { categoria: categorySlug } = await params;
  const category = findCategoryBySlug(categorySlug);

  if (!category) {
    notFound();
  }

  const bonuses = MOCK_BONUSES.filter(b => b.categoria === category);
  const activeBonuses = bonuses.filter(b => b.status === 'attivo');
  const totalValue = bonuses.reduce((acc, b) => acc + (b.valoreEsimato || 0), 0);

  // JSON-LD per la categoria
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Bonus ${category}`,
    description: `Lista di tutti i bonus ${category.toLowerCase()} disponibili`,
    numberOfItems: bonuses.length,
    itemListElement: bonuses.map((bonus, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'GovernmentService',
        name: bonus.titolo,
        description: bonus.descrizione,
        url: `https://bonusmatch.it${getBonusUrl(bonus.titolo)}`,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <SimpleHeader />
        
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
              </li>
              <li>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </li>
              <li className="text-slate-900 dark:text-white font-medium" aria-current="page">
                Bonus {category}
              </li>
            </ol>
          </nav>

          {/* Header */}
          <header className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Bonus {category}
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-6">
              Scopri tutti i bonus disponibili nella categoria {category.toLowerCase()}.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{bonuses.length}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Bonus totali</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{activeBonuses.length}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Bonus attivi</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">€{totalValue.toLocaleString('it-IT')}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Valore totale</p>
              </div>
            </div>
          </header>

          {/* Lista bonus */}
          <div className="grid md:grid-cols-2 gap-6">
            {bonuses.map((bonus) => (
              <Link
                key={bonus.id}
                href={getBonusUrl(bonus.titolo)}
                className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    bonus.status === 'attivo' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : bonus.status === 'scaduto'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                  }`}>
                    {bonus.status.charAt(0).toUpperCase() + bonus.status.slice(1)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    bonus.difficolta === 'bassa'
                      ? 'bg-green-100 text-green-800'
                      : bonus.difficolta === 'media'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {bonus.difficolta}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {bonus.titolo}
                </h2>
                
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">
                  {bonus.descrizione}
                </p>

                <div className="flex items-center justify-between">
                  {bonus.valoreEsimato ? (
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      €{bonus.valoreEsimato.toLocaleString('it-IT')}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-500">Valore variabile</p>
                  )}
                  <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                    Scopri di più →
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Altre categorie */}
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              Altre Categorie
            </h2>
            <div className="flex flex-wrap gap-3">
              {categories
                .filter(c => c !== category)
                .map((cat) => (
                  <Link
                    key={cat}
                    href={getCategoryUrl(cat)}
                    className="px-4 py-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm hover:shadow-md transition-shadow text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    {cat}
                  </Link>
                ))}
            </div>
          </section>
        </main>

        <SimpleFooter />
      </div>
    </>
  );
}
