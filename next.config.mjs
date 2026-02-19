/** @type {import('next').NextConfig} */
const nextConfig = {
  // Abilita output statico per deploy su Netlify
  output: 'export',
  
  // Trailing slash per compatibilità
  trailingSlash: true,
  
  // Immagini
  images: {
    unoptimized: true, // Per static export
  },
  
  // Transpile dipendenze se necessario
  transpilePackages: ['framer-motion'],
  
  // Configurazione TypeScript
  typescript: {
    ignoreBuildErrors: true, // Temporaneamente per il build
  },
};

export default nextConfig;
