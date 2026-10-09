/**
 * @license
 * FUTMANAGER Mobile - js/market.js
 * Mercado de Transferências, Negociações Interativas (Clube + Jogador) e Gestão Financeira (Etapa 5)
 */

import {
  formatMoney,
  calculatePlayerOverall,
  getLeagueById,
  getClubsByLeague,
  getClubById,
  calculateSquadOverall,
  generateClubSquad,
  ROSTER_NAMES
} from './data.js';
import { buildOptimalLineup } from './state.js';

/**
 * Retorna o resumo financeiro consolidado e formatado do clube
 * @param {Object} careerState 
 * @returns {Object}
 */
export function getFinancialOverview(careerState) {
  if (!careerState || !careerState.finances) {
    return {
      balance: 0,
      balanceFormatted: '0',
      transferBudget: 0,
      transferBudgetFormatted: '0',
      wageBudget: 0,
      wageBudgetFormatted: '0',
      monthlyWageExpense: 0,
      monthlyWageExpenseFormatted: '0',
      weeklyWageExpense: 0,
      weeklyWageExpenseFormatted: '0',
      wageUsagePercent: 0,
      history: [],
      raw: {}
    };
  }

  const { finances, league, squad } = careerState;
  const currency = league?.currencySymbol || 'R$';

  // Recalcular despesa salarial em tempo real para precisão absoluta
  const calculatedMonthlyWages = Array.isArray(squad)
    ? squad.reduce((acc, p) => acc + (p.salary || 0), 0)
    : (finances.monthlyWageExpense || 0);
  const calculatedWeeklyWages = Math.round(calculatedMonthlyWages / 4);

  const wageBudget = finances.wageBudget || 1000000;
  const wageUsagePercent = wageBudget > 0
    ? Math.min(100, Math.round((calculatedMonthlyWages / wageBudget) * 100))
    : 0;

  return {
    balance: finances.balance || 0,
    balanceFormatted: formatMoney(finances.balance || 0, currency),
    transferBudget: finances.transferBudget || 0,
    transferBudgetFormatted: formatMoney(finances.transferBudget || 0, currency),
    wageBudget,
    wageBudgetFormatted: formatMoney(wageBudget, currency),
    monthlyWageExpense: calculatedMonthlyWages,
    monthlyWageExpenseFormatted: formatMoney(calculatedMonthlyWages, currency),
    weeklyWageExpense: calculatedWeeklyWages,
    weeklyWageExpenseFormatted: formatMoney(calculatedWeeklyWages, currency),
    wageUsagePercent,
    history: Array.isArray(finances.history) ? finances.history : [],
    raw: finances
  };
}

/**
 * Garante que todos os clubes adversários da liga possuam elenco completo gerado e armazenado
 * @param {Object} careerState 
 */
export function ensureAllLeagueSquads(careerState) {
  if (!careerState) return;
  if (!careerState.aiSquads) {
    careerState.aiSquads = {};
  }

  const leagueId = careerState.league?.id || 'bra_serie_a';
  const allClubs = getClubsByLeague(leagueId);

  allClubs.forEach(club => {
    if (club.id === careerState.club?.id) return; // Clube do usuário já está em careerState.squad

    if (!careerState.aiSquads[club.id] || !Array.isArray(careerState.aiSquads[club.id]) || careerState.aiSquads[club.id].length === 0) {
      careerState.aiSquads[club.id] = generateClubSquad(club);
    }
  });

  // Garantir também o pool de agentes livres
  if (!careerState.freeAgents || !Array.isArray(careerState.freeAgents) || careerState.freeAgents.length === 0) {
    careerState.freeAgents = generateFreeAgentsPool(careerState);
  }
}

/**
 * Gera um pool diversificado de agentes livres (sem vínculo com clube)
 * @param {Object} careerState 
 * @returns {Array}
 */
