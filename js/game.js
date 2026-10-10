/**
 * @license
 * FUTMANAGER Mobile - js/game.js
 * Regras da carreira, simulação de partidas, eventos, calendário e campeonato (Etapa 4)
 */

import { INITIAL_LEAGUES, getClubsByLeague, getClubById, generateClubSquad, formatMoney } from './data.js';
import { FORMATIONS, TACTICAL_MENTALITIES, buildOptimalLineup } from './state.js';

/* ==========================================================================
   SISTEMA DE CAMPEONATO & CALENDÁRIO (ETAPA 4)
   ========================================================================== */

/**
 * Gera o calendário completo de ida e volta (Turno e Returno) para uma liga
 * Utiliza o algoritmo circular de Round-Robin
 * @param {string} leagueId 
 * @returns {{ calendar: Array, totalRounds: number }}
 */
export function generateLeagueCalendar(leagueId) {
  const clubs = getClubsByLeague(leagueId);
  if (!clubs || clubs.length < 2) {
    return { calendar: [], totalRounds: 0 };
  }

  const teamIds = clubs.map(c => c.id);
  const n = teamIds.length;
  const numRoundsFirstLeg = n - 1;
  const matchesPerRound = n / 2;
  const calendar = [];

  // Primeiro Turno (Ida)
  for (let round = 0; round < numRoundsFirstLeg; round++) {
    const roundNumber = round + 1;
    const matches = [];

    // Array de rotação com teamIds[0] fixo
    const roundTeams = [teamIds[0]];
    for (let i = 1; i < n; i++) {
      const idx = 1 + ((i - 1 + round) % (n - 1));
      roundTeams.push(teamIds[idx]);
    }

    for (let m = 0; m < matchesPerRound; m++) {
      let homeId = roundTeams[m];
      let awayId = roundTeams[n - 1 - m];

      // Alterna mando de campo para o time fixo e distribui equilíbrio
      if (m === 0 && round % 2 === 1) {
        const temp = homeId;
        homeId = awayId;
        awayId = temp;
      } else if (m > 0 && m % 2 === 1) {
        const temp = homeId;
        homeId = awayId;
        awayId = temp;
      }

      matches.push({
        id: `r${roundNumber}_m${m + 1}`,
        roundNumber,
        homeClubId: homeId,
        awayClubId: awayId,
        homeScore: null,
        awayScore: null,
        completed: false,
        scorers: []
      });
    }

    calendar.push({
      roundNumber,
      completed: false,
      matches
    });
  }

  // Segundo Turno (Returno - Mesmos confrontos com mando invertido)
  for (let round = 0; round < numRoundsFirstLeg; round++) {
    const firstLegRound = calendar[round];
    const roundNumber = numRoundsFirstLeg + round + 1;
    const matches = [];

    firstLegRound.matches.forEach((firstLegMatch, idx) => {
      matches.push({
        id: `r${roundNumber}_m${idx + 1}`,
        roundNumber,
        homeClubId: firstLegMatch.awayClubId, // Mando invertido
        awayClubId: firstLegMatch.homeClubId,
        homeScore: null,
        awayScore: null,
        completed: false,
        scorers: []
      });
    });

    calendar.push({
      roundNumber,
      completed: false,
      matches
    });
  }

  return {
    calendar,
    totalRounds: calendar.length
  };
}

/**
 * Cria a tabela de classificação inicial zerada para a liga
 * @param {string} leagueId 
 * @returns {Array} Array de clubes ordenados
 */
export function generateInitialStandings(leagueId) {
  const clubs = getClubsByLeague(leagueId);
  return clubs.map(club => ({
    clubId: club.id,
    clubName: club.name,
    shortName: club.shortName,
    primaryColor: club.primaryColor,
    secondaryColor: club.secondaryColor,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0
  })).sort((a, b) => a.clubName.localeCompare(b.clubName));
}

/**
 * Recalcula a tabela de classificação com base em todas as partidas concluídas do calendário
 * Critérios de desempate oficiais: 1. Pontos, 2. Saldo de gols, 3. Gols pró, 4. Vitórias
 * @param {string} leagueId 
 * @param {Array} calendar 
 * @returns {Array} Classificação atualizada e ordenada
 */
export function recalculateStandings(leagueId, calendar) {
  const standings = generateInitialStandings(leagueId);
  const standingsMap = new Map();
  standings.forEach(row => standingsMap.set(row.clubId, row));

  if (Array.isArray(calendar)) {
    calendar.forEach(round => {
      if (Array.isArray(round.matches)) {
        round.matches.forEach(match => {
          if (match.completed && match.homeScore !== null && match.awayScore !== null) {
            const home = standingsMap.get(match.homeClubId);
            const away = standingsMap.get(match.awayClubId);

            if (home && away) {
              home.played += 1;
              away.played += 1;

              home.goalsFor += match.homeScore;
              home.goalsAgainst += match.awayScore;
              away.goalsFor += match.awayScore;
              away.goalsAgainst += match.homeScore;

              home.goalDifference = home.goalsFor - home.goalsAgainst;
              away.goalDifference = away.goalsFor - away.goalsAgainst;

              if (match.homeScore > match.awayScore) {
                home.won += 1;
                home.points += 3;
                away.lost += 1;
              } else if (match.homeScore < match.awayScore) {
                away.won += 1;
                away.points += 3;
                home.lost += 1;
              } else {
                home.drawn += 1;
                home.points += 1;
                away.drawn += 1;
                away.points += 1;
              }
            }
          }
        });
      }
    });
  }

  // Ordenação: 1. Pontos, 2. Saldo de gols, 3. Gols pró, 4. Vitórias
  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    if (b.won !== a.won) return b.won - a.won;
    return a.clubName.localeCompare(b.clubName);
  });

  return standings;
}

