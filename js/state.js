/**
 * @license
 * FUTMANAGER Mobile - js/state.js
 * Estado central da carreira (Single Source of Truth)
 * Inclui Gestão de Elenco, Escalação e Táticas (Etapa 2)
 */

import { getLeagueById, getClubById, generateClubSquad, calculateSquadOverall } from './data.js';
import { generateLeagueCalendar, generateInitialStandings, ensureAllLeaguesInitialized } from './game.js';
import { buyPlayer as marketBuyPlayer, sellPlayer as marketSellPlayer, getAvailableMarketPlayers, ensureAllLeagueSquads } from './market.js';

// Definição das formações com 4 defensores (Regra 4)
export const FORMATIONS = {
  '4-3-3': {
    name: '4-3-3',
    label: '4-3-3 Ofensivo',
    slots: [
      { slotIndex: 0, pos: 'GOL', role: 'Goleiro' },
      { slotIndex: 1, pos: 'DEF', role: 'Lateral-Esq.' },
      { slotIndex: 2, pos: 'DEF', role: 'Zagueiro Central' },
      { slotIndex: 3, pos: 'DEF', role: 'Zagueiro Central' },
      { slotIndex: 4, pos: 'DEF', role: 'Lateral-Dir.' },
      { slotIndex: 5, pos: 'MEI', role: 'Volante' },
      { slotIndex: 6, pos: 'MEI', role: 'Meia Central' },
      { slotIndex: 7, pos: 'MEI', role: 'Meia Ofensivo' },
      { slotIndex: 8, pos: 'ATA', role: 'Ponta-Esquerda' },
      { slotIndex: 9, pos: 'ATA', role: 'Centroavante' },
      { slotIndex: 10, pos: 'ATA', role: 'Ponta-Direita' }
    ]
  },
  '4-4-2': {
    name: '4-4-2',
    label: '4-4-2 Tradicional',
    slots: [
      { slotIndex: 0, pos: 'GOL', role: 'Goleiro' },
      { slotIndex: 1, pos: 'DEF', role: 'Lateral-Esq.' },
      { slotIndex: 2, pos: 'DEF', role: 'Zagueiro Central' },
      { slotIndex: 3, pos: 'DEF', role: 'Zagueiro Central' },
      { slotIndex: 4, pos: 'DEF', role: 'Lateral-Dir.' },
      { slotIndex: 5, pos: 'MEI', role: 'Volante' },
      { slotIndex: 6, pos: 'MEI', role: 'Meia Central' },
      { slotIndex: 7, pos: 'MEI', role: 'Ala Esquerdo' },
      { slotIndex: 8, pos: 'MEI', role: 'Ala Direito' },
      { slotIndex: 9, pos: 'ATA', role: 'Segundo Atacante' },
      { slotIndex: 10, pos: 'ATA', role: 'Centroavante' }
    ]
  },
  '4-2-3-1': {
    name: '4-2-3-1',
    label: '4-2-3-1 Moderno',
    slots: [
      { slotIndex: 0, pos: 'GOL', role: 'Goleiro' },
      { slotIndex: 1, pos: 'DEF', role: 'Lateral-Esq.' },
      { slotIndex: 2, pos: 'DEF', role: 'Zagueiro Central' },
      { slotIndex: 3, pos: 'DEF', role: 'Zagueiro Central' },
      { slotIndex: 4, pos: 'DEF', role: 'Lateral-Dir.' },
      { slotIndex: 5, pos: 'MEI', role: 'Primeiro Volante' },
      { slotIndex: 6, pos: 'MEI', role: 'Segundo Volante' },
      { slotIndex: 7, pos: 'MEI', role: 'Meia Esquerda' },
      { slotIndex: 8, pos: 'MEI', role: 'Meia Central' },
      { slotIndex: 9, pos: 'MEI', role: 'Meia Direita' },
      { slotIndex: 10, pos: 'ATA', role: 'Centroavante' }
    ]
  },
  '4-5-1': {
    name: '4-5-1',
    label: '4-5-1 Reativo',
    slots: [
      { slotIndex: 0, pos: 'GOL', role: 'Goleiro' },
      { slotIndex: 1, pos: 'DEF', role: 'Lateral-Esq.' },
      { slotIndex: 2, pos: 'DEF', role: 'Zagueiro Central' },
      { slotIndex: 3, pos: 'DEF', role: 'Zagueiro Central' },
      { slotIndex: 4, pos: 'DEF', role: 'Lateral-Dir.' },
      { slotIndex: 5, pos: 'MEI', role: 'Volante Recuado' },
      { slotIndex: 6, pos: 'MEI', role: 'Volante' },
      { slotIndex: 7, pos: 'MEI', role: 'Meia Central' },
      { slotIndex: 8, pos: 'MEI', role: 'Ala Esquerdo' },
      { slotIndex: 9, pos: 'MEI', role: 'Ala Direito' },
      { slotIndex: 10, pos: 'ATA', role: 'Centroavante Referência' }
    ]
  }
};