export function generateFreeAgentsPool(careerState) {
  const league = getLeagueById(careerState?.league?.id) || careerState?.league;
  const currencySymbol = league?.currencySymbol || 'R$';
  const regionCode = league?.countryCode || 'BR';
  const namePool = ROSTER_NAMES[regionCode] || ROSTER_NAMES.BR;

  const positions = ['GOL', 'GOL', 'DEF', 'DEF', 'DEF', 'DEF', 'MEI', 'MEI', 'MEI', 'MEI', 'ATA', 'ATA', 'ATA', 'ATA'];
  const freeAgents = [];

  positions.forEach((pos, idx) => {
    // Variação entre jovens apostas (18-21) e veteranos livres (29-35) e jogadores no auge (24-27)
    let age;
    let targetOvr;

    if (idx % 3 === 0) {
      // Jovem promessa livre
      age = 18 + (idx % 4);
      targetOvr = 65 + Math.floor(Math.random() * 12); // 65-76
    } else if (idx % 3 === 1) {
      // Jogador maduro sem contrato
      age = 24 + (idx % 5);
      targetOvr = 70 + Math.floor(Math.random() * 14); // 70-83
    } else {
      // Veterano experiente com passe livre
      age = 30 + (idx % 5);
      targetOvr = 73 + Math.floor(Math.random() * 12); // 73-84
    }

    const fName = namePool.first[(idx * 7 + 3) % namePool.first.length];
    const lName = namePool.last[(idx * 11 + 5) % namePool.last.length];

    let atk = targetOvr - 20;
    let def = targetOvr - 20;
    let pas = targetOvr - 15;
    let phy = targetOvr - 10;

    if (pos === 'GOL') {
      def = targetOvr + 4;
      phy = targetOvr + 1;
      pas = Math.max(35, targetOvr - 18);
      atk = Math.max(15, targetOvr - 45);
    } else if (pos === 'DEF') {
      def = targetOvr + 3;
      phy = targetOvr + 2;
      pas = Math.max(45, targetOvr - 10);
      atk = Math.max(25, targetOvr - 30);
    } else if (pos === 'MEI') {
      pas = targetOvr + 4;
      atk = targetOvr - 3;
      def = targetOvr - 6;
      phy = targetOvr - 1;
    } else if (pos === 'ATA') {
      atk = targetOvr + 4;
      phy = targetOvr + 2;
      pas = targetOvr - 6;
      def = Math.max(20, targetOvr - 35);
    }

    const attrs = {
      attack: Math.min(99, Math.max(20, atk)),
      defense: Math.min(99, Math.max(20, def)),
      pass: Math.min(99, Math.max(25, pas)),
      physical: Math.min(99, Math.max(30, phy)),
      position: pos
    };

    const overall = calculatePlayerOverall(attrs);
    const mult = currencySymbol === 'R$' ? 1.0 : (currencySymbol === '£' ? 0.35 : 0.4);
    
    // Agente livre NÃO cobra taxa de transferência para clube (marketValue base para estimativa, taxa = 0)
    const marketValue = Math.round((overall * overall * 1400 * (36 - Math.min(34, age)) / 10) * mult);
    const salary = Math.round((overall * overall * 16) * mult);

    freeAgents.push({
      id: `free_${pos.toLowerCase()}_${idx + 1}_${Date.now() % 10000}`,
      clubId: null,
      clubName: 'Agente Livre',
      name: `${fName} ${lName}`,
      age,
      position: pos,
      attack: attrs.attack,
      defense: attrs.defense,
      pass: attrs.pass,
      physical: attrs.physical,
      overall,
      salary,
      marketValue,
      signingBonusRequested: Math.round(salary * 2.5),
      morale: 'Boa',
      fitness: 96,
      isFreeAgent: true
    });
  });

  return freeAgents;
}

/**
 * Retorna todos os clubes da liga para exibição no seletor do mercado
 * @param {Object} careerState 
 * @returns {Array} Lista de clubes adversários com seus dados
 */
export function getAllMarketClubs(careerState) {
  if (!careerState) return [];
  ensureAllLeagueSquads(careerState);

  const leagueId = careerState.league?.id || 'bra_serie_a';
  const allClubs = getClubsByLeague(leagueId);
  return allClubs.filter(c => c.id !== careerState.club?.id);
}

/**
 * Obtém os jogadores de um clube específico, ou de todos os clubes, ou agentes livres
 * @param {Object} careerState 
 * @param {string} clubId 'ALL' | 'FREE' | ou ID específico do clube
 * @returns {Array} Lista de jogadores
 */
