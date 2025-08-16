// Boss enemies and special enemy types
// These provide unique challenges and require different strategies to defeat

import { Enemy } from './enemy.js';
import { FlyingEnemy } from './enemyTypes.js';

// ====== BOSS ENEMIES ======

export class ShieldRegeneratorBoss extends Enemy {
  constructor(path, wave, gridSize) {
    super(path, wave, gridSize);
    this.type = 'shield-boss';
    this.isBoss = true;
    this.size = 20;
    this.health = 800 + (wave * 100);
    this.maxHealth = this.health;
    this.shields = 400 + (wave * 50);
    this.maxShields = this.shields;
    this.speed = 1.2;
    this.baseSpeed = 1.2;
    this.armor = 0.3; // 30% damage reduction
    this.reward = 100 + (wave * 10);
    this.color = { primary: '#4c1d95', secondary: '#312e81' };
    
    // Enable shield regeneration
    this.abilities.shieldRegen = {
      active: true,
      rate: 20 + wave * 2,
      interval: 1.5,
      lastRegen: 0
    };
  }
  
  render(ctx) {
    super.render(ctx);
    
    // Extra shield visual effect
    if (this.shields > 0) {
      ctx.save();
      const time = Date.now() * 0.01;
      ctx.globalAlpha = 0.4 + Math.sin(time) * 0.2;
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size + 8 + Math.sin(time * 2) * 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}

export class MinionSpawnerBoss extends Enemy {
  constructor(path, wave, gridSize) {
    super(path, wave, gridSize);
    this.type = 'spawner-boss';
    this.isBoss = true;
    this.size = 18;
    this.health = 600 + (wave * 80);
    this.maxHealth = this.health;
    this.speed = 1.0;
    this.baseSpeed = 1.0;
    this.armor = 0.2; // 20% damage reduction
    this.reward = 120 + (wave * 12);
    this.color = { primary: '#7c2d12', secondary: '#991b1b' };
    
    // Enable minion spawning
    this.abilities.minionsSpawn = {
      active: true,
      interval: 4 - Math.min(wave * 0.1, 2), // Faster spawning with higher waves
      lastSpawn: 0,
      maxMinions: 2 + Math.floor(wave / 5)
    };
  }
  
  render(ctx) {
    super.render(ctx);
    
    // Spawning energy effect
    const time = Date.now() * 0.01;
    ctx.save();
    ctx.globalAlpha = 0.6;
    
    for (let i = 0; i < 3; i++) {
      const angle = time + (i * Math.PI * 2 / 3);
      const radius = 25 + Math.sin(time * 2) * 5;
      const x = this.x + Math.cos(angle) * radius;
      const y = this.y + Math.sin(angle) * radius;
      
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export class ArmoredBoss extends Enemy {
  constructor(path, wave, gridSize) {
    super(path, wave, gridSize);
    this.type = 'armored-boss';
    this.isBoss = true;
    this.size = 22;
    this.health = 1200 + (wave * 150);
    this.maxHealth = this.health;
    this.speed = 0.8;
    this.baseSpeed = 0.8;
    this.armor = 0.5; // 50% damage reduction
    this.reward = 150 + (wave * 15);
    this.color = { primary: '#374151', secondary: '#111827' };
    
    // Partially immune to slows
    this.slowImmunity = 0.6; // 60% slow resistance
  }
  
  applyStatusEffect(effect, duration, potency = 1) {
    // Reduce slow effects
    if (effect === 'slow' || effect === 'freeze') {
      potency *= (1 - this.slowImmunity);
      duration *= (1 - this.slowImmunity);
    }
    super.applyStatusEffect(effect, duration, potency);
  }
  
  render(ctx) {
    super.render(ctx);
    
    // Armor plating visual
    ctx.save();
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 3;
    const segments = 8;
    for (let i = 0; i < segments; i++) {
      const angle = (i * Math.PI * 2) / segments;
      const x1 = this.x + Math.cos(angle) * (this.size - 2);
      const y1 = this.y + Math.sin(angle) * (this.size - 2);
      const x2 = this.x + Math.cos(angle) * (this.size + 2);
      const y2 = this.y + Math.sin(angle) * (this.size + 2);
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

export class PhaseChangeBoss extends Enemy {
  constructor(path, wave, gridSize) {
    super(path, wave, gridSize);
    this.type = 'phase-boss';
    this.isBoss = true;
    this.size = 16;
    this.health = 900 + (wave * 120);
    this.maxHealth = this.health;
    this.speed = 1.5;
    this.baseSpeed = 1.5;
    this.reward = 180 + (wave * 18);
    this.color = { primary: '#059669', secondary: '#047857' };
    
    this.phase = 1;
    this.maxPhases = 3;
  }
  
  takeDamage(amount, damageType = 'normal') {
    const killed = super.takeDamage(amount, damageType);
    
    // Check for phase change
    const healthPercent = this.health / this.maxHealth;
    const newPhase = Math.ceil(healthPercent * this.maxPhases);
    
    if (newPhase !== this.phase && newPhase >= 1) {
      this.changePhase(newPhase);
    }
    
    return killed;
  }
  
  changePhase(newPhase) {
    this.phase = newPhase;
    
    switch (this.phase) {
      case 3: // Healthy - normal behavior
        this.speed = this.baseSpeed;
        this.color = { primary: '#059669', secondary: '#047857' };
        break;
        
      case 2: // Wounded - faster and spawns minions
        this.speed = this.baseSpeed * 1.5;
        this.color = { primary: '#dc2626', secondary: '#991b1b' };
        this.abilities.minionsSpawn = {
          active: true,
          interval: 6,
          lastSpawn: 0,
          maxMinions: 2
        };
        break;
        
      case 1: // Critical - very fast with regeneration
        this.speed = this.baseSpeed * 2;
        this.color = { primary: '#7c3aed', secondary: '#5b21b6' };
        this.abilities.regeneration = {
          active: true,
          rate: 15,
          interval: 1,
          lastHeal: 0
        };
        break;
    }
  }
  
  render(ctx) {
    super.render(ctx);
    
    // Phase indicator
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Phase ${this.phase}`, this.x, this.y + this.size + 20);
    ctx.restore();
  }
}

// ====== SPECIAL ENEMY TYPES ======

export class CamoEnemy extends Enemy {
  constructor(path, wave, gridSize) {
    super(path, wave, gridSize);
    this.type = 'camo';
    this.health = 80 + (wave * 15);
    this.maxHealth = this.health;
    this.speed = 2.5;
    this.baseSpeed = 2.5;
    this.reward = 15 + wave;
    this.color = { primary: '#6b7280', secondary: '#374151' };
    this.isCamouflaged = true;
  }
  
  render(ctx) {
    // Only render if detected
    if (this.isDetected) {
      super.render(ctx);
    } else {
      // Show very faint outline
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.strokeStyle = '#6b7280';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }
}

export class SplitEnemy extends Enemy {
  constructor(path, wave, gridSize, isSplit = false) {
    super(path, wave, gridSize);
    this.type = isSplit ? 'split-mini' : 'split';
    this.health = isSplit ? 30 + (wave * 5) : 120 + (wave * 20);
    this.maxHealth = this.health;
    this.speed = isSplit ? 3.5 : 1.8;
    this.baseSpeed = this.speed;
    this.size = isSplit ? 8 : 14;
    this.reward = isSplit ? 5 + Math.floor(wave/2) : 25 + (wave * 2);
    this.color = { primary: '#f59e0b', secondary: '#d97706' };
    
    this.isSplit = isSplit;
    this.splitCount = isSplit ? 0 : 2; // Split enemies don't split further
  }
  
  takeDamage(amount, damageType = 'normal') {
    const killed = super.takeDamage(amount, damageType);
    
    if (killed && !this.isSplit && this.splitCount > 0) {
      // Spawn split enemies
      this.spawnSplits();
    }
    
    return killed;
  }
  
  spawnSplits() {
    // This will be called by the game when the enemy dies
    this.shouldSplit = true;
  }
}

export class HealerEnemy extends Enemy {
  constructor(path, wave, gridSize) {
    super(path, wave, gridSize);
    this.type = 'healer';
    this.health = 100 + (wave * 18);
    this.maxHealth = this.health;
    this.speed = 1.5;
    this.baseSpeed = 1.5;
    this.reward = 30 + (wave * 3);
    this.color = { primary: '#10b981', secondary: '#059669' };
    
    // Enable healing ability
    this.abilities.heal = {
      active: true,
      range: 80,
      rate: 8 + wave,
      interval: 2,
      lastHeal: 0
    };
  }
  
  render(ctx) {
    super.render(ctx);
    
    // Healing aura effect
    const time = Date.now() * 0.01;
    ctx.save();
    ctx.globalAlpha = 0.3 + Math.sin(time * 2) * 0.2;
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.abilities.heal.range, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
}

export class SwarmEnemy extends Enemy {
  constructor(path, wave, gridSize) {
    super(path, wave, gridSize);
    this.type = 'swarm';
    this.health = 20 + (wave * 3);
    this.maxHealth = this.health;
    this.speed = 4.0;
    this.baseSpeed = 4.0;
    this.size = 6;
    this.reward = 3 + Math.floor(wave/2);
    this.color = { primary: '#8b5cf6', secondary: '#7c3aed' };
  }
}

export class MinionEnemy extends Enemy {
  constructor(path, wave, gridSize) {
    super(path, wave, gridSize);
    this.type = 'minion';
    this.health = 25 + (wave * 4);
    this.maxHealth = this.health;
    this.speed = 3.2;
    this.baseSpeed = 3.2;
    this.size = 8;
    this.reward = 5 + Math.floor(wave/3);
    this.color = { primary: '#f97316', secondary: '#ea580c' };
  }
}

// Factory functions to create enemies
export function createBossEnemy(wave, path, gridSize) {
  // Rotate between different boss types
  const bossTypes = [
    'shield-regen',
    'minion-spawner', 
    'phase-change',
    'armored'
  ];
  
  const bossIndex = Math.floor((wave / 10 - 1) % bossTypes.length);
  const bossType = bossTypes[bossIndex];
  
  switch (bossType) {
    case 'shield-regen':
      return new ShieldRegeneratorBoss(path, wave, gridSize);
    case 'minion-spawner':
      return new MinionSpawnerBoss(path, wave, gridSize);
    case 'phase-change':
      return new PhaseChangeBoss(path, wave, gridSize);
    case 'armored':
      return new ArmoredBoss(path, wave, gridSize);
    default:
      return new ShieldRegeneratorBoss(path, wave, gridSize);
  }
}

export function createSpecialEnemy(enemyType, wave, path, gridSize) {
  switch (enemyType) {
    case 'camo':
      return new CamoEnemy(path, wave, gridSize);
    case 'split':
      return new SplitEnemy(path, wave, gridSize, false);
    case 'split-mini':
      return new SplitEnemy(path, wave, gridSize, true);
    case 'healer':
      return new HealerEnemy(path, wave, gridSize);
    case 'swarm':
      return new SwarmEnemy(path, wave, gridSize);
    case 'flying':
      return new FlyingEnemy(path, wave, gridSize);
    case 'minion':
      return new MinionEnemy(path, wave, gridSize);
    default:
      return new Enemy(path, wave, gridSize);
  }
}