/**
 * Adiciona gol à artilharia do campeonato
 * @param {Array} topScorers 
 * @param {Object} scorer 
 */
function recordGoalInTopScorers(topScorers, { playerId, playerName, clubId, clubName }) {
  if (!topScorers) return;
  let entry = topScorers.find(s => s.playerId === playerId);
  if (!entry) {
    entry = {
      playerId,
      playerName,
      clubId,
      clubName,
      goals: 0
    };
    topScorers.push(entry);
  }
  entry.goals += 1;
}

/**
 * Simula de forma rápida e coerente o resultado de uma partida da IA baseada na força dos clubes
 * @param {Object} homeClub 
 * @param {Object} awayClub 
 * @param {Object} careerState 
 * @returns {{ homeScore: number, awayScore: number, scorers: Array }}
 */
export function simulateAiMatch(homeClub, awayClub, careerState, targetTopScorers = null) {
  if (!careerState.aiSquads) careerState.aiSquads = {};
  if (!careerState.aiSquads[homeClub.id]) {
    careerState.aiSquads[homeClub.id] = generateClubSquad(homeClub);
  }
  if (!careerState.aiSquads[awayClub.id]) {
    careerState.aiSquads[awayClub.id] = generateClubSquad(awayClub);
  }

  const homeSquad = careerState.aiSquads[homeClub.id];
  const awaySquad = careerState.aiSquads[awayClub.id];

  const homeOvr = (homeClub.overall || 75) + 2; // Vantagem de jogar em casa
  const awayOvr = awayClub.overall || 75;
  const diff = (homeOvr - awayOvr) / 10;

  // Expectativa de gols calibrada
  const homeLambda = Math.max(0.4, Math.min(3.4, 1.4 + (diff * 0.4)));
  const awayLambda = Math.max(0.3, Math.min(3.0, 1.05 - (diff * 0.4)));

  const homeGoals = generateRealisticGoals(homeLambda);
  const awayGoals = generateRealisticGoals(awayLambda);

  const scorers = [];
  const topScorersList = targetTopScorers || careerState.topScorers || [];

  for (let i = 0; i < homeGoals; i++) {
    const scorer = pickScorerFromSquad(homeSquad);
    const minute = Math.floor(Math.random() * 90) + 1;
    const scorerData = {
      minute,
      playerId: scorer.id,
      playerName: scorer.name,
      clubId: homeClub.id,
      clubName: homeClub.name
    };
    scorers.push(scorerData);
    recordGoalInTopScorers(topScorersList, scorerData);
  }

  for (let i = 0; i < awayGoals; i++) {
    const scorer = pickScorerFromSquad(awaySquad);
    const minute = Math.floor(Math.random() * 90) + 1;
    const scorerData = {
      minute,
      playerId: scorer.id,
      playerName: scorer.name,
      clubId: awayClub.id,
      clubName: awayClub.name
    };
    scorers.push(scorerData);
    recordGoalInTopScorers(topScorersList, scorerData);
  }

  scorers.sort((a, b) => a.minute - b.minute);

  return {
    homeScore: homeGoals,
    awayScore: awayGoals,
    scorers
  };
}

/**
 * Gera número de gols realista com base na média esperada
 */
function generateRealisticGoals(lambda) {
  const rand = Math.random();
  const p0 = Math.exp(-lambda);
  const p1 = p0 * lambda;
  const p2 = p1 * lambda / 2;
  const p3 = p2 * lambda / 3;
  const p4 = p3 * lambda / 4;

  let cumulative = p0;
  if (rand < cumulative) return 0;
  cumulative += p1;
  if (rand < cumulative) return 1;
  cumulative += p2;
  if (rand < cumulative) return 2;
  cumulative += p3;
  if (rand < cumulative) return 3;
  cumulative += p4;
  if (rand < cumulative) return 4;
  return 5;
}

/**
 * Seleciona um jogador para ser autor do gol com maior peso para atacantes e meias
 */
function pickScorerFromSquad(squad) {
  if (!squad || squad.length === 0) {
    return { id: 'p_generic', name: 'Atacante' };
  }
  const weights = squad.map(p => {
    let posWeight = 1;
    if (p.position === 'ATA') posWeight = 6.0;
    else if (p.position === 'MEI') posWeight = 2.5;
    else if (p.position === 'DEF') posWeight = 0.5;
    else if (p.position === 'GOL') posWeight = 0.01;
    return (p.attack || 60) * posWeight;
  });

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * totalWeight;
  for (let i = 0; i < squad.length; i++) {
    r -= weights[i];
    if (r <= 0) return squad[i];
  }
  return squad[0];
}

/**
 * Retorna as informações do próximo confronto com base no calendário oficial do campeonato
 * @param {Object} careerState 
 * @returns {Object|null}
 */
