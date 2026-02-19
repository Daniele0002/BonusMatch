import { MetadataRoute } from 'next';
import { MOCK_BONUSES } from '../constants';
import { generateSlug } from '../utils/seo';

export const dynamic = 'force-static';

const BASE_URL = 'https://bonusmatch.it';

export default function sitemap(): MetadataRoute.Sitemap {
  const categories = [...new Set(MOCK_BONUSES.map(b => b.categoria))];

  // Pagine statiche
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ];

  // Pagine bonus
  const bonusPages: MetadataRoute.Sitemap = MOCK_BONUSES.map((bonus) => ({
    url: `${BASE_URL}/bonus/${generateSlug(bonus.titolo)}/`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Pagine categorie
  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${BASE_URL}/categoria/${generateSlug(category)}/`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  return [...staticPages, ...categoryPages, ...bonusPages];
}
