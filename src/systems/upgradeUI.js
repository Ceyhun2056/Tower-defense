// Tower upgrade UI system
// Handles displaying upgrade options and processing upgrades

export class UpgradeUI {
  constructor(game) {
    this.game = game;
    this.selectedTower = null;
    this.visible = false;
    this.upgradePanel = null;
    this.createUpgradePanel();
  }

  createUpgradePanel() {
    // Create upgrade panel element
    this.upgradePanel = document.createElement('div');
    this.upgradePanel.id = 'upgradePanel';
    this.upgradePanel.className = 'upgrade-panel hidden';
    this.upgradePanel.innerHTML = `
      <div class="upgrade-header">
        <h3 id="upgradeTowerName">Tower Upgrades</h3>
        <button id="closeUpgrade" class="close-btn">×</button>
      </div>
      <div class="tower-info">
        <div class="tower-stats">
          <div class="stat">
            <span class="stat-label">Damage:</span>
            <span id="towerDamage">0</span>
          </div>
          <div class="stat">
            <span class="stat-label">Range:</span>
            <span id="towerRange">0</span>
          </div>
          <div class="stat">
            <span class="stat-label">Fire Rate:</span>
            <span id="towerFireRate">0</span>
          </div>
          <div class="stat">
            <span class="stat-label">Sell Value:</span>
            <span id="towerSellValue">$0</span>
          </div>
        </div>
      </div>
      <div id="upgradeOptions" class="upgrade-options">
        <!-- Upgrade options will be populated here -->
      </div>
      <div class="upgrade-actions">
        <button id="sellTower" class="sell-btn">Sell Tower</button>
      </div>
    `;

    document.body.appendChild(this.upgradePanel);
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Close button
    document.getElementById('closeUpgrade').addEventListener('click', () => {
      this.hide();
    });

    // Sell tower button
    document.getElementById('sellTower').addEventListener('click', () => {
      this.sellTower();
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (this.visible && !this.upgradePanel.contains(e.target) && !e.target.closest('.tower')) {
        this.hide();
      }
    });
  }

  show(tower, x, y) {
    this.selectedTower = tower;
    this.visible = true;
    
    // Update tower info
    this.updateTowerInfo();
    
    // Position panel near the tower
    this.positionPanel(x, y);
    
    // Show panel
    this.upgradePanel.classList.remove('hidden');
    
    // Populate upgrade options
    this.populateUpgradeOptions();
  }

  hide() {
    this.visible = false;
    this.selectedTower = null;
    this.upgradePanel.classList.add('hidden');
  }

  updateTowerInfo() {
    if (!this.selectedTower) return;

    const tower = this.selectedTower;
    document.getElementById('upgradeTowerName').textContent = this.getTowerDisplayName(tower);
    document.getElementById('towerDamage').textContent = Math.round(tower.getEffectiveDamage());
    document.getElementById('towerRange').textContent = tower.getEffectiveRange().toFixed(1);
    document.getElementById('towerFireRate').textContent = tower.getEffectiveFireRate().toFixed(1);
    document.getElementById('towerSellValue').textContent = `$${tower.sellValue}`;
  }

  getTowerDisplayName(tower) {
    const names = {
      basic: 'Basic Tower',
      guard: 'Guard Tower',
      rapid: 'Rapid Tower',
      sniper: 'Sniper Tower',
      railgun: 'Railgun Tower',
      assassin: 'Assassin Tower',
      cannon: 'Cannon Tower',
      laser: 'Laser Tower',
      fire: 'Fire Tower',
      ice: 'Ice Tower',
      poison: 'Poison Tower',
      lightning: 'Lightning Tower',
      amplifier: 'Amplifier Tower'
    };
    return names[tower.type] || 'Unknown Tower';
  }