export function getNextMatchPreview(careerState) {
  if (!careerState || !careerState.club || !careerState.league) {
    return null;
  }

  if (careerState.isSeasonFinished) {
    return {
      isSeasonFinished: true,
      round: careerState.totalRounds,
      totalRounds: careerState.totalRounds,
      champion: careerState.champion || (careerState.standings && careerState.standings[0]) || null,
      topScorer: careerState.topScorers && careerState.topScorers[0] ? careerState.topScorers[0] : null
    };
  }

  let roundData = null;
  let userMatch = null;

  if (Array.isArray(careerState.calendar)) {
    // 1º tenta a rodada apontada por currentRound
    const currentRoundNum = careerState.currentRound || 1;
    const currentRound = careerState.calendar.find(r => r.roundNumber === currentRoundNum);
    if (currentRound && Array.isArray(currentRound.matches)) {
      const match = currentRound.matches.find(
        m => (m.homeClubId === careerState.club.id || m.awayClubId === careerState.club.id) && !m.completed
      );
      if (match) {
        roundData = currentRound;
        userMatch = match;
      }
    }

    // 2º se a partida atual já foi concluída, busca a primeira rodada com partida do usuário pendente
    if (!userMatch) {
      for (const r of careerState.calendar) {
        if (!r.completed && Array.isArray(r.matches)) {
          const match = r.matches.find(
            m => (m.homeClubId === careerState.club.id || m.awayClubId === careerState.club.id) && !m.completed
          );
          if (match) {
            roundData = r;
            userMatch = match;
            careerState.currentRound = r.roundNumber;
            break;
          }
        }
      }
    }
  }

  // Se não encontrar nenhuma partida pendente, a temporada terminou
  if (!userMatch || !roundData) {
    careerState.isSeasonFinished = true;
    return {
      isSeasonFinished: true,
      round: careerState.totalRounds || (careerState.calendar?.length || 38),
      totalRounds: careerState.totalRounds || (careerState.calendar?.length || 38),
      champion: careerState.champion || (careerState.standings && careerState.standings[0]) || null,
      topScorer: careerState.topScorers && careerState.topScorers[0] ? careerState.topScorers[0] : null
    };
  }

  const isHome = userMatch.homeClubId === careerState.club.id;
  const oppClubId = isHome ? userMatch.awayClubId : userMatch.homeClubId;
  const opponentClub = getClubById(oppClubId);

  const homeTeam = isHome ? careerState.club : opponentClub;
  const awayTeam = isHome ? opponentClub : careerState.club;

  return {
    round: roundData.roundNumber,
    totalRounds: careerState.totalRounds || (careerState.calendar?.length || 38),
    isHome,
    homeTeam,
    awayTeam,
    userTeam: careerState.club,
    opponentTeam: opponentClub,
    competition: careerState.league.name,
    stadium: homeTeam.stadium,
    fixtureId: userMatch.id,
    isSeasonFinished: false
  };
}

/**
 * Obtém resumo da situação atual do campeonato
 * @param {Object} careerState 
 * @returns {Object}
 */
export function getLeagueStatusSummary(careerState) {
  if (!careerState) return null;

  let userPosition = '-';
  if (careerState.standings && careerState.club) {
    const idx = careerState.standings.findIndex(s => s.clubId === careerState.club.id);
    if (idx !== -1) userPosition = `${idx + 1}º`;
  }

  return {
    leagueName: careerState.league?.name || '',
    round: careerState.currentRound || 1,
    totalRounds: careerState.totalRounds || (careerState.calendar?.length || 38),
    season: careerState.currentSeason || 2026,
    userClubPosition: userPosition,
    isSeasonFinished: !!careerState.isSeasonFinished,
    champion: careerState.champion || null
  };
}

/* ==========================================================================
   MOTOR DE SIMULAÇÃO DE PARTIDAS (ETAPA 3 & 4)
   ========================================================================== */

/**
 * Cria e inicializa um novo objeto de simulação de partida
 * Suporta o usuário jogando tanto como Mandante (Home) quanto como Visitante (Away)
 * @param {Object} careerState 
 * @param {Object} matchPreviewOrOpponent 
 * @returns {Object} Instância da partida
 */
