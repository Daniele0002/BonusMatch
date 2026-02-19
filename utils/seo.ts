/**
 * Genera uno slug SEO-friendly dal titolo del bonus
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Rimuove accenti
    .replace(/[^a-z0-9\s-]/g, '') // Rimuove caratteri speciali
    .replace(/\s+/g, '-') // Spazi diventano trattini
    .replace(/-+/g, '-') // Rimuove trattini multipli
    .replace(/^-|-$/g, ''); // Rimuove trattini iniziali/finali
}

/**
 * Trova un bonus dato lo slug
 */
export function findBonusBySlug(bonuses: any[], slug: string) {
  return bonuses.find(b => generateSlug(b.titolo) === slug);
}

/**
 * Genera URL SEO per un bonus
 */
export function getBonusUrl(title: string): string {
  return `/bonus/${generateSlug(title)}/`;
}

/**
 * Genera URL per una categoria
 */
export function getCategoryUrl(category: string): string {
  return `/categoria/${generateSlug(category)}/`;
}
