/**
 * @license
 * FUTMANAGER Mobile - js/storage.js
 * Gerenciamento de persistência local via localStorage com validação e segurança
 * Compatível com Etapa 1 e Etapa 2 (Elenco, Escalação e Táticas)
 */

import { generateClubSquad, calculateSquadOverall, getClubById, getClubsByLeague } from './data.js';
import { FORMATIONS, TACTICAL_MENTALITIES, buildOptimalLineup } from './state.js';
import { generateLeagueCalendar, generateInitialStandings } from './game.js';
import { ensureAllLeagueSquads } from './market.js';

export const STORAGE_KEY = 'futmanager_career_save_v1';

/**
 * Salva o estado atual da carreira no localStorage
 * @param {Object} state 
 * @returns {boolean} Sucesso do salvamento
 */
export function saveCareer(state) {
  try {
    if (!state || !state.manager || !state.club) {
      console.warn('Tentativa de salvar estado de carreira incompleto.');
      return false;
    }

    const payload = {
      version: 2, // Versão 2 inclui elenco e táticas
      savedAt: new Date().toISOString(),
      data: state
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch (error) {
    console.error('Erro ao salvar carreira no localStorage:', error);
    return false;
  }
}

/**
 * Carrega e valida o estado da carreira do localStorage com migração segura
 * @returns {Object|null}
 */
export function loadCareer() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (!rawData) return null;

    const parsed = JSON.parse(rawData);

    // Validação estrutural básica
    if (!parsed || !parsed.data || !parsed.data.manager || !parsed.data.club) {
      console.warn('Dados de save corrompidos ou em formato incompatível.');
      return null;
    }

    const state = parsed.data;

    // Migração/Garantia de Retrocompatibilidade para Etapa 2
    // Se for um save da Etapa 1 que não tinha elenco populado:
    if (!state.squad || state.squad.length === 0) {
      state.squad = generateClubSquad(state.club);
    }

    if (!state.tactics) {
      state.tactics = {
        formation: '4-3-3',
        mentality: 'balanced',
        modifiers: { ...TACTICAL_MENTALITIES.balanced }
      };
    } else if (!state.tactics.modifiers) {
      state.tactics.modifiers = { ...(TACTICAL_MENTALITIES[state.tactics.mentality] || TACTICAL_MENTALITIES.balanced) };
    }

    if (!state.lineup || state.lineup.length === 0) {
      state.lineup = buildOptimalLineup(state.squad, state.tactics.formation || '4-3-3');
    }

    // Garante que a força geral reflita os titulares
    state.club.overall = calculateSquadOverall(state.squad, state.lineup);

    // Garante que o clube tenha os dados mais recentes como presidente e estádio
    const clubRef = getClubById(state.club.id);
    if (clubRef) {
      if (!state.club.president) state.club.president = clubRef.president;
      if (!state.club.stadium) state.club.stadium = clubRef.stadium;
    }

    // Migração/Garantia de Retrocompatibilidade para Etapa 4 (Campeonato)
    const allLeagueClubs = getClubsByLeague(state.league.id);
    const expectedClubsCount = allLeagueClubs.length;
    const completedMatchesCount = (state.calendar || []).reduce((acc, r) => acc + (r.matches || []).filter(m => m.completed).length, 0);

    // Se o calendário não existe ou foi gerado com a versão antiga de menos equipes e nenhuma partida foi finalizada
    if (!state.calendar || state.calendar.length === 0 || (completedMatchesCount === 0 && (!state.standings || state.standings.length < expectedClubsCount))) {
      const { calendar, totalRounds } = generateLeagueCalendar(state.league.id);
      state.calendar = calendar;
      state.totalRounds = totalRounds;
      state.standings = generateInitialStandings(state.league.id);
      state.currentRound = 1;
    } else if (state.standings && state.standings.length < expectedClubsCount) {
      // Se já tinha jogos jogados mas faltam clubes na tabela, adiciona os faltantes
      const existingIds = new Set(state.standings.map(s => s.clubId));
      allLeagueClubs.forEach(c => {
        if (!existingIds.has(c.id)) {
          state.standings.push({
            clubId: c.id,
            clubName: c.name,
            shortName: c.shortName,
            primaryColor: c.primaryColor,
            secondaryColor: c.secondaryColor,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            points: 0
          });
        }
      });
      state.standings.sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference || a.clubName.localeCompare(b.clubName));
    }

    if (!state.topScorers) {
      state.topScorers = [];
    }
    if (state.currentRound === undefined || state.currentRound === null) {
      state.currentRound = 1;
    }
    if (state.isSeasonFinished === undefined) {
      state.isSeasonFinished = false;
    }

    // Migração/Garantia de Retrocompatibilidade para Etapa 5 (Finanças e Mercado)
    if (!state.finances) {
      const budget = clubRef?.budget || 20000000;
      const wageBudget = clubRef?.wageBudget || 1500000;
      const monthlyWages = state.squad.reduce((sum, p) => sum + (p.salary || 0), 0);
      state.finances = {
        balance: budget,
        transferBudget: Math.round(budget * 0.75),
        wageBudget: wageBudget,
        weeklyWageExpense: Math.round(monthlyWages / 4),
        monthlyWageExpense: monthlyWages,
        history: [
          {
            id: 'tx_init',
            date: '2026-01-10',
            type: 'initial',
            description: 'Orçamento inicial da temporada',
            amount: budget
          }
        ]
      };
    } else {
      if (!Array.isArray(state.finances.history)) {
        state.finances.history = [];
      }
      if (typeof state.finances.transferBudget !== 'number') {
        state.finances.transferBudget = Math.round((state.finances.balance || 10000000) * 0.75);
      }
      const monthlyWages = state.squad.reduce((sum, p) => sum + (p.salary || 0), 0);
      state.finances.monthlyWageExpense = monthlyWages;
      state.finances.weeklyWageExpense = Math.round(monthlyWages / 4);
    }

    ensureAllLeagueSquads(state);

    return state;
  } catch (error) {
    console.error('Falha ao restaurar dados do localStorage:', error);
    return null;
  }
}

/**
 * Verifica se já existe um save válido
 * @returns {boolean}
 */
export function hasSavedCareer() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (!rawData) return false;
    const parsed = JSON.parse(rawData);
    return !!(parsed && parsed.data && parsed.data.manager && parsed.data.club);
  } catch {
    return false;
  }
}

/**
 * Obtém resumo rápido do save para exibir na tela inicial
 * @returns {Object|null}
 */
export function getSavedCareerSummary() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (!rawData) return null;
    const parsed = JSON.parse(rawData);
    if (!parsed || !parsed.data) return null;

    const { manager, club, league, currentSeason, currentRound } = parsed.data;
    return {
      managerName: `${manager?.firstName || ''} ${manager?.lastName || ''}`.trim(),
      clubName: club?.name || 'Clube',
      leagueName: league?.name || 'Liga',
      round: currentRound || 1,
      season: currentSeason || 2026,
      savedAt: parsed.savedAt
    };
  } catch {
    return null;
  }
}

/**
 * Remove o save atual com segurança
 * @returns {boolean}
 */
export function clearCareer() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Erro ao limpar save:', error);
    return false;
  }
}