export function createMatchSimulation(careerState, matchPreviewOrOpponent) {
  const userClub = careerState.club;
  const userSquad = careerState.squad || [];
  const userLineup = careerState.lineup || [];
  const userTactics = careerState.tactics || { formation: '4-3-3', mentality: 'balanced', modifiers: TACTICAL_MENTALITIES.balanced };

  // Verifica se o objeto passado é um matchPreview completo ou apenas o clube adversário
  let isUserHome = true;
  let opponentClub = null;

  if (matchPreviewOrOpponent && matchPreviewOrOpponent.opponentTeam) {
    isUserHome = matchPreviewOrOpponent.isHome;
    opponentClub = matchPreviewOrOpponent.opponentTeam;
  } else {
    opponentClub = matchPreviewOrOpponent || getClubsByLeague(careerState.league.id).find(c => c.id !== userClub.id);
    const nextPreview = getNextMatchPreview(careerState);
    if (nextPreview && nextPreview.opponentTeam && nextPreview.opponentTeam.id === opponentClub.id) {
      isUserHome = nextPreview.isHome;
    }
  }

  // Titulares do usuário
  const userStarterIds = userLineup.map(s => s.playerId).filter(Boolean);
  const userStarters = userSquad.filter(p => userStarterIds.includes(p.id));
  const userBench = userSquad.filter(p => !userStarterIds.includes(p.id));

  // Adversário: obtém ou gera elenco e escalação
  if (!careerState.aiSquads) careerState.aiSquads = {};
  if (!careerState.aiSquads[opponentClub.id]) {
    careerState.aiSquads[opponentClub.id] = generateClubSquad(opponentClub);
  }
  const oppSquad = careerState.aiSquads[opponentClub.id];
  const oppLineup = buildOptimalLineup(oppSquad, '4-4-2');
  const oppStarterIds = oppLineup.map(s => s.playerId).filter(Boolean);
  const oppStarters = oppSquad.filter(p => oppStarterIds.includes(p.id));
  const oppBench = oppSquad.filter(p => !oppStarterIds.includes(p.id));

  const homeTeam = isUserHome ? userClub : opponentClub;
  const awayTeam = isUserHome ? opponentClub : userClub;

  const homeStarters = isUserHome ? [...userStarters] : [...oppStarters];
  const homeBench = isUserHome ? [...userBench] : [...oppBench];
  const awayStarters = isUserHome ? [...oppStarters] : [...userStarters];
  const awayBench = isUserHome ? [...oppBench] : [...userBench];

  const homeTactics = isUserHome ? { ...userTactics } : { formation: '4-4-2', mentality: 'balanced', modifiers: TACTICAL_MENTALITIES.balanced };
  const awayTactics = isUserHome ? { formation: '4-4-2', mentality: 'balanced', modifiers: TACTICAL_MENTALITIES.balanced } : { ...userTactics };

  // Acréscimos de cada tempo
  const stoppage1 = Math.floor(Math.random() * 3) + 1;
  const stoppage2 = Math.floor(Math.random() * 4) + 2;

  // Cálculo da posse inicial esperada
  const homeMidfieldAvg = getPositionAvg(homeStarters, 'MEI', 70);
  const awayMidfieldAvg = getPositionAvg(awayStarters, 'MEI', 70);
  const homeMod = homeTactics.modifiers?.possessionModifier || 1.0;
  const awayMod = awayTactics.modifiers?.possessionModifier || 1.0;

  let baseHomePossession = Math.round(50 + ((homeMidfieldAvg - awayMidfieldAvg) * 0.8) + ((homeMod - awayMod) * 25));
  baseHomePossession = Math.min(68, Math.max(32, baseHomePossession));

  return {
    homeTeam,
    awayTeam,
    isUserHome,
    userClub,
    stadium: homeTeam.stadium,
    competition: careerState.league.name,
    round: careerState.currentRound || 1,

    homeTactics,
    awayTactics,

    homeStarters,
    homeBench,
    awayStarters,
    awayBench,

    homeSubsUsed: 0,
    awaySubsUsed: 0,
    maxSubs: 5,
    substitutedOutIds: new Set(),

    minute: 0,
    stoppageTime1: stoppage1,
    stoppageTime2: stoppage2,
    status: 'not_started', // not_started, first_half, halftime, second_half, finished

    homeScore: 0,
    awayScore: 0,
    scorers: [], // [{ minute, playerId, playerName, clubId, clubName }]

    events: [
      {
        minute: 0,
        type: 'info',
        text: `Bola rolando no estádio ${homeTeam.stadium}! Início de ${homeTeam.name} x ${awayTeam.name}.`
      }
    ],

    stats: {
      possession: { home: baseHomePossession, away: 100 - baseHomePossession },
      shots: { home: 0, away: 0 },
      shotsOnTarget: { home: 0, away: 0 },
      corners: { home: 0, away: 0 },
      fouls: { home: 0, away: 0 },
      yellowCards: { home: 0, away: 0 },
      redCards: { home: 0, away: 0 },
      injuries: { home: 0, away: 0 }
    },

    playerYellowCards: {}
  };
}

/**
 * Avança a simulação da partida em 1 minuto cronológico
 * @param {Object} match 
 * @returns {Object|null} Novo evento gerado ou null
 */
