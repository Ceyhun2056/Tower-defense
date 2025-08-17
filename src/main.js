import { Game } from './systems/game.js';
import { initMap } from './map/map.js';
import { Input } from './systems/input.js';
import { UpgradeUI } from './systems/upgradeUI.js';

// Entry point
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const game = new Game(ctx, canvas);
game.map = initMap();

const input = new Input(canvas, game);
const upgradeUI = new UpgradeUI(game);

// Make upgradeUI available to input system
input.upgradeUI = upgradeUI;

// UI elements
const statLives = document.getElementById('statLives');
const statMoney = document.getElementById('statMoney');
const statWave = document.getElementById('statWave');
const statScore = document.getElementById('statScore');
const statEnemiesKilled = document.getElementById('statEnemiesKilled');
const statTowersBuilt = document.getElementById('statTowersBuilt');
const statAchievements = document.getElementById('statAchievements');
const statBossesKilled = document.getElementById('statBossesKilled');
const themeSelector = document.getElementById('themeSelector');

const btnStart = document.getElementById('btnStart');
const btnPause = document.getElementById('btnPause');
const btnRestart = document.getElementById('btnRestart');
const btnSave = document.getElementById('btnSave');
const btnLoad = document.getElementById('btnLoad');

const overlay = document.getElementById('overlay');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const pauseScreen = document.getElementById('pauseScreen');
const overlayStart = document.getElementById('overlayStart');
const overlayRestart = document.getElementById('overlayRestart');
const resumeButton = document.getElementById('resumeButton');
const restartFromPause = document.getElementById('restartFromPause');

// New UI elements
const towerCost = document.getElementById('towerCost');
const waveInfo = document.getElementById('waveInfo');
const finalScore = document.getElementById('finalScore');
const finalWave = document.getElementById('finalWave');
const enemiesKilled = document.getElementById('enemiesKilled');
const pauseWave = document.getElementById('pauseWave');
const pauseScore = document.getElementById('pauseScore');
const pauseMoney = document.getElementById('pauseMoney');

// Tower selection elements
const towerOptions = document.querySelectorAll('.tower-option');
let selectedTowerType = 'basic';

// Mobile UI elements
const mobileControls = document.getElementById('mobileControls');
const mobileLives = document.getElementById('mobileLives');
const mobileMoney = document.getElementById('mobileMoney');
const mobileWave = document.getElementById('mobileWave');
const mobileScore = document.getElementById('mobileScore');
const mobilePause = document.getElementById('mobilePause');
const mobileRestart = document.getElementById('mobileRestart');
const mobileWaveInfo = document.getElementById('mobileWaveInfo');
const mobileTowerBtns = document.querySelectorAll('.mobile-tower-btn');

// Detect mobile device
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                 ('ontouchstart' in window) || 
                 (navigator.maxTouchPoints > 0);

// Show mobile controls on mobile devices
if (isMobile) {
  mobileControls.classList.remove('hidden');
}

// Initialize theme selector
themeSelector.value = game.themeManager.currentTheme;

function updateHUD() {
  statLives.textContent = game.state.lives;
  statMoney.textContent = game.state.money;
  statWave.textContent = game.state.wave;
  statScore.textContent = game.state.score;
  
  // Update statistics
  if (game.achievements) {
    statEnemiesKilled.textContent = game.achievements.stats.enemiesKilled;
    statTowersBuilt.textContent = game.achievements.stats.towersBuilt;
    statBossesKilled.textContent = game.achievements.stats.bossesKilled;
    statAchievements.textContent = `${game.achievements.getUnlockedCount()}/${game.achievements.getTotalCount()}`;
  }
  
  // Update mobile stats
  if (isMobile) {
    mobileLives.textContent = game.state.lives;
    mobileMoney.textContent = game.state.money;
    mobileWave.textContent = game.state.wave;
    mobileScore.textContent = game.state.score;
    
    // Update mobile pause button
    mobilePause.textContent = game.paused ? '▶️' : '⏸️';
  }
  
  // Update button states
  btnPause.textContent = game.paused ? 'Resume' : 'Pause';
  btnPause.disabled = !game.running;
  btnSave.disabled = !game.running;
  btnLoad.disabled = !game.hasSavedGame();
  
  // Update tower options affordability (desktop)
  towerOptions.forEach(option => {
    const towerType = option.dataset.type;
    const towerInfo = game.getTowerInfo(towerType);
    const canAfford = game.state.money >= towerInfo.cost;
    
    option.classList.toggle('unaffordable', !canAfford);
    option.classList.toggle('selected', towerType === selectedTowerType);
  });
  
  // Update mobile tower buttons
  if (isMobile) {
    mobileTowerBtns.forEach(btn => {
      const towerType = btn.dataset.type;
      const towerInfo = game.getTowerInfo(towerType);
      const canAfford = game.state.money >= towerInfo.cost;
      
      btn.classList.toggle('unaffordable', !canAfford);
      btn.classList.toggle('selected', towerType === selectedTowerType);
    });
  }
  
  // Update wave info
  let waveInfoText;
  if (!game.running) {
    waveInfoText = isMobile ? 'Tap Start to begin' : 'Click Start to begin';
  } else if (game.paused) {
    waveInfoText = 'Game paused';
  } else if (game.waveActive) {
    const remaining = game.enemiesPerWave - game.enemiesSpawned;
    waveInfoText = `Spawning... ${remaining} enemies left`;
  } else {
    const timeLeft = Math.ceil(game.waveDelay - game.waveTimer);
    waveInfoText = `Next wave in ${timeLeft}s`;
  }
  
  // Update wave info displays
  if (waveInfo) waveInfo.textContent = waveInfoText;
  if (isMobile && mobileWaveInfo) mobileWaveInfo.textContent = waveInfoText;
}

