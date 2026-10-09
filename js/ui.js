/**
 * @license
 * FUTMANAGER Mobile - js/ui.js
 * Renderização das telas, componentes de interface e navegação
 */

import { NATIONALITIES, INITIAL_LEAGUES, getClubsByLeague, getLeagueById, getClubById, formatMoney } from './data.js';
import { 
  managerDraft, 
  validateManagerDraft, 
  resetManagerDraft,
  getCareerState,
  setCareerState,
  FORMATIONS,
  TACTICAL_MENTALITIES,
  updateTacticsMentality,
  updateTacticsFormation,
  assignPlayerToLineup,
  autoOptimizeLineup,
  validateCurrentLineup
} from './state.js';
import { 
  getNextMatchPreview, 
  getLeagueStatusSummary,
  createMatchSimulation, 
  simulateMatchMinute, 
  substitutePlayerInMatch, 
  finalizeMatchResult 
} from './game.js';
import { 
  getFinancialOverview, 
  getAvailableMarketPlayers,
  getPlayersForMarket,
  getAllMarketClubs,
  canBuyPlayer, 
  buyPlayer, 
  canSellPlayer, 
  sellPlayer, 
  refreshMarketPool,
  evaluateClubOffer,
  evaluatePlayerContract,
  finalizeTransfer,
  getTransferOffersForPlayer,
  ensureAllLeagueSquads
} from './market.js';
import { saveCareer, clearCareer, hasSavedCareer, getSavedCareerSummary } from './storage.js';

// Rastreamento da tela atual
let currentScreen = 'welcome'; // welcome, manager, league, club, dashboard, subscreen
let currentSubScreen = null; // squad, tactics, calendar, market, finances, settings
let selectedLeagueId = null;
let selectedClubId = null;

// Filtros e controles de modais da Etapa 2
let currentSquadFilter = 'ALL'; // ALL, GOL, DEF, MEI, ATA
let activePlayerDetailsId = null;
let activeSubstituteSlotIndex = null;

// Filtros e controles de Mercado (Etapa 5)
let currentMarketTab = 'buy'; // 'buy' | 'sell'
let currentMarketClubFilter = 'ALL'; // 'ALL' | 'FREE' | clubId
let currentMarketFilterPos = 'ALL';
let currentMarketSearchQuery = '';
let currentMarketSort = 'ovr_desc';

// Estado da simulação da partida ao vivo (Etapa 3)
let activeMatch = null;
let matchSimulationTimer = null;
let matchSimulationSpeed = 1; // 1 (normal), 2 (rápido), 5 (muito rápido)
let inMatchSubOutPlayerId = null;

// Controles da aba de Campeonato (Etapa 4)
let currentChampTab = 'standings'; // 'standings', 'calendar', 'scorers'
let calendarSelectedRound = null;

// Callbacks registrados pelo app.js
let onStartNewCareer = null;
let onContinueCareer = null;
let onResetCareer = null;

/**
 * Registra manipuladores de eventos do controlador principal
 */
export function registerUIHandlers(handlers) {
  onStartNewCareer = handlers.onStartNewCareer;
  onContinueCareer = handlers.onContinueCareer;
  onResetCareer = handlers.onResetCareer;
}

/**
 * Exibe notificação temporária no topo (Toast)
 * @param {string} message 
 * @param {'info'|'success'|'error'} type 
 */
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${type === 'error' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️'}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 250);
  }, 3200);
}

/**
 * Exibe um diálogo modal de confirmação moderno e responsivo na UI
 * Substitui window.confirm() garantindo funcionamento em iframes, webviews e mobile
 */
export function showConfirmModal({
  title = 'Confirmação',
  message = '',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDanger = false,
  icon = null,
  onConfirm = null,
  onCancel = null
}) {
  const existing = document.getElementById('app-confirm-modal');
  if (existing) existing.remove();

  const modalEl = document.createElement('div');
  modalEl.id = 'app-confirm-modal';
  modalEl.className = 'confirm-dialog-backdrop';

  const displayIcon = icon || (isDanger ? '🗑️' : '⚠️');

  modalEl.innerHTML = `
    <div class="confirm-dialog-card ${isDanger ? 'is-danger' : ''}">
      <div class="confirm-dialog-header">
        <div class="confirm-dialog-icon ${isDanger ? 'danger-icon' : 'primary-icon'}">
          ${displayIcon}
        </div>
        <h3 class="confirm-dialog-title">${title}</h3>
      </div>
      <p class="confirm-dialog-message">${message}</p>
      <div class="confirm-dialog-actions">
        <button id="confirm-modal-cancel" class="btn btn-secondary" style="flex: 1;">
          ${cancelText}
        </button>
        <button id="confirm-modal-ok" class="btn ${isDanger ? 'btn-danger' : 'btn-primary'}" style="flex: 1.2;">
          ${confirmText}
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modalEl);

  requestAnimationFrame(() => {
    modalEl.classList.add('open');
  });

  const closeModal = () => {
    modalEl.classList.remove('open');
    setTimeout(() => {
      modalEl.remove();
    }, 220);
  };

  const btnCancel = modalEl.querySelector('#confirm-modal-cancel');
  btnCancel.addEventListener('click', () => {
    closeModal();
    if (onCancel) onCancel();
  });

  const btnOk = modalEl.querySelector('#confirm-modal-ok');
  btnOk.addEventListener('click', () => {
    closeModal();
    if (onConfirm) onConfirm();
  });

  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) {
      closeModal();
      if (onCancel) onCancel();
    }
  });
}

/**
 * Navega para uma tela específica
 * @param {string} screenName 
 * @param {string|null} subScreen 
 */
export function navigateTo(screenName, subScreen = null) {
  currentScreen = screenName;
  currentSubScreen = subScreen;
  renderApp();
}

/**
 * Renderizador mestre da aplicação
 */
export function renderApp() {
  const appContainer = document.getElementById('app-container');
  if (!appContainer) return;

  const career = getCareerState();

  // Se a carreira já estiver ativa e estivermos no dashboard ou subscreens
  if (career && (currentScreen === 'dashboard' || currentSubScreen)) {
    renderDashboardLayout(appContainer, career);
    return;
  }

  // Telas do fluxo de início de carreira
  switch (currentScreen) {
    case 'welcome':
      renderWelcomeScreen(appContainer);
      break;
    case 'manager':
      renderManagerCreationScreen(appContainer);
      break;
    case 'league':
      renderLeagueSelectionScreen(appContainer);
      break;
    case 'club':
      renderClubSelectionScreen(appContainer);
      break;
    default:
      renderWelcomeScreen(appContainer);
  }
}

/* ==========================================================================
   TELA INICIAL: BOAS-VINDAS / CONTINUAR CARREIRA
   ========================================================================== */
function renderWelcomeScreen(container) {
  const hasSave = hasSavedCareer();
  const saveSummary = hasSave ? getSavedCareerSummary() : null;

  container.innerHTML = `
    <header class="mobile-top-bar">
      <div class="top-bar-left">
        <div class="top-bar-brand">
          <span style="color: var(--color-primary)">FUT</span>MANAGER
          <span class="brand-badge">MOBILE</span>
        </div>
      </div>
    </header>

    <div class="screen-content no-bottom-nav" style="justify-content: center; align-items: center; text-align: center; min-height: 80vh;">
      <div style="width: 72px; height: 72px; border-radius: 20px; background: linear-gradient(135deg, var(--color-primary), #990e1f); display: flex; align-items: center; justify-content: center; font-size: 36px; margin-bottom: 16px; box-shadow: 0 8px 24px var(--color-primary-glow);">
        ⚽
      </div>

      <h1 style="font-size: 24px; font-weight: 800; margin-bottom: 6px;">Gestão de Futebol</h1>
      <p style="font-size: 13px; max-width: 320px; margin-bottom: 24px;">
        Construa seu legado no futebol. Escale, compre, treine e leve seu time à glória dos títulos.
      </p>

      ${hasSave && saveSummary ? `
        <div class="card" style="width: 100%; text-align: left; margin-bottom: 16px; border-color: rgba(229,37,56,0.3); background: rgba(20, 23, 33, 0.9);">
          <div class="card-title">
            <span>Carreira Salva</span>
            <span style="font-size: 11px; color: var(--color-success); font-weight: 600;">DISPONÍVEL</span>
          </div>
          <div style="font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 2px;">
            ${saveSummary.clubName}
          </div>
          <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 10px;">
            Técnico: <strong style="color: #fff">${saveSummary.managerName}</strong> · ${saveSummary.leagueName}
          </div>
          <div style="font-size: 11px; color: var(--text-subtle); margin-bottom: 14px;">
            Rodada ${saveSummary.round} · Temporada ${saveSummary.season}
          </div>
          <div style="display: flex; gap: 8px;">
            <button id="btn-continue-career" class="btn btn-primary" style="flex: 2;">
              ▶ Continuar Carreira
            </button>
            <button id="btn-delete-saved-career" class="btn btn-secondary" style="flex: 1; border-color: rgba(229,37,56,0.35); color: #ff5264;" title="Excluir carreira salva">
              🗑️ Excluir
            </button>
          </div>
        </div>
      ` : ''}

      <div style="width: 100%; display: flex; flex-direction: column; gap: 10px;">
        <button id="btn-new-career" class="btn ${hasSave ? 'btn-secondary' : 'btn-primary'}">
          ${hasSave ? '+ Iniciar Nova Carreira' : 'Começar Nova Carreira'}
        </button>
      </div>

      <div style="margin-top: 32px; font-size: 11px; color: var(--text-subtle);">
        Inspirado no clássico Brasfoot e Football Manager<br>
        100% Offline & Mobile-First
      </div>
    </div>
  `;

  const btnContinue = document.getElementById('btn-continue-career');
  if (btnContinue) {
    btnContinue.addEventListener('click', () => {
      if (onContinueCareer) onContinueCareer();
    });
  }

  const btnDeleteSaved = document.getElementById('btn-delete-saved-career');
  if (btnDeleteSaved) {
    btnDeleteSaved.addEventListener('click', () => {
      showConfirmModal({
        title: 'Excluir Carreira Salva?',
        message: `Tem certeza de que deseja apagar permanentemente o save de ${saveSummary?.clubName || 'seu clube'} (${saveSummary?.managerName || 'Técnico'})? Todos os dados serão excluídos.`,
        confirmText: '🗑️ Sim, Excluir Carreira',
        cancelText: 'Cancelar',
        isDanger: true,
        onConfirm: () => {
          if (onResetCareer) {
            onResetCareer();
          } else {
            clearCareer();
            setCareerState(null);
            resetManagerDraft();
            showToast('Carreira excluída com sucesso.', 'info');
            renderApp();
          }
        }
      });
    });
  }

  const btnNew = document.getElementById('btn-new-career');
  if (btnNew) {
    btnNew.addEventListener('click', () => {
      const startManager = () => {
        resetManagerDraft();
        selectedLeagueId = null;
        selectedClubId = null;
        currentSubScreen = null;
        navigateTo('manager');
      };

      if (hasSave) {
        showConfirmModal({
          title: 'Iniciar Nova Carreira?',
          message: 'Existe uma carreira salva gravada no dispositivo. Deseja iniciar uma nova trajetória? O save atual continuará ativo até você assinar o contrato com um novo clube.',
          confirmText: 'Sim, Nova Carreira',
          cancelText: 'Cancelar',
          icon: '⚽',
          isDanger: false,
          onConfirm: () => {
            startManager();
          }
        });
      } else {
        startManager();
      }
    });
  }
}

/* ==========================================================================
   TELA 1: CRIAÇÃO DO TÉCNICO
   ========================================================================== */
function renderManagerCreationScreen(container) {
  const { attack, defense, tactics, management } = managerDraft.attributes;
  const totalAllocated = (attack - managerDraft.baseAttrValue) + 
                         (defense - managerDraft.baseAttrValue) + 
                         (tactics - managerDraft.baseAttrValue) + 
                         (management - managerDraft.baseAttrValue);
  const remainingPoints = managerDraft.pointsToDistribute - totalAllocated;

  container.innerHTML = `
    <header class="mobile-top-bar">
      <div class="top-bar-left">
        <button id="btn-back-welcome" class="top-bar-btn" aria-label="Voltar">←</button>
        <div style="font-size: 15px; font-weight: 700;">Etapa 1: Criação do Técnico</div>
      </div>
      <div class="top-bar-meta">1 de 3</div>
    </header>

    <div class="screen-content no-bottom-nav">
      <div class="card">
        <div class="card-title">Dados Pessoais</div>

        <div class="form-group">
          <label class="form-label" for="input-first-name">Nome</label>
          <input 
            type="text" 
            id="input-first-name" 
            class="form-input" 
            placeholder="Ex: Carlos, Roberto, Fernando..." 
            value="${managerDraft.firstName}" 
            maxlength="20"
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="input-last-name">Sobrenome</label>
          <input 
            type="text" 
            id="input-last-name" 
            class="form-input" 
            placeholder="Ex: Silva, Ferreira, Oliveira..." 
            value="${managerDraft.lastName}" 
            maxlength="20"
          />
        </div>

        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label" for="select-nationality">Nacionalidade</label>
          <select id="select-nationality" class="form-select">
            ${NATIONALITIES.map(nat => `
              <option value="${nat.code}" ${managerDraft.nationality === nat.code ? 'selected' : ''}>
                ${nat.flag} ${nat.name}
              </option>
            `).join('')}
          </select>
        </div>
      </div>

      <div class="points-remaining-card">
        <div>
          <div style="font-size: 12px; font-weight: 600; color: #fff;">Pontos Disponíveis</div>
          <div style="font-size: 11px; color: var(--text-muted);">Distribua entre as especialidades</div>
        </div>
        <div class="points-val" id="display-remaining-points">${remainingPoints}</div>
      </div>

      <div class="card">
        <div class="card-title">Perfil de Treinador</div>

        <!-- Ataque -->
        <div class="attribute-row">
          <div class="attr-info">
            <div class="attr-name">Ataque</div>
            <div class="attr-desc">Efetividade ofensiva e finalizações da equipe</div>
          </div>
          <div class="attr-stepper">
            <button class="stepper-btn btn-attr-dec" data-attr="attack" ${attack <= managerDraft.baseAttrValue ? 'disabled' : ''}>−</button>
            <span class="attr-score" id="score-attack">${attack}</span>
            <button class="stepper-btn btn-attr-inc" data-attr="attack" ${remainingPoints <= 0 || attack >= managerDraft.maxAttrValue ? 'disabled' : ''}>+</button>
          </div>
        </div>

        <!-- Defesa -->
        <div class="attribute-row">
          <div class="attr-info">
            <div class="attr-name">Defesa</div>
            <div class="attr-desc">Organização das linhas defensivas e desarmes</div>
          </div>
          <div class="attr-stepper">
            <button class="stepper-btn btn-attr-dec" data-attr="defense" ${defense <= managerDraft.baseAttrValue ? 'disabled' : ''}>−</button>
            <span class="attr-score" id="score-defense">${defense}</span>
            <button class="stepper-btn btn-attr-inc" data-attr="defense" ${remainingPoints <= 0 || defense >= managerDraft.maxAttrValue ? 'disabled' : ''}>+</button>
          </div>
        </div>

        <!-- Tática -->
        <div class="attribute-row">
          <div class="attr-info">
            <div class="attr-name">Tática</div>
            <div class="attr-desc">Posse de bola, transição e leitura de jogo</div>
          </div>
          <div class="attr-stepper">
            <button class="stepper-btn btn-attr-dec" data-attr="tactics" ${tactics <= managerDraft.baseAttrValue ? 'disabled' : ''}>−</button>
            <span class="attr-score" id="score-tactics">${tactics}</span>
            <button class="stepper-btn btn-attr-inc" data-attr="tactics" ${remainingPoints <= 0 || tactics >= managerDraft.maxAttrValue ? 'disabled' : ''}>+</button>
          </div>
        </div>

        <!-- Gestão de Elenco -->
        <div class="attribute-row">
          <div class="attr-info">
            <div class="attr-name">Gestão de Elenco</div>
            <div class="attr-desc">Moral dos atletas, disciplina e negociações</div>
          </div>
          <div class="attr-stepper">
            <button class="stepper-btn btn-attr-dec" data-attr="management" ${management <= managerDraft.baseAttrValue ? 'disabled' : ''}>−</button>
            <span class="attr-score" id="score-management">${management}</span>
            <button class="stepper-btn btn-attr-inc" data-attr="management" ${remainingPoints <= 0 || management >= managerDraft.maxAttrValue ? 'disabled' : ''}>+</button>
          </div>
        </div>
      </div>

      <div style="margin-top: 8px;">
        <button id="btn-next-to-leagues" class="btn btn-primary">
          Avançar para Seleção da Liga →
        </button>
      </div>
    </div>
  `;

  // Bind de eventos da tela de criação
  const btnBack = document.getElementById('btn-back-welcome');
  if (btnBack) {
    btnBack.addEventListener('click', () => navigateTo('welcome'));
  }

  const inputFirst = document.getElementById('input-first-name');
  if (inputFirst) {
    inputFirst.addEventListener('input', (e) => {
      managerDraft.firstName = e.target.value;
    });
  }

  const inputLast = document.getElementById('input-last-name');
  if (inputLast) {
    inputLast.addEventListener('input', (e) => {
      managerDraft.lastName = e.target.value;
    });
  }

  const selectNat = document.getElementById('select-nationality');
  if (selectNat) {
    selectNat.addEventListener('change', (e) => {
      managerDraft.nationality = e.target.value;
    });
  }

  // Steppers de atributos
  container.querySelectorAll('.btn-attr-inc').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const attr = e.currentTarget.dataset.attr;
      const currentAllocated = (managerDraft.attributes.attack - managerDraft.baseAttrValue) + 
                               (managerDraft.attributes.defense - managerDraft.baseAttrValue) + 
                               (managerDraft.attributes.tactics - managerDraft.baseAttrValue) + 
                               (managerDraft.attributes.management - managerDraft.baseAttrValue);
      if (currentAllocated < managerDraft.pointsToDistribute && managerDraft.attributes[attr] < managerDraft.maxAttrValue) {
        managerDraft.attributes[attr] += 1;
        renderManagerCreationScreen(container);
      }
    });
  });

  container.querySelectorAll('.btn-attr-dec').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const attr = e.currentTarget.dataset.attr;
      if (managerDraft.attributes[attr] > managerDraft.baseAttrValue) {
        managerDraft.attributes[attr] -= 1;
        renderManagerCreationScreen(container);
      }
    });
  });

  const btnNext = document.getElementById('btn-next-to-leagues');
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      const validation = validateManagerDraft(managerDraft);
      if (!validation.valid) {
        showToast(validation.errors[0], 'error');
        return;
      }
      navigateTo('league');
    });
  }
}

/* ==========================================================================
   TELA 2: SELEÇÃO DA LIGA
   ========================================================================== */
function renderLeagueSelectionScreen(container) {
  if (!selectedLeagueId && INITIAL_LEAGUES.length > 0) {
    selectedLeagueId = INITIAL_LEAGUES[0].id;
  }

  container.innerHTML = `
    <header class="mobile-top-bar">
      <div class="top-bar-left">
        <button id="btn-back-manager" class="top-bar-btn" aria-label="Voltar">←</button>
        <div style="font-size: 15px; font-weight: 700;">Etapa 2: Escolha da Liga</div>
      </div>
      <div class="top-bar-meta">2 de 3</div>
    </header>

    <div class="screen-content no-bottom-nav">
      <p style="font-size: 13px; margin-bottom: 16px;">
        Selecione o campeonato onde você deseja iniciar sua carreira:
      </p>

      <div style="margin-bottom: 20px;">
        ${INITIAL_LEAGUES.map(league => {
          const isSelected = league.id === selectedLeagueId;
          const clubCount = getClubsByLeague(league.id).length;
          return `
            <div class="league-card ${isSelected ? 'selected' : ''}" data-league-id="${league.id}">
              <div class="league-flag">${league.flag}</div>
              <div class="league-info">
                <div class="league-name">${league.name}</div>
                <div class="league-meta">${league.country} · ${clubCount} Clubes · Moeda: ${league.currencySymbol}</div>
                <div style="font-size: 11px; color: var(--text-subtle); margin-top: 3px;">
                  ${league.description}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div style="margin-top: auto;">
        <button id="btn-next-to-clubs" class="btn btn-primary">
          Avançar para Seleção do Clube →
        </button>
      </div>
    </div>
  `;

  // Voltar
  const btnBack = document.getElementById('btn-back-manager');
  if (btnBack) {
    btnBack.addEventListener('click', () => navigateTo('manager'));
  }

  // Selecionar liga ao clicar no card
  container.querySelectorAll('.league-card').forEach(card => {
    card.addEventListener('click', (e) => {
      selectedLeagueId = e.currentTarget.dataset.leagueId;
      selectedClubId = null; // reseta clube selecionado se mudar de liga
      renderLeagueSelectionScreen(container);
    });
  });

  // Próximo
  const btnNext = document.getElementById('btn-next-to-clubs');
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      if (!selectedLeagueId) {
        showToast('Por favor, selecione uma liga.', 'error');
        return;
      }
      navigateTo('club');
    });
  }
}