export function simulateMatchMinute(match) {
  if (match.status === 'not_started' || match.status === 'finished' || match.status === 'halftime') {
    return null;
  }

  match.minute += 1;

  // Controle de fim do 1º tempo
  if (match.status === 'first_half') {
    if (match.minute >= (45 + match.stoppageTime1)) {
      match.status = 'halftime';
      const event = {
        minute: match.minute,
        type: 'info',
        text: `⏸ Fim do primeiro tempo! O árbitro apita o intervalo. Placar: ${match.homeTeam.shortName} ${match.homeScore} x ${match.awayScore} ${match.awayTeam.shortName}.`
      };
      match.events.unshift(event);
      return event;
    }
  }

  // Controle de fim do 2º tempo
  if (match.status === 'second_half') {
    if (match.minute >= (90 + match.stoppageTime2)) {
      match.status = 'finished';
      const event = {
        minute: match.minute,
        type: 'info',
        text: `🏁 Apito final no estádio ${match.stadium}! Fim de jogo: ${match.homeTeam.name} ${match.homeScore} x ${match.awayScore} ${match.awayTeam.name}.`
      };
      match.events.unshift(event);
      return event;
    }
  }

  // Probabilidade de ocorrência de lance relevante neste minuto (~28%)
  const eventChance = Math.random();
  if (eventChance > 0.28) {
    return null;
  }

  // Determina qual time tem a iniciativa do lance
  const homeAttackPwr = getTeamSectorPower(match.homeStarters, 'ATA', match.homeTactics.modifiers?.attackModifier || 1.0);
  const homeDefPwr = getTeamSectorPower(match.homeStarters, 'DEF', match.homeTactics.modifiers?.defenseModifier || 1.0);
  const awayAttackPwr = getTeamSectorPower(match.awayStarters, 'ATA', match.awayTactics.modifiers?.attackModifier || 1.0);
  const awayDefPwr = getTeamSectorPower(match.awayStarters, 'DEF', match.awayTactics.modifiers?.defenseModifier || 1.0);

  // Vantagem de jogar em casa (+4% de peso)
  const homeWeight = (homeAttackPwr / (homeAttackPwr + awayDefPwr)) * 1.04;
  const isHomeAttacking = Math.random() < homeWeight;

  const attackingTeam = isHomeAttacking ? match.homeTeam : match.awayTeam;
  const defendingTeam = isHomeAttacking ? match.awayTeam : match.homeTeam;
  const attackingStarters = isHomeAttacking ? match.homeStarters : match.awayStarters;
  const defendingStarters = isHomeAttacking ? match.awayStarters : match.homeStarters;
  const attackKey = isHomeAttacking ? 'home' : 'away';
  const defKey = isHomeAttacking ? 'away' : 'home';

  const forwards = attackingStarters.filter(p => p.position === 'ATA');
  const midfielders = attackingStarters.filter(p => p.position === 'MEI');
  const defenders = defendingStarters.filter(p => p.position === 'DEF');
  const goalkeepers = defendingStarters.filter(p => p.position === 'GOL');

  const primaryAttacker = forwards.length > 0 ? forwards[Math.floor(Math.random() * forwards.length)] : attackingStarters[0];
  const primaryMidfielder = midfielders.length > 0 ? midfielders[Math.floor(Math.random() * midfielders.length)] : attackingStarters[1];
  const primaryDefender = defenders.length > 0 ? defenders[Math.floor(Math.random() * defenders.length)] : defendingStarters[0];
  const opposingKeeper = goalkeepers.length > 0 ? goalkeepers[0] : defendingStarters[0];

  const roll = Math.random();
  let generatedEvent = null;

  if (roll < 0.60) {
    // FINALIZAÇÃO
    match.stats.shots[attackKey] += 1;

    const shotQuality = (primaryAttacker.attack * 0.6) + (primaryAttacker.physical * 0.4);
    const defenseResistance = (opposingKeeper.defense * 0.65) + (primaryDefender.defense * 0.35);

    const onTargetChance = (shotQuality / (shotQuality + defenseResistance)) * 1.1;
    const isOnTarget = Math.random() < Math.min(0.85, Math.max(0.30, onTargetChance));

    if (isOnTarget) {
      match.stats.shotsOnTarget[attackKey] += 1;

      const goalProbability = ((shotQuality - defenseResistance + 30) / 100) * 0.38;
      const isGoal = Math.random() < Math.max(0.10, Math.min(0.48, goalProbability));

      if (isGoal) {
        if (isHomeAttacking) match.homeScore += 1;
        else match.awayScore += 1;

        if (!match.scorers) match.scorers = [];
        match.scorers.push({
          minute: match.minute,
          playerId: primaryAttacker.id,
          playerName: primaryAttacker.name,
          clubId: attackingTeam.id,
          clubName: attackingTeam.name
        });

        const assists = [
          `após passe açucarado de ${primaryMidfielder.name}`,
          `em linda jogada individual pela ponta`,
          `pegando rebote dentro da pequena área`,
          `com um chute colocado indefensável no ângulo`
        ];
        const assistText = assists[Math.floor(Math.random() * assists.length)];

        generatedEvent = {
          minute: match.minute,
          type: 'goal',
          team: attackKey,
          player: primaryAttacker.name,
          text: `⚽ GOL DO ${attackingTeam.shortName}! ${primaryAttacker.name} balança as redes ${assistText}! (${match.homeScore} x ${match.awayScore})`
        };
      } else {
        const savePhrases = [
          `DEFESAÇA! ${opposingKeeper.name} se estica todo e espalma o chute de ${primaryAttacker.name}!`,
          `${opposingKeeper.name} sai bem do gol e faz intervenção providencial evitando o gol de ${primaryAttacker.name}.`,
          `Finalização firme de ${primaryAttacker.name}, mas o goleiro ${opposingKeeper.name} segura firme!`
        ];
        generatedEvent = {
          minute: match.minute,
          type: 'save',
          team: defKey,
          player: opposingKeeper.name,
          text: `🧤 ${savePhrases[Math.floor(Math.random() * savePhrases.length)]}`
        };
      }
    } else {
      const missPhrases = [
        `${primaryAttacker.name} tenta o chute colocado da entrada da área, mas a bola vai à direita do gol!`,
        `${primaryAttacker.name} cabeceia após cruzamento, mas manda por cima do travessão.`,
        `Finalização precipitada de ${primaryAttacker.name}, bola sai direto pela linha de fundo.`
      ];
      generatedEvent = {
        minute: match.minute,
        type: 'shot_miss',
        team: attackKey,
        player: primaryAttacker.name,
        text: `⚠️ ${missPhrases[Math.floor(Math.random() * missPhrases.length)]}`
      };
    }
  } else if (roll < 0.78) {
    // FALTA / CARTÕES
    match.stats.fouls[defKey] += 1;

    const cardRoll = Math.random();
    if (cardRoll < 0.35) {
      match.stats.yellowCards[defKey] += 1;
      const count = (match.playerYellowCards[primaryDefender.id] || 0) + 1;
      match.playerYellowCards[primaryDefender.id] = count;

      if (count >= 2) {
        match.stats.redCards[defKey] += 1;
        generatedEvent = {
          minute: match.minute,
          type: 'card_red',
          team: defKey,
          player: primaryDefender.name,
          text: `🟥 EXPULSÃO! Segundo cartão amarelo para ${primaryDefender.name} (${defendingTeam.shortName}), que vai para o chuveiro mais cedo!`
        };
      } else {
        generatedEvent = {
          minute: match.minute,
          type: 'card_yellow',
          team: defKey,
          player: primaryDefender.name,
          text: `🟨 Cartão Amarelo para ${primaryDefender.name} (${defendingTeam.shortName}) após falta dura interrompendo o ataque.`
        };
      }
    } else {
      generatedEvent = {
        minute: match.minute,
        type: 'foul',
        team: defKey,
        text: `🚩 Falta cometida por ${primaryDefender.name} sobre ${primaryAttacker.name} no setor intermediário.`
      };
    }
  } else if (roll < 0.95) {
    // ESCANTEIO
    match.stats.corners[attackKey] += 1;
    generatedEvent = {
      minute: match.minute,
      type: 'corner',
      team: attackKey,
      text: `🚩 Escanteio para o ${attackingTeam.shortName}. ${primaryMidfielder.name} vai para a cobrança na área.`
    };
  } else {
    // CONTUSÃO / DESGASTE
    match.stats.injuries[attackKey] += 1;
    generatedEvent = {
      minute: match.minute,
      type: 'injury',
      team: attackKey,
      player: primaryAttacker.name,
      text: `🚑 ${primaryAttacker.name} desaba no gramado sentindo dores musculares e recebe atendimento médico.`
    };
  }

  if (generatedEvent) {
    match.events.unshift(generatedEvent);
    if (match.events.length > 50) {
      match.events.pop();
    }
  }

  return generatedEvent;
}

