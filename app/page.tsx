'use client';

import dynamic from 'next/dynamic';

// Import dinamico dell'App per evitare errori SSR (window is not defined)
const App = dynamic(() => import('../App'), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  ),
});

export default function HomePage() {
  return <App />;
}
