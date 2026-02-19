import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MOCK_BONUSES } from '../../../constants';
import { generateSlug, findBonusBySlug } from '../../../utils/seo';
import BonusPageClient from './BonusPageClient';

interface Props {
  params: Promise<{ slug: string }>;
}

// Genera tutti i percorsi statici per i bonus
export async function generateStaticParams() {
  return MOCK_BONUSES.map((bonus) => ({
    slug: generateSlug(bonus.titolo),
  }));
}

// Genera metadata dinamici per SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const bonus = findBonusBySlug(MOCK_BONUSES, slug);

  if (!bonus) {
    return {
      title: 'Bonus non trovato',
    };
  }

  const title = `${bonus.titolo} 2025: Requisiti, Importo e Come Richiederlo`;
  const description = `${bonus.descrizione} Scopri i requisiti, l'importo stimato${bonus.valoreEsimato ? ` di €${bonus.valoreEsimato}` : ''}, i documenti necessari e la procedura completa per richiedere ${bonus.titolo}.`;

  return {
    title,
    description,
    keywords: [
      bonus.titolo,
      bonus.categoria,
      'bonus',
      'agevolazioni',
      'come richiedere',
      'requisiti',
      ...bonus.requisiti.slice(0, 3),
    ],
    alternates: {
      canonical: `/bonus/${slug}/`,
    },
    openGraph: {
      title,
      description,
      url: `/bonus/${slug}/`,
      siteName: 'Bonus Match',
      locale: 'it_IT',
      type: 'article',
      images: [
        {
          url: `/og-bonus/${slug}.png`,
          width: 1200,
          height: 630,
          alt: bonus.titolo,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`/og-bonus/${slug}.png`],
    },
  };
}

// Genera JSON-LD per schema.org (Rich Snippets)
function generateJsonLd(bonus: typeof MOCK_BONUSES[0]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'GovernmentService',
    name: bonus.titolo,
    description: bonus.descrizione,
    provider: {
      '@type': 'GovernmentOrganization',
      name: 'Governo Italiano',
    },
    serviceType: 'Agevolazione fiscale',
    areaServed: {
      '@type': 'Country',
      name: 'Italia',
    },
    ...(bonus.valoreEsimato && {
      offers: {
        '@type': 'Offer',
        price: bonus.valoreEsimato,
        priceCurrency: 'EUR',
      },
    }),
    ...(bonus.linkPortale && {
      url: bonus.linkPortale,
    }),
  };
}

export default async function BonusPage({ params }: Props) {
  const { slug } = await params;
  const bonus = findBonusBySlug(MOCK_BONUSES, slug);

  if (!bonus) {
    notFound();
  }

  const jsonLd = generateJsonLd(bonus);

  return (
    <>
      {/* JSON-LD per Rich Snippets Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Breadcrumb JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://bonusmatch.it/',
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: bonus.categoria,
                item: `https://bonusmatch.it/categoria/${generateSlug(bonus.categoria)}/`,
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: bonus.titolo,
              },
            ],
          }),
        }}
      />
      
      <BonusPageClient bonus={bonus} allBonuses={MOCK_BONUSES} />
    </>
  );
}