/* ==========================================================================
   TELA 3: SELEÇÃO DO CLUBE
   ========================================================================== */
function renderClubSelectionScreen(container) {
  const league = getLeagueById(selectedLeagueId);
  if (!league) {
    navigateTo('league');
    return;
  }

  const clubs = getClubsByLeague(league.id);
  if (!selectedClubId && clubs.length > 0) {
    selectedClubId = clubs[0].id;
  }

  const currentSelectedClub = getClubById(selectedClubId) || clubs[0];

  container.innerHTML = `
    <header class="mobile-top-bar">
      <div class="top-bar-left">
        <button id="btn-back-leagues" class="top-bar-btn" aria-label="Voltar">←</button>
        <div style="font-size: 15px; font-weight: 700;">Etapa 3: Escolha do Clube</div>
      </div>
      <div class="top-bar-meta">3 de 3</div>
    </header>

    <div class="screen-content no-bottom-nav">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
        <span style="font-size: 12px; font-weight: 600; color: var(--text-muted);">
          ${league.flag} ${league.name} (${clubs.length} clubes)
        </span>
      </div>

      <div style="flex: 1; overflow-y: auto; margin-bottom: 16px;">
        ${clubs.map(club => {
          const isSelected = club.id === selectedClubId;
          const stars = '★'.repeat(club.reputation) + '☆'.repeat(5 - club.reputation);
          return `
            <div class="club-card ${isSelected ? 'selected' : ''}" data-club-id="${club.id}">
              <div class="club-shield" style="background: linear-gradient(135deg, ${club.primaryColor}, ${club.secondaryColor}); border: 1px solid rgba(255,255,255,0.2);">
                ${club.shortName}
              </div>
              <div class="club-details">
                <div class="club-name">${club.name}</div>
                <div class="club-meta-row">
                  <span style="color: #f59e0b;">${stars}</span>
                  <span>·</span>
                  <span>Orçamento: ${formatMoney(club.budget, league.currencySymbol)}</span>
                </div>
                <div style="font-size: 11px; color: var(--text-subtle); margin-top: 2px;">
                  Meta: ${club.expectation}
                </div>
              </div>
              <div class="club-overall-badge">
                ${club.overall}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Resumo do Clube Selecionado e Botão de Confirmação -->
      <div class="card" style="margin-bottom: 12px; border-color: rgba(229,37,56,0.3); background-color: #171b26;">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); margin-bottom: 4px;">
          Clube Escolhido
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-size: 16px; font-weight: 800; color: #fff;">${currentSelectedClub.name}</div>
            <div style="font-size: 12px; color: var(--text-muted);">
              Presidente: <strong style="color: #fff">${currentSelectedClub.president || 'Diretoria'}</strong> · Estádio: ${currentSelectedClub.stadium} (${currentSelectedClub.stadiumCapacity.toLocaleString('pt-BR')} lug.)
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 11px; color: var(--text-muted);">Força do Elenco</div>
            <div style="font-size: 18px; font-weight: 800; color: var(--color-primary);">${currentSelectedClub.overall} OVR</div>
          </div>
        </div>
      </div>

      <button id="btn-confirm-start-career" class="btn btn-primary">
        ⚽ Assinar Contrato e Iniciar Carreira
      </button>
    </div>
  `;

  // Voltar para seleção de liga
  const btnBack = document.getElementById('btn-back-leagues');
  if (btnBack) {
    btnBack.addEventListener('click', () => navigateTo('league'));
  }

  // Troca de clube
  container.querySelectorAll('.club-card').forEach(card => {
    card.addEventListener('click', (e) => {
      selectedClubId = e.currentTarget.dataset.clubId;
      renderClubSelectionScreen(container);
    });
  });

  // Confirmar início
  const btnConfirm = document.getElementById('btn-confirm-start-career');
  if (btnConfirm) {
    btnConfirm.addEventListener('click', () => {
      if (!selectedClubId) {
        showToast('Selecione um clube para iniciar a carreira.', 'error');
        return;
      }
      if (onStartNewCareer) {
        onStartNewCareer(managerDraft, selectedLeagueId, selectedClubId);
      }
    });
  }
}

/* ==========================================================================
   TELA 4: PAINEL PRINCIPAL (DASHBOARD) & SUBSCREENS
   ========================================================================== */
function renderDashboardLayout(container, career) {
  const nextMatch = getNextMatchPreview(career);
  const finances = getFinancialOverview(career);

  // Layout base com Top Bar móvel + Área de Conteúdo + Bottom Navigation Bar
  container.innerHTML = `
    <header class="mobile-top-bar">
      <div class="top-bar-left">
        <div class="club-shield" style="width: 32px; height: 32px; font-size: 10px; background: linear-gradient(135deg, ${career.club.primaryColor}, ${career.club.secondaryColor});">
          ${career.club.shortName}
        </div>
        <div>
          <div style="font-size: 13px; font-weight: 800; line-height: 1.1;">${career.club.name}</div>
          <div style="font-size: 10px; color: var(--text-muted);">Técnico: ${career.manager.firstName} ${career.manager.lastName}</div>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 12px; font-weight: 700; color: #10b981; font-variant-numeric: tabular-nums;">
          ${finances.balanceFormatted}
        </span>
        <button id="btn-open-settings" class="top-bar-btn" aria-label="Configurações">
          ⚙️
        </button>
      </div>
    </header>

    <main class="screen-content" id="dashboard-content-area">
      <!-- O conteúdo específico será inserido aqui -->
    </main>

    <nav class="bottom-nav-bar">
      <button class="nav-tab-item ${(!currentSubScreen || currentSubScreen === 'overview') ? 'active' : ''}" data-tab="overview">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        <span class="nav-tab-label">Visão Geral</span>
      </button>

      <button class="nav-tab-item ${currentSubScreen === 'squad' ? 'active' : ''}" data-tab="squad">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        <span class="nav-tab-label">Elenco</span>
      </button>

      <button class="nav-tab-item ${currentSubScreen === 'tactics' ? 'active' : ''}" data-tab="tactics">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
          <line x1="8" y1="21" x2="16" y2="21"></line>
          <line x1="12" y1="17" x2="12" y2="21"></line>
        </svg>
        <span class="nav-tab-label">Táticas</span>
      </button>

      <button class="nav-tab-item ${currentSubScreen === 'calendar' ? 'active' : ''}" data-tab="calendar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="8" r="7"></circle>
          <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
        </svg>
        <span class="nav-tab-label">Campeonato</span>
      </button>

      <button class="nav-tab-item ${currentSubScreen === 'more' ? 'active' : ''}" data-tab="more">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="1"></circle>
          <circle cx="19" cy="12" r="1"></circle>
          <circle cx="5" cy="12" r="1"></circle>
        </svg>
        <span class="nav-tab-label">Mais</span>
      </button>
    </nav>
  `;

  // Renderiza a aba correspondente
  const contentArea = document.getElementById('dashboard-content-area');
  if (contentArea) {
    switch (currentSubScreen) {
      case 'squad':
        renderSquadScreen(contentArea, career);
        break;
      case 'tactics':
        renderTacticsScreen(contentArea, career);
        break;
      case 'calendar':
        renderChampionshipScreen(contentArea, career);
        break;
      case 'market':
        renderMarketScreen(contentArea, career);
        break;
      case 'finances':
        renderFinancesScreen(contentArea, career);
        break;
      case 'next_match':
        renderMatchScreen(contentArea, career);
        break;
      case 'more':
        renderMoreMenuScreen(contentArea, career);
        break;
      case 'overview':
      default:
        renderDashboardOverview(contentArea, career, nextMatch, finances);
        break;
    }
  }

  // Navegação nas Tabs inferiores
  container.querySelectorAll('.nav-tab-item').forEach(tabBtn => {
    tabBtn.addEventListener('click', (e) => {
      const tabName = e.currentTarget.dataset.tab;
      currentSubScreen = tabName === 'overview' ? null : tabName;
      renderApp();
    });
  });

  // Botão de Configurações do Top Bar
  const btnSettings = document.getElementById('btn-open-settings');
  if (btnSettings) {
    btnSettings.addEventListener('click', () => {
      currentSubScreen = 'more';
      renderApp();
    });
  }
}

/**
 * Conteúdo da Visão Geral (Dashboard Principal)
 */
function renderDashboardOverview(contentArea, career, nextMatch, finances) {
  const standings = career.standings || [];
  const userIdx = standings.findIndex(s => s.clubId === career.club.id);
  const userPosStr = userIdx !== -1 ? `${userIdx + 1}º Lugar` : '-';
  const isFinished = !!career.isSeasonFinished;

  contentArea.innerHTML = `
    <!-- Banner Principal do Clube -->
    <div class="hero-club-banner">
      <div class="hero-manager-line">
        <span>📋</span>
        <span>Temporada ${career.currentSeason} · Rodada ${career.currentRound} de ${career.totalRounds}</span>
      </div>
      <div class="hero-club-title">${career.club.name}</div>
      <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 14px; display: flex; flex-direction: column; gap: 2px;">
        <div>Presidente: <strong style="color: #fff">${career.club.president || 'Diretoria Executiva'}</strong></div>
        <div>Objetivo da Diretoria: <strong style="color: #fff">${career.club.expectation}</strong></div>
      </div>

      <div class="hero-stats-grid">
        <div class="hero-stat-pill">
          <div class="stat-label">Força Geral</div>
          <div class="stat-val" style="color: #ff334b;">${career.club.overall} OVR</div>
        </div>
        <div class="hero-stat-pill">
          <div class="stat-label">Caixa</div>
          <div class="stat-val" style="color: #10b981;">${finances.balanceFormatted}</div>
        </div>
        <div class="hero-stat-pill">
          <div class="stat-label">Classificação</div>
          <div class="stat-val" style="color: #3b82f6;">${userPosStr}</div>
        </div>
      </div>
    </div>

    <!-- Próximo Confronto Agendado ou Fim de Temporada -->
    ${isFinished ? `
      <div class="season-finished-card">
        <div class="trophy-badge">🏆</div>
        <div style="font-size: 16px; font-weight: 800; color: #f59e0b; margin-bottom: 4px;">
          Temporada ${career.currentSeason} Concluída!
        </div>
        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 12px;">
          Campeão: <strong style="color: #fff">${career.champion?.clubName || 'Campeão'}</strong>
        </p>
        <button id="btn-view-final-table" class="btn btn-primary btn-sm" style="width: 100%;">
          Ver Classificação Final & Artilharia →
        </button>
      </div>
    ` : nextMatch ? `
      <div class="match-preview-card">
        <div class="match-header-row">
          <span>PRÓXIMO COMPROMISSO</span>
          <span>${career.league.name} · Rodada ${career.currentRound} de ${career.totalRounds}</span>
        </div>

        <div class="match-versus-container">
          <div class="team-versus-block">
            <div class="club-shield" style="width: 44px; height: 44px; font-size: 13px; background: linear-gradient(135deg, ${nextMatch.homeTeam?.primaryColor || '#444'}, ${nextMatch.homeTeam?.secondaryColor || '#222'});">
              ${nextMatch.homeTeam?.shortName || 'CAS'}
            </div>
            <div class="team-versus-name">${nextMatch.homeTeam?.name || 'Casa'}</div>
            <div style="font-size: 10px; color: var(--text-muted);">${nextMatch.isHome ? '(Seu Time · Casa)' : '(Adversário · Casa)'}</div>
          </div>

          <div class="versus-vs">VS</div>

          <div class="team-versus-block">
            <div class="club-shield" style="width: 44px; height: 44px; font-size: 13px; background: linear-gradient(135deg, ${nextMatch.awayTeam?.primaryColor || '#444'}, ${nextMatch.awayTeam?.secondaryColor || '#222'});">
              ${nextMatch.awayTeam?.shortName || 'VIS'}
            </div>
            <div class="team-versus-name">${nextMatch.awayTeam?.name || 'Visitante'}</div>
            <div style="font-size: 10px; color: var(--text-muted);">${!nextMatch.isHome ? '(Seu Time · Fora)' : '(Adversário · Fora)'}</div>
          </div>
        </div>

        <div style="text-align: center; font-size: 11px; color: var(--text-muted); margin-top: 8px;">
          Local: ${nextMatch.stadium} · ${nextMatch.isHome ? 'Você joga em casa (Mandante)' : 'Você joga fora (Visitante)'}
        </div>

        <div style="margin-top: 14px;">
          <button id="btn-quick-play-match" class="btn btn-primary btn-sm" style="width: 100%;">
            Ir para a Partida →
          </button>
        </div>
      </div>
    ` : ''}

    <!-- Ações e Módulos de Gestão -->
    <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); margin-bottom: 8px;">
      Central de Comando
    </div>

    <div class="management-grid">
      <div class="quick-action-card" data-sub="squad">
        <div class="quick-action-icon">👥</div>
        <div class="quick-action-title">Elenco</div>
        <div class="quick-action-desc">Jogadores, atributos e condição física</div>
      </div>

      <div class="quick-action-card" data-sub="tactics">
        <div class="quick-action-icon">📐</div>
        <div class="quick-action-title">Táticas</div>
        <div class="quick-action-desc">Esquema tático, postura e titulares</div>
      </div>

      <div class="quick-action-card" data-sub="calendar">
        <div class="quick-action-icon">🏆</div>
        <div class="quick-action-title">Campeonato</div>
        <div class="quick-action-desc">Classificação, rodadas e artilharia</div>
      </div>

      <div class="quick-action-card" data-sub="market">
        <div class="quick-action-icon">💼</div>
        <div class="quick-action-title">Transferências</div>
        <div class="quick-action-desc">Mercado de atletas e contratos</div>
      </div>

      <div class="quick-action-card" data-sub="finances">
        <div class="quick-action-icon">💰</div>
        <div class="quick-action-title">Finanças</div>
        <div class="quick-action-desc">Balanço, receitas e salários</div>
      </div>

      <div class="quick-action-card" data-sub="more">
        <div class="quick-action-icon">⚙️</div>
        <div class="quick-action-title">Mais Opções</div>
        <div class="quick-action-desc">Salvar jogo e configurações</div>
      </div>
    </div>
  `;

  // Handlers dos cards da central de comando
  contentArea.querySelectorAll('.quick-action-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const sub = e.currentTarget.dataset.sub;
      currentSubScreen = sub;
      renderApp();
    });
  });

  const btnPlay = document.getElementById('btn-quick-play-match');
  if (btnPlay) {
    btnPlay.addEventListener('click', () => {
      if (activeMatch && activeMatch.status === 'finished') {
        activeMatch = null;
      }
      currentSubScreen = 'next_match';
      renderApp();
    });
  }

  const btnFinalTable = document.getElementById('btn-view-final-table');
  if (btnFinalTable) {
    btnFinalTable.addEventListener('click', () => {
      currentSubScreen = 'calendar';
      currentChampTab = 'standings';
      renderApp();
    });
  }
}

/* ==========================================================================
   TELA DE ELENCO E DETALHES DE JOGADORES (ETAPA 2)
   ========================================================================== */
function renderSquadScreen(contentArea, career) {
  career = getCareerState() || career;
  const squad = career.squad || [];
  const lineup = career.lineup || [];
  const starterIds = new Set(lineup.map(s => s.playerId).filter(Boolean));

  // Métricas agregadas do elenco
  const totalPlayers = squad.length;
  const avgAge = totalPlayers > 0 ? (squad.reduce((acc, p) => acc + p.age, 0) / totalPlayers).toFixed(1) : '0';
  const totalMonthlyWages = squad.reduce((acc, p) => acc + p.salary, 0);
  const currency = career.league?.currencySymbol || 'R$';

  // Filtragem por posição
  const filteredSquad = squad.filter(p => {
    if (currentSquadFilter === 'ALL') return true;
    return p.position === currentSquadFilter;
  });

  // Contadores por posição
  const countGol = squad.filter(p => p.position === 'GOL').length;
  const countDef = squad.filter(p => p.position === 'DEF').length;
  const countMei = squad.filter(p => p.position === 'MEI').length;
  const countAta = squad.filter(p => p.position === 'ATA').length;

  contentArea.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
      <div>
        <h2 style="font-size: 18px; font-weight: 800;">Gestão do Elenco</h2>
        <div style="font-size: 11px; color: var(--text-muted);">${career.club.name} · ${totalPlayers} Atletas</div>
      </div>
      <div style="display: flex; gap: 6px;">
        <button class="btn btn-primary btn-sm" id="btn-goto-market-from-squad">💼 Mercado</button>
        <button class="btn btn-secondary btn-sm" id="btn-return-overview">← Voltar</button>
      </div>
    </div>

    <!-- Cards de Resumo do Elenco -->
    <div class="hero-stats-grid" style="margin-bottom: 14px;">
      <div class="hero-stat-pill">
        <div class="stat-label">Força Geral</div>
        <div class="stat-val" style="color: var(--color-primary);">${career.club.overall} OVR</div>
      </div>
      <div class="hero-stat-pill">
        <div class="stat-label">Média Idade</div>
        <div class="stat-val">${avgAge} anos</div>
      </div>
      <div class="hero-stat-pill">
        <div class="stat-label">Folha Mensal</div>
        <div class="stat-val" style="color: #10b981;">${formatMoney(totalMonthlyWages, currency)}</div>
      </div>
    </div>

    <!-- Filtros por Posição -->
    <div class="filter-tabs-row">
      <button class="filter-tab-btn ${currentSquadFilter === 'ALL' ? 'active' : ''}" data-filter="ALL">
        Todos (${totalPlayers})
      </button>
      <button class="filter-tab-btn ${currentSquadFilter === 'GOL' ? 'active' : ''}" data-filter="GOL">
        GOL (${countGol})
      </button>
      <button class="filter-tab-btn ${currentSquadFilter === 'DEF' ? 'active' : ''}" data-filter="DEF">
        DEF (${countDef})
      </button>
      <button class="filter-tab-btn ${currentSquadFilter === 'MEI' ? 'active' : ''}" data-filter="MEI">
        MEI (${countMei})
      </button>
      <button class="filter-tab-btn ${currentSquadFilter === 'ATA' ? 'active' : ''}" data-filter="ATA">
        ATA (${countAta})
      </button>
    </div>

    <!-- Lista de Jogadores -->
    <div style="flex: 1; overflow-y: auto;">
      ${filteredSquad.map(player => {
        const isStarter = starterIds.has(player.id);
        return `
          <div class="player-item-card" data-player-id="${player.id}">
            <div class="player-pos-badge pos-${player.position}">
              ${player.position}
            </div>

            <div class="player-info-col">
              <div class="player-name-line">
                <span class="player-name-text">${player.name}</span>
                <span class="${isStarter ? 'starter-tag' : 'bench-tag'}">
                  ${isStarter ? 'TITULAR' : 'RESERVA'}
                </span>
              </div>
              <div class="player-sub-meta">
                <span>${player.age} anos</span>
                <span>·</span>
                <span>Moral: ${player.morale}</span>
                <span>·</span>
                <span>Físico: ${player.fitness}%</span>
                <div class="fitness-bar-mini">
                  <div class="fitness-fill" style="width: ${player.fitness}%;"></div>
                </div>
              </div>
              <div style="font-size: 11px; color: var(--text-subtle); margin-top: 2px;">
                Salário: ${formatMoney(player.salary, currency)}/mês · Passe: ${formatMoney(player.marketValue, currency)}
              </div>
            </div>

            <div class="player-overall-num">
              ${player.overall}
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <!-- Modal Detalhes do Jogador -->
    <div id="player-modal-backdrop" class="modal-backdrop ${activePlayerDetailsId ? 'open' : ''}">
      <div class="bottom-sheet" id="player-modal-sheet">
        <!-- Preenchido dinamicamente quando aberto -->
      </div>
    </div>
  `;

  attachReturnBtn();

  const btnGotoMarket = document.getElementById('btn-goto-market-from-squad');
  if (btnGotoMarket) {
    btnGotoMarket.addEventListener('click', () => {
      currentSubScreen = 'market';
      renderApp();
    });
  }

  // Handlers dos botões de filtro
  contentArea.querySelectorAll('.filter-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      currentSquadFilter = e.currentTarget.dataset.filter;
      renderSquadScreen(contentArea, career);
    });
  });

  // Handlers de clique no jogador para abrir ficha detalhada
  contentArea.querySelectorAll('.player-item-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const pid = e.currentTarget.dataset.playerId;
      activePlayerDetailsId = pid;
      renderPlayerModal(contentArea, career, pid);
    });
  });
}

/**
 * Renderiza modal com a ficha completa e atributos do atleta
 */
function renderPlayerModal(contentArea, career, playerId) {
  const player = career.squad.find(p => p.id === playerId);
  if (!player) return;

  const lineup = career.lineup || [];
  const assignedSlot = lineup.find(s => s.playerId === player.id);
  const currency = career.league?.currencySymbol || 'R$';
  const modalSheet = document.getElementById('player-modal-sheet');
  const backdrop = document.getElementById('player-modal-backdrop');

  if (!modalSheet || !backdrop) return;

  modalSheet.innerHTML = `
    <div class="sheet-grab-bar"></div>

    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <div class="player-pos-badge pos-${player.position}" style="width: 44px; height: 44px; font-size: 14px;">
          ${player.position}
        </div>
        <div>
          <div style="font-size: 17px; font-weight: 800; color: #fff;">${player.name}</div>
          <div style="font-size: 12px; color: var(--text-muted);">
            ${player.age} anos · ${career.club.name} · ${assignedSlot ? `Titular (${assignedSlot.role})` : 'Reserva'}
          </div>
        </div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 10px; text-transform: uppercase; color: var(--text-muted);">FORÇA</div>
        <div style="font-size: 22px; font-weight: 800; color: var(--color-primary);">${player.overall}</div>
      </div>
    </div>

    <!-- Grid de Atributos Detalhados -->
    <div class="card" style="margin-bottom: 14px; background-color: var(--bg-surface);">
      <div class="card-title" style="font-size: 13px;">Atributos do Atleta</div>

      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 3px;">
            <span>Ataque / Finalização</span>
            <strong style="color: #ff334b;">${player.attack}</strong>
          </div>
          <div class="fitness-bar-mini" style="width: 100%; height: 6px;">
            <div style="height: 100%; width: ${player.attack}%; background-color: #ff334b;"></div>
          </div>
        </div>

        <div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 3px;">
            <span>Defesa / Desarme</span>
            <strong style="color: #3b82f6;">${player.defense}</strong>
          </div>
          <div class="fitness-bar-mini" style="width: 100%; height: 6px;">
            <div style="height: 100%; width: ${player.defense}%; background-color: #3b82f6;"></div>
          </div>
        </div>

        <div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 3px;">
            <span>Passe / Visão</span>
            <strong style="color: #10b981;">${player.pass}</strong>
          </div>
          <div class="fitness-bar-mini" style="width: 100%; height: 6px;">
            <div style="height: 100%; width: ${player.pass}%; background-color: #10b981;"></div>
          </div>
        </div>

        <div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 3px;">
            <span>Físico / Vigor</span>
            <strong style="color: #f59e0b;">${player.physical}</strong>
          </div>
          <div class="fitness-bar-mini" style="width: 100%; height: 6px;">
            <div style="height: 100%; width: ${player.physical}%; background-color: #f59e0b;"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Detalhes Contratuais e Condição -->
    <div class="card" style="margin-bottom: 16px;">
      <div class="card-title" style="font-size: 13px;">Contrato & Condição</div>
      <div style="display: flex; justify-content: space-between; font-size: 12px; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
        <span style="color: var(--text-muted);">Salário Mensal</span>
        <strong>${formatMoney(player.salary, currency)}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 12px; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
        <span style="color: var(--text-muted);">Valor de Mercado</span>
        <strong>${formatMoney(player.marketValue, currency)}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 12px; padding: 6px 0;">
        <span style="color: var(--text-muted);">Condição Física / Moral</span>
        <span>${player.fitness}% · ${player.morale}</span>
      </div>
    </div>

    <div style="display: flex; flex-direction: column; gap: 8px;">
      <div style="display: flex; gap: 8px;">
        <button id="btn-modal-go-tactics" class="btn btn-primary" style="flex: 1;">
          Ir para Prancheta
        </button>
        <button id="btn-modal-sell-player" class="btn btn-secondary" style="flex: 1; border-color: rgba(245, 158, 11, 0.4); color: #fbbf24;">
          💰 Vender Atleta
        </button>
      </div>
      <button id="btn-close-player-modal" class="btn btn-secondary" style="width: 100%;">
        Fechar
      </button>
    </div>
  `;

  backdrop.classList.add('open');

  // Fechar modal
  const btnClose = document.getElementById('btn-close-player-modal');
  if (btnClose) {
    btnClose.addEventListener('click', () => {
      activePlayerDetailsId = null;
      backdrop.classList.remove('open');
    });
  }

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) {
      activePlayerDetailsId = null;
      backdrop.classList.remove('open');
    }
  });

  // Vender atleta diretamente do modal usando negociação
  const btnSell = document.getElementById('btn-modal-sell-player');
  if (btnSell) {
    btnSell.addEventListener('click', () => {
      const check = canSellPlayer(career, player.id);
      if (!check.allowed) {
        showToast(check.reason, 'warning');
        return;
      }

      activePlayerDetailsId = null;
      backdrop.classList.remove('open');
      const contentArea = document.getElementById('dashboard-content');
      openNegotiationSellModal(player, career, contentArea);
    });
  }

  // Ir para táticas
  const btnGoTactics = document.getElementById('btn-modal-go-tactics');
  if (btnGoTactics) {
    btnGoTactics.addEventListener('click', () => {
      activePlayerDetailsId = null;
      backdrop.classList.remove('open');
      currentSubScreen = 'tactics';
      renderApp();
    });
  }
}

/* ==========================================================================
   TELA DE TÁTICAS, ESCALAÇÃO E PRANCHETA (ETAPA 2)
   ========================================================================== */
function renderTacticsScreen(contentArea, career) {
  // Garante que os dados sempre reflitam o estado central mais recente
  career = getCareerState() || career;
  const squad = career.squad || [];
  const lineup = career.lineup || [];
  const tactics = career.tactics || { formation: '4-3-3', mentality: 'balanced', modifiers: TACTICAL_MENTALITIES.balanced };
  const currentFormationKey = tactics.formation || '4-3-3';
  const formationDef = FORMATIONS[currentFormationKey] || FORMATIONS['4-3-3'];
  const mentalityDef = TACTICAL_MENTALITIES[tactics.mentality] || TACTICAL_MENTALITIES.balanced;

  // Mapa de coordenadas no campo tático por formação (vertical, gol no rodapé, ataque no topo)
  const pitchCoords = {
    '4-3-3': [
      { x: 50, y: 88 }, // GOL
      { x: 18, y: 72 }, // LE
      { x: 38, y: 74 }, // ZAG
      { x: 62, y: 74 }, // ZAG
      { x: 82, y: 72 }, // LD
      { x: 50, y: 52 }, // VOL
      { x: 32, y: 44 }, // MC
      { x: 68, y: 44 }, // MO
      { x: 20, y: 22 }, // PE
      { x: 50, y: 16 }, // CA
      { x: 80, y: 22 }  // PD
    ],
    '4-4-2': [
      { x: 50, y: 88 }, // GOL
      { x: 18, y: 72 }, // LE
      { x: 38, y: 74 }, // ZAG
      { x: 62, y: 74 }, // ZAG
      { x: 82, y: 72 }, // LD
      { x: 38, y: 50 }, // VOL
      { x: 62, y: 50 }, // MC
      { x: 18, y: 44 }, // ME
      { x: 82, y: 44 }, // MD
      { x: 38, y: 18 }, // ATA
      { x: 62, y: 18 }  // ATA
    ],
    '4-2-3-1': [
      { x: 50, y: 88 }, // GOL
      { x: 18, y: 72 }, // LE
      { x: 38, y: 74 }, // ZAG
      { x: 62, y: 74 }, // ZAG
      { x: 82, y: 72 }, // LD
      { x: 38, y: 56 }, // VOL
      { x: 62, y: 56 }, // VOL
      { x: 20, y: 36 }, // ME
      { x: 50, y: 32 }, // MC
      { x: 80, y: 36 }, // MD
      { x: 50, y: 16 }  // CA
    ],
    '4-5-1': [
      { x: 50, y: 88 }, // GOL
      { x: 18, y: 72 }, // LE
      { x: 38, y: 74 }, // ZAG
      { x: 62, y: 74 }, // ZAG
      { x: 82, y: 72 }, // LD
      { x: 50, y: 56 }, // VOL
      { x: 34, y: 50 }, // MC
      { x: 66, y: 50 }, // MC
      { x: 18, y: 40 }, // AE
      { x: 82, y: 40 }, // AD
      { x: 50, y: 18 }  // CA
    ]
  };

  const currentCoords = pitchCoords[currentFormationKey] || pitchCoords['4-3-3'];

  contentArea.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
      <div>
        <h2 style="font-size: 18px; font-weight: 800;">Quadro Tático</h2>
        <div style="font-size: 11px; color: var(--text-muted);">${formationDef.label} · Força: ${career.club.overall} OVR</div>
      </div>
      <button class="btn btn-secondary btn-sm" id="btn-return-overview">← Voltar</button>
    </div>

    <!-- Seletor de Formações com 4 Defensores -->
    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px;">
      Esquema Tático (4 Defensores)
    </div>
    <div class="formation-pills-row">
      ${Object.keys(FORMATIONS).map(key => `
        <button class="formation-pill-btn ${currentFormationKey === key ? 'active' : ''}" data-formation="${key}">
          ${FORMATIONS[key].name}
        </button>
      `).join('')}
    </div>

    <!-- Seletor de Postura Tática (Ofensiva, Equilibrada, Defensiva) -->
    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px;">
      Postura da Equipe
    </div>
    <div class="mentality-selector-grid">
      ${Object.values(TACTICAL_MENTALITIES).map(m => {
        const isActive = tactics.mentality === m.key;
        return `
          <div class="mentality-option-card ${isActive ? 'active' : ''}" data-mentality="${m.key}">
            <div class="mentality-icon">${m.icon}</div>
            <div class="mentality-title">${m.name}</div>
            <div class="mentality-badge-effect">
              ${m.key === 'offensive' ? '+20% Ataque' : m.key === 'defensive' ? '+25% Defesa' : 'Equilíbrio'}
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <!-- Explicação do Modificador Tático Ativo -->
    <div class="card" style="padding: 10px 14px; margin-bottom: 12px; background: rgba(0,0,0,0.25); border-color: rgba(255,255,255,0.06);">
      <div style="font-size: 11px; color: var(--text-main);">
        <strong>${mentalityDef.icon} Postura ${mentalityDef.name}:</strong> ${mentalityDef.description}
      </div>
    </div>

    <!-- Prancheta Tática / Campo de Jogo Interativo -->
    <div class="tactical-pitch-container">
      <div class="pitch-half-line"></div>
      <div class="pitch-center-circle"></div>
      <div class="pitch-penalty-area-top"></div>
      <div class="pitch-penalty-area-bottom"></div>

      <!-- 11 Nós dos Titulares no Campo -->
      ${lineup.map((slot, index) => {
        const coord = currentCoords[index] || { x: 50, y: 50 };
        const player = squad.find(p => p.id === slot.playerId);
        const displayName = player ? player.name.split(' ').slice(-1)[0] : 'Vazio';
        const displayOvr = player ? player.overall : '--';

        return `
          <div class="pitch-player-node" style="left: ${coord.x}%; top: ${coord.y}%;" data-slot-index="${slot.slotIndex}">
            <div class="node-circle pos-${slot.pos}">
              ${slot.pos}
            </div>
            <div class="node-name">
              ${displayName} <span class="node-ovr-tag">${displayOvr}</span>
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <!-- Ações Rápidas de Escalação -->
    <div style="display: flex; gap: 8px; margin-bottom: 14px;">
      <button id="btn-auto-optimize-lineup" class="btn btn-secondary btn-sm" style="flex: 1;">
        ⚡ Auto-Escalar Melhores
      </button>
      <button id="btn-save-lineup-state" class="btn btn-primary btn-sm" style="flex: 1;">
        💾 Salvar Escalação
      </button>
    </div>

    <!-- Lista Detalhada dos 11 Titulares -->
    <div class="card">
      <div class="card-title">Titulares Escalados</div>

      ${lineup.map(slot => {
        const player = squad.find(p => p.id === slot.playerId);
        return `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="player-pos-badge pos-${slot.pos}" style="width: 28px; height: 28px; font-size: 10px;">
                ${slot.pos}
              </span>
              <div>
                <div style="font-size: 12px; font-weight: 700; color: #fff;">
                  ${player ? player.name : '<span style="color: #ef4444;">Vaga desocupada</span>'}
                </div>
                <div style="font-size: 10px; color: var(--text-muted);">${slot.role}</div>
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 13px; font-weight: 800; color: var(--color-primary);">
                ${player ? `${player.overall} OVR` : '--'}
              </span>
              <button class="btn btn-secondary btn-sm btn-substitute-slot" data-slot-index="${slot.slotIndex}" style="padding: 4px 8px; min-height: 28px; font-size: 11px;">
                Substituir
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <!-- Modal de Substituição de Jogador -->
    <div id="sub-modal-backdrop" class="modal-backdrop ${activeSubstituteSlotIndex !== null ? 'open' : ''}">
      <div class="bottom-sheet" id="sub-modal-sheet">
        <!-- Preenchido dinamicamente quando aberto -->
      </div>
    </div>
  `;

  attachReturnBtn();

  // Handlers de Formação (atualização e persistência imediatas)
  contentArea.querySelectorAll('.formation-pill-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const fKey = e.currentTarget.dataset.formation;
      updateTacticsFormation(fKey);
      const latestCareer = getCareerState();
      saveCareer(latestCareer);
      renderApp();
      showToast(`Formação alterada para ${fKey}`, 'info');
    });
  });

  // Handlers de Postura Tática (atualização e persistência imediatas)
  contentArea.querySelectorAll('.mentality-option-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const mKey = e.currentTarget.dataset.mentality;
      updateTacticsMentality(mKey);
      const latestCareer = getCareerState();
      saveCareer(latestCareer);
      renderApp();
      showToast(`Postura alterada para ${TACTICAL_MENTALITIES[mKey].name}`, 'info');
    });
  });

  // Clique nos nós do campo para substituir
  contentArea.querySelectorAll('.pitch-player-node').forEach(node => {
    node.addEventListener('click', (e) => {
      const slotIndex = parseInt(e.currentTarget.dataset.slotIndex, 10);
      activeSubstituteSlotIndex = slotIndex;
      openSubstitutionDrawer(contentArea, career, slotIndex);
    });
  });

  // Clique no botão "Substituir" da lista
  contentArea.querySelectorAll('.btn-substitute-slot').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const slotIndex = parseInt(e.currentTarget.dataset.slotIndex, 10);
      activeSubstituteSlotIndex = slotIndex;
      openSubstitutionDrawer(contentArea, career, slotIndex);
    });
  });

  // Auto-otimizar escalação
  const btnAuto = document.getElementById('btn-auto-optimize-lineup');
  if (btnAuto) {
    btnAuto.addEventListener('click', () => {
      autoOptimizeLineup();
      const latestCareer = getCareerState();
      saveCareer(latestCareer);
      renderApp();
      showToast('Escalação otimizada com os melhores jogadores!', 'success');
    });
  }

  // Salvar escalação manualmente
  const btnSaveLineup = document.getElementById('btn-save-lineup-state');
  if (btnSaveLineup) {
    btnSaveLineup.addEventListener('click', () => {
      const validation = validateCurrentLineup();
      if (!validation.valid) {
        showToast(validation.errors[0], 'error');
        return;
      }

      const saved = saveCareer(career);
      if (saved) {
        showToast('Escalação e táticas salvas com sucesso!', 'success');
      } else {
        showToast('Erro ao salvar no armazenamento local.', 'error');
      }
    });
  }
}

/**
 * Abre a gaveta de substituição para um slot específico com validação anti-duplicidade
 */
function openSubstitutionDrawer(contentArea, career, slotIndex) {
  const lineup = career.lineup || [];
  const squad = career.squad || [];
  const targetSlot = lineup.find(s => s.slotIndex === slotIndex);
  if (!targetSlot) return;

  const currentOccupant = squad.find(p => p.id === targetSlot.playerId);
  const modalSheet = document.getElementById('sub-modal-sheet');
  const backdrop = document.getElementById('sub-modal-backdrop');
  if (!modalSheet || !backdrop) return;

  // Ordena candidatos: jogadores da mesma posição primeiro, depois outros, com Overall decrescente
  const sortedCandidates = [...squad].sort((a, b) => {
    const aMatch = a.position === targetSlot.pos ? 1 : 0;
    const bMatch = b.position === targetSlot.pos ? 1 : 0;
    if (aMatch !== bMatch) return bMatch - aMatch;
    return b.overall - a.overall;
  });

  modalSheet.innerHTML = `
    <div class="sheet-grab-bar"></div>

    <div style="margin-bottom: 14px;">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted);">
        Substituição na Vaga
      </div>
      <div style="font-size: 16px; font-weight: 800; color: #fff;">
        ${targetSlot.role} (${targetSlot.pos})
      </div>
      <div style="font-size: 12px; color: var(--text-muted);">
        Atual titular: <strong style="color: #fff">${currentOccupant ? currentOccupant.name : 'Vaga Desocupada'}</strong>
      </div>
    </div>

    <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); margin-bottom: 8px;">
      Selecione o jogador para entrar na vaga:
    </div>

    <div style="max-height: 50vh; overflow-y: auto; margin-bottom: 14px;">
      ${sortedCandidates.map(player => {
        const isCurrentlyInThisSlot = currentOccupant && currentOccupant.id === player.id;
        const otherSlot = lineup.find(s => s.playerId === player.id && s.slotIndex !== slotIndex);
        const positionMatches = player.position === targetSlot.pos;

        return `
          <div class="player-item-card btn-select-sub-candidate ${isCurrentlyInThisSlot ? 'selected' : ''}" data-player-id="${player.id}" style="${isCurrentlyInThisSlot ? 'border-color: var(--color-primary); background-color: rgba(229,37,56,0.1);' : ''}">
            <div class="player-pos-badge pos-${player.position}">
              ${player.position}
            </div>

            <div class="player-info-col">
              <div class="player-name-line">
                <span class="player-name-text">${player.name}</span>
                ${otherSlot ? `
                  <span class="bench-tag" style="background-color: rgba(245,158,11,0.2); color: #f59e0b;">
                    Troca com ${otherSlot.role}
                  </span>
                ` : isCurrentlyInThisSlot ? `
                  <span class="starter-tag">Atual</span>
                ` : `
                  <span class="bench-tag">Banco</span>
                `}
              </div>
              <div class="player-sub-meta">
                <span>${player.age} anos</span>
                <span>·</span>
                <span>Físico: ${player.fitness}%</span>
                ${!positionMatches ? `<span style="color: #f59e0b;">(Fora de posição)</span>` : ''}
              </div>
            </div>

            <div class="player-overall-num">
              ${player.overall}
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <button id="btn-close-sub-drawer" class="btn btn-secondary">
      Cancelar
    </button>
  `;

  backdrop.classList.add('open');

  // Cancelar / fechar
  const btnClose = document.getElementById('btn-close-sub-drawer');
  if (btnClose) {
    btnClose.addEventListener('click', () => {
      activeSubstituteSlotIndex = null;
      backdrop.classList.remove('open');
    });
  }

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) {
      activeSubstituteSlotIndex = null;
      backdrop.classList.remove('open');
    }
  });

  // Atribuir jogador ao slot (atualização e salvamento imediatos)
  modalSheet.querySelectorAll('.btn-select-sub-candidate').forEach(card => {
    card.addEventListener('click', (e) => {
      const chosenPlayerId = e.currentTarget.dataset.playerId;
      const res = assignPlayerToLineup(slotIndex, chosenPlayerId);
      if (res.success) {
        const latestCareer = getCareerState();
        saveCareer(latestCareer);
        activeSubstituteSlotIndex = null;
        backdrop.classList.remove('open');
        renderApp();
        const player = latestCareer?.squad?.find(p => p.id === chosenPlayerId);
        showToast(`${player ? player.name : 'Jogador'} escalado como ${targetSlot.role}!`, 'success');
      } else {
        showToast(res.message || 'Erro ao escalar jogador.', 'error');
      }
    });
  });
}