function getPositionAvg(squad, pos, fallback = 70) {
  const filtered = squad.filter(p => p.position === pos);
  if (filtered.length === 0) return fallback;
  return filtered.reduce((sum, p) => sum + p.overall, 0) / filtered.length;
}

function getTeamSectorPower(starters, pos, modifier = 1.0) {
  let sector = starters.filter(p => p.position === pos);
  if (sector.length === 0) {
    sector = starters;
  }
  const avg = sector.reduce((sum, p) => sum + p.overall, 0) / sector.length;
  return avg * modifier;
}

/**
 * Executa uma substituição de jogador em tempo real durante a partida
 * @param {Object} match 
 * @param {string} playerOutId 
 * @param {string} playerInId 
 * @returns {{ success: boolean, message?: string }}
 */
export function substitutePlayerInMatch(match, playerOutId, playerInId) {
  if (match.status === 'finished') {
    return { success: false, message: 'A partida já terminou.' };
  }

  const isUserHome = match.isUserHome !== false;
  const userSubsUsed = isUserHome ? match.homeSubsUsed : match.awaySubsUsed;
  const userStarters = isUserHome ? match.homeStarters : match.awayStarters;
  const userBench = isUserHome ? match.homeBench : match.awayBench;
  const userTeam = isUserHome ? match.homeTeam : match.awayTeam;
  const userTeamKey = isUserHome ? 'home' : 'away';

  if (userSubsUsed >= match.maxSubs) {
    return { success: false, message: 'Limite máximo de 5 substituições atingido.' };
  }

  const outIndex = userStarters.findIndex(p => p.id === playerOutId);
  if (outIndex === -1) {
    return { success: false, message: 'O jogador a ser substituído não está em campo.' };
  }

  if (match.substitutedOutIds.has(playerInId)) {
    return { success: false, message: 'Jogador que já saiu não pode retornar à partida.' };
  }

  const inIndex = userBench.findIndex(p => p.id === playerInId);
  if (inIndex === -1) {
    return { success: false, message: 'Jogador substituto não disponível no banco.' };
  }

  const playerOut = userStarters[outIndex];
  const playerIn = userBench[inIndex];

  userStarters.splice(outIndex, 1, playerIn);
  userBench.splice(inIndex, 1);
  match.substitutedOutIds.add(playerOut.id);
  if (isUserHome) {
    match.homeSubsUsed += 1;
  } else {
    match.awaySubsUsed += 1;
  }

  const event = {
    minute: match.minute,
    type: 'sub',
    team: userTeamKey,
    text: `🔄 Substituição no ${userTeam.shortName}: Sai ${playerOut.name} (${playerOut.position}), entra ${playerIn.name} (${playerIn.position}).`
  };
  match.events.unshift(event);

  return { success: true, event };
}

/**
 * Conclui a partida, simula os outros jogos da rodada, atualiza a classificação e avança a temporada
 * @param {Object} careerState 
 * @param {Object} match 
 * @returns {Object} Estado atualizado da carreira
 */
