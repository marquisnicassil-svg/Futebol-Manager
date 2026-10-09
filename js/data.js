/**
 * @license
 * FUTMANAGER Mobile - js/data.js
 * Base de dados inicial de Ligas, Clubes, Nacionalidades e Sistema de Jogadores
 */

export const NATIONALITIES = [
  { code: 'BR', name: 'Brasil', flag: '🇧🇷' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'ES', name: 'Espanha', flag: '🇪🇸' },
  { code: 'EN', name: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { code: 'IT', name: 'Itália', flag: '🇮🇹' },
  { code: 'DE', name: 'Alemanha', flag: '🇩🇪' },
  { code: 'FR', name: 'França', flag: '🇫🇷' },
  { code: 'UY', name: 'Uruguai', flag: '🇺🇾' }
];

export const INITIAL_LEAGUES = [
  {
    id: 'bra_serie_a',
    name: 'Brasileirão Série A',
    country: 'Brasil',
    countryCode: 'BR',
    flag: '🇧🇷',
    currencySymbol: 'R$',
    rounds: 22,
    reputation: 4,
    description: 'A elite do futebol brasileiro. Muito equilíbrio e calendário disputado.'
  },
  {
    id: 'eng_premier',
    name: 'Premier League',
    country: 'Inglaterra',
    countryCode: 'EN',
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    currencySymbol: '£',
    rounds: 22,
    reputation: 5,
    description: 'A liga mais rica do mundo, com elencos galácticos e alta competitividade.'
  },
  {
    id: 'esp_la_liga',
    name: 'La Liga',
    country: 'Espanha',
    countryCode: 'ES',
    flag: '🇪🇸',
    currencySymbol: '€',
    rounds: 22,
    reputation: 5,
    description: 'O campeonato espanhol, marcado pela técnica refinada e gigantes mundiais.'
  }
];

export const INITIAL_CLUBS = [
  // --- BRASIL (SÉRIE A) - 12 Clubes ---
  {
    id: 'fla',
    leagueId: 'bra_serie_a',
    name: 'Flamengo',
    shortName: 'FLA',
    city: 'Rio de Janeiro',
    president: 'Rodolfo Landim',
    primaryColor: '#c3281c',
    secondaryColor: '#111111',
    reputation: 5,
    budget: 85000000,
    wageBudget: 4200000,
    expectation: 'Campeão da Liga',
    overall: 82,
    stadium: 'Maracanã',
    stadiumCapacity: 78838
  },
  {
    id: 'pal',
    leagueId: 'bra_serie_a',
    name: 'Palmeiras',
    shortName: 'PAL',
    city: 'São Paulo',
    president: 'Leila Pereira',
    primaryColor: '#006437',
    secondaryColor: '#ffffff',
    reputation: 5,
    budget: 78000000,
    wageBudget: 3900000,
    expectation: 'Campeão da Liga',
    overall: 81,
    stadium: 'Allianz Parque',
    stadiumCapacity: 43713
  },
  {
    id: 'atletico_mg',
    leagueId: 'bra_serie_a',
    name: 'Atlético Mineiro',
    shortName: 'CAM',
    city: 'Belo Horizonte',
    president: 'Sérgio Coelho',
    primaryColor: '#111111',
    secondaryColor: '#ffffff',
    reputation: 4,
    budget: 45000000,
    wageBudget: 2800000,
    expectation: 'Vaga na Libertadores',
    overall: 78,
    stadium: 'Arena MRV',
    stadiumCapacity: 46000
  },
  {
    id: 'sao_paulo',
    leagueId: 'bra_serie_a',
    name: 'São Paulo',
    shortName: 'SAO',
    city: 'São Paulo',
    president: 'Julio Casares',
    primaryColor: '#cf152b',
    secondaryColor: '#ffffff',
    reputation: 4,
    budget: 38000000,
    wageBudget: 2600000,
    expectation: 'Vaga na Libertadores',
    overall: 77,
    stadium: 'Morumbi',
    stadiumCapacity: 66795
  },
  {
    id: 'botafogo',
    leagueId: 'bra_serie_a',
    name: 'Botafogo',
    shortName: 'BOT',
    city: 'Rio de Janeiro',
    president: 'John Textor',
    primaryColor: '#1c1c1c',
    secondaryColor: '#ffffff',
    reputation: 4,
    budget: 52000000,
    wageBudget: 3100000,
    expectation: 'Vaga na Libertadores',
    overall: 78,
    stadium: 'Nilton Santos',
    stadiumCapacity: 44661
  },
  {
    id: 'fluminense',
    leagueId: 'bra_serie_a',
    name: 'Fluminense',
    shortName: 'FLU',
    city: 'Rio de Janeiro',
    president: 'Mário Bittencourt',
    primaryColor: '#7a192c',
    secondaryColor: '#006144',
    reputation: 4,
    budget: 32000000,
    wageBudget: 2400000,
    expectation: 'Metade Superior da Tabela',
    overall: 76,
    stadium: 'Maracanã',
    stadiumCapacity: 78838
  },
  {
    id: 'gremio',
    leagueId: 'bra_serie_a',
    name: 'Grêmio',
    shortName: 'GRE',
    city: 'Porto Alegre',
    president: 'Alberto Guerra',
    primaryColor: '#0d80bf',
    secondaryColor: '#ffffff',
    reputation: 4,
    budget: 30000000,
    wageBudget: 2300000,
    expectation: 'Metade Superior da Tabela',
    overall: 76,
    stadium: 'Arena do Grêmio',
    stadiumCapacity: 55662
  },
  {
    id: 'internacional',
    leagueId: 'bra_serie_a',
    name: 'Internacional',
    shortName: 'INT',
    city: 'Porto Alegre',
    president: 'Alessandro Barcellos',
    primaryColor: '#cc092f',
    secondaryColor: '#ffffff',
    reputation: 4,
    budget: 34000000,
    wageBudget: 2500000,
    expectation: 'Vaga na Libertadores',
    overall: 77,
    stadium: 'Beira-Rio',
    stadiumCapacity: 50128
  },
  {
    id: 'corinthians',
    leagueId: 'bra_serie_a',
    name: 'Corinthians',
    shortName: 'COR',
    city: 'São Paulo',
    president: 'Augusto Melo',
    primaryColor: '#ffffff',
    secondaryColor: '#111111',
    reputation: 4,
    budget: 35000000,
    wageBudget: 2700000,
    expectation: 'Metade Superior da Tabela',
    overall: 76,
    stadium: 'Neo Química Arena',
    stadiumCapacity: 49205
  },
  {
    id: 'cruzeiro',
    leagueId: 'bra_serie_a',
    name: 'Cruzeiro',
    shortName: 'CRU',
    city: 'Belo Horizonte',
    president: 'Pedro Lourenço',
    primaryColor: '#004185',
    secondaryColor: '#ffffff',
    reputation: 4,
    budget: 40000000,
    wageBudget: 2600000,
    expectation: 'Metade Superior da Tabela',
    overall: 76,
    stadium: 'Mineirão',
    stadiumCapacity: 61846
  },
  {
    id: 'vasco',
    leagueId: 'bra_serie_a',
    name: 'Vasco da Gama',
    shortName: 'VAS',
    city: 'Rio de Janeiro',
    president: 'Pedrinho',
    primaryColor: '#111111',
    secondaryColor: '#ffffff',
    reputation: 3,
    budget: 25000000,
    wageBudget: 1900000,
    expectation: 'Evitar Rebaixamento',
    overall: 74,
    stadium: 'São Januário',
    stadiumCapacity: 21880
  },
  {
    id: 'fortaleza',
    leagueId: 'bra_serie_a',
    name: 'Fortaleza',
    shortName: 'FOR',
    city: 'Fortaleza',
    president: 'Marcelo Paz',
    primaryColor: '#114084',
    secondaryColor: '#d61d2d',
    reputation: 3,
    budget: 28000000,
    wageBudget: 1800000,
    expectation: 'Metade Superior da Tabela',
    overall: 75,
    stadium: 'Castelão',
    stadiumCapacity: 63903
  },

  // --- INGLATERRA (PREMIER LEAGUE) - 12 Clubes ---
  {
    id: 'mancity',
    leagueId: 'eng_premier',
    name: 'Manchester City',
    shortName: 'MCI',
    city: 'Manchester',
    president: 'Khaldoon Al Mubarak',
    primaryColor: '#6cabdd',
    secondaryColor: '#ffffff',
    reputation: 5,
    budget: 120000000,
    wageBudget: 6500000,
    expectation: 'Campeão da Liga',
    overall: 86,
    stadium: 'Etihad Stadium',
    stadiumCapacity: 53400
  },
  {
    id: 'arsenal',
    leagueId: 'eng_premier',
    name: 'Arsenal',
    shortName: 'ARS',
    city: 'Londres',
    president: 'Stan Kroenke',
    primaryColor: '#db0007',
    secondaryColor: '#ffffff',
    reputation: 5,
    budget: 95000000,
    wageBudget: 5200000,
    expectation: 'Campeão da Liga',
    overall: 84,
    stadium: 'Emirates Stadium',
    stadiumCapacity: 60704
  },
  {
    id: 'liverpool',
    leagueId: 'eng_premier',
    name: 'Liverpool',
    shortName: 'LIV',
    city: 'Liverpool',
    president: 'Tom Werner',
    primaryColor: '#c8102e',
    secondaryColor: '#ffffff',
    reputation: 5,
    budget: 90000000,
    wageBudget: 5100000,
    expectation: 'Campeão da Liga',
    overall: 84,
    stadium: 'Anfield',
    stadiumCapacity: 61276
  },
  {
    id: 'chelsea',
    leagueId: 'eng_premier',
    name: 'Chelsea',
    shortName: 'CHE',
    city: 'Londres',
    president: 'Todd Boehly',
    primaryColor: '#034694',
    secondaryColor: '#ffffff',
    reputation: 4,
    budget: 85000000,
    wageBudget: 4800000,
    expectation: 'Vaga na Champions League',
    overall: 81,
    stadium: 'Stamford Bridge',
    stadiumCapacity: 40343
  },
  {
    id: 'manutd',
    leagueId: 'eng_premier',
    name: 'Manchester United',
    shortName: 'MUN',
    city: 'Manchester',
    president: 'Sir Jim Ratcliffe',
    primaryColor: '#da291c',
    secondaryColor: '#ffffff',
    reputation: 4,
    budget: 80000000,
    wageBudget: 5000000,
    expectation: 'Vaga na Champions League',
    overall: 80,
    stadium: 'Old Trafford',
    stadiumCapacity: 74310
  },
  {
    id: 'tottenham',
    leagueId: 'eng_premier',
    name: 'Tottenham',
    shortName: 'TOT',
    city: 'Londres',
    president: 'Daniel Levy',
    primaryColor: '#132257',
    secondaryColor: '#ffffff',
    reputation: 4,
    budget: 75000000,
    wageBudget: 4600000,
    expectation: 'Vaga na Champions League',
    overall: 81,
    stadium: 'Tottenham Stadium',
    stadiumCapacity: 62850
  },
  {
    id: 'newcastle',
    leagueId: 'eng_premier',
    name: 'Newcastle United',
    shortName: 'NEW',
    city: 'Newcastle',
    president: 'Yasir Al-Rumayyan',
    primaryColor: '#241f20',
    secondaryColor: '#ffffff',
    reputation: 4,
    budget: 70000000,
    wageBudget: 4200000,
    expectation: 'Vaga nas Copas Europeias',
    overall: 80,
    stadium: "St. James' Park",
    stadiumCapacity: 52305
  },
  {
    id: 'astonvilla',
    leagueId: 'eng_premier',
    name: 'Aston Villa',
    shortName: 'AVL',
    city: 'Birmingham',
    president: 'Nassef Sawiris',
    primaryColor: '#670e36',
    secondaryColor: '#95bfe5',
    reputation: 4,
    budget: 50000000,
    wageBudget: 3200000,
    expectation: 'Vaga nas Copas Europeias',
    overall: 79,
    stadium: 'Villa Park',
    stadiumCapacity: 42682
  },
  {
    id: 'brighton',
    leagueId: 'eng_premier',
    name: 'Brighton',
    shortName: 'BHA',
    city: 'Brighton',
    president: 'Tony Bloom',
    primaryColor: '#0057b8',
    secondaryColor: '#ffcd00',
    reputation: 3,
    budget: 42000000,
    wageBudget: 2800000,
    expectation: 'Metade Superior da Tabela',
    overall: 77,
    stadium: 'Amex Stadium',
    stadiumCapacity: 31800
  },
  {
    id: 'westham',
    leagueId: 'eng_premier',
    name: 'West Ham',
    shortName: 'WHU',
    city: 'Londres',
    president: 'David Sullivan',
    primaryColor: '#7a263a',
    secondaryColor: '#1bb1e7',
    reputation: 3,
    budget: 45000000,
    wageBudget: 3000000,
    expectation: 'Metade Superior da Tabela',
    overall: 77,
    stadium: 'London Stadium',
    stadiumCapacity: 62500
  },
  {
    id: 'everton',
    leagueId: 'eng_premier',
    name: 'Everton',
    shortName: 'EVE',
    city: 'Liverpool',
    president: 'Farhad Moshiri',
    primaryColor: '#003399',
    secondaryColor: '#ffffff',
    reputation: 3,
    budget: 35000000,
    wageBudget: 2500000,
    expectation: 'Evitar Rebaixamento',
    overall: 75,
    stadium: 'Goodison Park',
    stadiumCapacity: 39572
  },
  {
    id: 'wolves',
    leagueId: 'eng_premier',
    name: 'Wolverhampton',
    shortName: 'WOL',
    city: 'Wolverhampton',
    president: 'Jeff Shi',
    primaryColor: '#fdb913',
    secondaryColor: '#231f20',
    reputation: 3,
    budget: 36000000,
    wageBudget: 2400000,
    expectation: 'Evitar Rebaixamento',
    overall: 75,
    stadium: 'Molineux Stadium',
    stadiumCapacity: 32050
  },

  // --- ESPANHA (LA LIGA) - 12 Clubes ---
  {
    id: 'realmadrid',
    leagueId: 'esp_la_liga',
    name: 'Real Madrid',
    shortName: 'RMA',
    city: 'Madrid',
    president: 'Florentino Pérez',
    primaryColor: '#eeeee0',
    secondaryColor: '#00529f',
    reputation: 5,
    budget: 130000000,
    wageBudget: 7000000,
    expectation: 'Campeão da Liga',
    overall: 87,
    stadium: 'Santiago Bernabéu',
    stadiumCapacity: 84000
  },
  {
    id: 'barcelona',
    leagueId: 'esp_la_liga',
    name: 'Barcelona',
    shortName: 'BAR',
    city: 'Barcelona',
    president: 'Joan Laporta',
    primaryColor: '#a50044',
    secondaryColor: '#004d98',
    reputation: 5,
    budget: 65000000,
    wageBudget: 5500000,
    expectation: 'Campeão da Liga',
    overall: 84,
    stadium: 'Camp Nou',
    stadiumCapacity: 99354
  },
  {
    id: 'atleticomadrid',
    leagueId: 'esp_la_liga',
    name: 'Atlético de Madrid',
    shortName: 'ATM',
    city: 'Madrid',
    president: 'Enrique Cerezo',
    primaryColor: '#cb3524',
    secondaryColor: '#272e61',
    reputation: 4,
    budget: 60000000,
    wageBudget: 4200000,
    expectation: 'Vaga na Champions League',
    overall: 82,
    stadium: 'Metropolitano',
    stadiumCapacity: 70460
  },
  {
    id: 'athleticbilbao',
    leagueId: 'esp_la_liga',
    name: 'Athletic Bilbao',
    shortName: 'ATH',
    city: 'Bilbao',
    president: 'Jon Uriarte',
    primaryColor: '#ee2524',
    secondaryColor: '#ffffff',
    reputation: 4,
    budget: 32000000,
    wageBudget: 2200000,
    expectation: 'Vaga nas Copas Europeias',
    overall: 79,
    stadium: 'San Mamés',
    stadiumCapacity: 53289
  },
  {
    id: 'realsociedad',
    leagueId: 'esp_la_liga',
    name: 'Real Sociedad',
    shortName: 'RSO',
    city: 'San Sebastián',
    president: 'Jokin Aperribay',
    primaryColor: '#0067b1',
    secondaryColor: '#ffffff',
    reputation: 4,
    budget: 35000000,
    wageBudget: 2400000,
    expectation: 'Vaga nas Copas Europeias',
    overall: 78,
    stadium: 'Reale Arena',
    stadiumCapacity: 39313
  },
  {
    id: 'realbetis',
    leagueId: 'esp_la_liga',
    name: 'Real Betis',
    shortName: 'BET',
    city: 'Sevilha',
    president: 'Ángel Haro',
    primaryColor: '#0bb364',
    secondaryColor: '#ffffff',
    reputation: 4,
    budget: 28000000,
    wageBudget: 2100000,
    expectation: 'Metade Superior da Tabela',
    overall: 78,
    stadium: 'Benito Villamarín',
    stadiumCapacity: 60721
  },
  {
    id: 'villarreal',
    leagueId: 'esp_la_liga',
    name: 'Villarreal',
    shortName: 'VIL',
    city: 'Vila-real',
    president: 'Fernando Roig',
    primaryColor: '#f5e300',
    secondaryColor: '#00529f',
    reputation: 4,
    budget: 38000000,
    wageBudget: 2700000,
    expectation: 'Vaga nas Copas Europeias',
    overall: 78,
    stadium: 'Estadio de la Cerámica',
    stadiumCapacity: 23500
  },
  {
    id: 'sevilla',
    leagueId: 'esp_la_liga',
    name: 'Sevilla FC',
    shortName: 'SEV',
    city: 'Sevilha',
    president: 'José María del Nido',
    primaryColor: '#d4001f',
    secondaryColor: '#ffffff',
    reputation: 4,
    budget: 40000000,
    wageBudget: 2900000,
    expectation: 'Metade Superior da Tabela',
    overall: 78,
    stadium: 'Ramón Sánchez-Pizjuán',
    stadiumCapacity: 43883
  },
  {
    id: 'valencia',
    leagueId: 'esp_la_liga',
    name: 'Valencia CF',
    shortName: 'VAL',
    city: 'Valência',
    president: 'Peter Lim',
    primaryColor: '#ffffff',
    secondaryColor: '#ee3524',
    reputation: 3,
    budget: 30000000,
    wageBudget: 2300000,
    expectation: 'Metade Superior da Tabela',
    overall: 76,
    stadium: 'Mestalla',
    stadiumCapacity: 49430
  },
  {
    id: 'celta',
    leagueId: 'esp_la_liga',
    name: 'Celta de Vigo',
    shortName: 'CEL',
    city: 'Vigo',
    president: 'Marián Mouriño',
    primaryColor: '#87ceeb',
    secondaryColor: '#ffffff',
    reputation: 3,
    budget: 26000000,
    wageBudget: 2000000,
    expectation: 'Metade Superior da Tabela',
    overall: 75,
    stadium: 'Abanca-Balaídos',
    stadiumCapacity: 24870
  },
  {
    id: 'osasuna',
    leagueId: 'esp_la_liga',
    name: 'Osasuna',
    shortName: 'OSA',
    city: 'Pamplona',
    president: 'Luis Sabalza',
    primaryColor: '#c8102e',
    secondaryColor: '#0a2240',
    reputation: 3,
    budget: 24000000,
    wageBudget: 1900000,
    expectation: 'Evitar Rebaixamento',
    overall: 75,
    stadium: 'El Sadar',
    stadiumCapacity: 23576
  },
  {
    id: 'mallorca',
    leagueId: 'esp_la_liga',
    name: 'Mallorca',
    shortName: 'MLL',
    city: 'Palma',
    president: 'Andy Kohlberg',
    primaryColor: '#e20613',
    secondaryColor: '#000000',
    reputation: 3,
    budget: 22000000,
    wageBudget: 1800000,
    expectation: 'Evitar Rebaixamento',
    overall: 74,
    stadium: 'Son Moix',
    stadiumCapacity: 23142
  }
];

/**
 * Retorna os clubes filtrados por liga
 * @param {string} leagueId 
 * @returns {Array}
 */
export function getClubsByLeague(leagueId) {
  return INITIAL_CLUBS.filter(club => club.leagueId === leagueId);
}

/**
 * Retorna uma liga pelo ID
 * @param {string} leagueId 
 * @returns {Object|null}
 */
export function getLeagueById(leagueId) {
  return INITIAL_LEAGUES.find(league => league.id === leagueId) || null;
}

/**
 * Retorna um clube pelo ID
 * @param {string} clubId 
 * @returns {Object|null}
 */
export function getClubById(clubId) {
  return INITIAL_CLUBS.find(club => club.id === clubId) || null;
}

/**
 * Formata valores monetários com precisão
 * @param {number} value 
 * @param {string} currencySymbol 
 * @returns {string}
 */
export function formatMoney(value, currencySymbol = 'R$') {
  if (value >= 1000000) {
    const millions = (value / 1000000).toFixed(1);
    return `${currencySymbol} ${millions.replace('.0', '')}M`;
  }
  if (value >= 1000) {
    const thousands = (value / 1000).toFixed(0);
    return `${currencySymbol} ${thousands}K`;
  }
  return `${currencySymbol} ${value.toLocaleString('pt-BR')}`;
}

/* ==========================================================================
   SISTEMA DE JOGADORES (ETAPA 2)
   ========================================================================== */

/**
 * Calcula a força geral individual de acordo com atributos e posição
 * @param {{ attack: number, defense: number, pass: number, physical: number, position: 'GOL'|'DEF'|'MEI'|'ATA' }} player
 * @returns {number}
 */
export function calculatePlayerOverall(player) {
  const { attack, defense, pass, physical, position } = player;

  let ovr = 50;
  switch (position) {
    case 'GOL':
      // Goleiro valoriza fortemente defesa (reflexos/posicionamento) e físico
      ovr = (defense * 0.65) + (physical * 0.25) + (pass * 0.10);
      break;
    case 'DEF':
      // Defensor valoriza desarme, posicionamento e vigor físico
      ovr = (defense * 0.55) + (physical * 0.25) + (pass * 0.15) + (attack * 0.05);
      break;
    case 'MEI':
      // Meio-campista valoriza passe, visão, apoio ao ataque e recomposição
      ovr = (pass * 0.35) + (attack * 0.25) + (defense * 0.20) + (physical * 0.20);
      break;
    case 'ATA':
      // Atacante valoriza finalização/ataque, explosão física e passes
      ovr = (attack * 0.55) + (physical * 0.20) + (pass * 0.15) + (defense * 0.10);
      break;
    default:
      ovr = (attack + defense + pass + physical) / 4;
  }

  return Math.min(99, Math.max(1, Math.round(ovr)));
}

/**
 * Calcula a força geral do elenco com base nos 11 titulares ou média ponderada
 * @param {Array} squad 
 * @param {Array} lineup 
 * @returns {number}
 */
export function calculateSquadOverall(squad, lineup = []) {
  if (!squad || squad.length === 0) return 70;

  // Se houver escalação definida com jogadores escalados
  if (lineup && lineup.length > 0) {
    const starterIds = lineup.map(slot => slot.playerId).filter(Boolean);
    const starters = squad.filter(p => starterIds.includes(p.id));

    if (starters.length >= 7) {
      const sumStarters = starters.reduce((acc, p) => acc + p.overall, 0);
      return Math.round(sumStarters / starters.length);
    }
  }

  // Fallback: média dos 14 melhores jogadores
  const sorted = [...squad].sort((a, b) => b.overall - a.overall);
  const topPlayers = sorted.slice(0, 14);
  const sum = topPlayers.reduce((acc, p) => acc + p.overall, 0);
  return Math.round(sum / topPlayers.length);
}

/**
 * Nomes e sobrenomes autênticos para geração determinística por região
 */
export const ROSTER_NAMES = {
  BR: {
    first: ['Gabriel', 'Lucas', 'Rodrigo', 'Matheus', 'Vinicius', 'Bruno', 'Felipe', 'Eduardo', 'Thiago', 'Gustavo', 'Danilo', 'Rafael', 'Luan', 'Murilo', 'Everton', 'Marcos', 'Kaio', 'André', 'Igor', 'Pedro'],
    last: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa']
  },
  EN: {
    first: ['Harry', 'Jack', 'Declan', 'Marcus', 'Phil', 'Jude', 'Bukayo', 'Cole', 'John', 'Kyle', 'James', 'Trent', 'Luke', 'Jordan', 'Oliver', 'Harvey', 'Mason', 'Conor', 'Lewis', 'Ben'],
    last: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'White', 'Harris', 'Clark', 'Walker', 'Young', 'Wright']
  },
  ES: {
    first: ['Alejandro', 'Pablo', 'Pedri', 'Gavi', 'Lamine', 'Ferran', 'Dani', 'Mikel', 'Rodri', 'Alvaro', 'Nico', 'Unai', 'David', 'Sergio', 'Inigo', 'Marc', 'Pau', 'Alex', 'Jesus', 'Gerard'],
    last: ['Garcia', 'Martinez', 'Lopez', 'Sanchez', 'Gonzalez', 'Rodriguez', 'Fernandez', 'Perez', 'Gomez', 'Martin', 'Ruiz', 'Diaz', 'Navarro', 'Torres', 'Ramos', 'Vazquez', 'Castro', 'Romero', 'Morata', 'Iglesias']
  }
};

