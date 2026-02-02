import React from "react";

interface FooterProps {
  onNavigate: (section: "dashboard" | "search" | "saved" | "settings") => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-10 mt-12">
      <div className="container mx-auto px-4 max-w-screen-2xl">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10">
          <div>
            <div className="flex items-center gap-1.5 mb-4">
              <div className="h-6 w-6 rounded-lg flex items-center justify-center">
                <img src="assets/logo.png" alt="BonusMatch Logo" />
              </div>
              <span className="text-base text-slate-900 dark:text-white uppercase" style={{ fontFamily: '"Special Gothic Expanded One", sans-serif' }}>
                Bonus Match
              </span>
            </div>
            <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-sm">
              Semplifichiamo l'accesso ai bonus italiani grazie all'intelligenza
              artificiale. La burocrazia non è mai stata così semplice.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-widest text-[10px] mb-4">
              Supporto
            </h4>
            <ul className="space-y-2">
              <li>
                <button className="text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium transition-colors">
                  Centro Assistenza
                </button>
              </li>
              <li>
                <button className="text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium transition-colors">
                  FAQ
                </button>
              </li>
              <li>
                <a
                 
                  className="text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium transition-colors"
                >
                  support@bonusmatch.it
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-slate-400 dark:text-slate-600 text-[9px] font-bold uppercase tracking-[0.2em]">
            Bonus Match &copy; 2026 • Made with ❤️ in Italy
          </p>
          <div className="flex gap-4 items-center">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              System Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