export function getPlayersForMarket(careerState, clubId = 'ALL') {
  if (!careerState) return [];
  ensureAllLeagueSquads(careerState);

  if (clubId === 'FREE') {
    return careerState.freeAgents || [];
  }

  if (clubId !== 'ALL') {
    // Clube específico
    const squad = careerState.aiSquads[clubId];
    if (Array.isArray(squad)) {
      const clubInfo = getClubById(clubId);
      return squad.map(p => ({
        ...p,
        clubName: clubInfo?.name || p.clubName || 'Clube Rival',
        primaryColor: clubInfo?.primaryColor || '#333333',
        secondaryColor: clubInfo?.secondaryColor || '#ffffff',
        isFreeAgent: false
      }));
    }
    return [];
  }

  // Todos os clubes da liga + Agentes Livres
  let allPlayers = [];
  const rivalClubs = getAllMarketClubs(careerState);

  rivalClubs.forEach(c => {
    const sq = careerState.aiSquads[c.id];
    if (Array.isArray(sq)) {
      sq.forEach(p => {
        allPlayers.push({
          ...p,
          clubName: c.name,
          primaryColor: c.primaryColor,
          secondaryColor: c.secondaryColor,
          isFreeAgent: false
        });
      });
    }
  });

  // Acrescenta agentes livres
  if (Array.isArray(careerState.freeAgents)) {
    careerState.freeAgents.forEach(fa => {
      allPlayers.push({
        ...fa,
        clubName: 'Agente Livre',
        isFreeAgent: true
      });
    });
  }

  return allPlayers;
}

/**
 * Compatibilidade com o código anterior: retorna a lista padrão de mercado
 * @param {Object} careerState 
 * @returns {Array}
 */
export function getAvailableMarketPlayers(careerState) {
  return getPlayersForMarket(careerState, 'ALL');
}

/**
 * Avalia a proposta de transferência enviada ao clube detentor dos direitos
 * @param {Object} careerState 
 * @param {Object} player 
 * @param {number} offeredFee Valor em dinheiro oferecido
 * @param {boolean} isInstallment Se a compra é parcelada em 2x
 * @param {number} round Rodada de negociação (1 a 4)
 * @returns {Object} { status: 'accepted'|'counter'|'rejected', counterFee: number, message: string, patienceRemaining: number }
 */
export function evaluateClubOffer(careerState, player, offeredFee, isInstallment = false, round = 1) {
  if (player.isFreeAgent || !player.clubId) {
    return {
      status: 'accepted',
      counterFee: 0,
      message: 'Jogador sem vínculo empregatício. Nenhuma taxa de transferência necessária para o clube!',
      patienceRemaining: 4
    };
  }

  const baseValue = Number(player.marketValue) || 1000000;
  const currencySymbol = careerState.league?.currencySymbol || 'R$';
  const clubInfo = getClubById(player.clubId);
  const clubName = clubInfo?.name || player.clubName || 'Clube Detentor';

  // O clube valoriza ligeiramente titulares e craques de OVR alto
  const askTarget = player.overall >= 82 ? Math.round(baseValue * 1.08) : Math.round(baseValue * 0.98);
  const effectiveOffer = isInstallment ? offeredFee * 0.93 : offeredFee; // Pequeno deságio se parcelado
  const ratio = effectiveOffer / askTarget;

  const maxRounds = 4;
  const patienceRemaining = Math.max(0, maxRounds - round);

  if (ratio >= 0.92) {
    // Proposta Aceita!
    return {
      status: 'accepted',
      agreedFee: offeredFee,
      counterFee: offeredFee,
      message: `A diretoria do ${clubName} aceitou a proposta formal de ${formatMoney(offeredFee, currencySymbol)}! Você foi autorizado a negociar os termos contratuais diretamente com o atleta e seu empresário.`,
      patienceRemaining
    };
  }

  if (ratio >= 0.70 && patienceRemaining > 0) {
    // Contraproposta do Clube
    const counterDiscount = 0.05 * round;
    const counterFee = Math.round(askTarget * (1 - counterDiscount));
    return {
      status: 'counter',
      counterFee,
      message: `A diretoria do ${clubName} achou a oferta de ${formatMoney(offeredFee, currencySymbol)} abaixo do valor pretendido. Eles apresentaram uma contraproposta de ${formatMoney(counterFee, currencySymbol)} para liberar o atleta.`,
      patienceRemaining
    };
  }

  // Recusa
  if (patienceRemaining <= 0) {
    return {
      status: 'rejected',
      counterFee: askTarget,
      message: `A diretoria do ${clubName} encerrou as conversas por hoje devido ao impasse nos valores. Tente novamente mais tarde.`,
      patienceRemaining: 0
    };
  }

  const minimumAcceptable = Math.round(askTarget * 0.88);
  return {
    status: 'rejected',
    counterFee: minimumAcceptable,
    message: `A diretoria do ${clubName} recusou a proposta por considerar o valor ${formatMoney(offeredFee, currencySymbol)} muito baixo para liberar ${player.name}. Eles exigem ao menos ${formatMoney(minimumAcceptable, currencySymbol)} para abrir conversas.`,
    patienceRemaining
  };
}