/**
 * Jogadores reais e icônicos pré-definidos para os principais clubes
 */
const PRESET_STARS = {
  fla: [
    { name: 'Agustín Rossi', pos: 'GOL', age: 29, atk: 25, def: 84, pas: 68, phy: 80 },
    { name: 'Léo Ortiz', pos: 'DEF', age: 28, atk: 45, def: 83, pas: 78, phy: 82 },
    { name: 'Léo Pereira', pos: 'DEF', age: 28, atk: 40, def: 82, pas: 74, phy: 81 },
    { name: 'Ayrton Lucas', pos: 'DEF', age: 27, atk: 72, def: 77, pas: 75, phy: 86 },
    { name: 'Guillermo Varela', pos: 'DEF', age: 31, atk: 68, def: 78, pas: 74, phy: 79 },
    { name: 'Erick Pulgar', pos: 'MEI', age: 31, atk: 65, def: 82, pas: 84, phy: 82 },
    { name: 'Nicolás De La Cruz', pos: 'MEI', age: 27, atk: 81, def: 75, pas: 86, phy: 84 },
    { name: 'Gerson', pos: 'MEI', age: 27, atk: 82, def: 78, pas: 87, phy: 85 },
    { name: 'Giorgian De Arrascaeta', pos: 'MEI', age: 30, atk: 86, def: 55, pas: 90, phy: 76 },
    { name: 'Pedro', pos: 'ATA', age: 27, atk: 87, def: 35, pas: 75, phy: 83 },
    { name: 'Bruno Henrique', pos: 'ATA', age: 33, atk: 83, def: 42, pas: 73, phy: 86 },
    { name: 'Luiz Araújo', pos: 'ATA', age: 28, atk: 80, def: 48, pas: 78, phy: 84 }
  ],
  pal: [
    { name: 'Weverton', pos: 'GOL', age: 36, atk: 20, def: 84, pas: 72, phy: 78 },
    { name: 'Gustavo Gómez', pos: 'DEF', age: 31, atk: 52, def: 86, pas: 74, phy: 85 },
    { name: 'Murilo', pos: 'DEF', age: 27, atk: 48, def: 83, pas: 72, phy: 83 },
    { name: 'Joaquín Piquerez', pos: 'DEF', age: 26, atk: 74, def: 80, pas: 78, phy: 84 },
    { name: 'Marcos Rocha', pos: 'DEF', age: 35, atk: 66, def: 77, pas: 76, phy: 74 },
    { name: 'Aníbal Moreno', pos: 'MEI', age: 25, atk: 62, def: 83, pas: 81, phy: 84 },
    { name: 'Zé Rafael', pos: 'MEI', age: 31, atk: 72, def: 79, pas: 80, phy: 82 },
    { name: 'Raphael Veiga', pos: 'MEI', age: 29, atk: 85, def: 60, pas: 87, phy: 81 },
    { name: 'Maurício', pos: 'MEI', age: 23, atk: 80, def: 58, pas: 82, phy: 78 },
    { name: 'Estêvão', pos: 'ATA', age: 18, atk: 84, def: 40, pas: 81, phy: 79 },
    { name: 'Rony', pos: 'ATA', age: 29, atk: 78, def: 60, pas: 70, phy: 88 },
    { name: 'Flaco López', pos: 'ATA', age: 23, atk: 82, def: 35, pas: 72, phy: 84 }
  ],
  mancity: [
    { name: 'Ederson', pos: 'GOL', age: 31, atk: 30, def: 87, pas: 88, phy: 82 },
    { name: 'Rúben Dias', pos: 'DEF', age: 27, atk: 45, def: 89, pas: 80, phy: 88 },
    { name: 'Manuel Akanji', pos: 'DEF', age: 29, atk: 50, def: 85, pas: 82, phy: 86 },
    { name: 'Josko Gvardiol', pos: 'DEF', age: 23, atk: 70, def: 86, pas: 84, phy: 87 },
    { name: 'Kyle Walker', pos: 'DEF', age: 34, atk: 68, def: 84, pas: 78, phy: 88 },
    { name: 'Rodri', pos: 'MEI', age: 28, atk: 82, def: 91, pas: 92, phy: 89 },
    { name: 'Kevin De Bruyne', pos: 'MEI', age: 33, atk: 88, def: 65, pas: 95, phy: 78 },
    { name: 'Bernardo Silva', pos: 'MEI', age: 30, atk: 85, def: 70, pas: 90, phy: 82 },
    { name: 'Phil Foden', pos: 'MEI', age: 24, atk: 88, def: 58, pas: 89, phy: 84 },
    { name: 'Erling Haaland', pos: 'ATA', age: 24, atk: 94, def: 42, pas: 74, phy: 93 },
    { name: 'Jérémy Doku', pos: 'ATA', age: 22, atk: 84, def: 40, pas: 80, phy: 90 },
    { name: 'Jack Grealish', pos: 'ATA', age: 29, atk: 82, def: 52, pas: 85, phy: 80 }
  ],
  realmadrid: [
    { name: 'Thibaut Courtois', pos: 'GOL', age: 32, atk: 20, def: 90, pas: 75, phy: 85 },
    { name: 'Antonio Rüdiger', pos: 'DEF', age: 31, atk: 52, def: 88, pas: 75, phy: 90 },
    { name: 'Éder Militão', pos: 'DEF', age: 26, atk: 50, def: 87, pas: 76, phy: 88 },
    { name: 'Ferland Mendy', pos: 'DEF', age: 29, atk: 65, def: 84, pas: 76, phy: 87 },
    { name: 'Dani Carvajal', pos: 'DEF', age: 32, atk: 74, def: 86, pas: 82, phy: 84 },
    { name: 'Federico Valverde', pos: 'MEI', age: 26, atk: 84, def: 83, pas: 87, phy: 91 },
    { name: 'Aurélien Tchouaméni', pos: 'MEI', age: 24, atk: 72, def: 87, pas: 84, phy: 88 },
    { name: 'Jude Bellingham', pos: 'MEI', age: 21, atk: 89, def: 78, pas: 88, phy: 88 },
    { name: 'Luka Modric', pos: 'MEI', age: 39, atk: 78, def: 68, pas: 92, phy: 70 },
    { name: 'Vinícius Júnior', pos: 'ATA', age: 24, atk: 92, def: 40, pas: 85, phy: 91 },
    { name: 'Kylian Mbappé', pos: 'ATA', age: 25, atk: 94, def: 38, pas: 84, phy: 92 },
    { name: 'Rodrygo', pos: 'ATA', age: 23, atk: 88, def: 45, pas: 84, phy: 86 }
  ],
  barcelona: [
    { name: 'Marc-André ter Stegen', pos: 'GOL', age: 32, atk: 25, def: 87, pas: 86, phy: 80 },
    { name: 'Ronald Araújo', pos: 'DEF', age: 25, atk: 48, def: 88, pas: 70, phy: 89 },
    { name: 'Pau Cubarsí', pos: 'DEF', age: 18, atk: 42, def: 83, pas: 85, phy: 78 },
    { name: 'Alejandro Balde', pos: 'DEF', age: 21, atk: 76, def: 78, pas: 78, phy: 89 },
    { name: 'Jules Koundé', pos: 'DEF', age: 26, atk: 65, def: 85, pas: 80, phy: 84 },
    { name: 'Pedri', pos: 'MEI', age: 22, atk: 82, def: 70, pas: 90, phy: 78 },
    { name: 'Gavi', pos: 'MEI', age: 20, atk: 78, def: 79, pas: 83, phy: 86 },
    { name: 'Frenkie de Jong', pos: 'MEI', age: 27, atk: 79, def: 79, pas: 88, phy: 83 },
    { name: 'Dani Olmo', pos: 'MEI', age: 26, atk: 85, def: 55, pas: 86, phy: 80 },
    { name: 'Lamine Yamal', pos: 'ATA', age: 17, atk: 89, def: 42, pas: 87, phy: 82 },
    { name: 'Robert Lewandowski', pos: 'ATA', age: 36, atk: 90, def: 35, pas: 78, phy: 82 },
    { name: 'Raphinha', pos: 'ATA', age: 28, atk: 86, def: 60, pas: 84, phy: 87 }
  ],
  tottenham: [
    { name: 'Guglielmo Vicario', pos: 'GOL', age: 28, atk: 20, def: 84, pas: 74, phy: 81 },
    { name: 'Cristian Romero', pos: 'DEF', age: 26, atk: 48, def: 86, pas: 76, phy: 87 },
    { name: 'Micky van de Ven', pos: 'DEF', age: 23, atk: 52, def: 85, pas: 75, phy: 91 },
    { name: 'Pedro Porro', pos: 'DEF', age: 25, atk: 76, def: 79, pas: 82, phy: 83 },
    { name: 'James Maddison', pos: 'MEI', age: 27, atk: 84, def: 58, pas: 88, phy: 78 },
    { name: 'Dejan Kulusevski', pos: 'MEI', age: 24, atk: 82, def: 64, pas: 84, phy: 85 },
    { name: 'Son Heung-min', pos: 'ATA', age: 32, atk: 89, def: 45, pas: 82, phy: 84 },
    { name: 'Dominic Solanke', pos: 'ATA', age: 27, atk: 83, def: 38, pas: 74, phy: 85 }
  ],
  newcastle: [
    { name: 'Nick Pope', pos: 'GOL', age: 32, atk: 18, def: 84, pas: 68, phy: 84 },
    { name: 'Fabian Schär', pos: 'DEF', age: 32, atk: 54, def: 82, pas: 80, phy: 81 },
    { name: 'Kieran Trippier', pos: 'DEF', age: 34, atk: 74, def: 80, pas: 86, phy: 78 },
    { name: 'Bruno Guimarães', pos: 'MEI', age: 27, atk: 80, def: 84, pas: 88, phy: 86 },
    { name: 'Joelinton', pos: 'MEI', age: 28, atk: 78, def: 82, pas: 80, phy: 89 },
    { name: 'Alexander Isak', pos: 'ATA', age: 25, atk: 88, def: 35, pas: 78, phy: 85 },
    { name: 'Anthony Gordon', pos: 'ATA', age: 23, atk: 84, def: 48, pas: 79, phy: 88 }
  ],
  sevilla: [
    { name: 'Ørjan Nyland', pos: 'GOL', age: 34, atk: 18, def: 80, pas: 70, phy: 78 },
    { name: 'Loïc Badé', pos: 'DEF', age: 24, atk: 40, def: 82, pas: 72, phy: 84 },
    { name: 'Jesús Navas', pos: 'DEF', age: 38, atk: 72, def: 77, pas: 80, phy: 76 },
    { name: 'Saúl Ñíguez', pos: 'MEI', age: 30, atk: 77, def: 78, pas: 80, phy: 81 },
    { name: 'Djibril Sow', pos: 'MEI', age: 27, atk: 74, def: 78, pas: 81, phy: 82 },
    { name: 'Lucas Ocampos', pos: 'ATA', age: 30, atk: 82, def: 58, pas: 77, phy: 86 },
    { name: 'Isaac Romero', pos: 'ATA', age: 24, atk: 80, def: 40, pas: 72, phy: 82 }
  ],
  villarreal: [
    { name: 'Diego Conde', pos: 'GOL', age: 26, atk: 20, def: 81, pas: 72, phy: 79 },
    { name: 'Raúl Albiol', pos: 'DEF', age: 39, atk: 35, def: 82, pas: 74, phy: 75 },
    { name: 'Dani Parejo', pos: 'MEI', age: 35, atk: 76, def: 70, pas: 89, phy: 70 },
    { name: 'Álex Baena', pos: 'MEI', age: 23, atk: 82, def: 65, pas: 87, phy: 80 },
    { name: 'Gerard Moreno', pos: 'ATA', age: 32, atk: 86, def: 42, pas: 82, phy: 78 },
    { name: 'Ayoze Pérez', pos: 'ATA', age: 31, atk: 83, def: 45, pas: 78, phy: 80 }
  ]
};