// Modificadores numéricos das posturas táticas (Regra 5)
export const TACTICAL_MENTALITIES = {
  offensive: {
    key: 'offensive',
    name: 'Ofensiva',
    icon: '⚡',
    attackModifier: 1.20,
    defenseModifier: 0.85,
    possessionModifier: 1.05,
    description: 'Aumenta a criação de jogadas e finalizações, mas expõe as linhas defensivas.'
  },
  balanced: {
    key: 'balanced',
    name: 'Equilibrada',
    icon: '⚖️',
    attackModifier: 1.00,
    defenseModifier: 1.00,
    possessionModifier: 1.00,
    description: 'Mantém estabilidade sólida entre chegadas ao ataque e cobertura defensiva.'
  },
  defensive: {
    key: 'defensive',
    name: 'Defensiva',
    icon: '🛡️',
    attackModifier: 0.80,
    defenseModifier: 1.25,
    possessionModifier: 0.95,
    description: 'Linhas recuadas com foco em desarmes e proteção do gol, reduzindo o ataque.'
  }
};

// Estado do rascunho de criação antes de iniciar a carreira
export const managerDraft = {
  firstName: '',
  lastName: '',
  nationality: 'BR',
  attributes: {
    attack: 5,
    defense: 5,
    tactics: 5,
    management: 5
  },
  baseAttrValue: 5,
  maxAttrValue: 15,
  pointsToDistribute: 10
};

/**
 * Reseta os dados de rascunho de criação do técnico
 */
export function resetManagerDraft() {
  managerDraft.firstName = '';
  managerDraft.lastName = '';
  managerDraft.nationality = 'BR';
  managerDraft.attributes.attack = 5;
  managerDraft.attributes.defense = 5;
  managerDraft.attributes.tactics = 5;
  managerDraft.attributes.management = 5;
}

// Estado central da carreira ativa
let careerState = null;

// Ouvintes para mudanças de estado
const listeners = new Set();

/**
 * Retorna uma cópia do estado atual da carreira
 * @returns {Object|null}
 */
export function getCareerState() {
  return careerState ? JSON.parse(JSON.stringify(careerState)) : null;
}

/**
 * Define ou atualiza o estado central da carreira
 * @param {Object} newState 
 */
export function setCareerState(newState) {
  careerState = newState;
  notifyListeners();
}

/**
 * Inscreve um ouvinte para alterações no estado
 * @param {Function} callback 
 * @returns {Function} Função de cancelamento
 */