export function finalizeMatchResult(careerState, match) {
  if (!careerState || !match) return null;
  if (match._isFinalized) return careerState;
  match._isFinalized = true;

  const userClubId = careerState.club.id;
  const isUserHome = match.homeTeam.id === userClubId;
  const userScore = isUserHome ? match.homeScore : match.awayScore;
  const oppScore = isUserHome ? match.awayScore : match.homeScore;
  const userWon = userScore > oppScore;
  const isDraw = userScore === oppScore;

  // Registrar no histórico de partidas do usuário
  const matchRecord = {
    id: `match_r${match.round}_${Date.now()}`,
    round: match.round,
    competition: match.competition,
    homeTeam: { id: match.homeTeam.id, name: match.homeTeam.name, shortName: match.homeTeam.shortName },
    awayTeam: { id: match.awayTeam.id, name: match.awayTeam.name, shortName: match.awayTeam.shortName },
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    userWon,
    isDraw,
    scorers: match.scorers ? [...match.scorers] : [],
    events: [...match.events],
    stats: { ...match.stats },
    date: new Date().toISOString()
  };

  if (!careerState.matchHistory) {
    careerState.matchHistory = [];
  }
  careerState.matchHistory.unshift(matchRecord);
  careerState.lastMatchResult = matchRecord;

  // 1. Registrar artilheiros do jogo do usuário na artilharia geral
  if (!careerState.topScorers) careerState.topScorers = [];
  if (Array.isArray(match.scorers)) {
    match.scorers.forEach(scorer => {
      recordGoalInTopScorers(careerState.topScorers, scorer);
    });
  }

  // 2. Localizar a rodada correspondente no calendário e registrar o resultado do usuário
  let roundData = null;
  if (Array.isArray(careerState.calendar)) {
    // 1º tenta encontrar pelo número exato da rodada do jogo
    roundData = careerState.calendar.find(r => r.roundNumber === match.round);
    // 2º se não encontrou ou já estava completa, busca a primeira rodada pendente que tenha o time do usuário
    if (!roundData || roundData.completed) {
      roundData = careerState.calendar.find(r => !r.completed && r.matches.some(m => m.homeClubId === userClubId || m.awayClubId === userClubId));
    }
    // 3º fallback por índice
    if (!roundData) {
      const currentRoundIndex = Math.max(0, (careerState.currentRound || 1) - 1);
      roundData = careerState.calendar[currentRoundIndex];
    }
  }

  const finishedRoundNumber = roundData ? roundData.roundNumber : (match.round || careerState.currentRound || 1);

  if (roundData && Array.isArray(roundData.matches)) {
    // Localizar a partida do usuário nesta rodada (tanto em casa quanto fora)
    const userFixture = roundData.matches.find(
      m => (m.homeClubId === match.homeTeam.id && m.awayClubId === match.awayTeam.id) ||
           (m.homeClubId === userClubId || m.awayClubId === userClubId)
    );

    if (userFixture) {
      userFixture.homeScore = match.homeScore;
      userFixture.awayScore = match.awayScore;
      userFixture.completed = true;
      userFixture.scorers = Array.isArray(match.scorers) ? [...match.scorers] : [];
    }

    // 3. Simular todos os OUTROS jogos desta mesma rodada automaticamente
    roundData.matches.forEach(fixture => {
      if (!fixture.completed) {
        const homeClub = getClubById(fixture.homeClubId);
        const awayClub = getClubById(fixture.awayClubId);
        if (homeClub && awayClub) {
          const aiResult = simulateAiMatch(homeClub, awayClub, careerState);
          fixture.homeScore = aiResult.homeScore;
          fixture.awayScore = aiResult.awayScore;
          fixture.completed = true;
          fixture.scorers = aiResult.scorers || [];
        }
      }
    });

    roundData.completed = true;
  }

  // 4. Recalcular a tabela oficial de classificação
  careerState.standings = recalculateStandings(careerState.league.id, careerState.calendar);

  // 5. Ordenar a artilharia
  careerState.topScorers.sort((a, b) => b.goals - a.goals || a.playerName.localeCompare(b.playerName));

  // 6. Atualizar desgaste físico e moral dos jogadores
  if (careerState.squad) {
    const userStarters = (isUserHome ? match.homeStarters : match.awayStarters) || [];
    const subOutSet = match.substitutedOutIds;
    careerState.squad.forEach(player => {
      const isSubbedOut = subOutSet instanceof Set ? subOutSet.has(player.id) : (Array.isArray(subOutSet) ? subOutSet.includes(player.id) : false);
      const played = userStarters.some(p => p.id === player.id) || isSubbedOut;
      if (played) {
        player.fitness = Math.max(65, player.fitness - (Math.floor(Math.random() * 4) + 4));
        if (userWon) {
          player.morale = 'Excelente';
        } else if (isDraw) {
          player.morale = 'Boa';
        } else {
          player.morale = player.morale === 'Excelente' ? 'Boa' : 'Normal';
        }
      } else {
        player.fitness = Math.min(100, player.fitness + 2);
      }
    });
  }

  // 7. Receita de bilheteria se jogou em casa
  if (isUserHome && careerState.finances) {
    const ticketPrice = careerState.league.currencySymbol === 'R$' ? 65 : 45;
    const attendance = Math.round(careerState.club.stadiumCapacity * (0.65 + Math.random() * 0.25));
    const ticketRevenue = attendance * ticketPrice;
    
    careerState.finances.balance += ticketRevenue;
    careerState.finances.history.push({
      date: new Date().toISOString().split('T')[0],
      type: 'match_tickets',
      description: `Bilheteria vs ${match.awayTeam.name} (${attendance.toLocaleString('pt-BR')} torcedores)`,
      amount: ticketRevenue
    });
  }

  // 8. Avançar rodada ou encerrar temporada se for a última rodada
  const pendingRound = Array.isArray(careerState.calendar) ? careerState.calendar.find(r => !r.completed) : null;
  if (!pendingRound) {
    careerState.isSeasonFinished = true;
    careerState.currentRound = careerState.calendar ? careerState.calendar.length : (careerState.totalRounds || 38);
    careerState.champion = careerState.standings ? careerState.standings[0] : null;
  } else {
    careerState.currentRound = pendingRound.roundNumber;
  }

  // 9. Simular rodada correspondente em TODAS as outras ligas (Brasil, Inglaterra, Espanha)
  // Garante que todas as competições avancem sincronizadas rodada a rodada
  advanceOtherLeagues(careerState, finishedRoundNumber);

  return careerState;
}