/**
 * Avalia os termos contratuais oferecidos ao jogador e ao empresário
 * @param {Object} careerState 
 * @param {Object} player 
 * @param {number} offeredSalary Salário mensal oferecido
 * @param {number} offeredBonus Luvas / bônus de assinatura
 * @param {string} offeredRole 'star' | 'key' | 'rotation' | 'prospect'
 * @param {number} contractYears Duração do contrato (1, 2 ou 3 anos)
 * @returns {Object} { status: 'accepted'|'counter'|'rejected', satisfactionScore: number, message: string, counterSalary: number }
 */
export function evaluatePlayerContract(careerState, player, offeredSalary, offeredBonus = 0, offeredRole = 'key', contractYears = 2) {
  const baseSalary = Number(player.salary) || 50000;
  const currencySymbol = careerState.league?.currencySymbol || 'R$';

  // Pedida de luvas padrão: ~2.5 meses de salário para jogadores livres ou titulares
  const requestedBonus = player.isFreeAgent ? Math.round(baseSalary * 3.5) : Math.round(baseSalary * 2.0);

  // Fator de salário (peso 60%)
  const salaryRatio = offeredSalary / baseSalary;
  let salaryScore = Math.min(100, Math.round(salaryRatio * 75));

  // Fator de luvas (peso 20%)
  let bonusScore = 0;
  if (offeredBonus >= requestedBonus) {
    bonusScore = 20;
  } else if (offeredBonus > 0) {
    bonusScore = Math.round((offeredBonus / requestedBonus) * 20);
  }

  // Fator de papel no elenco (peso 15%)
  let roleScore = 10;
  if (offeredRole === 'star') roleScore = 15;
  if (offeredRole === 'key') roleScore = 12;
  if (offeredRole === 'rotation') roleScore = 8;
  if (offeredRole === 'prospect') roleScore = player.age <= 22 ? 12 : 4;

  // Fator de prestígio do clube usuário (peso 5%)
  const clubReputation = careerState.club?.reputation || 3;
  const prestigeScore = clubReputation;

  const totalScore = Math.min(100, Math.max(0, salaryScore + bonusScore + roleScore + prestigeScore));

  if (totalScore >= 75) {
    return {
      status: 'accepted',
      satisfactionScore: totalScore,
      counterSalary: offeredSalary,
      message: `"${player.name}: 'Estou extremamente entusiasmado com o projeto e com as condições apresentadas! Aceito a proposta e estou pronto para vestir a camisa do ${careerState.club?.name}!'"`
    };
  }

  if (totalScore >= 52) {
    const counterSalary = Math.round(baseSalary * 1.05);
    return {
      status: 'counter',
      satisfactionScore: totalScore,
      counterSalary,
      message: `"${player.name} e seu empresário: 'Temos interesse em defender o clube, mas consideramos a oferta salarial ainda um pouco tímida. Se você subir a proposta para ${formatMoney(counterSalary, currencySymbol)}/mês ou melhorar as luvas, fechamos agora!'"`
    };
  }

  return {
    status: 'rejected',
    satisfactionScore: totalScore,
    counterSalary: Math.round(baseSalary * 1.15),
    message: `"${player.name}: 'Agradeço o interesse, mas as condições financeiras oferecidas estão muito distantes das minhas ambições profissionais no momento.'"`
  };
}