/**
 * Gera um elenco completo e coerente (20 jogadores) para um determinado clube
 * @param {Object} club 
 * @returns {Array} Array de 20 jogadores
 */
export function generateClubSquad(club) {
  const squad = [];
  const league = getLeagueById(club.leagueId);
  const regionCode = league?.countryCode || 'BR';
  const namePool = ROSTER_NAMES[regionCode] || ROSTER_NAMES.BR;

  // Distribuição equilibrada: 3 GOL, 6 DEF, 6 MEI, 5 ATA = 20 jogadores
  const positionsLayout = [
    { pos: 'GOL', count: 3 },
    { pos: 'DEF', count: 6 },
    { pos: 'MEI', count: 6 },
    { pos: 'ATA', count: 5 }
  ];

  const presets = PRESET_STARS[club.id] ? PRESET_STARS[club.id].map(p => ({ ...p })) : [];
  let presetIndex = 0;
  let playerSequence = 1;

  positionsLayout.forEach(({ pos, count }) => {
    for (let i = 0; i < count; i++) {
      const playerId = `${club.id}_p${String(playerSequence).padStart(2, '0')}`;
      playerSequence++;

      // Se houver estrela pré-definida para esta posição
      const matchingPresetIndex = presets.findIndex(p => p.pos === pos);
      let newPlayer = null;

      if (matchingPresetIndex !== -1) {
        const star = presets.splice(matchingPresetIndex, 1)[0];
        const overall = calculatePlayerOverall({
          attack: star.atk,
          defense: star.def,
          pass: star.pas,
          physical: star.phy,
          position: star.pos
        });

        // Salário e valor de mercado baseados na liga e força
        const mult = league?.currencySymbol === 'R$' ? 1.0 : (league?.currencySymbol === '£' ? 0.35 : 0.4);
        const salary = Math.round((overall * overall * 22) * mult);
        const marketValue = Math.round((overall * overall * 1800 * (34 - Math.min(32, star.age)) / 10) * mult);

        newPlayer = {
          id: playerId,
          clubId: club.id,
          name: star.name,
          age: star.age,
          position: star.pos,
          attack: star.atk,
          defense: star.def,
          pass: star.pas,
          physical: star.phy,
          overall,
          salary,
          marketValue,
          morale: 'Excelente',
          fitness: 98
        };
      } else {
        // Geração com base no Overall do clube e posição
        const variance = (i === 0) ? 2 : (i === 1 ? -1 : -4); // Titular > Reserva imediato > Base
        const targetOvr = Math.min(94, Math.max(58, club.overall + variance + Math.floor((Math.random() * 4) - 2)));

        let atk = targetOvr - 20;
        let def = targetOvr - 20;
        let pas = targetOvr - 15;
        let phy = targetOvr - 10;

        if (pos === 'GOL') {
          def = targetOvr + 3;
          phy = targetOvr;
          pas = Math.max(40, targetOvr - 18);
          atk = Math.max(15, targetOvr - 45);
        } else if (pos === 'DEF') {
          def = targetOvr + 2;
          phy = targetOvr;
          pas = Math.max(45, targetOvr - 10);
          atk = Math.max(25, targetOvr - 30);
        } else if (pos === 'MEI') {
          pas = targetOvr + 2;
          atk = targetOvr - 5;
          def = targetOvr - 8;
          phy = targetOvr - 2;
        } else if (pos === 'ATA') {
          atk = targetOvr + 3;
          phy = targetOvr;
          pas = targetOvr - 8;
          def = Math.max(25, targetOvr - 35);
        }

        // Idade entre 19 e 34
        const age = 19 + Math.floor(Math.random() * 15);

        // Nome gerado aleatoriamente da região
        const firstName = namePool.first[(playerSequence * 7 + i) % namePool.first.length];
        const lastName = namePool.last[(playerSequence * 11 + i) % namePool.last.length];

        const tempPlayer = {
          attack: Math.min(99, Math.max(20, atk)),
          defense: Math.min(99, Math.max(20, def)),
          pass: Math.min(99, Math.max(25, pas)),
          physical: Math.min(99, Math.max(30, phy)),
          position: pos
        };

        const calculatedOvr = calculatePlayerOverall(tempPlayer);
        const mult = league?.currencySymbol === 'R$' ? 1.0 : (league?.currencySymbol === '£' ? 0.35 : 0.4);
        const salary = Math.round((calculatedOvr * calculatedOvr * 18) * mult);
        const marketValue = Math.round((calculatedOvr * calculatedOvr * 1400 * (35 - Math.min(33, age)) / 10) * mult);

        newPlayer = {
          id: playerId,
          clubId: club.id,
          name: `${firstName} ${lastName}`,
          age,
          position: pos,
          attack: tempPlayer.attack,
          defense: tempPlayer.defense,
          pass: tempPlayer.pass,
          physical: tempPlayer.physical,
          overall: calculatedOvr,
          salary,
          marketValue,
          morale: 'Boa',
          fitness: 95 + Math.floor(Math.random() * 5)
        };
      }

      squad.push(newPlayer);
    }
  });

  return squad;
}
