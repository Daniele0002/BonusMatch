import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '../context/AuthContext';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'BonusMatch - Trova i Bonus a cui hai Diritto',
    template: '%s | BonusMatch',
  },
  description: 'Scopri tutti i bonus statali, regionali e comunali a cui hai diritto. Analisi personalizzata basata sul tuo profilo familiare e ISEE.',
  keywords: ['bonus', 'agevolazioni', 'ISEE', 'bonus famiglia', 'bonus luce', 'bonus gas', 'assegno unico', 'bonus psicologo'],
  authors: [{ name: 'BonusMatch' }],
  creator: 'BonusMatch',
  publisher: 'BonusMatch',
  metadataBase: new URL('https://bonusmatch.it'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'it_IT',
    url: 'https://bonusmatch.it',
    siteName: 'BonusMatch',
    title: 'BonusMatch - Trova i Bonus a cui hai Diritto',
    description: 'Scopri tutti i bonus statali, regionali e comunali a cui hai diritto.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'BonusMatch',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BonusMatch - Trova i Bonus a cui hai Diritto',
    description: 'Scopri tutti i bonus statali, regionali e comunali a cui hai diritto.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'YOUR_GOOGLE_VERIFICATION_CODE', // Sostituisci con il tuo codice
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1e293b' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Special+Gothic+Expanded+One&display=swap" rel="stylesheet" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
