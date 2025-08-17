import { Tower } from './tower.js';

export class BasicTower extends Tower {
  constructor(x, y, gridSize) {
    super(x, y, gridSize);
    this.type = 'basic';
    this.range = 2.5;
    this.damage = 50;
    this.fireRate = 1.2;
    this.cost = 50;
    this.projectileSpeed = 300;
    this.color = { base: '#4a5568', barrel: '#2d3748' };
  }

  render(ctx, showRange = false, themeColors = null) {
    this._renderTower(ctx, showRange, this.color, themeColors);
  }
}

// ====== ELEMENTAL TOWERS ======

export class FireTower extends Tower {
  constructor(x, y, gridSize) {
    super(x, y, gridSize);
    this.type = 'fire';
    this.range = 2.8;
    this.damage = 70;
    this.fireRate = 1.5;
    this.cost = 110;
    this.projectileSpeed = 280;
    this.color = { base: '#dc2626', barrel: '#ef4444' };
    this.special = 'burn';
  }

  render(ctx, showRange = false, themeColors = null) {
    this._renderTower(ctx, showRange, this.color, themeColors);
    // Add flame effect
    ctx.save();
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    const time = Date.now() * 0.01;
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2 / 3) + time;
      const radius = 8 + Math.sin(time + i) * 2;
      const x = this.centerX + Math.cos(angle) * radius;
      const y = this.centerY + Math.sin(angle) * radius;
      ctx.arc(x, y, 2, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.restore();
  }
}

export class IceTower extends Tower {
  constructor(x, y, gridSize) {
    super(x, y, gridSize);
    this.type = 'ice';
    this.range = 3.0;
    this.damage = 60;
    this.fireRate = 1.2;
    this.cost = 105;
    this.projectileSpeed = 250;
    this.color = { base: '#0284c7', barrel: '#0ea5e9' };
    this.special = 'freeze';
  }

  render(ctx, showRange = false, themeColors = null) {
    this._renderTower(ctx, showRange, this.color, themeColors);
    // Add ice crystals
    ctx.save();
    ctx.strokeStyle = '#7dd3fc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const points = 6;
    for (let i = 0; i < points; i++) {
      const angle = (i * Math.PI * 2) / points;
      const x1 = this.centerX + Math.cos(angle) * 8;
      const y1 = this.centerY + Math.sin(angle) * 8;
      const x2 = this.centerX + Math.cos(angle + Math.PI) * 4;
      const y2 = this.centerY + Math.sin(angle + Math.PI) * 4;
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    ctx.stroke();
    ctx.restore();
  }
}

export class PoisonTower extends Tower {
  constructor(x, y, gridSize) {
    super(x, y, gridSize);
    this.type = 'poison';
    this.range = 2.5;
    this.damage = 50;
    this.fireRate = 1.0;
    this.cost = 95;
    this.projectileSpeed = 200;
    this.color = { base: '#16a34a', barrel: '#22c55e' };
    this.special = 'poison';
  }

