/**
 * @license
 * FUTMANAGER Mobile - js/app.js
 * Inicialização, orquestração e integração de módulos
 */

import { initCareer, setCareerState, getCareerState, resetManagerDraft } from './state.js';
import { loadCareer, saveCareer, clearCareer, hasSavedCareer } from './storage.js';
import { registerUIHandlers, renderApp, navigateTo, showToast } from './ui.js';

/**
 * Inicialização principal do FUTMANAGER Mobile
 */
function initApp() {
  console.log('⚽ Inicializando FUTMANAGER Mobile (Etapa 1 - Fundação)...');

  // Registrar manipuladores de eventos da UI
  registerUIHandlers({
    onStartNewCareer: handleStartNewCareer,
    onContinueCareer: handleContinueCareer,
    onResetCareer: handleResetCareer
  });

  // Verificar se há carreira salva previamente
  if (hasSavedCareer()) {
    navigateTo('welcome');
  } else {
    // Se for o primeiro acesso, apresenta a tela inicial para início direto
    navigateTo('welcome');
  }
}

/**
 * Cria formalmente uma nova carreira e direciona ao painel
 */
function handleStartNewCareer(managerDraft, leagueId, clubId) {
  try {
    const newState = initCareer(managerDraft, leagueId, clubId);
    
    // Persistência inicial imediata
    const saved = saveCareer(newState);
    if (!saved) {
      console.warn('Não foi possível persistir no localStorage imediatamente.');
    }

    showToast(`Bem-vindo ao ${newState.club.name}, Professor ${newState.manager.lastName}!`, 'success');
    navigateTo('dashboard');
  } catch (error) {
    console.error('Falha ao iniciar carreira:', error);
    showToast('Erro ao iniciar carreira: ' + error.message, 'error');
  }
}

/**
 * Carrega a carreira salva existente
 */
function handleContinueCareer() {
  const savedState = loadCareer();
  if (savedState) {
    setCareerState(savedState);
    showToast(`Carreira retomada: ${savedState.club.name}`, 'success');
    navigateTo('dashboard');
  } else {
    showToast('Não foi possível carregar os dados salvos.', 'error');
    navigateTo('welcome');
  }
}

/**
 * Limpa a carreira e reseta a sessão
 */
function handleResetCareer() {
  clearCareer();
  setCareerState(null);
  resetManagerDraft();
  showToast('Carreira excluída com sucesso.', 'info');
  navigateTo('welcome');
}

// Iniciar quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
