import { renderMap } from '../map/map.js';
import { Enemy } from '../entities/enemy.js';
import { Tower } from '../entities/tower.js';
import { 
  BasicTower, SniperTower, CannonTower, LaserTower,
  GuardTower, RapidTower, RailgunTower, AssassinTower,
  FireTower, IceTower, PoisonTower, LightningTower,
  AmplifierTower
} from '../entities/towerTypes.js';
import { createEnemy } from '../entities/enemyTypes.js';
import { createBossEnemy, createSpecialEnemy } from '../entities/bossEnemies.js';
import { Projectile } from '../entities/projectile.js';
import { getTowerInfo } from '../entities/towerUpgrades.js';

export class Game {
  constructor(ctx, canvas) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.running = false;
    this.paused = false;
    this.lastTime = 0;
    this.accumulator = 0;
    this.dt = 1000/60; // fixed timestep (ms)
    this.map = null;
    this.gridSize = 48; // pixels per tile (before scaling by DPI transform separately)
    this.hoverCell = null;
    this.enemies = [];
    this.towers = [];
    this.projectiles = [];
    this.selectedTowerType = 'basic'; // for tower selection
    this.waveTimer = 0;
    this.waveDelay = 3; // seconds between waves
    this.enemiesPerWave = 5;
    this.spawnTimer = 0;
    this.spawnDelay = 1; // seconds between enemy spawns
    this.enemiesSpawned = 0;
    this.waveActive = false;
    this.enemiesKilled = 0;
    this.state = {
      lives: 20,
      money: 150, // increased starting money for tower variety
      wave: 0,
      score: 0
    };
    this.onStateChange = null;
    this.onGameOver = null;
    this._anim = this._anim.bind(this);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.paused = false;
    this.lastTime = performance.now();
    requestAnimationFrame(this._anim);
  }

  togglePause() {
    if (!this.running) return;
    this.paused = !this.paused;
  }

  restart() {
    this.running = false;
    this.paused = false;
    this.enemies = [];
    this.towers = [];
    this.projectiles = [];
    this.waveTimer = 0;
    this.enemiesSpawned = 0;
    this.waveActive = false;
    this.enemiesKilled = 0;
    this.state = { lives: 20, money: 100, wave: 0, score: 0 };
    this._notifyState();
    this.start();
  }

  _notifyState() { if (this.onStateChange) this.onStateChange(this.state); }

  gameOver() {
    this.running = false;
    if (this.onGameOver) this.onGameOver();
  }

  update(dt) {
    // Wave management
    this.updateWaves(dt);
    
    // Update enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(dt, this);
      
      // Check if enemy reached the end
      if (enemy.pathIndex >= this.map.path.length - 1) {
        this.state.lives--;
        this.enemies.splice(i, 1);
        this._notifyState();
        continue;
      }
      
      // Remove dead enemies and give money
      if (!enemy.active) {
        // Handle special death effects
        this.handleEnemyDeath(enemy);
        
        this.state.money += enemy.reward;
        this.state.score += enemy.reward;
        this.enemiesKilled++;
        this.enemies.splice(i, 1);
        this._notifyState();
      }
    }
    
    // Update towers
    this.towers.forEach(tower => {
      // Reset multipliers each frame (support towers will reapply them)
      tower.damageMultiplier = 1.0;
      tower.rangeMultiplier = 1.0;
      tower.fireRateMultiplier = 1.0;
      
      tower.update(dt, this.enemies, this);
    });
    
    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      projectile.update(dt, this);
      
      if (!projectile.active) {
        this.projectiles.splice(i, 1);
      }
    }
    
    if (this.state.lives <= 0) this.gameOver();
  }

  updateWaves(dt) {
    if (!this.waveActive) {
      // Start next wave after delay
      this.waveTimer += dt;
      if (this.waveTimer >= this.waveDelay) {
        this.startWave();
      }
    } else {
      // Spawn enemies during active wave
      this.spawnTimer += dt;
      if (this.spawnTimer >= this.spawnDelay && this.enemiesSpawned < this.enemiesPerWave) {
        this.spawnEnemy();
        this.spawnTimer = 0;
        this.enemiesSpawned++;
      }
      
      // End wave when all enemies spawned
      if (this.enemiesSpawned >= this.enemiesPerWave) {
        this.waveActive = false;
        this.enemiesSpawned = 0;
        this.waveTimer = 0;
      }
    }
  }

  startWave() {
    this.state.wave++;
    this.waveActive = true;
    
    // Check if this is a boss wave (every 10th wave)
    const isBossWave = this.state.wave % 10 === 0;
    
    if (isBossWave) {
      // Boss waves have fewer but stronger enemies
      this.enemiesPerWave = 1 + Math.floor(this.state.wave / 20); // 1 boss + some regular enemies
      this.spawnDelay = 3; // Longer delay for boss waves
    } else {
      // Regular waves scale up
      this.enemiesPerWave = 5 + Math.floor(this.state.wave / 2);
      this.spawnDelay = Math.max(0.3, 1 - (this.state.wave - 1) * 0.05);
    }
    
    this._notifyState();
  }

  spawnEnemy() {
    if (!this.map || !this.map.path.length) return;

    const wave = this.state.wave;
    const isBossWave = wave % 10 === 0;
    let enemy;

    if (isBossWave && this.enemiesSpawned === 0) {
      // First enemy in boss wave is always a boss
      const bossTypes = ['shield-regen', 'spawner', 'armored', 'phase'];
      const bossType = bossTypes[Math.floor(wave / 10) % bossTypes.length];
      enemy = createBossEnemy(bossType, wave, this.map.path, this.gridSize);
    } else if (isBossWave) {
      // Remaining enemies in boss wave are special types
      const specialTypes = ['camo', 'split', 'healer', 'flying'];
      const specialType = specialTypes[Math.floor(Math.random() * specialTypes.length)];
      enemy = createSpecialEnemy(specialType, wave, this.map.path, this.gridSize);
    } else {
      // Regular wave with mixed enemy types
      enemy = this.spawnRegularWaveEnemy(wave);
    }

    this.enemies.push(enemy);
  }

  spawnRegularWaveEnemy(wave) {
    // Introduce special enemies gradually
    let enemyType = 'basic';
    const rand = Math.random();

    if (wave >= 15) {
      // Late game: all enemy types possible
      const allTypes = ['basic', 'fast', 'tank', 'flying', 'camo', 'split', 'healer', 'swarm'];
      enemyType = allTypes[Math.floor(Math.random() * allTypes.length)];
    } else if (wave >= 12) {
      // Mid-late game: introduce swarm and healer
      if (rand < 0.15) enemyType = 'swarm';
      else if (rand < 0.25) enemyType = 'healer';
      else if (rand < 0.4) enemyType = 'camo';
      else if (rand < 0.55) enemyType = 'split';
      else if (rand < 0.7) enemyType = 'flying';
      else if (rand < 0.85) enemyType = 'fast';
      else enemyType = 'tank';
    } else if (wave >= 8) {
      // Mid game: introduce camo and split
      if (rand < 0.2) enemyType = 'camo';
      else if (rand < 0.35) enemyType = 'split';
      else if (rand < 0.55) enemyType = 'flying';
      else if (rand < 0.75) enemyType = 'fast';
      else enemyType = 'tank';
    } else if (wave >= 5) {
      // Early-mid game: basic enemy types
      if (rand < 0.3) enemyType = 'flying';
      else if (rand < 0.6) enemyType = 'fast';
      else enemyType = 'tank';
    } else if (wave >= 3) {
      // Early game: fast enemies
      if (rand < 0.4) enemyType = 'fast';
      else enemyType = 'basic';
    }

    // Check if we should spawn special enemies
    if (['camo', 'split', 'healer', 'swarm'].includes(enemyType)) {
      return createSpecialEnemy(enemyType, wave, this.map.path, this.gridSize);
    } else {
      return createEnemy(enemyType, this.map.path, wave, this.gridSize);
    }
  }

  handleEnemyDeath(enemy) {
    // Handle special enemy death effects
    if (enemy.onDeath) {
      enemy.onDeath(this);
    }
    
    // Handle special enemy types with death effects
    if (enemy.type === 'split') {
      // Split enemies spawn smaller versions when killed
      const splitCount = enemy.splitCount || 2;
      for (let i = 0; i < splitCount; i++) {
        const splitEnemy = createEnemy('fast', this.map.path, this.currentWave, this.gridSize);
        splitEnemy.x = enemy.x;
        splitEnemy.y = enemy.y;
        splitEnemy.pathIndex = enemy.pathIndex;
        splitEnemy.health *= 0.5; // Half health
        splitEnemy.maxHealth *= 0.5;
        splitEnemy.reward = Math.floor(enemy.reward * 0.3); // Reduced reward
        splitEnemy.size *= 0.7; // Smaller size
        this.enemies.push(splitEnemy);
      }
    }
  }

  // Check if a tile is buildable (grass, not path, no existing tower)
  canBuildAt(x, y) {
    if (!this.map || x < 0 || y < 0 || x >= this.map.width || y >= this.map.height) {
      return false;
    }
    
    // Can't build on path tiles
    if (this.map.tiles[y][x] === 1) {
      return false;
    }
    
    // Can't build where tower already exists
    return !this.towers.some(tower => tower.x === x && tower.y === y);
  }

  // Place a tower at the given grid coordinates
  placeTower(x, y) {
    let tower;
    
    // Create tower based on selected type
    switch (this.selectedTowerType) {
      case 'sniper':
        tower = new SniperTower(x, y, this.gridSize);
        break;
      case 'cannon':
        tower = new CannonTower(x, y, this.gridSize);
        break;
      case 'laser':
        tower = new LaserTower(x, y, this.gridSize);
        break;
      // Elemental towers
      case 'fire':
        tower = new FireTower(x, y, this.gridSize);
        break;
      case 'ice':
        tower = new IceTower(x, y, this.gridSize);
        break;
      case 'poison':
        tower = new PoisonTower(x, y, this.gridSize);
        break;
      case 'lightning':
        tower = new LightningTower(x, y, this.gridSize);
        break;
      // Support towers
      case 'amplifier':
        tower = new AmplifierTower(x, y, this.gridSize);
        break;
      default:
        tower = new BasicTower(x, y, this.gridSize);
    }
    
    if (!this.canBuildAt(x, y)) {
      return false; // Can't build here
    }

    if (this.state.money < tower.cost) {
      return false; // Not enough money
    }

    this.state.money -= tower.cost;
    this.towers.push(tower);
    this._notifyState();
    return true;
  }

  // Method for towers to create projectiles with special effects
  createProjectile(startX, startY, target, damage, speed = 300, special = null, specialData = null) {
    const projectile = new Projectile(startX, startY, target, damage, speed, special, specialData);
    
    // Apply special properties for backward compatibility
    if (special && specialData) {
      // Handle special projectile types
      if (special === 'splash') {
        projectile.splashRadius = specialData.radius || 2;
        projectile.type = 'cannon';
      } else if (special === 'pierce') {
        projectile.type = 'laser';
      }
    }
    
    this.projectiles.push(projectile);
    return projectile;
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.map) {
      renderMap(ctx, this.map, this.gridSize);
    }
    
    // Render towers
    this.towers.forEach(tower => {
      const showRange = this.hoverCell && tower.x === this.hoverCell.x && tower.y === this.hoverCell.y;
      tower.render(ctx, showRange);
    });
    
    // Render projectiles
    this.projectiles.forEach(projectile => projectile.render(ctx));
    
    // Render enemies
    this.enemies.forEach(enemy => enemy.render(ctx));
    
    // Hover highlight - show build preview or tower range
    if (this.hoverCell) {
      const { x, y } = this.hoverCell;
      ctx.save();
      
      if (this.canBuildAt(x, y)) {
        // Green highlight for buildable
        ctx.strokeStyle = 'rgba(100, 255, 100, 0.8)';
        ctx.fillStyle = 'rgba(100, 255, 100, 0.15)';
        ctx.fillRect(x * this.gridSize + 1, y * this.gridSize + 1, this.gridSize - 2, this.gridSize - 2);
        
        // Add a center dot to show exact position
        ctx.fillStyle = 'rgba(100, 255, 100, 0.6)';
        ctx.beginPath();
        ctx.arc(x * this.gridSize + this.gridSize/2, y * this.gridSize + this.gridSize/2, 4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Red highlight for non-buildable
        ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)';
        ctx.fillStyle = 'rgba(255, 100, 100, 0.15)';
        ctx.fillRect(x * this.gridSize + 1, y * this.gridSize + 1, this.gridSize - 2, this.gridSize - 2);
      }
      
      ctx.lineWidth = 2;
      ctx.strokeRect(x * this.gridSize + 1, y * this.gridSize + 1, this.gridSize - 2, this.gridSize - 2);
      
      ctx.restore();
    }
  }

  _anim(time) {
    if (!this.running) return;
    const frameTime = time - this.lastTime;
    this.lastTime = time;
    if (!this.paused) {
      this.accumulator += frameTime;
      while (this.accumulator >= this.dt) {
        this.update(this.dt / 1000);
        this.accumulator -= this.dt;
      }
      this.render();
    }
    requestAnimationFrame(this._anim);
  }

  // Tower selection methods
  selectTowerType(type) {
    this.selectedTowerType = type;
  }

  getTowerInfo(type) {
    // Use the centralized tower info from towerUpgrades.js
    return getTowerInfo(type);
  }
}