  render(ctx, showRange = false, themeColors = null) {
    this._renderTower(ctx, showRange, this.color, themeColors);
    // Add poison bubbles
    ctx.save();
    ctx.fillStyle = 'rgba(34, 197, 94, 0.6)';
    const time = Date.now() * 0.005;
    for (let i = 0; i < 4; i++) {
      const angle = time + i * Math.PI / 2;
      const radius = 6 + Math.sin(time * 2 + i) * 3;
      const x = this.centerX + Math.cos(angle) * radius;
      const y = this.centerY + Math.sin(angle) * radius;
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export class LightningTower extends Tower {
  constructor(x, y, gridSize) {
    super(x, y, gridSize);
    this.type = 'lightning';
    this.range = 3.2;
    this.damage = 85;
    this.fireRate = 1.3;
    this.cost = 125;
    this.projectileSpeed = 500;
    this.color = { base: '#7c3aed', barrel: '#8b5cf6' };
    this.special = 'chain';
  }

  render(ctx, showRange = false, themeColors = null) {
    this._renderTower(ctx, showRange, this.color, themeColors);
    // Add electric effect
    if (this.target && Math.random() < 0.3) {
      ctx.save();
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 1;
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 5;
      ctx.beginPath();
      // Draw lightning bolt
      const steps = 5;
      let currentX = this.centerX;
      let currentY = this.centerY;
      ctx.moveTo(currentX, currentY);
      
      for (let i = 0; i < steps; i++) {
        currentX += (Math.random() - 0.5) * 10;
        currentY += (Math.random() - 0.5) * 10;
        ctx.lineTo(currentX, currentY);
      }
      ctx.stroke();
      ctx.restore();
    }
  }
}

// ====== SUPPORT TOWERS ======

export class AmplifierTower extends Tower {
  constructor(x, y, gridSize) {
    super(x, y, gridSize);
    this.type = 'amplifier';
    this.range = 4.0;
    this.damage = 0; // Support tower
    this.fireRate = 0;
    this.cost = 120;
    this.color = { base: '#7c3aed', barrel: '#8b5cf6' };
    this.special = 'damageAura';
  }

  update(dt, enemies, game) {
    // Buff nearby towers
    this.buffNearbyTowers(game.towers);
  }

  buffNearbyTowers(towers) {
    towers.forEach(tower => {
      if (tower === this) return;
      
      const dx = tower.centerX - this.centerX;
      const dy = tower.centerY - this.centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= this.range * this.gridSize) {
        tower.damageMultiplier = Math.max(tower.damageMultiplier, 1.5);
      }
    });
  }

  render(ctx, showRange = false, themeColors = null) {
    this._renderTower(ctx, showRange, this.color, themeColors);
    // Draw aura effect
    ctx.save();
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.range * this.gridSize * 0.7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
}

// Advanced Basic Tower Upgrades
export class GuardTower extends Tower {
  constructor(x, y, gridSize) {
    super(x, y, gridSize);
    this.type = 'guard';
    this.range = 3.0;
    this.damage = 80;
    this.fireRate = 1.4;
    this.cost = 125; // 50 + 75 upgrade cost
    this.projectileSpeed = 320;
    this.color = { base: '#7c2d12', barrel: '#991b1b' };
    this.upgraded = true;
    this.upgradeType = 'guard';
    this.level = 2;
  }

  render(ctx, showRange = false, themeColors = null) {
    this._renderTower(ctx, showRange, this.color, themeColors);
    // Add armor plating visual
    ctx.save();
    ctx.strokeStyle = this.color.barrel;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

export class RapidTower extends Tower {
  constructor(x, y, gridSize) {
    super(x, y, gridSize);
    this.type = 'rapid';
    this.range = 2.8;
    this.damage = 35;
    this.fireRate = 2.5;
    this.cost = 120; // 50 + 70 upgrade cost
    this.projectileSpeed = 400;
    this.color = { base: '#1e40af', barrel: '#1d4ed8' };
    this.upgraded = true;
    this.upgradeType = 'rapid';
    this.level = 2;
  }

  render(ctx, showRange = false, themeColors = null) {
    this._renderTower(ctx, showRange, this.color, themeColors);
    // Add multiple barrels visual
    ctx.save();
    ctx.translate(this.centerX, this.centerY);
    if (this.target) {
      const angle = Math.atan2(this.target.y - this.centerY, this.target.x - this.centerX);
      ctx.rotate(angle);
    }
    
    ctx.fillStyle = this.color.barrel;
    // Draw three small barrels
    ctx.fillRect(8, -2, 12, 1.5);
    ctx.fillRect(8, 0.5, 12, 1.5);
    ctx.fillRect(8, -0.75, 10, 1.5);
    ctx.restore();
  }
}

export class SniperTower extends Tower {
  constructor(x, y, gridSize) {
    super(x, y, gridSize);
    this.type = 'sniper';
    this.range = 4.5; // longer range
    this.damage = 120; // high damage
    this.fireRate = 0.6; // slower fire rate
    this.cost = 100;
    this.projectileSpeed = 500; // faster projectiles
    this.color = { base: '#065f46', barrel: '#047857' };
  }

  render(ctx, showRange = false, themeColors = null) {
    this._renderTower(ctx, showRange, this.color, themeColors);
    
    // Draw sniper scope
    if (this.target && this.target.active) {
      ctx.save();
      ctx.strokeStyle = 'rgba(5, 150, 105, 0.6)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(this.centerX, this.centerY);
      ctx.lineTo(this.target.x, this.target.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }
}

// Advanced Sniper Tower Upgrades
export class RailgunTower extends Tower {
  constructor(x, y, gridSize) {
    super(x, y, gridSize);
    this.type = 'railgun';
    this.range = 6.0;
    this.damage = 200;
    this.fireRate = 0.4;
    this.cost = 250; // 100 + 150 upgrade cost
    this.projectileSpeed = 800;
    this.color = { base: '#581c87', barrel: '#6b21a8' };
    this.upgraded = true;
    this.upgradeType = 'railgun';
    this.level = 2;
    this.special = 'pierce';
  }

  render(ctx, showRange = false, themeColors = null) {
    this._renderTower(ctx, showRange, this.color, themeColors);
    // Add charging effect when about to shoot
    if (this.target && this.lastShot > 0.8 / this.fireRate) {
      ctx.save();
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#8b5cf6';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, 15, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}

export class AssassinTower extends Tower {
  constructor(x, y, gridSize) {
    super(x, y, gridSize);
    this.type = 'assassin';
    this.range = 4.8;
    this.damage = 150;
    this.fireRate = 0.8;
    this.cost = 230; // 100 + 130 upgrade cost
    this.projectileSpeed = 600;
    this.color = { base: '#374151', barrel: '#111827' };
    this.upgraded = true;
    this.upgradeType = 'assassin';
    this.level = 2;
    this.special = 'critical';
  }

  render(ctx, showRange = false, themeColors = null) {
    this._renderTower(ctx, showRange, this.color, themeColors);
    // Add stealth effect
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = 'rgba(75, 85, 99, 0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([1, 3]);
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
}

export class CannonTower extends Tower {
  constructor(x, y, gridSize) {
    super(x, y, gridSize);
    this.type = 'cannon';
    this.range = 2.8;
    this.damage = 80;
    this.fireRate = 0.8; // slower but powerful
    this.cost = 80;
    this.projectileSpeed = 250;
    this.splashRadius = 1.2; // area damage
    this.color = { base: '#7c2d12', barrel: '#991b1b' };
  }

  shoot(game) {
    if (this.target && game) {
      const projectile = game.createProjectile(this.centerX, this.centerY, this.target, this.damage, this.projectileSpeed);
      projectile.splashRadius = this.splashRadius;
      projectile.type = 'cannon';
    }
  }

  render(ctx, showRange = false, themeColors = null) {
    this._renderTower(ctx, showRange, this.color, themeColors);
    
    // Draw cannon as larger barrel
    if (this.target && this.target.active) {
      ctx.save();
      const dx = this.target.x - this.centerX;
      const dy = this.target.y - this.centerY;
      const angle = Math.atan2(dy, dx);
      
      ctx.translate(this.centerX, this.centerY);
      ctx.rotate(angle);
      
      // Draw larger cannon barrel
      const cannonGradient = ctx.createLinearGradient(0, -4, 0, 4);
      cannonGradient.addColorStop(0, '#dc2626');
      cannonGradient.addColorStop(1, '#7c2d12');
      
      ctx.fillStyle = cannonGradient;
      ctx.fillRect(-3, -4, 25, 8);
      
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(-3, -4, 25, 8);
      
      ctx.restore();
    }
  }
}

export class LaserTower extends Tower {
  constructor(x, y, gridSize) {
    super(x, y, gridSize);
    this.type = 'laser';
    this.range = 3.2;
    this.damage = 35;
    this.fireRate = 3; // very fast
    this.cost = 120;
    this.projectileSpeed = 600; // instant-like
    this.color = { base: '#4338ca', barrel: '#3730a3' };
  }

  shoot(game) {
    if (this.target && game) {
      const projectile = game.createProjectile(this.centerX, this.centerY, this.target, this.damage, this.projectileSpeed);
      projectile.type = 'laser';
    }
  }

  render(ctx, showRange = false, themeColors = null) {
    this._renderTower(ctx, showRange, this.color, themeColors);
    
    // Draw laser beam when shooting
    if (this.target && this.target.active && this.lastShot < 0.1) {
      ctx.save();
      ctx.strokeStyle = 'rgba(67, 56, 202, 0.8)';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#4338ca';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(this.centerX, this.centerY);
      ctx.lineTo(this.target.x, this.target.y);
      ctx.stroke();
      ctx.restore();
    }
  }
}

