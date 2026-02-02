export const REGIONI = [
  "Abruzzo", "Basilicata", "Calabria", "Campania", "Emilia-Romagna", 
  "Friuli-Venezia Giulia", "Lazio", "Liguria", "Lombardia", "Marche", 
  "Molise", "Piemonte", "Puglia", "Sardegna", "Sicilia", "Toscana", 
  "Trentino-Alto Adige", "Umbria", "Valle d'Aosta", "Veneto"
];

export const COMUNI_BY_REGIONE: Record<string, string[]> = {
  "Abruzzo": ["Pescara", "L'Aquila", "Teramo", "Chieti", "Montesilvano"],
  "Basilicata": ["Potenza", "Matera"],
  "Calabria": ["Reggio Calabria", "Catanzaro", "Lamezia Terme", "Cosenza", "Crotone"],
  "Campania": ["Napoli", "Salerno", "Giugliano in Campania", "Torre del Greco", "Pozzuoli", "Casoria", "Caserta", "Afragola", "Marano di Napoli", "Benevento", "Avellino", "Ercolano", "Portici", "Cava de' Tirreni", "Aversa", "Battipaglia", "Scafati", "Casalnuovo di Napoli"],
  "Emilia-Romagna": ["Bologna", "Parma", "Modena", "Reggio Emilia", "Ravenna", "Rimini", "Ferrara", "Forlì", "Piacenza", "Cesena", "Carpi", "Imola", "Faenza"],
  "Friuli-Venezia Giulia": ["Trieste", "Udine", "Pordenone"],
  "Lazio": ["Roma", "Latina", "Guidonia Montecelio", "Fiumicino", "Aprilia", "Viterbo", "Pomezia", "Tivoli", "Anzio", "Velletri", "Civitavecchia"],
  "Liguria": ["Genova", "La Spezia", "Savona"],
  "Lombardia": ["Milano", "Brescia", "Monza", "Bergamo", "Como", "Busto Arsizio", "Sesto San Giovanni", "Varese", "Cinisello Balsamo", "Pavia", "Cremona", "Vigevano", "Legnano", "Gallarate", "Rho", "Cologno Monzese", "Paderno Dugnano", "Mantova", "Lecco"],
  "Marche": ["Ancona", "Pesaro", "Fano", "Ascoli Piceno"],
  "Molise": ["Campobasso"],
  "Piemonte": ["Torino", "Novara", "Alessandria", "Asti", "Moncalieri", "Cuneo", "Collegno"],
  "Puglia": ["Bari", "Taranto", "Foggia", "Andria", "Lecce", "Barletta", "Brindisi", "Altamura", "Cerignola", "Manfredonia", "Bitonto", "San Severo", "Bisceglie", "Trani"],
  "Sardegna": ["Cagliari", "Sassari", "Quartu Sant'Elena", "Olbia"],
  "Sicilia": ["Palermo", "Catania", "Messina", "Siracusa", "Marsala", "Gela", "Ragusa", "Trapani", "Caltanissetta", "Vittoria", "Agrigento", "Bagheria", "Modica", "Acireale", "Mazara del Vallo"],
  "Toscana": ["Firenze", "Prato", "Livorno", "Arezzo", "Pistoia", "Pisa", "Lucca", "Grosseto", "Massa", "Carrara", "Viareggio", "Siena", "Scandicci"],
  "Trentino-Alto Adige": ["Trento", "Bolzano"],
  "Umbria": ["Perugia", "Terni", "Foligno"],
  "Valle d'Aosta": ["Aosta"],
  "Veneto": ["Venezia", "Verona", "Padova", "Vicenza", "Treviso", "Rovigo", "Chioggia"]
};

// Helper per ottenere tutti i comuni in una lista piatta se necessario
export const ALL_COMUNI = Object.values(COMUNI_BY_REGIONE).flat().sort();
