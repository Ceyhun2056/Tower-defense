import { renderMap } from '../map/map.js';
import { Enemy } from '../entities/enemy.js';
import { Tower } from '../entities/tower.js';
import { BasicTower, SniperTower, CannonTower, LaserTower } from '../entities/towerTypes.js';
import { createEnemy } from '../entities/enemyTypes.js';
import { Projectile } from '../entities/projectile.js';

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
      enemy.update(dt);
      
      // Check if enemy reached the end
      if (enemy.pathIndex >= this.map.path.length - 1) {
        this.state.lives--;
        this.enemies.splice(i, 1);
        this._notifyState();
        continue;
      }
      
      // Remove dead enemies and give money
      if (!enemy.active) {
        this.state.money += enemy.reward;
        this.state.score += enemy.reward;
        this.enemiesKilled++;
        this.enemies.splice(i, 1);
        this._notifyState();
      }
    }
    
    // Update towers
    this.towers.forEach(tower => tower.update(dt, this.enemies, this));
    
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
    this.enemiesPerWave = 5 + Math.floor(this.state.wave / 2); // More enemies each wave
    
    // Decrease spawn delay progressively - faster spawning each wave
    this.spawnDelay = Math.max(0.3, 1 - (this.state.wave - 1) * 0.05); // Reduces by 0.05 seconds each wave, minimum 0.3s
    
    this._notifyState();
  }

  spawnEnemy() {
    if (this.map && this.map.path.length > 0) {
      // Determine enemy type based on wave
      let enemyType = 'basic';
      
      if (this.state.wave >= 3 && Math.random() < 0.3) {
        enemyType = 'fast';
      }
      if (this.state.wave >= 5 && Math.random() < 0.2) {
        enemyType = 'tank';
      }
      if (this.state.wave >= 7 && Math.random() < 0.15) {
        enemyType = 'flying';
      }
      
      // Mix enemy types in later waves
      if (this.state.wave >= 8) {
        const types = ['basic', 'fast', 'tank', 'flying'];
        enemyType = types[Math.floor(Math.random() * types.length)];
      }
      
      const enemy = createEnemy(enemyType, this.map.path, this.state.wave, this.gridSize);
      this.enemies.push(enemy);
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

  // Method for towers to create projectiles
  createProjectile(startX, startY, target, damage, speed = 300) {
    const projectile = new Projectile(startX, startY, target, damage, speed);
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
        ctx.strokeStyle = 'rgba(100, 255, 100, 0.6)';
        ctx.fillStyle = 'rgba(100, 255, 100, 0.1)';
        ctx.fillRect(x * this.gridSize + 1, y * this.gridSize + 1, this.gridSize - 2, this.gridSize - 2);
      } else {
        // Red highlight for non-buildable
        ctx.strokeStyle = 'rgba(255, 100, 100, 0.6)';
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
    const towerTypes = {
      basic: { name: 'Basic Tower', cost: 50, damage: 50, range: 2.5, rate: 1.2 },
      sniper: { name: 'Sniper Tower', cost: 100, damage: 120, range: 4.5, rate: 0.6 },
      cannon: { name: 'Cannon Tower', cost: 80, damage: 80, range: 2.8, rate: 0.8 },
      laser: { name: 'Laser Tower', cost: 120, damage: 35, range: 3.2, rate: 3.0 }
    };
    return towerTypes[type] || towerTypes.basic;
  }
}