/**
 * Inicializa ou assegura a estrutura de todas as ligas (Brasil, Inglaterra, Espanha) na carreira
 * @param {Object} careerState 
 */
export function ensureAllLeaguesInitialized(careerState) {
  if (!careerState) return;

  if (!careerState.otherLeagues || typeof careerState.otherLeagues !== 'object') {
    careerState.otherLeagues = {};
  }

  INITIAL_LEAGUES.forEach(league => {
    // Se for a liga principal do usuário, sincroniza com os campos de topo
    if (league.id === careerState.league.id) {
      careerState.otherLeagues[league.id] = {
        leagueId: league.id,
        name: league.name,
        country: league.country,
        flag: league.flag,
        currencySymbol: league.currencySymbol,
        totalRounds: careerState.totalRounds || (careerState.calendar?.length || 38),
        currentRound: careerState.currentRound || 1,
        calendar: careerState.calendar,
        standings: careerState.standings,
        topScorers: careerState.topScorers || [],
        isSeasonFinished: !!careerState.isSeasonFinished,
        champion: careerState.champion || null
      };
      return;
    }

    // Se a outra liga ainda não foi inicializada ou tem menos de 20 clubes (atualização de formato)
    const existingOther = careerState.otherLeagues[league.id];
    const expectedClubsCount = getClubsByLeague(league.id).length;
    if (!existingOther || !Array.isArray(existingOther.calendar) || !Array.isArray(existingOther.standings) || existingOther.standings.length < expectedClubsCount) {
      const { calendar, totalRounds } = generateLeagueCalendar(league.id);
      const standings = generateInitialStandings(league.id);
      careerState.otherLeagues[league.id] = {
        leagueId: league.id,
        name: league.name,
        country: league.country,
        flag: league.flag,
        currencySymbol: league.currencySymbol,
        totalRounds,
        currentRound: 1,
        calendar,
        standings,
        topScorers: [],
        isSeasonFinished: false,
        champion: null
      };
    }
  });
}

/**
 * Avança e simula os jogos da rodada para todas as outras ligas
 * @param {Object} careerState 
 * @param {number} roundNumber Rodada que acabou de ser concluída
 */
export function advanceOtherLeagues(careerState, roundNumber) {
  if (!careerState) return;
  ensureAllLeaguesInitialized(careerState);

  INITIAL_LEAGUES.forEach(league => {
    // A liga do usuário já foi simulada na partida principal
    if (league.id === careerState.league.id) {
      if (careerState.otherLeagues && careerState.otherLeagues[league.id]) {
        careerState.otherLeagues[league.id].currentRound = careerState.currentRound;
        careerState.otherLeagues[league.id].standings = careerState.standings;
        careerState.otherLeagues[league.id].calendar = careerState.calendar;
        careerState.otherLeagues[league.id].topScorers = careerState.topScorers;
        careerState.otherLeagues[league.id].isSeasonFinished = careerState.isSeasonFinished;
        careerState.otherLeagues[league.id].champion = careerState.champion;
      }
      return;
    }

    const otherData = careerState.otherLeagues[league.id];
    if (!otherData || otherData.isSeasonFinished) return;

    if (!Array.isArray(otherData.topScorers)) {
      otherData.topScorers = [];
    }

    // Simula a rodada correspondente se ainda não estiver concluída
    const roundData = otherData.calendar.find(r => r.roundNumber === roundNumber);
    if (roundData && !roundData.completed && Array.isArray(roundData.matches)) {
      roundData.matches.forEach(match => {
        if (!match.completed) {
          const homeClub = getClubById(match.homeClubId);
          const awayClub = getClubById(match.awayClubId);
          if (homeClub && awayClub) {
            const result = simulateAiMatch(homeClub, awayClub, careerState, otherData.topScorers);
            match.homeScore = result.homeScore;
            match.awayScore = result.awayScore;
            match.completed = true;
            match.scorers = result.scorers || [];
          }
        }
      });
      roundData.completed = true;

      // Recalcular classificação independente da outra liga
      otherData.standings = recalculateStandings(league.id, otherData.calendar);

      // Avançar rodada da outra liga
      const nextPending = otherData.calendar.find(r => !r.completed);
      if (!nextPending) {
        otherData.isSeasonFinished = true;
        otherData.currentRound = otherData.totalRounds;
        otherData.champion = otherData.standings[0] || null;
      } else {
        otherData.currentRound = nextPending.roundNumber;
      }
    }
  });
}