/* ==========================================================================
   TELA DE CAMPEONATO: CLASSIFICAÇÃO, CALENDÁRIO & ARTILHARIA (ETAPA 4)
   ========================================================================== */
function renderChampionshipScreen(contentArea, career) {
  career = getCareerState() || career;
  const standings = career.standings || [];
  const calendar = career.calendar || [];
  const topScorers = career.topScorers || [];
  const totalRounds = career.totalRounds || (calendar.length || 22);

  if (!calendarSelectedRound || calendarSelectedRound > totalRounds || calendarSelectedRound < 1) {
    calendarSelectedRound = career.currentRound || 1;
  }

  const selectedRoundData = calendar[calendarSelectedRound - 1] || { roundNumber: calendarSelectedRound, matches: [], completed: false };

  contentArea.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
      <div>
        <h2 style="font-size: 18px; font-weight: 800; line-height: 1.2;">${career.league.name}</h2>
        <div style="font-size: 11px; color: var(--text-muted);">
          Temporada ${career.currentSeason} · Rodada ${career.currentRound} de ${totalRounds}
          ${career.isSeasonFinished ? ' · <span style="color: #f59e0b; font-weight: 700;">FINALIZADA</span>' : ''}
        </div>
      </div>
      <button class="btn btn-secondary btn-sm" id="btn-return-overview">← Voltar</button>
    </div>

    ${career.isSeasonFinished ? `
      <div class="season-finished-card">
        <div class="trophy-badge">🏆</div>
        <div style="font-size: 17px; font-weight: 900; color: #f59e0b; margin-bottom: 4px;">
          CAMPEONATO ENCERRADO!
        </div>
        <div style="font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 6px;">
          Campeão: ${career.champion?.clubName || (standings[0] && standings[0].clubName) || 'Campeão'}
        </div>
        <div style="font-size: 11px; color: var(--text-muted);">
          Artilheiro: <strong style="color: #fff">${topScorers[0] ? `${topScorers[0].playerName} (${topScorers[0].goals} gols, ${topScorers[0].clubName})` : 'Nenhum'}</strong>
        </div>
      </div>
    ` : ''}

    <!-- Seletor de Abas do Campeonato -->
    <div class="champ-nav-pills">
      <button class="champ-pill-btn ${currentChampTab === 'standings' ? 'active' : ''}" data-champ-tab="standings">
        📊 Classificação
      </button>
      <button class="champ-pill-btn ${currentChampTab === 'calendar' ? 'active' : ''}" data-champ-tab="calendar">
        📅 Rodadas
      </button>
      <button class="champ-pill-btn ${currentChampTab === 'scorers' ? 'active' : ''}" data-champ-tab="scorers">
        ⚽ Artilharia
      </button>
    </div>

    <!-- Conteúdo da Aba Ativa -->
    <div id="champ-tab-content-area">
      ${currentChampTab === 'standings' ? renderStandingsTabHtml(career, standings) :
        currentChampTab === 'calendar' ? renderCalendarTabHtml(career, calendarSelectedRound, selectedRoundData, totalRounds) :
        renderTopScorersTabHtml(career, topScorers)}
    </div>
  `;

  attachReturnBtn();

  // Navegação entre abas do campeonato
  contentArea.querySelectorAll('.champ-pill-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      currentChampTab = e.currentTarget.dataset.champTab;
      renderChampionshipScreen(contentArea, career);
    });
  });

  // Eventos da aba de Calendário (navegação de rodadas)
  if (currentChampTab === 'calendar') {
    const btnPrev = document.getElementById('btn-prev-round');
    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        if (calendarSelectedRound > 1) {
          calendarSelectedRound -= 1;
          renderChampionshipScreen(contentArea, career);
        }
      });
    }

    const btnNext = document.getElementById('btn-next-round');
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        if (calendarSelectedRound < totalRounds) {
          calendarSelectedRound += 1;
          renderChampionshipScreen(contentArea, career);
        }
      });
    }

    const btnCurrent = document.getElementById('btn-jump-current-round');
    if (btnCurrent) {
      btnCurrent.addEventListener('click', () => {
        calendarSelectedRound = career.currentRound || 1;
        renderChampionshipScreen(contentArea, career);
      });
    }
  }
}

/**
 * Renderiza HTML da tabela de classificação
 */
function renderStandingsTabHtml(career, standings) {
  const isBrasil = career.league.id === 'bra_serie_a';
  const totalClubs = standings.length;

  return `
    <div class="standings-table-card">
      <div class="standings-table-container">
        <table class="standings-table">
          <thead>
            <tr>
              <th class="standings-col-pos">#</th>
              <th class="standings-col-club">Clube</th>
              <th>J</th>
              <th>V</th>
              <th>E</th>
              <th>D</th>
              <th>GP</th>
              <th>GC</th>
              <th>SG</th>
              <th class="standings-col-pts">PTS</th>
            </tr>
          </thead>
          <tbody>
            ${standings.map((club, idx) => {
              const pos = idx + 1;
              const isUser = club.clubId === career.club.id;
              let posClass = '';
              if (pos <= 4) posClass = 'pos-g4';
              else if (isBrasil && pos > (totalClubs - 4)) posClass = 'pos-relegation';

              return `
                <tr class="${isUser ? 'user-club-row' : ''}">
                  <td class="standings-col-pos ${posClass}">${pos}º</td>
                  <td class="standings-col-club">
                    <div class="standings-club-cell">
                      <div class="standings-mini-shield" style="background: linear-gradient(135deg, ${club.primaryColor}, ${club.secondaryColor});">
                        ${club.shortName}
                      </div>
                      <span style="${isUser ? 'color: var(--color-primary); font-weight: 800;' : ''}">${club.clubName}</span>
                    </div>
                  </td>
                  <td>${club.played}</td>
                  <td>${club.won}</td>
                  <td>${club.drawn}</td>
                  <td>${club.lost}</td>
                  <td>${club.goalsFor}</td>
                  <td>${club.goalsAgainst}</td>
                  <td style="color: ${club.goalDifference > 0 ? '#10b981' : club.goalDifference < 0 ? '#ef4444' : 'inherit'}; font-weight: 600;">
                    ${club.goalDifference > 0 ? `+${club.goalDifference}` : club.goalDifference}
                  </td>
                  <td class="standings-col-pts">${club.points}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <div class="standings-legend">
        <div class="legend-item">
          <div class="legend-dot" style="background: #10b981;"></div>
          <span>1º ao 4º: Vaga Libertadores / Champions</span>
        </div>
        ${isBrasil ? `
          <div class="legend-item">
            <div class="legend-dot" style="background: #ef4444;"></div>
            <span>Z-4: Zona de Rebaixamento</span>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * Renderiza HTML da aba de calendário e rodadas
 */
function renderCalendarTabHtml(career, activeRoundNum, roundData, totalRounds) {
  const isCurrentRound = activeRoundNum === career.currentRound;

  return `
    <div class="round-selector-bar">
      <button id="btn-prev-round" class="round-nav-btn" ${activeRoundNum <= 1 ? 'disabled' : ''} aria-label="Rodada anterior">
        ◀
      </button>

      <div class="round-selector-info">
        <div class="round-selector-title">Rodada ${activeRoundNum} de ${totalRounds}</div>
        <div class="round-selector-status ${roundData.completed ? 'completed' : 'pending'}">
          ${roundData.completed ? '✓ Concluída' : isCurrentRound ? '⚡ Rodada Atual' : '⏳ A Disputar'}
        </div>
      </div>

      <button id="btn-next-round" class="round-nav-btn" ${activeRoundNum >= totalRounds ? 'disabled' : ''} aria-label="Próxima rodada">
        ▶
      </button>
    </div>

    ${!isCurrentRound ? `
      <div style="text-align: center; margin-bottom: 12px;">
        <button id="btn-jump-current-round" class="btn btn-secondary btn-sm" style="font-size: 11px;">
          📍 Ir para a Rodada Atual (${career.currentRound})
        </button>
      </div>
    ` : ''}

    <div class="fixtures-list">
      ${(roundData.matches || []).map(m => {
        const homeClub = getClubById(m.homeClubId);
        const awayClub = getClubById(m.awayClubId);
        const isUserMatch = m.homeClubId === career.club.id || m.awayClubId === career.club.id;

        return `
          <div class="fixture-card ${isUserMatch ? 'user-fixture' : ''}">
            <div class="fixture-teams-row">
              <div class="fixture-team-col">
                <div class="club-shield" style="width: 32px; height: 32px; font-size: 10px; background: linear-gradient(135deg, ${homeClub?.primaryColor || '#333'}, ${homeClub?.secondaryColor || '#111'});">
                  ${homeClub?.shortName || 'CAS'}
                </div>
                <div class="fixture-team-name ${m.homeClubId === career.club.id ? 'font-bold' : ''}">
                  ${homeClub?.name || m.homeClubId}
                </div>
              </div>

              <div class="fixture-score-center">
                ${m.completed ? `
                  <div class="fixture-score-badge">
                    ${m.homeScore} : ${m.awayScore}
                  </div>
                ` : `
                  <div class="fixture-score-badge pending">
                    VS
                  </div>
                `}
              </div>

              <div class="fixture-team-col away">
                <div class="club-shield" style="width: 32px; height: 32px; font-size: 10px; background: linear-gradient(135deg, ${awayClub?.primaryColor || '#333'}, ${awayClub?.secondaryColor || '#111'});">
                  ${awayClub?.shortName || 'VIS'}
                </div>
                <div class="fixture-team-name ${m.awayClubId === career.club.id ? 'font-bold' : ''}">
                  ${awayClub?.name || m.awayClubId}
                </div>
              </div>
            </div>

            ${m.completed && m.scorers && m.scorers.length > 0 ? `
              <div class="fixture-scorers-box">
                ${m.scorers.map(s => `
                  <div>⚽ ${s.playerName} (${s.minute}') · <span style="color: var(--text-subtle);">${s.clubName}</span></div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Renderiza HTML da aba de artilharia
 */
function renderTopScorersTabHtml(career, topScorers) {
  if (!topScorers || topScorers.length === 0) {
    return `
      <div class="card" style="text-align: center; padding: 28px 16px;">
        <div style="font-size: 32px; margin-bottom: 8px;">⚽</div>
        <div style="font-size: 14px; font-weight: 700; margin-bottom: 4px;">Nenhum Gol Registrado</div>
        <div style="font-size: 12px; color: var(--text-muted);">
          A artilharia será atualizada assim que os primeiros gols forem marcados no campeonato!
        </div>
      </div>
    `;
  }

  const topList = topScorers.slice(0, 20);

  return `
    <div class="top-scorers-list">
      ${topList.map((scorer, idx) => {
        const rank = idx + 1;
        let rankClass = '';
        if (rank === 1) rankClass = 'gold';
        else if (rank === 2) rankClass = 'silver';
        else if (rank === 3) rankClass = 'bronze';

        return `
          <div class="scorer-card">
            <div class="scorer-left-group">
              <div class="scorer-rank-pill ${rankClass}">
                ${rank}º
              </div>
              <div>
                <div class="scorer-name">${scorer.playerName}</div>
                <div class="scorer-club">${scorer.clubName}</div>
              </div>
            </div>

            <div class="scorer-goals-pill">
              ⚽ ${scorer.goals} ${scorer.goals === 1 ? 'gol' : 'gols'}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/* ==========================================================================
   TELA DE PARTIDA AO VIVO (ETAPA 3 - MOTOR DE PARTIDAS)
   ========================================================================== */
function renderMatchScreen(contentArea, career) {
  career = getCareerState() || career;

  // Se não houver partida ativa, cria nova simulação com o próximo confronto pendente
  if (!activeMatch) {
    const nextInfo = getNextMatchPreview(career);
    if (!nextInfo || nextInfo.isSeasonFinished) {
      showToast('A temporada já foi finalizada! Veja os resultados no campeonato.', 'info');
      currentSubScreen = 'calendar';
      renderApp();
      return;
    }
    activeMatch = createMatchSimulation(career, nextInfo);
  }

  const isSimulating = !!matchSimulationTimer;
  const isHalftime = activeMatch.status === 'halftime';
  const isFinished = activeMatch.status === 'finished';
  const isNotStarted = activeMatch.status === 'not_started';

  // Obter texto do relógio
  let clockText = 'PRÉ-JOGO';
  let isClockLive = false;
  if (activeMatch.status === 'first_half') {
    clockText = `${activeMatch.minute}' 🟢 1ºT`;
    isClockLive = isSimulating;
  } else if (isHalftime) {
    clockText = 'INTERVALO';
  } else if (activeMatch.status === 'second_half') {
    clockText = `${activeMatch.minute}' 🟢 2ºT`;
    isClockLive = isSimulating;
  } else if (isFinished) {
    clockText = 'FIM DE JOGO';
  }

  contentArea.innerHTML = `
    <!-- Top Bar da Partida -->
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
      <div>
        <h2 style="font-size: 17px; font-weight: 800;">Partida ao Vivo</h2>
        <div style="font-size: 11px; color: var(--text-muted);">${activeMatch.competition} · Rodada ${activeMatch.round}</div>
      </div>
      <button class="btn btn-secondary btn-sm" id="btn-leave-match">
        ${isFinished ? 'Concluir' : '← Voltar'}
      </button>
    </div>

    <!-- Placar ao Vivo Principal -->
    <div class="match-live-scoreboard">
      <div class="match-live-header-bar">
        <span>🏟️ ${activeMatch.stadium}</span>
        <div class="match-clock-badge ${isClockLive ? 'live' : ''}" id="match-clock-display">
          ${clockText}
        </div>
      </div>

      <div class="match-teams-score-row">
        <!-- Mandante (Meu Clube) -->
        <div class="match-team-col">
          <div class="club-shield" style="width: 48px; height: 48px; font-size: 14px; background: linear-gradient(135deg, ${activeMatch.homeTeam.primaryColor}, ${activeMatch.homeTeam.secondaryColor});">
            ${activeMatch.homeTeam.shortName}
          </div>
          <div class="match-team-name-lg">${activeMatch.homeTeam.name}</div>
          <div style="font-size: 10px; color: var(--text-muted);">
            ${activeMatch.homeTactics.formation} · ${activeMatch.homeTactics.modifiers?.name || 'Equilibrada'}
          </div>
        </div>

        <!-- Placar Central -->
        <div class="match-score-center">
          <div class="match-big-score" id="match-score-text">
            ${activeMatch.homeScore} : ${activeMatch.awayScore}
          </div>
          <div class="match-status-label" id="match-status-text">
            ${isNotStarted ? 'Aguardando Início' : isHalftime ? 'Intervalo' : isFinished ? 'Encerrada' : 'Em Andamento'}
          </div>
        </div>

        <!-- Visitante -->
        <div class="match-team-col">
          <div class="club-shield" style="width: 48px; height: 48px; font-size: 14px; background: linear-gradient(135deg, ${activeMatch.awayTeam.primaryColor}, ${activeMatch.awayTeam.secondaryColor});">
            ${activeMatch.awayTeam.shortName}
          </div>
          <div class="match-team-name-lg">${activeMatch.awayTeam.name}</div>
          <div style="font-size: 10px; color: var(--text-muted);">
            ${activeMatch.awayTactics.formation} · ${activeMatch.awayTactics.modifiers?.name || 'Equilibrada'}
          </div>
        </div>
      </div>
    </div>

    <!-- Barra de Controles da Partida -->
    <div class="card" style="padding: 12px; margin-bottom: 12px;">
      <div style="display: flex; flex-direction: column; gap: 10px;">
        ${isNotStarted ? `
          <button id="btn-start-match-sim" class="btn btn-primary" style="font-size: 15px; font-weight: 800;">
            ⚽ Iniciar Partida (1º Tempo)
          </button>
        ` : isHalftime ? `
          <div style="text-align: center; font-size: 12px; color: var(--color-warning); font-weight: 700;">
            ⏸️ Intervalo de Jogo — Ajuste a equipe para o 2º Tempo
          </div>
          <div style="display: flex; gap: 8px;">
            <button id="btn-resume-second-half" class="btn btn-primary" style="flex: 1;">
              ▶ Iniciar 2º Tempo
            </button>
            <button id="btn-in-match-subs" class="btn btn-secondary" style="flex: 1;">
              🔄 Substituições (${(activeMatch.isUserHome !== false ? activeMatch.homeSubsUsed : activeMatch.awaySubsUsed)}/5)
            </button>
          </div>
        ` : isFinished ? `
          <div style="text-align: center; font-size: 13px; font-weight: 800; color: #10b981; margin-bottom: 6px;">
            🏁 Partida Encerrada! Rodada Processada no Campeonato.
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <button id="btn-finish-and-next-match" class="btn btn-primary" style="width: 100%; font-weight: 800; font-size: 14px;">
              ⚽ Próxima Partida →
            </button>
            <div style="display: flex; gap: 8px;">
              <button id="btn-finish-and-exit" class="btn btn-secondary" style="flex: 1;">
                🏠 Painel Principal
              </button>
              <button id="btn-finish-and-table" class="btn btn-secondary" style="flex: 1;">
                📊 Classificação
              </button>
            </div>
          </div>
        ` : `
          <!-- Partida em andamento -->
          <div class="match-controls-bar" style="margin-bottom: 0;">
            <button id="btn-toggle-pause" class="btn ${isSimulating ? 'btn-secondary' : 'btn-primary'} btn-sm" style="flex: 1; min-height: 38px;">
              ${isSimulating ? '⏸ Pausar' : '▶ Continuar'}
            </button>

            <!-- Seletor de Velocidade -->
            <div class="speed-selector-group">
              <button class="speed-btn ${matchSimulationSpeed === 1 ? 'active' : ''}" data-speed="1">1x</button>
              <button class="speed-btn ${matchSimulationSpeed === 2 ? 'active' : ''}" data-speed="2">2x</button>
              <button class="speed-btn ${matchSimulationSpeed === 5 ? 'active' : ''}" data-speed="5">⚡ Rápido</button>
            </div>

            <button id="btn-fast-forward-match" class="btn btn-secondary btn-sm" style="min-height: 38px; padding: 0 10px; font-weight: 700;" title="Simular até o final da partida">
              ⏩ Fim
            </button>

            <button id="btn-in-match-subs" class="btn btn-secondary btn-sm" style="min-height: 38px;">
              🔄 Subs (${(activeMatch.isUserHome !== false ? activeMatch.homeSubsUsed : activeMatch.awaySubsUsed)}/5)
            </button>
          </div>
        `}
      </div>
    </div>

    <!-- Feed de Narração de Lances em Tempo Real -->
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
      <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px;">
        Narração dos Lances
      </span>
      <span style="font-size: 11px; color: var(--text-subtle);">
        ${activeMatch.events.length} lance(s)
      </span>
    </div>

    <div class="match-events-feed" id="match-events-feed-container">
      ${activeMatch.events.map(ev => {
        let eventClass = '';
        if (ev.type === 'goal') eventClass = 'event-goal';
        else if (ev.type === 'card_yellow') eventClass = 'event-card-yellow';
        else if (ev.type === 'card_red') eventClass = 'event-card-red';

        return `
          <div class="match-event-row ${eventClass}">
            <span class="match-event-minute">${ev.minute}'</span>
            <span class="match-event-text">${ev.text}</span>
          </div>
        `;
      }).join('')}
    </div>

    <!-- Estatísticas Comparativas da Partida -->
    <div class="match-stats-panel">
      <div class="card-title" style="font-size: 13px; margin-bottom: 12px;">Estatísticas do Confronto</div>

      <!-- Posse de Bola -->
      <div class="stat-comparison-row">
        <div class="stat-labels-row">
          <span>${activeMatch.stats.possession.home}%</span>
          <span class="stat-name-center">Posse de Bola</span>
          <span>${activeMatch.stats.possession.away}%</span>
        </div>
        <div class="stat-bar-duo">
          <div class="stat-bar-fill-home" style="width: ${activeMatch.stats.possession.home}%;"></div>
          <div class="stat-bar-fill-away" style="width: ${activeMatch.stats.possession.away}%;"></div>
        </div>
      </div>

      <!-- Finalizações -->
      <div class="stat-comparison-row">
        <div class="stat-labels-row">
          <span>${activeMatch.stats.shots.home}</span>
          <span class="stat-name-center">Finalizações</span>
          <span>${activeMatch.stats.shots.away}</span>
        </div>
        <div class="stat-bar-duo">
          <div class="stat-bar-fill-home" style="width: ${calculateBarPercent(activeMatch.stats.shots.home, activeMatch.stats.shots.away)}%;"></div>
          <div class="stat-bar-fill-away" style="width: ${calculateBarPercent(activeMatch.stats.shots.away, activeMatch.stats.shots.home)}%;"></div>
        </div>
      </div>

      <!-- Finalizações no Alvo -->
      <div class="stat-comparison-row">
        <div class="stat-labels-row">
          <span>${activeMatch.stats.shotsOnTarget.home}</span>
          <span class="stat-name-center">Chutes no Alvo</span>
          <span>${activeMatch.stats.shotsOnTarget.away}</span>
        </div>
        <div class="stat-bar-duo">
          <div class="stat-bar-fill-home" style="width: ${calculateBarPercent(activeMatch.stats.shotsOnTarget.home, activeMatch.stats.shotsOnTarget.away)}%;"></div>
          <div class="stat-bar-fill-away" style="width: ${calculateBarPercent(activeMatch.stats.shotsOnTarget.away, activeMatch.stats.shotsOnTarget.home)}%;"></div>
        </div>
      </div>

      <!-- Escanteios -->
      <div class="stat-comparison-row">
        <div class="stat-labels-row">
          <span>${activeMatch.stats.corners.home}</span>
          <span class="stat-name-center">Escanteios</span>
          <span>${activeMatch.stats.corners.away}</span>
        </div>
        <div class="stat-bar-duo">
          <div class="stat-bar-fill-home" style="width: ${calculateBarPercent(activeMatch.stats.corners.home, activeMatch.stats.corners.away)}%;"></div>
          <div class="stat-bar-fill-away" style="width: ${calculateBarPercent(activeMatch.stats.corners.away, activeMatch.stats.corners.home)}%;"></div>
        </div>
      </div>

      <!-- Faltas -->
      <div class="stat-comparison-row">
        <div class="stat-labels-row">
          <span>${activeMatch.stats.fouls.home}</span>
          <span class="stat-name-center">Faltas</span>
          <span>${activeMatch.stats.fouls.away}</span>
        </div>
        <div class="stat-bar-duo">
          <div class="stat-bar-fill-home" style="width: ${calculateBarPercent(activeMatch.stats.fouls.home, activeMatch.stats.fouls.away)}%;"></div>
          <div class="stat-bar-fill-away" style="width: ${calculateBarPercent(activeMatch.stats.fouls.away, activeMatch.stats.fouls.home)}%;"></div>
        </div>
      </div>

      <!-- Cartões Amarelos / Vermelhos -->
      <div class="stat-comparison-row">
        <div class="stat-labels-row">
          <span>🟨 ${activeMatch.stats.yellowCards.home} ${activeMatch.stats.redCards.home > 0 ? `· 🟥 ${activeMatch.stats.redCards.home}` : ''}</span>
          <span class="stat-name-center">Cartões</span>
          <span>🟨 ${activeMatch.stats.yellowCards.away} ${activeMatch.stats.redCards.away > 0 ? `· 🟥 ${activeMatch.stats.redCards.away}` : ''}</span>
        </div>
      </div>
    </div>

    <!-- Modal de Substituição Durante a Partida -->
    <div id="inmatch-sub-backdrop" class="modal-backdrop">
      <div class="bottom-sheet" id="inmatch-sub-sheet">
        <!-- Preenchido via openInMatchSubstitutionDrawer -->
      </div>
    </div>
  `;

  // Handlers dos botões de ação
  const btnLeave = document.getElementById('btn-leave-match');
  if (btnLeave) {
    btnLeave.addEventListener('click', () => {
      stopMatchSimulationTimer();
      if (isFinished) {
        if (activeMatch && !activeMatch._isFinalized) {
          const currentCareer = getCareerState() || career;
          const updatedCareer = finalizeMatchResult(currentCareer, activeMatch);
          setCareerState(updatedCareer);
          saveCareer(updatedCareer);
        }
        activeMatch = null;
        currentSubScreen = null;
        renderApp();
        return;
      }

      if (!isNotStarted) {
        showConfirmModal({
          title: 'Pausar Partida?',
          message: 'A partida está em andamento. Deseja pausar e voltar ao painel principal?',
          confirmText: 'Sim, Voltar',
          cancelText: 'Continuar no Jogo',
          icon: '⏸️',
          isDanger: false,
          onConfirm: () => {
            currentSubScreen = null;
            renderApp();
          }
        });
      } else {
        currentSubScreen = null;
        renderApp();
      }
    });
  }

  // Iniciar 1º tempo
  const btnStartSim = document.getElementById('btn-start-match-sim');
  if (btnStartSim) {
    btnStartSim.addEventListener('click', () => {
      activeMatch.status = 'first_half';
      startMatchSimulationTimer(contentArea, career);
      renderMatchScreen(contentArea, career);
    });
  }

  // Iniciar 2º tempo
  const btnResume2nd = document.getElementById('btn-resume-second-half');
  if (btnResume2nd) {
    btnResume2nd.addEventListener('click', () => {
      activeMatch.status = 'second_half';
      activeMatch.minute = 46;
      activeMatch.events.unshift({
        minute: 46,
        type: 'info',
        text: `Início do segundo tempo! As equipes voltam a campo sem alterações adicionais.`
      });
      startMatchSimulationTimer(contentArea, career);
      renderMatchScreen(contentArea, career);
    });
  }

  // Pausar / Continuar
  const btnTogglePause = document.getElementById('btn-toggle-pause');
  if (btnTogglePause) {
    btnTogglePause.addEventListener('click', () => {
      if (matchSimulationTimer) {
        stopMatchSimulationTimer();
      } else {
        startMatchSimulationTimer(contentArea, career);
      }
      renderMatchScreen(contentArea, career);
    });
  }

  // Troca de velocidade
  contentArea.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const speed = parseInt(e.currentTarget.dataset.speed, 10);
      matchSimulationSpeed = speed;
      if (matchSimulationTimer) {
        stopMatchSimulationTimer();
        startMatchSimulationTimer(contentArea, career);
      }
      renderMatchScreen(contentArea, career);
    });
  });

  // Simular partida diretamente até o apito final
  const btnFastForward = document.getElementById('btn-fast-forward-match');
  if (btnFastForward) {
    btnFastForward.addEventListener('click', () => {
      stopMatchSimulationTimer();
      while (activeMatch && activeMatch.status !== 'finished') {
        if (activeMatch.status === 'not_started') activeMatch.status = 'first_half';
        if (activeMatch.status === 'halftime') activeMatch.status = 'second_half';
        simulateMatchMinute(activeMatch);
      }
      if (activeMatch && !activeMatch._isFinalized) {
        const currentCareer = getCareerState() || career;
        const updatedCareer = finalizeMatchResult(currentCareer, activeMatch);
        setCareerState(updatedCareer);
        saveCareer(updatedCareer);
        career = updatedCareer;
      }
      showToast(`Fim de jogo! ${activeMatch.homeTeam.shortName} ${activeMatch.homeScore} x ${activeMatch.awayScore} ${activeMatch.awayTeam.shortName}`, 'success');
      renderMatchScreen(contentArea, career);
    });
  }

  // Abrir gaveta de substituições durante a partida
  const btnSubs = document.getElementById('btn-in-match-subs');
  if (btnSubs) {
    btnSubs.addEventListener('click', () => {
      openInMatchSubstitutionDrawer(contentArea, career);
    });
  }

  // Botão para avançar direto para a próxima rodada
  const btnFinishNext = document.getElementById('btn-finish-and-next-match');
  if (btnFinishNext) {
    btnFinishNext.addEventListener('click', () => {
      stopMatchSimulationTimer();
      if (activeMatch && activeMatch.status === 'finished' && !activeMatch._isFinalized) {
        const currentCareer = getCareerState() || career;
        const updatedCareer = finalizeMatchResult(currentCareer, activeMatch);
        setCareerState(updatedCareer);
        saveCareer(updatedCareer);
      }
      activeMatch = null;
      const latestCareer = getCareerState();
      if (latestCareer && latestCareer.isSeasonFinished) {
        showToast('Temporada concluída! Veja a classificação final.', 'info');
        currentSubScreen = 'calendar';
        currentChampTab = 'standings';
      } else {
        showToast('Avançando para a próxima rodada!', 'success');
        currentSubScreen = 'next_match';
      }
      renderApp();
    });
  }

  // Finalizar e voltar ao painel principal
  const btnFinish = document.getElementById('btn-finish-and-exit');
  if (btnFinish) {
    btnFinish.addEventListener('click', () => {
      stopMatchSimulationTimer();
      if (activeMatch && activeMatch.status === 'finished' && !activeMatch._isFinalized) {
        const currentCareer = getCareerState() || career;
        const updatedCareer = finalizeMatchResult(currentCareer, activeMatch);
        setCareerState(updatedCareer);
        saveCareer(updatedCareer);
      }
      showToast('Partida registrada no campeonato!', 'success');
      activeMatch = null;
      currentSubScreen = null;
      renderApp();
    });
  }

  const btnFinishTable = document.getElementById('btn-finish-and-table');
  if (btnFinishTable) {
    btnFinishTable.addEventListener('click', () => {
      stopMatchSimulationTimer();
      if (activeMatch && activeMatch.status === 'finished' && !activeMatch._isFinalized) {
        const currentCareer = getCareerState() || career;
        const updatedCareer = finalizeMatchResult(currentCareer, activeMatch);
        setCareerState(updatedCareer);
        saveCareer(updatedCareer);
      }
      showToast(`Partida registrada no campeonato!`, 'success');
      activeMatch = null;
      currentSubScreen = 'calendar';
      currentChampTab = 'standings';
      renderApp();
    });
  }
}

/**
 * Inicia o timer de avanço minuto a minuto da partida
 */
function startMatchSimulationTimer(contentArea, career) {
  stopMatchSimulationTimer();
  if (!activeMatch || activeMatch.status === 'finished' || activeMatch.status === 'halftime') return;

  // Intervalos em milissegundos por minuto simulado
  let intervalMs = 600;
  if (matchSimulationSpeed === 2) intervalMs = 260;
  else if (matchSimulationSpeed === 5) intervalMs = 65;

  matchSimulationTimer = setInterval(() => {
    if (!activeMatch) {
      stopMatchSimulationTimer();
      return;
    }

    const event = simulateMatchMinute(activeMatch);

    // Se chegou ao intervalo ou fim de jogo
    if (activeMatch.status === 'halftime') {
      stopMatchSimulationTimer();
      showToast('Intervalo de jogo!', 'info');
      renderMatchScreen(contentArea, career);
      return;
    }

    if (activeMatch.status === 'finished') {
      stopMatchSimulationTimer();
      if (!activeMatch._isFinalized) {
        const currentCareer = getCareerState() || career;
        const updatedCareer = finalizeMatchResult(currentCareer, activeMatch);
        setCareerState(updatedCareer);
        saveCareer(updatedCareer);
        career = updatedCareer;
      }
      showToast(`Fim de jogo! ${activeMatch.homeTeam.shortName} ${activeMatch.homeScore} x ${activeMatch.awayScore} ${activeMatch.awayTeam.shortName}`, 'success');
      renderMatchScreen(contentArea, career);
      return;
    }

    // Atualização dinâmica dos elementos no DOM para fluidez sem recarregar a tela inteira
    updateLiveMatchDOM(activeMatch);
  }, intervalMs);
}

/**
 * Para o timer da simulação
 */
function stopMatchSimulationTimer() {
  if (matchSimulationTimer) {
    clearInterval(matchSimulationTimer);
    matchSimulationTimer = null;
  }
}

/**
 * Atualiza elementos de placar, relógio e narração no DOM
 */
function updateLiveMatchDOM(match) {
  const clockEl = document.getElementById('match-clock-display');
  const scoreEl = document.getElementById('match-score-text');
  const feedEl = document.getElementById('match-events-feed-container');

  if (clockEl) {
    const half = match.status === 'first_half' ? '1ºT' : '2ºT';
    clockEl.textContent = `${match.minute}' 🟢 ${half}`;
  }

  if (scoreEl) {
    scoreEl.textContent = `${match.homeScore} : ${match.awayScore}`;
  }

  if (feedEl && match.events.length > 0) {
    feedEl.innerHTML = match.events.map(ev => {
      let eventClass = '';
      if (ev.type === 'goal') eventClass = 'event-goal';
      else if (ev.type === 'card_yellow') eventClass = 'event-card-yellow';
      else if (ev.type === 'card_red') eventClass = 'event-card-red';

      return `
        <div class="match-event-row ${eventClass}">
          <span class="match-event-minute">${ev.minute}'</span>
          <span class="match-event-text">${ev.text}</span>
        </div>
      `;
    }).join('');
  }
}

/**
 * Abre a gaveta para realizar substituição durante a partida em andamento
 */
function openInMatchSubstitutionDrawer(contentArea, career) {
  if (!activeMatch) return;

  const wasSimulating = !!matchSimulationTimer;
  stopMatchSimulationTimer();

  const backdrop = document.getElementById('inmatch-sub-backdrop');
  const sheet = document.getElementById('inmatch-sub-sheet');
  if (!backdrop || !sheet) return;

  inMatchSubOutPlayerId = null;

  function renderSubDrawerContent() {
    const isUserHome = activeMatch.isUserHome !== false;
    const starters = isUserHome ? activeMatch.homeStarters : activeMatch.awayStarters;
    const bench = (isUserHome ? activeMatch.homeBench : activeMatch.awayBench).filter(p => !activeMatch.substitutedOutIds.has(p.id));
    const subsUsed = isUserHome ? activeMatch.homeSubsUsed : activeMatch.awaySubsUsed;

    sheet.innerHTML = `
      <div class="sheet-grab-bar"></div>

      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
        <div>
          <div style="font-size: 16px; font-weight: 800; color: #fff;">Substituição na Partida</div>
          <div style="font-size: 11px; color: var(--text-muted);">
            Substituições usadas: <strong>${subsUsed} de ${activeMatch.maxSubs}</strong>
          </div>
        </div>
        <button id="btn-close-inmatch-sub" class="btn btn-secondary btn-sm">Fechar</button>
      </div>

      ${subsUsed >= activeMatch.maxSubs ? `
        <div class="card" style="text-align: center; color: var(--color-warning);">
          Você já utilizou todas as 5 substituições permitidas nesta partida.
        </div>
      ` : !inMatchSubOutPlayerId ? `
        <div style="font-size: 12px; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">
          1. Selecione o jogador titular que deixará o gramado:
        </div>
        <div style="max-height: 45vh; overflow-y: auto;">
          ${starters.map(player => `
            <div class="player-item-card btn-select-player-out" data-player-id="${player.id}">
              <div class="player-pos-badge pos-${player.position}">${player.position}</div>
              <div class="player-info-col">
                <div class="player-name-text">${player.name}</div>
                <div class="player-sub-meta">
                  <span>Físico: ${player.fitness}%</span>
                  <span>·</span>
                  <span>${player.overall} OVR</span>
                </div>
              </div>
              <button class="btn btn-secondary btn-sm" style="min-height: 30px; font-size: 11px;">Substituir</button>
            </div>
          `).join('')}
        </div>
      ` : `
        <!-- Passo 2: Escolher quem entra -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <div style="font-size: 12px; font-weight: 700; color: var(--text-main);">
            2. Selecione o reserva para entrar na vaga:
          </div>
          <button id="btn-cancel-sub-out" class="btn btn-secondary btn-sm" style="font-size: 10px; padding: 2px 6px;">
            Trocar Atleta que Sai
          </button>
        </div>

        <div style="max-height: 45vh; overflow-y: auto;">
          ${bench.map(player => `
            <div class="player-item-card btn-confirm-player-in" data-player-id="${player.id}">
              <div class="player-pos-badge pos-${player.position}">${player.position}</div>
              <div class="player-info-col">
                <div class="player-name-text">${player.name}</div>
                <div class="player-sub-meta">
                  <span>Físico: ${player.fitness}%</span>
                  <span>·</span>
                  <span>${player.overall} OVR</span>
                </div>
              </div>
              <button class="btn btn-primary btn-sm" style="min-height: 30px; font-size: 11px;">Entrar</button>
            </div>
          `).join('')}
        </div>
      `}
    `;

    // Handlers do drawer
    const btnClose = document.getElementById('btn-close-inmatch-sub');
    if (btnClose) {
      btnClose.addEventListener('click', () => {
        backdrop.classList.remove('open');
        if (wasSimulating) startMatchSimulationTimer(contentArea, career);
        renderMatchScreen(contentArea, career);
      });
    }

    const btnCancelOut = document.getElementById('btn-cancel-sub-out');
    if (btnCancelOut) {
      btnCancelOut.addEventListener('click', () => {
        inMatchSubOutPlayerId = null;
        renderSubDrawerContent();
      });
    }

    sheet.querySelectorAll('.btn-select-player-out').forEach(card => {
      card.addEventListener('click', (e) => {
        inMatchSubOutPlayerId = e.currentTarget.dataset.playerId;
        renderSubDrawerContent();
      });
    });

    sheet.querySelectorAll('.btn-confirm-player-in').forEach(card => {
      card.addEventListener('click', (e) => {
        const inId = e.currentTarget.dataset.playerId;
        const res = substitutePlayerInMatch(activeMatch, inMatchSubOutPlayerId, inId);
        if (res.success) {
          backdrop.classList.remove('open');
          showToast('Substituição realizada com sucesso!', 'success');
          if (wasSimulating) startMatchSimulationTimer(contentArea, career);
          renderMatchScreen(contentArea, career);
        } else {
          showToast(res.message, 'error');
        }
      });
    });
  }

  renderSubDrawerContent();
  backdrop.classList.add('open');

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) {
      backdrop.classList.remove('open');
      if (wasSimulating) startMatchSimulationTimer(contentArea, career);
      renderMatchScreen(contentArea, career);
    }
  });
}

/**
 * Utilitário para proporção visual em barras duplas
 */
function calculateBarPercent(val1, val2) {
  const sum = val1 + val2;
  if (sum === 0) return 50;
  return Math.min(85, Math.max(15, Math.round((val1 / sum) * 100)));
}

/* ==========================================================================
   ETAPA 5 — MERCADO DE TRANSFERÊNCIAS (CLUBES, JOGADORES E NEGOCIAÇÃO)
   ========================================================================== */

function renderMarketScreen(contentArea, career) {
  career = getCareerState() || career;
  ensureAllLeagueSquads(career);

  const currency = career.league?.currencySymbol || 'R$';
  const finances = getFinancialOverview(career);
  const mySquad = career.squad || [];

  // Obter jogadores de acordo com o filtro de clube atual
  const marketPlayers = getPlayersForMarket(career, currentMarketClubFilter);
  const allClubs = getAllMarketClubs(career);
  const freeAgentsCount = (career.freeAgents || []).length;

  contentArea.innerHTML = `
    <!-- Cabeçalho com Resumo Financeiro do Mercado -->
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
      <div>
        <h2 style="font-size: 18px; font-weight: 800;">Mercado da Bola</h2>
        <div style="font-size: 11px; color: var(--text-muted); display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <span>Caixa: <strong style="color: #10b981;">${finances.balanceFormatted}</strong></span>
          <span>·</span>
          <span>Verba de Compras: <strong style="color: #38bdf8;">${finances.transferBudgetFormatted}</strong></span>
        </div>
      </div>
      <button class="btn btn-secondary btn-sm" id="btn-return-overview">← Voltar</button>
    </div>

    <!-- Abas de Navegação (Comprar / Vender) -->
    <div class="subnav-tabs-bar">
      <button class="subnav-tab-btn ${currentMarketTab === 'buy' ? 'active' : ''}" id="tab-market-buy">
        🛒 Contratar Jogadores
      </button>
      <button class="subnav-tab-btn ${currentMarketTab === 'sell' ? 'active' : ''}" id="tab-market-sell">
        💰 Vender / Negociar Elenco (${mySquad.length})
      </button>
    </div>

    ${currentMarketTab === 'buy' 
      ? renderMarketBuyTabHtml(career, marketPlayers, allClubs, finances, currency, freeAgentsCount) 
      : renderMarketSellTabHtml(career, mySquad, finances, currency)}

    <!-- Container dos Modais de Negociação -->
    <div id="negotiation-modal-container"></div>
  `;

  attachReturnBtn();
  attachMarketEvents(contentArea, career);
}

function renderMarketBuyTabHtml(career, marketPlayers, allClubs, finances, currency, freeAgentsCount) {
  const countGol = marketPlayers.filter(p => p.position === 'GOL').length;
  const countDef = marketPlayers.filter(p => p.position === 'DEF').length;
  const countMei = marketPlayers.filter(p => p.position === 'MEI').length;
  const countAta = marketPlayers.filter(p => p.position === 'ATA').length;

  return `
    <!-- Seletor de Clubes Presentes no Jogo -->
    <div style="margin-bottom: 4px;">
      <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center;">
        <span>CLUBES DA LIGA & MERCADO:</span>
        <span style="font-size: 10px; color: #38bdf8;">Toque para filtrar por clube</span>
      </div>
      <div class="market-club-selector-scroll">
        <button class="club-filter-pill ${currentMarketClubFilter === 'ALL' ? 'active' : ''}" data-club-filter="ALL">
          <span>🌐 Todos da Liga</span>
        </button>
        <button class="club-filter-pill ${currentMarketClubFilter === 'FREE' ? 'active' : ''}" data-club-filter="FREE">
          <span>⭐ Agentes Livres</span>
          <span class="club-count-badge" style="background: rgba(16, 185, 129, 0.3); color: #10b981;">${freeAgentsCount}</span>
        </button>
        ${allClubs.map(club => {
          const squadCount = (career.aiSquads && career.aiSquads[club.id]) ? career.aiSquads[club.id].length : 20;
          const isSelected = currentMarketClubFilter === club.id;
          return `
            <button class="club-filter-pill ${isSelected ? 'active' : ''}" data-club-filter="${club.id}">
              <span class="club-color-dot" style="background-color: ${club.primaryColor};"></span>
              <span>${club.name}</span>
              <span class="club-count-badge">${squadCount}</span>
            </button>
          `;
        }).join('')}
      </div>
    </div>

    <!-- Campo de Busca em Tempo Real -->
    <div class="market-search-box">
      <span class="market-search-icon">🔍</span>
      <input type="text" id="market-search-input" class="market-search-input" 
        placeholder="Buscar jogador por nome ou clube..." value="${currentMarketSearchQuery}">
    </div>

    <!-- Filtros de Posição -->
    <div class="filter-tabs-row" style="margin-bottom: 8px;">
      <button class="filter-tab-btn ${currentMarketFilterPos === 'ALL' ? 'active' : ''}" data-market-filter="ALL">
        Todos (${marketPlayers.length})
      </button>
      <button class="filter-tab-btn ${currentMarketFilterPos === 'GOL' ? 'active' : ''}" data-market-filter="GOL">
        GOL (${countGol})
      </button>
      <button class="filter-tab-btn ${currentMarketFilterPos === 'DEF' ? 'active' : ''}" data-market-filter="DEF">
        DEF (${countDef})
      </button>
      <button class="filter-tab-btn ${currentMarketFilterPos === 'MEI' ? 'active' : ''}" data-market-filter="MEI">
        MEI (${countMei})
      </button>
      <button class="filter-tab-btn ${currentMarketFilterPos === 'ATA' ? 'active' : ''}" data-market-filter="ATA">
        ATA (${countAta})
      </button>
    </div>

    <!-- Barra de Ordenação e Ações -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-size: 11px;">
      <div style="display: flex; align-items: center; gap: 6px;">
        <span style="color: var(--text-subtle);">Ordenar:</span>
        <select id="market-sort-select" style="background: var(--bg-surface); color: var(--text-main); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 3px 6px; font-size: 11px;">
          <option value="ovr_desc" ${currentMarketSort === 'ovr_desc' ? 'selected' : ''}>Maior Força (OVR)</option>
          <option value="price_asc" ${currentMarketSort === 'price_asc' ? 'selected' : ''}>Menor Preço (Acessíveis)</option>
          <option value="age_asc" ${currentMarketSort === 'age_asc' ? 'selected' : ''}>Mais Jovens (Promessas)</option>
          <option value="wage_asc" ${currentMarketSort === 'wage_asc' ? 'selected' : ''}>Menor Salário</option>
        </select>
      </div>
      <button class="btn btn-secondary btn-sm" id="btn-refresh-market" style="padding: 3px 8px; font-size: 10px;">
        🔄 Novos Agentes
      </button>
    </div>

    <!-- Lista de Jogadores -->
    <div id="market-cards-list-container" style="flex: 1; overflow-y: auto;">
      ${renderMarketBuyCardsHtml(career, marketPlayers, currency)}
    </div>
  `;
}

function renderMarketBuyCardsHtml(career, marketPlayers, currency) {
  let filtered = marketPlayers.filter(p => {
    if (currentMarketFilterPos !== 'ALL' && p.position !== currentMarketFilterPos) return false;
    if (currentMarketSearchQuery.trim()) {
      const q = currentMarketSearchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchClub = (p.clubName || '').toLowerCase().includes(q);
      if (!matchName && !matchClub) return false;
    }
    return true;
  });

  filtered.sort((a, b) => {
    if (currentMarketSort === 'price_asc') return (a.marketValue || 0) - (b.marketValue || 0);
    if (currentMarketSort === 'age_asc') return a.age - b.age;
    if (currentMarketSort === 'wage_asc') return (a.salary || 0) - (b.salary || 0);
    return b.overall - a.overall;
  });

  if (filtered.length === 0) {
    return `
      <div class="module-placeholder-box" style="padding: 28px 12px; margin-top: 10px; text-align: center;">
        <div style="font-size: 32px; margin-bottom: 8px;">🔍</div>
        <p style="font-size: 14px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">Nenhum atleta encontrado</p>
        <p style="font-size: 12px; color: var(--text-muted);">Tente mudar o filtro de clube, a posição ou o termo de busca.</p>
      </div>
    `;
  }

  return filtered.map(player => {
    const isFree = player.isFreeAgent || !player.clubId;
    const ovrClass = player.overall >= 84 ? 'ovr-gold' : (player.overall >= 80 ? 'ovr-green' : '');

    return `
      <div class="market-player-card">
        <div class="market-player-header">
          <div class="player-pos-badge pos-${player.position}">
            ${player.position}
          </div>

          <div class="market-player-title">
            <div class="market-player-name">${player.name}</div>
            <div class="market-player-club">
              <span>${player.age} anos</span>
              <span>·</span>
              ${isFree ? `
                <span class="market-club-badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3);">
                  ⭐ Passe Livre
                </span>
              ` : `
                <span class="market-club-badge">
                  ${player.clubName || 'Clube'}
                </span>
              `}
            </div>
          </div>

          <div class="market-ovr-box ${ovrClass}">
            ${player.overall}
          </div>
        </div>

        <!-- Atributos Chave -->
        <div class="market-attrs-mini-grid">
          <div class="market-attr-cell">
            <span class="attr-label">ATK</span>
            <span class="attr-value" style="color: #ef4444;">${player.attack}</span>
          </div>
          <div class="market-attr-cell">
            <span class="attr-label">DEF</span>
            <span class="attr-value" style="color: #3b82f6;">${player.defense}</span>
          </div>
          <div class="market-attr-cell">
            <span class="attr-label">PAS</span>
            <span class="attr-value" style="color: #10b981;">${player.pass}</span>
          </div>
          <div class="market-attr-cell">
            <span class="attr-label">FÍS</span>
            <span class="attr-value" style="color: #f59e0b;">${player.physical}</span>
          </div>
        </div>

        <!-- Rodapé Financeiro e Botão de Negociação -->
        <div class="market-player-footer">
          <div class="market-price-col">
            <span class="market-price-label">${isFree ? 'Custo de Transferência' : 'Valor de Mercado'}</span>
            <span class="market-price-val" style="color: ${isFree ? '#10b981' : '#38bdf8'};">
              ${isFree ? 'R$ 0 (Custo Zero)' : formatMoney(player.marketValue, currency)}
            </span>
            <span class="market-wage-sub">Pedida: ${formatMoney(player.salary, currency)}/mês</span>
          </div>

          <div>
            <button class="market-action-btn btn-buy btn-negotiate-hire" data-player-id="${player.id}">
              ${isFree ? '📄 Negociar Contrato' : '🤝 Negociar'}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderMarketSellTabHtml(career, mySquad, finances, currency) {
  const countGol = mySquad.filter(p => p.position === 'GOL').length;
  const countDef = mySquad.filter(p => p.position === 'DEF').length;
  const countMei = mySquad.filter(p => p.position === 'MEI').length;
  const countAta = mySquad.filter(p => p.position === 'ATA').length;

  return `
    <div style="background-color: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 10px 14px; margin-bottom: 10px; font-size: 11px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <span style="color: var(--text-muted);">Atletas sob Contrato:</span>
        <strong style="color: var(--text-main);">${mySquad.length} / 30 atletas</strong>
      </div>
      <div style="color: var(--text-subtle); line-height: 1.35;">
        Receba propostas de clubes nacionais e internacionais para negociar seus atletas, reforçar seu caixa e aliviar a folha salarial!
      </div>
    </div>

    <!-- Busca no Elenco -->
    <div class="market-search-box">
      <span class="market-search-icon">🔍</span>
      <input type="text" id="market-search-input" class="market-search-input" 
        placeholder="Buscar atleta no seu elenco..." value="${currentMarketSearchQuery}">
    </div>

    <!-- Filtros de Posição -->
    <div class="filter-tabs-row" style="margin-bottom: 10px;">
      <button class="filter-tab-btn ${currentMarketFilterPos === 'ALL' ? 'active' : ''}" data-market-filter="ALL">
        Todos (${mySquad.length})
      </button>
      <button class="filter-tab-btn ${currentMarketFilterPos === 'GOL' ? 'active' : ''}" data-market-filter="GOL">
        GOL (${countGol})
      </button>
      <button class="filter-tab-btn ${currentMarketFilterPos === 'DEF' ? 'active' : ''}" data-market-filter="DEF">
        DEF (${countDef})
      </button>
      <button class="filter-tab-btn ${currentMarketFilterPos === 'MEI' ? 'active' : ''}" data-market-filter="MEI">
        MEI (${countMei})
      </button>
      <button class="filter-tab-btn ${currentMarketFilterPos === 'ATA' ? 'active' : ''}" data-market-filter="ATA">
        ATA (${countAta})
      </button>
    </div>

    <!-- Container dos Cards de Venda -->
    <div id="market-cards-list-container" style="flex: 1; overflow-y: auto;">
      ${renderMarketSellCardsHtml(career, mySquad, currency)}
    </div>
  `;
}

function renderMarketSellCardsHtml(career, mySquad, currency) {
  let filtered = mySquad.filter(p => {
    if (currentMarketFilterPos !== 'ALL' && p.position !== currentMarketFilterPos) return false;
    if (currentMarketSearchQuery.trim()) {
      const q = currentMarketSearchQuery.toLowerCase();
      if (!p.name.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  filtered.sort((a, b) => b.overall - a.overall);
  const starterIds = new Set((career.lineup || []).map(s => (s && s.playerId) ? s.playerId : s).filter(Boolean));

  if (filtered.length === 0) {
    return `
      <div class="module-placeholder-box" style="padding: 24px 12px; margin-top: 10px;">
        <p style="font-size: 13px; color: var(--text-muted);">Nenhum atleta encontrado.</p>
      </div>
    `;
  }

  return filtered.map(player => {
    const isStarter = starterIds.has(player.id);
    const sellCheck = canSellPlayer(career, player.id);

    return `
      <div class="market-player-card">
        <div class="market-player-header">
          <div class="player-pos-badge pos-${player.position}">
            ${player.position}
          </div>

          <div class="market-player-title">
            <div class="market-player-name">${player.name}</div>
            <div class="market-player-club">
              <span>${player.age} anos</span>
              <span>·</span>
              <span class="${isStarter ? 'starter-tag' : 'bench-tag'}">
                ${isStarter ? 'TITULAR' : 'RESERVA'}
              </span>
            </div>
          </div>

          <div class="market-ovr-box">
            ${player.overall}
          </div>
        </div>

        <!-- Atributos -->
        <div class="market-attrs-mini-grid">
          <div class="market-attr-cell">
            <span class="attr-label">ATK</span>
            <span class="attr-value" style="color: #ef4444;">${player.attack}</span>
          </div>
          <div class="market-attr-cell">
            <span class="attr-label">DEF</span>
            <span class="attr-value" style="color: #3b82f6;">${player.defense}</span>
          </div>
          <div class="market-attr-cell">
            <span class="attr-label">PAS</span>
            <span class="attr-value" style="color: #10b981;">${player.pass}</span>
          </div>
          <div class="market-attr-cell">
            <span class="attr-label">FÍS</span>
            <span class="attr-value" style="color: #f59e0b;">${player.physical}</span>
          </div>
        </div>

        <!-- Rodapé de Venda -->
        <div class="market-player-footer">
          <div class="market-price-col">
            <span class="market-price-label">Valor Estimado</span>
            <span class="market-price-val" style="color: #fbbf24;">${formatMoney(player.marketValue, currency)}</span>
            <span class="market-wage-sub">Alívio: ${formatMoney(player.salary, currency)}/mês</span>
          </div>

          <div>
            ${sellCheck.allowed ? `
              <button class="market-action-btn btn-sell btn-negotiate-sell" data-player-id="${player.id}">
                💼 Negociar Venda
              </button>
            ` : `
              <button class="market-action-btn btn-sell" style="opacity: 0.6; cursor: not-allowed;" title="${sellCheck.reason || 'Venda bloqueada'}">
                🔒 Intocável
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function attachMarketEvents(contentArea, career) {
  const currency = career.league?.currencySymbol || 'R$';

  // Alternar abas Comprar / Vender
  const tabBuy = document.getElementById('tab-market-buy');
  if (tabBuy) {
    tabBuy.addEventListener('click', () => {
      currentMarketTab = 'buy';
      currentMarketFilterPos = 'ALL';
      renderMarketScreen(contentArea, career);
    });
  }

  const tabSell = document.getElementById('tab-market-sell');
  if (tabSell) {
    tabSell.addEventListener('click', () => {
      currentMarketTab = 'sell';
      currentMarketFilterPos = 'ALL';
      renderMarketScreen(contentArea, career);
    });
  }

  // Filtro de Clube
  contentArea.querySelectorAll('.club-filter-pill[data-club-filter]').forEach(pill => {
    pill.addEventListener('click', (e) => {
      currentMarketClubFilter = e.currentTarget.dataset.clubFilter;
      contentArea.querySelectorAll('.club-filter-pill[data-club-filter]').forEach(p => p.classList.remove('active'));
      e.currentTarget.classList.add('active');

      const listContainer = document.getElementById('market-cards-list-container');
      if (listContainer) {
        const players = getPlayersForMarket(career, currentMarketClubFilter);
        listContainer.innerHTML = renderMarketBuyCardsHtml(career, players, currency);
        attachMarketCardActionListeners(contentArea, career);
      }
    });
  });

  // Busca textual em tempo real
  const searchInput = document.getElementById('market-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentMarketSearchQuery = e.target.value;
      const listContainer = document.getElementById('market-cards-list-container');
      if (listContainer) {
        if (currentMarketTab === 'buy') {
          const players = getPlayersForMarket(career, currentMarketClubFilter);
          listContainer.innerHTML = renderMarketBuyCardsHtml(career, players, currency);
        } else {
          listContainer.innerHTML = renderMarketSellCardsHtml(career, career.squad || [], currency);
        }
        attachMarketCardActionListeners(contentArea, career);
      }
    });
  }

  // Filtros de posição
  contentArea.querySelectorAll('.filter-tab-btn[data-market-filter]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      currentMarketFilterPos = e.currentTarget.dataset.marketFilter;
      contentArea.querySelectorAll('.filter-tab-btn[data-market-filter]').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');

      const listContainer = document.getElementById('market-cards-list-container');
      if (listContainer) {
        if (currentMarketTab === 'buy') {
          const players = getPlayersForMarket(career, currentMarketClubFilter);
          listContainer.innerHTML = renderMarketBuyCardsHtml(career, players, currency);
        } else {
          listContainer.innerHTML = renderMarketSellCardsHtml(career, career.squad || [], currency);
        }
        attachMarketCardActionListeners(contentArea, career);
      }
    });
  });

  // Ordenação
  const sortSelect = document.getElementById('market-sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentMarketSort = e.target.value;
      const listContainer = document.getElementById('market-cards-list-container');
      if (listContainer) {
        const players = getPlayersForMarket(career, currentMarketClubFilter);
        listContainer.innerHTML = renderMarketBuyCardsHtml(career, players, currency);
        attachMarketCardActionListeners(contentArea, career);
      }
    });
  }

  // Botão de Refresh de Agentes Livres
  const btnRefresh = document.getElementById('btn-refresh-market');
  if (btnRefresh) {
    btnRefresh.addEventListener('click', () => {
      refreshMarketPool(career);
      saveCareer(career);
      showToast('Novos agentes livres e atletas monitorados no mercado!', 'info');
      renderMarketScreen(contentArea, career);
    });
  }

  attachMarketCardActionListeners(contentArea, career);
}

function attachMarketCardActionListeners(contentArea, career) {
  // Iniciar Negociação de Contratação
  contentArea.querySelectorAll('.btn-negotiate-hire[data-player-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const pid = e.currentTarget.dataset.playerId;
      const allAvailable = getPlayersForMarket(career, 'ALL');
      const player = allAvailable.find(p => p.id === pid);
      if (!player) return;

      openNegotiationHireModal(player, career, contentArea);
    });
  });

  // Iniciar Negociação de Venda
  contentArea.querySelectorAll('.btn-negotiate-sell[data-player-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const pid = e.currentTarget.dataset.playerId;
      const player = (career.squad || []).find(p => p.id === pid);
      if (!player) return;

      openNegotiationSellModal(player, career, contentArea);
    });
  });
}

/**
 * ============================================================================
 * MODAL DINÂMICO DE NEGOCIAÇÃO DE CONTRATAÇÃO (CLUBE + JOGADOR EM 2 FASES)
 * ============================================================================
 */
function openNegotiationHireModal(player, career, contentArea) {
  const container = document.getElementById('negotiation-modal-container') || document.body;
  const currency = career.league?.currencySymbol || 'R$';
  const finances = getFinancialOverview(career);

  const isFreeAgent = player.isFreeAgent || !player.clubId;
  const initialAskingFee = isFreeAgent ? 0 : Math.round(player.marketValue * 1.05);

  // Estado interno da sessão de negociação
  const negState = {
    phase: isFreeAgent ? 2 : 1, // 1: Clube, 2: Jogador
    // Fase 1:
    offeredFee: isFreeAgent ? 0 : player.marketValue,
    isInstallment: false,
    clubStatus: isFreeAgent ? 'accepted' : 'initial', // 'initial', 'counter', 'accepted', 'rejected'
    clubCounterFee: initialAskingFee,
    clubMessage: isFreeAgent 
      ? 'Atleta sem vínculo com clube. Nenhuma taxa de transferência necessária!' 
      : `A diretoria do ${player.clubName || 'Clube'} recebeu seu contato formal. A pedida inicial por ${player.name} é de ${formatMoney(initialAskingFee, currency)}.`,
    round: 1,
    patience: 4,
    agreedFee: isFreeAgent ? 0 : null,
    // Fase 2:
    offeredSalary: player.salary,
    offeredBonus: isFreeAgent ? Math.round(player.salary * 2.5) : Math.round(player.salary * 1.5),
    offeredRole: 'key',
    contractYears: 2,
    playerStatus: 'pending',
    satisfactionScore: 75,
    playerMessage: `"${player.name}: 'Aguardando seus termos contratuais e projeto esportivo.'"`
  };

  const modalBackdrop = document.createElement('div');
  modalBackdrop.className = 'modal-backdrop open';
  modalBackdrop.id = 'hire-negotiation-modal';

  function renderModalContent() {
    modalBackdrop.innerHTML = `
      <div class="negotiation-modal-dialog">
        <!-- Barra de Fases da Negociação -->
        <div class="negotiation-phase-banner">
          <div class="negotiation-phase-tab ${negState.phase === 1 ? 'active' : (negState.phase > 1 ? 'done' : '')}">
            <span>${negState.phase > 1 ? '✅' : '🏛️'} 1. Acordo com o Clube</span>
          </div>
          <div class="negotiation-phase-tab ${negState.phase === 2 ? 'active' : ''}">
            <span>✍️ 2. Contrato com o Atleta</span>
          </div>
        </div>

        <div class="negotiation-body">
          <!-- Card de Apresentação do Jogador -->
          <div class="negotiation-player-hero">
            <div class="player-pos-badge pos-${player.position}" style="font-size: 13px; width: 38px; height: 38px;">
              ${player.position}
            </div>
            <div style="flex: 1; min-width: 0;">
              <div style="font-size: 15px; font-weight: 800; color: var(--text-main);">${player.name}</div>
              <div style="font-size: 11px; color: var(--text-muted); display: flex; gap: 6px; align-items: center; margin-top: 2px;">
                <span>${player.age} anos</span>
                <span>·</span>
                <span style="color: #38bdf8; font-weight: 700;">${player.clubName || 'Agente Livre'}</span>
              </div>
            </div>
            <div class="market-ovr-box" style="width: 38px; height: 38px; font-size: 15px;">
              ${player.overall}
            </div>
          </div>

          ${negState.phase === 1 ? renderPhase1Html() : renderPhase2Html()}
        </div>
      </div>
    `;

    attachModalInternalEvents();
  }

  function renderPhase1Html() {
    const bubbleClass = negState.clubStatus === 'accepted' ? 'accepted' : (negState.clubStatus === 'counter' ? 'counter' : (negState.clubStatus === 'rejected' ? 'rejected' : ''));

    return `
      <!-- Situação Financeira do Clube Comprador -->
      <div style="background: rgba(0, 0, 0, 0.25); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 10px 12px; font-size: 11px; display: flex; justify-content: space-between;">
        <div>
          <span style="color: var(--text-muted);">Seu Saldo em Caixa:</span>
          <strong style="color: #10b981; margin-left: 4px;">${formatMoney(career.finances?.balance || 0, currency)}</strong>
        </div>
        <div>
          <span style="color: var(--text-muted);">Teto de Compras:</span>
          <strong style="color: #38bdf8; margin-left: 4px;">${formatMoney(career.finances?.transferBudget || 0, currency)}</strong>
        </div>
      </div>

      <!-- Diálogo com a Diretoria do Clube Vendedor -->
      <div class="negotiation-dialogue-bubble ${bubbleClass}">
        <div style="font-weight: 800; font-size: 11px; margin-bottom: 4px; display: flex; justify-content: space-between;">
          <span>🏛️ Diretoria do ${player.clubName}</span>
          <span style="font-size: 10px; color: var(--text-subtle);">Tentativa ${negState.round}/4 (Paciência: ${'🟢'.repeat(Math.max(1, negState.patience))})</span>
        </div>
        <div>${negState.clubMessage}</div>
      </div>

      ${negState.clubStatus === 'accepted' ? `
        <!-- Botão para avançar quando aceito -->
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <button class="btn btn-primary" id="btn-advance-to-player-contract" style="width: 100%; padding: 12px; font-weight: 800;">
            Avançar para Negociação de Contrato ➔
          </button>
        </div>
      ` : `
        <!-- Controles de Proposta ao Clube -->
        <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <label style="font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Sua Oferta de Transferência:</label>
            <strong style="font-size: 16px; font-weight: 900; color: #38bdf8;" id="display-offered-fee">
              ${formatMoney(negState.offeredFee, currency)}
            </strong>
          </div>

          <div class="adjust-pills-row">
            <button class="adjust-pill-btn" data-fee-adjust="-0.15">-15%</button>
            <button class="adjust-pill-btn" data-fee-adjust="-0.10">-10%</button>
            <button class="adjust-pill-btn" data-fee-adjust="-0.05">-5%</button>
            <button class="adjust-pill-btn" data-fee-adjust="target">Valor Mercado</button>
            <button class="adjust-pill-btn" data-fee-adjust="0.05">+5%</button>
            <button class="adjust-pill-btn" data-fee-adjust="0.10">+10%</button>
          </div>

          <!-- Opção de Parcelamento -->
          <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: space-between; font-size: 11px;">
            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; color: var(--text-main);">
              <input type="checkbox" id="chk-installment" ${negState.isInstallment ? 'checked' : ''}>
              <span>Parcelar em 2x (50% no fechamento, 50% na próxima temporada)</span>
            </label>
          </div>
        </div>

        <!-- Botões de Ação da Fase 1 -->
        <div style="display: flex; gap: 8px; margin-top: 4px;">
          <button class="btn btn-secondary" id="btn-cancel-negotiation" style="flex: 1;">
            Desistir
          </button>
          ${negState.clubStatus === 'counter' ? `
            <button class="btn btn-secondary" id="btn-accept-club-counter" style="flex: 1.2; border-color: rgba(245, 158, 11, 0.5); color: #fbbf24;">
              Aceitar Contraproposta (${formatMoney(negState.clubCounterFee, currency)})
            </button>
          ` : ''}
          <button class="btn btn-primary" id="btn-submit-club-offer" style="flex: 1.5;">
            📤 Enviar Proposta
          </button>
        </div>
      `}
    `;
  }

  function renderPhase2Html() {
    // Avaliação instantânea para atualizar a reação do jogador
    const evalResult = evaluatePlayerContract(
      career, 
      player, 
      negState.offeredSalary, 
      negState.offeredBonus, 
      negState.offeredRole, 
      negState.contractYears
    );

    negState.satisfactionScore = evalResult.satisfactionScore;
    negState.playerMessage = evalResult.message;
    negState.playerStatus = evalResult.status;

    const satisfactionColor = negState.satisfactionScore >= 75 ? '#10b981' : (negState.satisfactionScore >= 52 ? '#f59e0b' : '#ef4444');
    const canSign = negState.satisfactionScore >= 68;

    const immediateCost = (negState.agreedFee ? (negState.isInstallment ? Math.round(negState.agreedFee / 2) : negState.agreedFee) : 0) + negState.offeredBonus;
    const hasEnoughBalance = (career.finances?.balance || 0) >= immediateCost;

    return `
      <!-- Resumo do Acordo com o Clube -->
      <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 10px; padding: 8px 12px; font-size: 11px; display: flex; justify-content: space-between; align-items: center;">
        <span style="color: #a7f3d0;">Taxa de Transferência Fechada:</span>
        <strong style="color: #10b981;">
          ${negState.agreedFee ? `${formatMoney(negState.agreedFee, currency)} ${negState.isInstallment ? '(2x)' : ''}` : 'R$ 0 (Agente Livre)'}
        </strong>
      </div>

      <!-- Diálogo com o Atleta e Empresário -->
      <div class="negotiation-dialogue-bubble ${negState.playerStatus === 'accepted' ? 'accepted' : (negState.playerStatus === 'counter' ? 'counter' : 'rejected')}">
        <div style="font-weight: 800; font-size: 11px; margin-bottom: 4px;">
          <span>🧑‍💼 Representante de ${player.name}</span>
        </div>
        <div>${negState.playerMessage}</div>
      </div>

      <!-- Termômetro de Satisfação do Jogador -->
      <div class="satisfaction-meter-container">
        <div style="display: flex; justify-content: space-between; font-size: 11px;">
          <span style="color: var(--text-muted);">Vontade de Assinar com o Clube:</span>
          <strong style="color: ${satisfactionColor};">${negState.satisfactionScore}%</strong>
        </div>
        <div class="satisfaction-bar-bg">
          <div class="satisfaction-bar-fill" style="width: ${negState.satisfactionScore}%; background-color: ${satisfactionColor};"></div>
        </div>
      </div>

      <!-- Controles de Salário Mensal -->
      <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span style="font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Salário Mensal Oferecido:</span>
          <strong style="font-size: 15px; font-weight: 900; color: #10b981;" id="display-offered-salary">
            ${formatMoney(negState.offeredSalary, currency)}/mês
          </strong>
        </div>

        <div class="adjust-pills-row">
          <button class="adjust-pill-btn" data-salary-adjust="-0.10">-10%</button>
          <button class="adjust-pill-btn" data-salary-adjust="-0.05">-5%</button>
          <button class="adjust-pill-btn" data-salary-adjust="target">Pedida Base</button>
          <button class="adjust-pill-btn" data-salary-adjust="0.10">+10%</button>
          <button class="adjust-pill-btn" data-salary-adjust="0.25">+25%</button>
        </div>

        <!-- Luvas / Bônus de Assinatura -->
        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.06);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Luvas de Assinatura:</span>
            <strong style="font-size: 13px; font-weight: 800; color: #fbbf24;" id="display-offered-bonus">
              ${formatMoney(negState.offeredBonus, currency)}
            </strong>
          </div>
          <div class="adjust-pills-row">
            <button class="adjust-pill-btn" data-bonus-adjust="zero">R$ 0</button>
            <button class="adjust-pill-btn" data-bonus-adjust="half">50%</button>
            <button class="adjust-pill-btn" data-bonus-adjust="target">Padrão</button>
            <button class="adjust-pill-btn" data-bonus-adjust="high">+50%</button>
          </div>
        </div>

        <!-- Papel no Elenco -->
        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.06);">
          <span style="font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; display: block; margin-bottom: 6px;">
            Papel no Elenco:
          </span>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px;">
            <button class="adjust-pill-btn ${negState.offeredRole === 'star' ? 'active' : ''}" data-role="star">⭐ Estrela Principal</button>
            <button class="adjust-pill-btn ${negState.offeredRole === 'key' ? 'active' : ''}" data-role="key">🟢 Titular Importante</button>
            <button class="adjust-pill-btn ${negState.offeredRole === 'rotation' ? 'active' : ''}" data-role="rotation">🔄 Rotação</button>
            <button class="adjust-pill-btn ${negState.offeredRole === 'prospect' ? 'active' : ''}" data-role="prospect">🌱 Jovem Promessa</button>
          </div>
        </div>
      </div>

      <!-- Resumo Financeiro do Fechamento -->
      <div style="font-size: 11px; color: var(--text-muted); background: rgba(0,0,0,0.2); padding: 8px 12px; border-radius: 8px;">
        <div>Total de Saída Imediata no Caixa: <strong style="color: ${hasEnoughBalance ? '#10b981' : '#ef4444'};">${formatMoney(immediateCost, currency)}</strong></div>
        ${!hasEnoughBalance ? `<div style="color: #ef4444; font-weight: 700; margin-top: 2px;">⚠️ Saldo em caixa insuficiente para o pagamento inicial!</div>` : ''}
      </div>

      <!-- Botões de Ação da Fase 2 -->
      <div style="display: flex; gap: 8px; margin-top: 4px;">
        <button class="btn btn-secondary" id="btn-cancel-negotiation" style="flex: 1;">
          Cancelar
        </button>
        ${canSign && hasEnoughBalance ? `
          <button class="btn btn-primary" id="btn-finalize-contract" style="flex: 2; padding: 12px; font-weight: 800;">
            ✍️ Oficializar e Assinar Contrato!
          </button>
        ` : `
          <button class="btn btn-secondary" style="flex: 2; opacity: 0.6; cursor: not-allowed;" title="${!hasEnoughBalance ? 'Saldo insuficiente' : 'Melhore a proposta para convencer o atleta'}">
            ${!hasEnoughBalance ? '🚫 Sem Saldo Suficiente' : '⏳ Termos Não Aceitos'}
          </button>
        `}
      </div>
    `;
  }

  function attachModalInternalEvents() {
    // Botão Cancelar/Fechar
    const btnCancel = modalBackdrop.querySelector('#btn-cancel-negotiation');
    if (btnCancel) {
      btnCancel.addEventListener('click', () => {
        modalBackdrop.remove();
      });
    }

    // Fechar ao clicar no backdrop escuro
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) {
        modalBackdrop.remove();
      }
    });

    if (negState.phase === 1) {
      // Ajustes de Oferta de Transferência
      modalBackdrop.querySelectorAll('.adjust-pill-btn[data-fee-adjust]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const adj = e.currentTarget.dataset.feeAdjust;
          const base = player.marketValue;

          if (adj === 'target') {
            negState.offeredFee = base;
          } else {
            const factor = parseFloat(adj);
            negState.offeredFee = Math.max(100000, Math.round(negState.offeredFee * (1 + factor)));
          }

          const disp = modalBackdrop.querySelector('#display-offered-fee');
          if (disp) disp.textContent = formatMoney(negState.offeredFee, currency);
        });
      });

      // Parcelamento
      const chkInstallment = modalBackdrop.querySelector('#chk-installment');
      if (chkInstallment) {
        chkInstallment.addEventListener('change', (e) => {
          negState.isInstallment = e.target.checked;
        });
      }

      // Enviar Proposta ao Clube
      const btnSubmit = modalBackdrop.querySelector('#btn-submit-club-offer');
      if (btnSubmit) {
        btnSubmit.addEventListener('click', () => {
          const result = evaluateClubOffer(career, player, negState.offeredFee, negState.isInstallment, negState.round);
          negState.clubStatus = result.status;
          negState.clubMessage = result.message;
          negState.patience = result.patienceRemaining;
          negState.clubCounterFee = result.counterFee || negState.offeredFee;

          if (result.status === 'accepted') {
            negState.agreedFee = negState.offeredFee;
          } else {
            negState.round++;
          }

          renderModalContent();
        });
      }

      // Aceitar Contraproposta do Clube
      const btnAcceptCounter = modalBackdrop.querySelector('#btn-accept-club-counter');
      if (btnAcceptCounter) {
        btnAcceptCounter.addEventListener('click', () => {
          negState.agreedFee = negState.clubCounterFee;
          negState.clubStatus = 'accepted';
          negState.phase = 2;
          renderModalContent();
        });
      }

      // Avançar para Fase 2
      const btnAdvance = modalBackdrop.querySelector('#btn-advance-to-player-contract');
      if (btnAdvance) {
        btnAdvance.addEventListener('click', () => {
          negState.agreedFee = negState.offeredFee;
          negState.phase = 2;
          renderModalContent();
        });
      }
    } else {
      // FASE 2: Eventos de Contrato com Jogador
      // Ajustes de Salário
      modalBackdrop.querySelectorAll('.adjust-pill-btn[data-salary-adjust]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const adj = e.currentTarget.dataset.salaryAdjust;
          const base = player.salary;

          if (adj === 'target') {
            negState.offeredSalary = base;
          } else {
            const factor = parseFloat(adj);
            negState.offeredSalary = Math.max(10000, Math.round(negState.offeredSalary * (1 + factor)));
          }

          renderModalContent();
        });
      });

      // Ajustes de Luvas
      modalBackdrop.querySelectorAll('.adjust-pill-btn[data-bonus-adjust]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const adj = e.currentTarget.dataset.bonusAdjust;
          const base = Math.round(player.salary * (isFreeAgent ? 2.5 : 1.5));

          if (adj === 'zero') negState.offeredBonus = 0;
          else if (adj === 'half') negState.offeredBonus = Math.round(base * 0.5);
          else if (adj === 'target') negState.offeredBonus = base;
          else if (adj === 'high') negState.offeredBonus = Math.round(base * 1.5);

          renderModalContent();
        });
      });

      // Papel no elenco
      modalBackdrop.querySelectorAll('.adjust-pill-btn[data-role]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          negState.offeredRole = e.currentTarget.dataset.role;
          renderModalContent();
        });
      });

      // Oficializar e Assinar Contrato!
      const btnFinalize = modalBackdrop.querySelector('#btn-finalize-contract');
      if (btnFinalize) {
        btnFinalize.addEventListener('click', () => {
          try {
            const res = finalizeTransfer(career, {
              player,
              agreedFee: negState.agreedFee || 0,
              agreedSalary: negState.offeredSalary,
              agreedBonus: negState.offeredBonus,
              isInstallment: negState.isInstallment,
              agreedRole: negState.offeredRole
            });

            saveCareer(career);
            modalBackdrop.remove();
            showToast(res.message, 'success');
            renderMarketScreen(contentArea, career);
          } catch (err) {
            showToast(err.message, 'error');
          }
        });
      }
    }
  }

  container.appendChild(modalBackdrop);
  renderModalContent();
}

/**
 * ============================================================================
 * MODAL DINÂMICO DE VENDA DE JOGADORES COM PROPOSTAS FORMAIS
 * ============================================================================
 */
function openNegotiationSellModal(player, career, contentArea) {
  const container = document.getElementById('negotiation-modal-container') || document.body;
  const currency = career.league?.currencySymbol || 'R$';
  const offers = getTransferOffersForPlayer(career, player);

  const modalBackdrop = document.createElement('div');
  modalBackdrop.className = 'modal-backdrop open';
  modalBackdrop.id = 'sell-negotiation-modal';

  modalBackdrop.innerHTML = `
    <div class="negotiation-modal-dialog">
      <div style="padding: 16px; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h3 style="font-size: 16px; font-weight: 800; color: var(--text-main);">Propostas por ${player.name}</h3>
          <div style="font-size: 11px; color: var(--text-muted);">${player.position} · ${player.overall} OVR · Valor de Mercado: ${formatMoney(player.marketValue, currency)}</div>
        </div>
        <button class="btn btn-secondary btn-sm" id="btn-close-sell-modal">✕</button>
      </div>

      <div class="negotiation-body">
        <div style="font-size: 12px; color: var(--text-subtle); line-height: 1.4;">
          Clubes interessados enviaram propostas formais de transferência. Analise os valores para fechar a negociação:
        </div>

        <!-- Lista de Propostas Recebidas -->
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${offers.map((offer, idx) => `
            <div class="sell-offer-card">
              <div style="flex: 1; min-width: 0;">
                <div style="font-size: 14px; font-weight: 800; color: var(--text-main);">${offer.buyerName}</div>
                <div style="font-size: 11px; color: var(--text-muted);">${offer.buyerOrigin}</div>
                <div style="font-size: 15px; font-weight: 900; color: #10b981; margin-top: 3px;">
                  ${formatMoney(offer.offerAmount, currency)}
                </div>
              </div>

              <div>
                <button class="btn btn-primary btn-sm btn-accept-sell-offer" 
                  data-offer-amount="${offer.offerAmount}" 
                  data-buyer-name="${offer.buyerName}" 
                  data-buyer-id="${offer.buyerId}">
                  💰 Aceitar
                </button>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Opção de Venda Rápida -->
        <div style="background: rgba(0, 0, 0, 0.25); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 12px; margin-top: 6px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 12px; font-weight: 700; color: var(--text-main);">Venda Imediata no Mercado</div>
            <div style="font-size: 11px; color: var(--text-muted);">Transferência direta pelo valor de mercado</div>
          </div>
          <button class="btn btn-secondary btn-sm" id="btn-instant-market-sell" style="border-color: rgba(245, 158, 11, 0.5); color: #fbbf24;">
            ⚡ Vender por ${formatMoney(player.marketValue, currency)}
          </button>
        </div>
      </div>
    </div>
  `;

  function closeModal() {
    modalBackdrop.remove();
  }

  const btnClose = modalBackdrop.querySelector('#btn-close-sell-modal');
  if (btnClose) btnClose.addEventListener('click', closeModal);

  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeModal();
  });

  // Aceitar Proposta Formal
  modalBackdrop.querySelectorAll('.btn-accept-sell-offer').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const amount = Number(e.currentTarget.dataset.offerAmount);
      const buyerName = e.currentTarget.dataset.buyerName;
      const buyerId = e.currentTarget.dataset.buyerId;

      try {
        const res = sellPlayer(career, player.id, amount, { buyerId, buyerName });
        saveCareer(career);
        closeModal();
        showToast(res.message, 'success');
        renderMarketScreen(contentArea, career);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });

  // Venda Rápida Imediata
  const btnInstant = modalBackdrop.querySelector('#btn-instant-market-sell');
  if (btnInstant) {
    btnInstant.addEventListener('click', () => {
      try {
        const res = sellPlayer(career, player.id, player.marketValue);
        saveCareer(career);
        closeModal();
        showToast(res.message, 'success');
        renderMarketScreen(contentArea, career);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  container.appendChild(modalBackdrop);
}


/* ==========================================================================
   ETAPA 5 — TELA DE FINANÇAS E EXTRATO CONSOLIDADO
   ========================================================================== */

function renderFinancesScreen(contentArea, career) {
  career = getCareerState() || career;
  const finances = getFinancialOverview(career);
  const currency = career.league?.currencySymbol || 'R$';
  const history = finances.history || [];

  contentArea.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
      <div>
        <h2 style="font-size: 18px; font-weight: 800;">Finanças do Clube</h2>
        <div style="font-size: 11px; color: var(--text-muted);">${career.club.name} · Balanço da Temporada</div>
      </div>
      <button class="btn btn-secondary btn-sm" id="btn-return-overview">← Voltar</button>
    </div>

    <!-- Banner Principal -->
    <div class="finance-hero-banner">
      <div class="finance-hero-main">
        <div>
          <div class="finance-hero-title">Saldo Financeiro em Caixa</div>
          <div class="finance-hero-balance">${finances.balanceFormatted}</div>
        </div>
        <div style="text-align: right;">
          <div class="finance-hero-title">Verba de Transferências</div>
          <div style="font-size: 16px; font-weight: 800; color: #38bdf8; margin-top: 2px;">
            ${finances.transferBudgetFormatted}
          </div>
        </div>
      </div>

      <!-- Métricas em Grid -->
      <div class="finance-stat-grid">
        <div class="finance-stat-card">
          <div class="label">Folha Mensal do Elenco</div>
          <div class="val" style="color: #f59e0b;">${finances.monthlyWageExpenseFormatted}</div>
        </div>
        <div class="finance-stat-card">
          <div class="label">Teto Salarial da Diretoria</div>
          <div class="val">${finances.wageBudgetFormatted}</div>
        </div>
        <div class="finance-stat-card">
          <div class="label">Custo Semanal (Salários)</div>
          <div class="val">${finances.weeklyWageExpenseFormatted}</div>
        </div>
        <div class="finance-stat-card">
          <div class="label">Atletas sob Contrato</div>
          <div class="val">${career.squad.length} jogadores</div>
        </div>
      </div>

      <!-- Barra de Uso da Folha Salarial -->
      <div class="wage-meter-box" style="margin-bottom: 0; background-color: rgba(0,0,0,0.25);">
        <div class="wage-meter-header">
          <span style="color: var(--text-muted); font-size: 11px;">Comprometimento Salarial</span>
          <strong style="color: ${finances.wageUsagePercent > 90 ? '#ef4444' : (finances.wageUsagePercent > 75 ? '#f59e0b' : '#10b981')};">
            ${finances.wageUsagePercent}%
          </strong>
        </div>
        <div class="wage-progress-bg">
          <div class="wage-progress-fill" style="width: ${finances.wageUsagePercent}%; background-color: ${finances.wageUsagePercent > 90 ? '#ef4444' : (finances.wageUsagePercent > 75 ? '#f59e0b' : '#10b981')};"></div>
        </div>
      </div>
    </div>

    <!-- Botão Rápido para Mercado -->
    <button class="btn btn-primary" id="btn-goto-market-from-finances" style="margin-bottom: 14px; width: 100%;">
      💼 Abrir Mercado de Transferências
    </button>

    <!-- Histórico de Movimentações (Extrato) -->
    <div class="history-feed-card">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
        <h3 style="font-size: 14px; font-weight: 700;">Histórico de Movimentações</h3>
        <span style="font-size: 11px; color: var(--text-muted);">${history.length} lançamentos</span>
      </div>

      ${history.length === 0 ? `
        <div style="text-align: center; padding: 24px 0; color: var(--text-muted); font-size: 12px;">
          Nenhuma movimentação registrada nesta temporada.
        </div>
      ` : `
        <div style="display: flex; flex-direction: column;">
          ${history.map(item => {
            const isPositive = (item.amount || 0) > 0;
            const isNegative = (item.amount || 0) < 0;
            const formattedAmount = (isPositive ? '+ ' : '') + formatMoney(item.amount || 0, currency);

            let icon = '📄';
            let iconClass = 'neutral';
            if (item.type === 'transfer_in') {
              icon = '📥';
              iconClass = 'out';
            } else if (item.type === 'transfer_out') {
              icon = '📤';
              iconClass = 'in';
            } else if (item.type === 'match_tickets') {
              icon = '🎟️';
              iconClass = 'in';
            } else if (item.type === 'wage') {
              icon = '👥';
              iconClass = 'out';
            } else if (item.type === 'initial') {
              icon = '🏦';
              iconClass = 'neutral';
            }

            return `
              <div class="history-item-row">
                <div class="history-item-left">
                  <div class="history-type-icon ${iconClass}">
                    ${icon}
                  </div>
                  <div class="history-info-col">
                    <div class="history-desc-text">${item.description || 'Lançamento financeiro'}</div>
                    <div class="history-meta-text">${item.date || 'Hoje'}</div>
                  </div>
                </div>

                <div class="history-amount-text ${isPositive ? 'positive' : (isNegative ? 'negative' : '')}">
                  ${formattedAmount}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    </div>
  `;

  attachReturnBtn();

  const btnGotoMarket = document.getElementById('btn-goto-market-from-finances');
  if (btnGotoMarket) {
    btnGotoMarket.addEventListener('click', () => {
      currentSubScreen = 'market';
      renderApp();
    });
  }
}

function renderMoreMenuScreen(contentArea, career) {
  contentArea.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
      <h2 style="font-size: 18px;">Opções da Carreira</h2>
      <button class="btn btn-secondary btn-sm" id="btn-return-overview">← Voltar</button>
    </div>

    <div class="card" style="margin-bottom: 16px;">
      <div class="card-title">Diretoria & Finanças</div>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <button id="btn-more-go-market" class="btn btn-secondary" style="justify-content: flex-start; gap: 10px;">
          💼 Mercado da Bola (Transferências)
        </button>
        <button id="btn-more-go-finances" class="btn btn-secondary" style="justify-content: flex-start; gap: 10px;">
          💰 Finanças e Extrato do Clube
        </button>
      </div>
    </div>

    <div class="card" style="margin-bottom: 16px;">
      <div class="card-title">Gestão do Jogo</div>
      <button id="btn-manual-save" class="btn btn-primary" style="margin-bottom: 10px;">
        💾 Salvar Progresso Atual
      </button>
      <div style="font-size: 11px; color: var(--text-muted); text-align: center;">
        Os dados são mantidos com segurança no seu dispositivo (localStorage).
      </div>
    </div>

    <div class="card" style="margin-bottom: 16px;">
      <div class="card-title">Perfil do Treinador</div>
      <div style="font-size: 13px; margin-bottom: 4px;">
        <strong>${career.manager.firstName} ${career.manager.lastName}</strong> (${career.manager.nationality})
      </div>
      <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">
        Clube: ${career.club.name} · Liga: ${career.league.name}
      </div>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; font-size: 11px; color: var(--text-muted);">
        <div>Ataque: <strong>${career.manager.attributes.attack}</strong></div>
        <div>Defesa: <strong>${career.manager.attributes.defense}</strong></div>
        <div>Tática: <strong>${career.manager.attributes.tactics}</strong></div>
        <div>Gestão: <strong>${career.manager.attributes.management}</strong></div>
      </div>
    </div>

    <div class="card" style="border-color: rgba(229,37,56,0.3);">
      <div class="card-title" style="color: #ff5264;">Zona de Perigo</div>
      <p style="font-size: 12px; margin-bottom: 12px;">
        Deseja encerrar esta carreira ou começar uma nova trajetória?
      </p>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <button id="btn-reset-career" class="btn btn-danger">
          🗑️ Excluir Carreira e Reiniciar
        </button>
        <button id="btn-more-new-career" class="btn btn-secondary">
          + Iniciar Nova Carreira
        </button>
      </div>
    </div>
  `;

  attachReturnBtn();

  const btnMoreMarket = document.getElementById('btn-more-go-market');
  if (btnMoreMarket) {
    btnMoreMarket.addEventListener('click', () => {
      currentSubScreen = 'market';
      renderApp();
    });
  }

  const btnMoreFinances = document.getElementById('btn-more-go-finances');
  if (btnMoreFinances) {
    btnMoreFinances.addEventListener('click', () => {
      currentSubScreen = 'finances';
      renderApp();
    });
  }

  const btnSave = document.getElementById('btn-manual-save');
  if (btnSave) {
    btnSave.addEventListener('click', () => {
      const ok = saveCareer(career);
      if (ok) {
        showToast('Carreira salva com sucesso!', 'success');
      } else {
        showToast('Erro ao salvar carreira no navegador.', 'error');
      }
    });
  }

  const btnReset = document.getElementById('btn-reset-career');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      showConfirmModal({
        title: 'Excluir Carreira Atual?',
        message: 'Tem certeza de que deseja apagar todos os dados desta carreira? Esta ação não pode ser desfeita e você retornará à tela inicial.',
        confirmText: '🗑️ Sim, Excluir Carreira',
        cancelText: 'Cancelar',
        isDanger: true,
        onConfirm: () => {
          if (matchSimulationTimer) {
            clearInterval(matchSimulationTimer);
            matchSimulationTimer = null;
          }
          activeMatch = null;
          if (onResetCareer) {
            onResetCareer();
          } else {
            clearCareer();
            setCareerState(null);
            resetManagerDraft();
            showToast('Carreira excluída com sucesso.', 'info');
            navigateTo('welcome');
          }
        }
      });
    });
  }

  const btnMoreNew = document.getElementById('btn-more-new-career');
  if (btnMoreNew) {
    btnMoreNew.addEventListener('click', () => {
      showConfirmModal({
        title: 'Iniciar Nova Carreira?',
        message: 'Deseja iniciar uma nova trajetória de técnico? O save atual continuará ativo até você assinar com o novo clube.',
        confirmText: 'Sim, Nova Carreira',
        cancelText: 'Cancelar',
        icon: '⚽',
        isDanger: false,
        onConfirm: () => {
          resetManagerDraft();
          selectedLeagueId = null;
          selectedClubId = null;
          currentSubScreen = null;
          navigateTo('manager');
        }
      });
    });
  }
}

function attachReturnBtn() {
  const btnReturn = document.getElementById('btn-return-overview');
  if (btnReturn) {
    btnReturn.addEventListener('click', () => {
      currentSubScreen = null;
      renderApp();
    });
  }
}