  populateUpgradeOptions() {
    const optionsContainer = document.getElementById('upgradeOptions');
    optionsContainer.innerHTML = '';

    if (!this.selectedTower || !this.selectedTower.canUpgrade()) {
      optionsContainer.innerHTML = '<p class="no-upgrades">No upgrades available</p>';
      return;
    }

    // Import upgrade data
    import('./towerUpgrades.js').then(({ getAvailableUpgrades }) => {
      const upgrades = getAvailableUpgrades(this.selectedTower, this.game.state.money);
      
      if (upgrades.length === 0) {
        optionsContainer.innerHTML = '<p class="no-upgrades">No upgrades available</p>';
        return;
      }

      upgrades.forEach(upgrade => {
        const upgradeElement = this.createUpgradeOption(upgrade);
        optionsContainer.appendChild(upgradeElement);
      });
    });
  }

  createUpgradeOption(upgrade) {
    const upgradeDiv = document.createElement('div');
    upgradeDiv.className = `upgrade-option ${upgrade.affordable ? '' : 'unaffordable'}`;
    
    upgradeDiv.innerHTML = `
      <div class="upgrade-info">
        <h4 class="upgrade-name">${upgrade.name}</h4>
        <p class="upgrade-description">${upgrade.description}</p>
        <div class="upgrade-stats">
          <span class="stat">💥 ${upgrade.stats.damage}</span>
          <span class="stat">🎯 ${upgrade.stats.range}</span>
          <span class="stat">⚡ ${upgrade.stats.fireRate}</span>
        </div>
      </div>
      <div class="upgrade-cost">
        <span class="cost">$${upgrade.cost}</span>
        <button class="upgrade-btn ${upgrade.affordable ? '' : 'disabled'}" 
                data-upgrade-id="${upgrade.id}" 
                ${upgrade.affordable ? '' : 'disabled'}>
          ${upgrade.affordable ? 'Upgrade' : 'Can\'t Afford'}
        </button>
      </div>
    `;

    // Add click handler for upgrade button
    const upgradeBtn = upgradeDiv.querySelector('.upgrade-btn');
    upgradeBtn.addEventListener('click', () => {
      if (upgrade.affordable) {
        this.performUpgrade(upgrade);
      }
    });

    return upgradeDiv;
  }

  performUpgrade(upgrade) {
    if (!this.selectedTower || !upgrade.affordable) return;

    // Check if player has enough money
    if (this.game.state.money < upgrade.cost) return;

    // Deduct cost
    this.game.state.money -= upgrade.cost;

    // Apply upgrade to tower
    this.selectedTower.upgrade(upgrade.id, upgrade);

    // Update display
    this.updateTowerInfo();
    this.populateUpgradeOptions();

    // Trigger state change callback
    if (this.game.onStateChange) {
      this.game.onStateChange();
    }

    // Hide upgrade panel
    this.hide();
  }

  sellTower() {
    if (!this.selectedTower) return;

    // Add sell value to money
    this.game.state.money += this.selectedTower.sellValue;

    // Remove tower from game
    const towerIndex = this.game.towers.indexOf(this.selectedTower);
    if (towerIndex > -1) {
      this.game.towers.splice(towerIndex, 1);
    }

    // Trigger state change callback
    if (this.game.onStateChange) {
      this.game.onStateChange();
    }

    // Hide upgrade panel
    this.hide();
  }

  positionPanel(x, y) {
    const panel = this.upgradePanel;
    const rect = panel.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Default position
    let left = x + 20;
    let top = y - 50;

    // Adjust if panel would go off screen
    if (left + 300 > viewportWidth) {
      left = x - 320;
    }
    if (top + 400 > viewportHeight) {
      top = Math.max(10, y - 350);
    }
    if (left < 10) {
      left = 10;
    }
    if (top < 10) {
      top = 10;
    }

    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
  }

  // Check if upgrade panel is open
  isVisible() {
    return this.visible;
  }

  // Get currently selected tower
  getSelectedTower() {
    return this.selectedTower;
  }
}