// Buttons
btnStart.addEventListener('click', () => { game.start(); hideOverlay(); });
btnPause.addEventListener('click', () => {
  game.togglePause();
  if (game.paused) showPause();
  else hideOverlay();
});
btnRestart.addEventListener('click', () => { game.restart(); hideOverlay(); });
btnSave.addEventListener('click', () => {
  if (game.running) {
    game.saveGame();
  }
});
btnLoad.addEventListener('click', () => {
  if (game.hasSavedGame()) {
    game.loadGame();
    hideOverlay();
  }
});

// Theme selector
themeSelector.addEventListener('change', (e) => {
  game.themeManager.setTheme(e.target.value);
});
overlayStart.addEventListener('click', () => { game.start(); hideOverlay(); });
overlayRestart.addEventListener('click', () => { game.restart(); hideOverlay(); });
resumeButton.addEventListener('click', () => { game.togglePause(); hideOverlay(); });
restartFromPause.addEventListener('click', () => { game.restart(); hideOverlay(); });

function hideOverlay() { overlay.classList.add('hidden'); }
function showGameOver() {
  // Update final stats
  finalScore.textContent = game.state.score;
  finalWave.textContent = game.state.wave;
  enemiesKilled.textContent = game.enemiesKilled || 0;
  
  overlay.classList.remove('hidden');
  startScreen.classList.add('hidden');
  pauseScreen.classList.add('hidden');
  gameOverScreen.classList.remove('hidden');
}

function showPause() {
  // Update pause stats
  pauseWave.textContent = game.state.wave;
  pauseScore.textContent = game.state.score;
  pauseMoney.textContent = game.state.money;
  
  overlay.classList.remove('hidden');
  startScreen.classList.add('hidden');
  gameOverScreen.classList.add('hidden');
  pauseScreen.classList.remove('hidden');
}

game.onStateChange = updateHUD;
game.onGameOver = showGameOver;

// Tower selection event handlers
towerOptions.forEach(option => {
  option.addEventListener('click', () => {
    const towerType = option.dataset.type;
    const towerInfo = game.getTowerInfo(towerType);
    
    // Check if player can afford this tower type
    if (game.state.money >= towerInfo.cost) {
      selectedTowerType = towerType;
      game.selectTowerType(towerType);
      updateHUD();
    }
  });
});

updateHUD();

// Resize handling for crisp rendering
function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  game.render();
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Mobile controls event handlers
if (isMobile) {
  // Mobile tower selection
  mobileTowerBtns.forEach(btn => {
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const towerType = btn.dataset.type;
      const towerInfo = game.getTowerInfo(towerType);
      
      if (game.state.money >= towerInfo.cost) {
        selectedTowerType = towerType;
        game.selectTowerType(towerType);
        updateHUD();
      }
    });
  });

  // Mobile pause button
  mobilePause.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (game.running) {
      if (game.paused) {
        game.resume();
      } else {
        game.pause();
        showPauseScreen();
      }
    }
  });

  // Mobile restart button
  mobileRestart.addEventListener('touchstart', (e) => {
    e.preventDefault();
    game.restart();
  });
}

// Start screen visible by default