/**
 * Conclui a transferência e integração completa do jogador ao elenco
 * @param {Object} careerState 
 * @param {Object} params { player, agreedFee, agreedSalary, agreedBonus, isInstallment, agreedRole }
 * @returns {Object} Resultado da operação
 */
export function finalizeTransfer(careerState, {
  player,
  agreedFee = 0,
  agreedSalary = 0,
  agreedBonus = 0,
  isInstallment = false,
  agreedRole = 'key'
}) {
  if (!careerState || !player) {
    throw new Error('Parâmetros inválidos para finalizar a transferência.');
  }

  const currencySymbol = careerState.league?.currencySymbol || 'R$';
  const finances = careerState.finances;

  // Validação de elenco cheio
  if (Array.isArray(careerState.squad) && careerState.squad.length >= 30) {
    throw new Error('Seu elenco já atingiu o limite regulamentar de 30 atletas.');
  }

  // Custo imediato à vista
  const immediateClubFee = isInstallment ? Math.round(agreedFee / 2) : agreedFee;
  const immediateCashCost = immediateClubFee + agreedBonus;

  if (finances.balance < immediateCashCost) {
    throw new Error(`Saldo em caixa insuficiente para o pagamento inicial (${formatMoney(finances.balance, currencySymbol)} disponível, custo inicial: ${formatMoney(immediateCashCost, currencySymbol)}).`);
  }

  if (finances.transferBudget < immediateClubFee) {
    throw new Error(`Orçamento de transferências insuficiente (${formatMoney(finances.transferBudget, currencySymbol)} disponível, taxa: ${formatMoney(immediateClubFee, currencySymbol)}).`);
  }

  // 1. Débito financeiro
  finances.balance -= immediateCashCost;
  finances.transferBudget = Math.max(0, finances.transferBudget - immediateClubFee);

  // 2. Criação do jogador no elenco do usuário
  const hiredPlayer = {
    ...player,
    id: player.id.startsWith('usr_') ? player.id : `usr_${player.id}_${Date.now()}`,
    clubId: careerState.club.id,
    clubName: careerState.club.name,
    salary: agreedSalary || player.salary,
    morale: 'Excelente',
    fitness: 100,
    role: agreedRole,
    isFreeAgent: false
  };

  // 3. Adicionar ao elenco do usuário
  if (!Array.isArray(careerState.squad)) {
    careerState.squad = [];
  }
  careerState.squad.push(hiredPlayer);

  // 4. Remover do clube vendedor (se pertencia a clube de IA)
  if (player.clubId && careerState.aiSquads && Array.isArray(careerState.aiSquads[player.clubId])) {
    careerState.aiSquads[player.clubId] = careerState.aiSquads[player.clubId].filter(p => p.id !== player.id && p.name !== player.name);
  }

  // 5. Remover da lista de agentes livres (se era agente livre)
  if (Array.isArray(careerState.freeAgents)) {
    careerState.freeAgents = careerState.freeAgents.filter(p => p.id !== player.id && p.name !== player.name);
  }

  // 6. Atualizar folha salarial
  const totalMonthlyWages = careerState.squad.reduce((sum, p) => sum + (p.salary || 0), 0);
  finances.monthlyWageExpense = totalMonthlyWages;
  finances.weeklyWageExpense = Math.round(totalMonthlyWages / 4);

  // 7. Recalcular overall do clube
  careerState.club.overall = calculateSquadOverall(careerState.squad, careerState.lineup);

  // 8. Registro no histórico financeiro
  if (!Array.isArray(finances.history)) {
    finances.history = [];
  }

  const descFee = agreedFee > 0 ? `Taxa: ${formatMoney(agreedFee, currencySymbol)}${isInstallment ? ' (2x)' : ''}` : 'Custo Zero (Agente Livre)';
  const descBonus = agreedBonus > 0 ? ` + Luvas: ${formatMoney(agreedBonus, currencySymbol)}` : '';

  finances.history.unshift({
    id: `tx_buy_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    date: new Date().toISOString().split('T')[0],
    type: 'transfer_in',
    description: `Contratação: ${hiredPlayer.name} (${hiredPlayer.position}, ${hiredPlayer.overall} OVR - ${player.clubName || 'Agente Livre'}) [${descFee}${descBonus}]`,
    amount: -immediateCashCost
  });

  return {
    success: true,
    player: hiredPlayer,
    message: `${hiredPlayer.name} assinou com o ${careerState.club.name} e já está disponível para escalação!`
  };
}

/**
 * Avalia se o usuário pode vender o jogador selecionado
 * @param {Object} careerState 
 * @param {string} playerId 
 * @returns {{ allowed: boolean, reason: string|null, player: Object|null }}
 */
export function canSellPlayer(careerState, playerId) {
  if (!careerState || !Array.isArray(careerState.squad)) {
    return { allowed: false, reason: 'Elenco não carregado.', player: null };
  }

  const player = careerState.squad.find(p => p.id === playerId);
  if (!player) {
    return { allowed: false, reason: 'Jogador não encontrado no elenco.', player: null };
  }

  if (careerState.squad.length <= 15) {
    return {
      allowed: false,
      reason: 'Seu elenco precisa ter no mínimo 15 jogadores para disputar as partidas da liga.',
      player
    };
  }

  if (player.position === 'GOL') {
    const countGols = careerState.squad.filter(p => p.position === 'GOL').length;
    if (countGols <= 1) {
      return {
        allowed: false,
        reason: 'Você não pode vender seu único goleiro disponível no elenco.',
        player
      };
    }
  }

  return { allowed: true, reason: null, player };
}

/**
 * Gera propostas de compra realistas de clubes interessados da liga ou exterior
 * @param {Object} careerState 
 * @param {Object} player 
 * @returns {Array} Lista de 2 a 3 propostas formais
 */
export function getTransferOffersForPlayer(careerState, player) {
  if (!careerState || !player) return [];
  ensureAllLeagueSquads(careerState);

  const baseValue = Number(player.marketValue) || 1000000;
  const rivalClubs = getAllMarketClubs(careerState);
  const leagueId = careerState.league?.id || 'bra_serie_a';

  const externalBuyers = [
    { name: 'Benfica', league: 'Liga Portugal', rep: 4 },
    { name: 'Porto', league: 'Liga Portugal', rep: 4 },
    { name: 'Real Betis', league: 'La Liga', rep: 4 },
    { name: 'Fiorentina', league: 'Serie A Itália', rep: 4 },
    { name: 'Al Hilal', league: 'Saudi Pro League', rep: 4 }
  ];

  const offers = [];

  // 1. Proposta de clube rival da liga
  if (rivalClubs.length > 0) {
    const rival = rivalClubs[Math.floor(Math.random() * rivalClubs.length)];
    const rivalOfferMultiplier = 0.90 + (Math.random() * 0.22); // 90% a 112% do valor
    offers.push({
      buyerId: rival.id,
      buyerName: rival.name,
      buyerOrigin: 'Liga Nacional',
      offerAmount: Math.round(baseValue * rivalOfferMultiplier),
      isNational: true
    });
  }

  // 2. Proposta do exterior
  const ext = externalBuyers[Math.floor(Math.random() * externalBuyers.length)];
  const extMultiplier = 0.98 + (Math.random() * 0.25); // 98% a 123% do valor
  offers.push({
    buyerId: `ext_${ext.name.toLowerCase().replace(/\s+/g, '_')}`,
    buyerName: ext.name,
    buyerOrigin: ext.league,
    offerAmount: Math.round(baseValue * extMultiplier),
    isNational: false
  });

  return offers;
}

/**
 * Executa a venda de um atleta do elenco do usuário
 * @param {Object} careerState 
 * @param {string} playerId 
 * @param {number|null} customValue 
 * @param {Object|null} buyerClub 
 * @returns {Object}
 */
export function sellPlayer(careerState, playerId, customValue = null, buyerClub = null) {
  const check = canSellPlayer(careerState, playerId);
  if (!check.allowed) {
    throw new Error(check.reason || 'Venda não permitida.');
  }

  const player = check.player;
  const currencySymbol = careerState.league?.currencySymbol || 'R$';
  const saleAmount = customValue !== null ? Number(customValue) : (Number(player.marketValue) || 100000);

  // 1. Creditar valor em caixa e aumentar orçamento de transferências
  careerState.finances.balance = (careerState.finances.balance || 0) + saleAmount;
  careerState.finances.transferBudget = (careerState.finances.transferBudget || 0) + saleAmount;

  // 2. Remover do elenco do usuário
  careerState.squad = careerState.squad.filter(p => p.id !== playerId);

  // 3. Se vendido para clube da liga, adicionar ao elenco do comprador
  if (buyerClub && buyerClub.buyerId && !buyerClub.buyerId.startsWith('ext_') && careerState.aiSquads && careerState.aiSquads[buyerClub.buyerId]) {
    careerState.aiSquads[buyerClub.buyerId].push({
      ...player,
      clubId: buyerClub.buyerId,
      clubName: buyerClub.buyerName
    });
  }

  // 4. Se estava na escalação titular, reajustar escalação com melhor substituto
  if (Array.isArray(careerState.lineup)) {
    const slotIdx = careerState.lineup.findIndex(s => s && (s.playerId === playerId || s === playerId));
    if (slotIdx !== -1) {
      const assignedIds = new Set(careerState.lineup.map(s => (s && s.playerId) ? s.playerId : s).filter(Boolean));
      assignedIds.delete(playerId);
      const samePosSubs = careerState.squad
        .filter(p => p.position === player.position && !assignedIds.has(p.id))
        .sort((a, b) => b.overall - a.overall);

      if (samePosSubs.length > 0) {
        if (typeof careerState.lineup[slotIdx] === 'object' && careerState.lineup[slotIdx] !== null) {
          careerState.lineup[slotIdx].playerId = samePosSubs[0].id;
        } else {
          careerState.lineup[slotIdx] = samePosSubs[0].id;
        }
      } else {
        const formationKey = careerState.tactics?.formation || '4-3-3';
        careerState.lineup = buildOptimalLineup(careerState.squad, formationKey);
      }
    }
  }

  // 5. Recalcular folha salarial
  const totalMonthlyWages = careerState.squad.reduce((sum, p) => sum + (p.salary || 0), 0);
  careerState.finances.monthlyWageExpense = totalMonthlyWages;
  careerState.finances.weeklyWageExpense = Math.round(totalMonthlyWages / 4);

  // 6. Recalcular força geral do clube
  careerState.club.overall = calculateSquadOverall(careerState.squad, careerState.lineup);

  // 7. Registrar receita no extrato financeiro
  if (!Array.isArray(careerState.finances.history)) {
    careerState.finances.history = [];
  }

  const buyerDesc = buyerClub?.buyerName ? ` para ${buyerClub.buyerName}` : '';
  careerState.finances.history.unshift({
    id: `tx_sell_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    date: new Date().toISOString().split('T')[0],
    type: 'transfer_out',
    description: `Venda: ${player.name} (${player.position}, ${player.overall} OVR)${buyerDesc}`,
    amount: saleAmount
  });

  return {
    success: true,
    player,
    amount: saleAmount,
    message: `${player.name} foi vendido com sucesso${buyerDesc} por ${formatMoney(saleAmount, currencySymbol)}!`
  };
}