export function subscribeToState(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notifyListeners() {
  const current = getCareerState();
  listeners.forEach(cb => {
    try {
      cb(current);
    } catch (err) {
      console.error('Erro em ouvinte de estado:', err);
    }
  });
}

/**
 * Validação dos campos de criação do técnico
 * @param {Object} draft 
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateManagerDraft(draft) {
  const errors = [];
  
  if (!draft.firstName || draft.firstName.trim().length < 2) {
    errors.push('O nome deve ter pelo menos 2 caracteres.');
  }

  if (!draft.lastName || draft.lastName.trim().length < 2) {
    errors.push('O sobrenome deve ter pelo menos 2 caracteres.');
  }

  if (!draft.nationality) {
    errors.push('Selecione uma nacionalidade válida.');
  }

  const { attack, defense, tactics, management } = draft.attributes;
  const totalAllocated = (attack - draft.baseAttrValue) + 
                         (defense - draft.baseAttrValue) + 
                         (tactics - draft.baseAttrValue) + 
                         (management - draft.baseAttrValue);

  if (totalAllocated !== draft.pointsToDistribute) {
    const remaining = draft.pointsToDistribute - totalAllocated;
    if (remaining > 0) {
      errors.push(`Você ainda tem ${remaining} ponto(s) para distribuir.`);
    } else {
      errors.push(`Você ultrapassou o limite de pontos em ${Math.abs(remaining)}.`);
    }
  }

  Object.entries(draft.attributes).forEach(([attr, val]) => {
    if (val < draft.baseAttrValue || val > draft.maxAttrValue) {
      errors.push(`O atributo ${attr} deve estar entre ${draft.baseAttrValue} e ${draft.maxAttrValue}.`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Monta automaticamente a melhor escalação para uma determinada formação
 * @param {Array} squad 
 * @param {string} formationKey 
 * @returns {Array} Array de 11 slots preenchidos
 */
export function buildOptimalLineup(squad, formationKey = '4-3-3') {
  const formation = FORMATIONS[formationKey] || FORMATIONS['4-3-3'];
  const lineup = [];
  const assignedPlayerIds = new Set();

  formation.slots.forEach(slot => {
    // Busca os jogadores da mesma posição não escalados ordenados pelo Overall decrescente
    const candidates = squad
      .filter(p => p.position === slot.pos && !assignedPlayerIds.has(p.id))
      .sort((a, b) => b.overall - a.overall);

    let chosenPlayer = candidates[0];

    // Se faltar jogador da posição exata, pega o melhor jogador geral disponível
    if (!chosenPlayer) {
      const anyCandidates = squad
        .filter(p => !assignedPlayerIds.has(p.id))
        .sort((a, b) => b.overall - a.overall);
      chosenPlayer = anyCandidates[0] || null;
    }

    if (chosenPlayer) {
      assignedPlayerIds.add(chosenPlayer.id);
      lineup.push({
        slotIndex: slot.slotIndex,
        pos: slot.pos,
        role: slot.role,
        playerId: chosenPlayer.id
      });
    } else {
      lineup.push({
        slotIndex: slot.slotIndex,
        pos: slot.pos,
        role: slot.role,
        playerId: null
      });
    }
  });

  return lineup;
}

/**
 * Inicializa formalmente uma nova carreira no estado central (Etapa 1 + Etapa 2)
 * @param {Object} managerData 
 * @param {string} leagueId 
 * @param {string} clubId 
 * @returns {Object} Estado inicial da carreira
 */
export function initCareer(managerData, leagueId, clubId) {
  const league = getLeagueById(leagueId);
  const club = getClubById(clubId);

  if (!league || !club) {
    throw new Error('Liga ou clube inválido selecionado.');
  }

  // Geração determinística do elenco de 20 atletas (Etapa 2)
  const squad = generateClubSquad(club);

  // Escalação inicial padrão 4-3-3 com 4 defensores
  const defaultFormationKey = '4-3-3';
  const lineup = buildOptimalLineup(squad, defaultFormationKey);

  // Cálculo da folha salarial real mensal
  const monthlyWages = squad.reduce((acc, p) => acc + p.salary, 0);

  // Cálculo do Overall dinâmico da equipe
  const realOverall = calculateSquadOverall(squad, lineup);

  // Geração do Calendário e Classificação Inicial (Etapa 4)
  const { calendar, totalRounds } = generateLeagueCalendar(league.id);
  const standings = generateInitialStandings(league.id);

  careerState = {
    manager: {
      firstName: managerData.firstName.trim(),
      lastName: managerData.lastName.trim(),
      nationality: managerData.nationality,
      attributes: { ...managerData.attributes },
      hiredDate: '2026-01-10',
      reputation: 2.5
    },
    league: {
      id: league.id,
      name: league.name,
      country: league.country,
      currencySymbol: league.currencySymbol,
      rounds: totalRounds
    },
    club: {
      id: club.id,
      name: club.name,
      shortName: club.shortName,
      president: club.president || 'Diretoria Executiva',
      primaryColor: club.primaryColor,
      secondaryColor: club.secondaryColor,
      reputation: club.reputation,
      overall: realOverall,
      expectation: club.expectation,
      stadium: club.stadium,
      stadiumCapacity: club.stadiumCapacity
    },
    currentSeason: 2026,
    currentRound: 1,
    totalRounds,
    finances: {
      balance: club.budget,
      transferBudget: Math.round(club.budget * 0.75),
      wageBudget: club.wageBudget,
      weeklyWageExpense: Math.round(monthlyWages / 4),
      monthlyWageExpense: monthlyWages,
      history: [
        {
          date: '2026-01-10',
          type: 'initial',
          description: 'Orçamento inicial da temporada',
          amount: club.budget
        }
      ]
    },
    // SISTEMA DE ELENCO E TÁTICAS (ETAPA 2)
    squad,
    lineup,
    tactics: {
      formation: defaultFormationKey,
      mentality: 'balanced', // offensive, balanced, defensive
      modifiers: { ...TACTICAL_MENTALITIES.balanced }
    },
    // CAMPEONATO (ETAPA 4)
    standings,
    calendar,
    topScorers: [],
    aiSquads: {},
    isSeasonFinished: false,
    champion: null,
    // MERCADO E FINANÇAS (ETAPA 5)
    marketPool: null,
    freeAgents: null,
    // COMPETIÇÕES E OUTRAS LIGAS
    otherLeagues: {}
  };

  ensureAllLeaguesInitialized(careerState);
  ensureAllLeagueSquads(careerState);
  notifyListeners();
  return careerState;
}

/**
 * Atualiza a postura tática (Ofensiva, Equilibrada, Defensiva)
 * @param {'offensive'|'balanced'|'defensive'} mentalityKey 
 */
export function updateTacticsMentality(mentalityKey) {
  if (!careerState || !TACTICAL_MENTALITIES[mentalityKey]) return;

  careerState.tactics.mentality = mentalityKey;
  careerState.tactics.modifiers = { ...TACTICAL_MENTALITIES[mentalityKey] };

  notifyListeners();
}

/**
 * Altera a formação tática preservando os jogadores titulares existentes na medida do possível
 * @param {string} formationKey 
 */
export function updateTacticsFormation(formationKey) {
  if (!careerState || !FORMATIONS[formationKey]) return;

  const currentLineup = careerState.lineup || [];
  const currentSquad = careerState.squad || [];
  const targetFormation = FORMATIONS[formationKey];

  // Reaproveita titulares já escalados
  const existingStarterIds = currentLineup.map(s => s.playerId).filter(Boolean);
  const newLineup = [];
  const usedIds = new Set();

  targetFormation.slots.forEach(slot => {
    // Tenta manter um jogador da mesma posição já escalado
    const matchingPrevStarter = currentSquad.find(p => 
      existingStarterIds.includes(p.id) && 
      p.position === slot.pos && 
      !usedIds.has(p.id)
    );

    if (matchingPrevStarter) {
      usedIds.add(matchingPrevStarter.id);
      newLineup.push({
        slotIndex: slot.slotIndex,
        pos: slot.pos,
        role: slot.role,
        playerId: matchingPrevStarter.id
      });
    } else {
      // Se não houver, busca outro atleta elegível do elenco
      const candidate = currentSquad.find(p => p.position === slot.pos && !usedIds.has(p.id)) ||
                        currentSquad.find(p => !usedIds.has(p.id));
      if (candidate) {
        usedIds.add(candidate.id);
        newLineup.push({
          slotIndex: slot.slotIndex,
          pos: slot.pos,
          role: slot.role,
          playerId: candidate.id
        });
      } else {
        newLineup.push({
          slotIndex: slot.slotIndex,
          pos: slot.pos,
          role: slot.role,
          playerId: null
        });
      }
    }
  });

  careerState.tactics.formation = formationKey;
  careerState.lineup = newLineup;

  // Atualiza a força geral do clube
  careerState.club.overall = calculateSquadOverall(careerState.squad, newLineup);

  notifyListeners();
}

/**
 * Escala um jogador em um slot específico, impedindo duplicidade (Regra 4)
 * Se o jogador já estiver em outro slot, realiza o swap ou limpa a posição anterior.
 * @param {number} targetSlotIndex 
 * @param {string} playerId 
 * @returns {{ success: boolean, message?: string }}
 */
export function assignPlayerToLineup(targetSlotIndex, playerId) {
  if (!careerState || !careerState.lineup) {
    return { success: false, message: 'Estado de escalação não inicializado.' };
  }

  const lineup = careerState.lineup;
  const targetSlot = lineup.find(s => s.slotIndex === targetSlotIndex);
  if (!targetSlot) {
    return { success: false, message: 'Posição inválida na escalação.' };
  }

  const player = careerState.squad.find(p => p.id === playerId);
  if (!player) {
    return { success: false, message: 'Jogador não encontrado no elenco.' };
  }

  // Verifica se o jogador já está escalado em outro slot
  const currentSlotIndex = lineup.findIndex(s => s.playerId === playerId);

  if (currentSlotIndex !== -1 && currentSlotIndex !== targetSlotIndex) {
    // Swap: o jogador que estava na vaga alvo vai para a vaga de onde este veio
    const previousOccupantId = targetSlot.playerId;
    lineup[currentSlotIndex].playerId = previousOccupantId;
    lineup[targetSlotIndex].playerId = playerId;
  } else {
    // Atribuição direta
    lineup[targetSlotIndex].playerId = playerId;
  }

  // Recalcula força geral do time
  careerState.club.overall = calculateSquadOverall(careerState.squad, lineup);

  notifyListeners();
  return { success: true };
}

/**
 * Auto-escala os melhores jogadores disponíveis para todos os slots
 */
export function autoOptimizeLineup() {
  if (!careerState || !careerState.squad) return;

  const formationKey = careerState.tactics?.formation || '4-3-3';
  careerState.lineup = buildOptimalLineup(careerState.squad, formationKey);
  careerState.club.overall = calculateSquadOverall(careerState.squad, careerState.lineup);

  notifyListeners();
}

/**
 * Validação da escalação (11 titulares únicos e válidos)
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateCurrentLineup() {
  if (!careerState || !careerState.lineup) {
    return { valid: false, errors: ['Nenhuma escalação encontrada.'] };
  }

  const errors = [];
  const lineup = careerState.lineup;

  if (lineup.length !== 11) {
    errors.push(`A escalação deve conter exatamente 11 jogadores (atualmente: ${lineup.length}).`);
  }

  const usedIds = new Set();
  lineup.forEach((slot, idx) => {
    if (!slot.playerId) {
      errors.push(`A vaga ${slot.role} (${slot.pos}) está desocupada.`);
    } else if (usedIds.has(slot.playerId)) {
      errors.push(`O jogador ${slot.playerId} está escalado em mais de uma posição.`);
    } else {
      usedIds.add(slot.playerId);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Realiza a contratação de um jogador integrando ao estado central
 * @param {Object} player 
 * @returns {{ success: boolean, message: string, player?: Object }}
 */
export function hirePlayer(player) {
  if (!careerState) return { success: false, message: 'Nenhuma carreira ativa.' };
  try {
    const res = marketBuyPlayer(careerState, player);
    notifyListeners();
    return res;
  } catch (err) {
    return { success: false, message: err.message };
  }
}

/**
 * Realiza a venda de um atleta do elenco do usuário
 * @param {string} playerId 
 * @param {number|null} customValue 
 * @returns {{ success: boolean, message: string, amount?: number }}
 */
export function transferOutPlayer(playerId, customValue = null) {
  if (!careerState) return { success: false, message: 'Nenhuma carreira ativa.' };
  try {
    const res = marketSellPlayer(careerState, playerId, customValue);
    notifyListeners();
    return res;
  } catch (err) {
    return { success: false, message: err.message };
  }
}

/**
 * Retorna os jogadores disponíveis no mercado de transferências
 * @returns {Array}
 */
export function getMarketPlayers() {
  if (!careerState) return [];
  return getAvailableMarketPlayers(careerState);
}