/**
 * Função de compra direta legada (mantida para compatibilidade)
 */
export function canBuyPlayer(careerState, player) {
  if (!careerState || !player) {
    return { allowed: false, reason: 'Dados insuficientes para a transação.' };
  }
  if (Array.isArray(careerState.squad) && careerState.squad.some(p => p.id === player.id || p.name === player.name)) {
    return { allowed: false, reason: 'Este jogador já faz parte do seu elenco.' };
  }
  if (Array.isArray(careerState.squad) && careerState.squad.length >= 30) {
    return { allowed: false, reason: 'Seu elenco já atingiu a capacidade máxima de 30 atletas.' };
  }
  return { allowed: true, reason: null };
}

export function buyPlayer(careerState, player) {
  return finalizeTransfer(careerState, {
    player,
    agreedFee: player.isFreeAgent ? 0 : player.marketValue,
    agreedSalary: player.salary,
    agreedBonus: 0,
    isInstallment: false,
    agreedRole: 'key'
  });
}

/**
 * Renova o mercado de agentes livres e scouts
 * @param {Object} careerState 
 * @returns {Array}
 */
export function refreshMarketPool(careerState) {
  if (!careerState) return [];
  careerState.freeAgents = generateFreeAgentsPool(careerState);
  return getPlayersForMarket(careerState, 'ALL');
}
