export class Enemy {
  constructor(path, wave = 1, gridSize = 48) {
    this.path = path.map(([x, y]) => ({ x, y })); // Convert array format to object format
    this.pathIndex = 0;
    this.gridSize = gridSize;
    this.x = this.path[0].x * this.gridSize + this.gridSize / 2;
    this.y = this.path[0].y * this.gridSize + this.gridSize / 2;
    this.speed = 2; // cells per second
    this.baseSpeed = 2; // Original speed for calculations
    this.health = 100;
    this.maxHealth = 100;
    this.size = 12; // radius
    this.active = true;
    this.reward = 10;
    this.type = 'basic';
    this.wave = wave;
    this.color = { primary: '#dc2626', secondary: '#7f1d1d' };
    
    // Advanced mechanics
    this.armor = 0; // Damage reduction percentage (0-1)
    this.shields = 0; // Shield points that absorb damage first
    this.maxShields = 0;
    this.isFlying = false; // Flying enemies use different pathing
    this.isCamouflaged = false; // Camo enemies are invisible to most towers
    this.isDetected = false; // Whether camo enemy is revealed
    this.isBoss = false;
    
    // Status effects
    this.statusEffects = {
      burn: { active: false, duration: 0, damage: 0, interval: 0, lastTick: 0 },
      freeze: { active: false, duration: 0, slowAmount: 0 },
      poison: { active: false, duration: 0, damage: 0, interval: 0, lastTick: 0, stacks: 0 },
      slow: { active: false, duration: 0, slowAmount: 0 },
      stun: { active: false, duration: 0 }
    };
    
    // Special abilities
    this.abilities = {
      regeneration: { active: false, rate: 0, interval: 1, lastHeal: 0 },
      shieldRegen: { active: false, rate: 0, interval: 2, lastRegen: 0 },
      minionsSpawn: { active: false, interval: 5, lastSpawn: 0, maxMinions: 3 },
      split: { active: false, splitCount: 2, splitHealth: 0.5 },
      heal: { active: false, range: 100, rate: 10, interval: 2, lastHeal: 0 }
    };
    
    // Visual effects
    this.damageNumbers = []; // Floating damage numbers
    this.effects = []; // Visual effect particles
  }

  // Move towards the next waypoint in the path
  update(dt, game = null) {
    if (!this.active) return;

    // Update status effects first
    this.updateStatusEffects(dt, game);
    
    // Update special abilities
    this.updateAbilities(dt, game);
    
    // Update visual effects
    this.updateVisualEffects(dt);

    // Check if stunned - can't move
    if (this.statusEffects.stun.active) {
      return;
    }

    // Calculate current speed with slow effects
    let currentSpeed = this.baseSpeed;
    if (this.statusEffects.freeze.active) {
      currentSpeed *= (1 - this.statusEffects.freeze.slowAmount);
    }
    if (this.statusEffects.slow.active) {
      currentSpeed *= (1 - this.statusEffects.slow.slowAmount);
    }
    this.speed = Math.max(currentSpeed, 0.1); // Minimum speed

    // Movement logic
    if (this.pathIndex >= this.path.length - 1) {
      return;
    }

    const targetWaypoint = this.path[this.pathIndex + 1];
    const targetX = targetWaypoint.x * this.gridSize + this.gridSize / 2;
    const targetY = targetWaypoint.y * this.gridSize + this.gridSize / 2;

    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const moveDistance = this.speed * this.gridSize * dt;

    if (distance < moveDistance) {
      // Reached waypoint, snap to it and advance
      this.x = targetX;
      this.y = targetY;
      this.pathIndex++;
    } else {
      // Move towards waypoint
      this.x += (dx / distance) * moveDistance;
      this.y += (dy / distance) * moveDistance;
    }
  }

  // Take damage, returns true if killed
  takeDamage(amount, damageType = 'normal', game = null) {
    // Apply armor reduction
    let finalDamage = amount;
    if (this.armor > 0 && damageType !== 'true') {
      finalDamage = amount * (1 - this.armor);
    }

    // Apply to shields first
    if (this.shields > 0) {
      const shieldDamage = Math.min(finalDamage, this.shields);
      this.shields -= shieldDamage;
      finalDamage -= shieldDamage;
      
      // Show shield damage
      if (game && game.createDamageNumber) {
        game.createDamageNumber(this.x, this.y, shieldDamage, 'shield');
      }
    }

    // Apply remaining damage to health
    if (finalDamage > 0) {
      this.health -= finalDamage;
      if (game && game.createDamageNumber) {
        const isCritical = finalDamage > amount * 1.5; // Critical if 50% more than base
        const displayType = isCritical ? 'critical' : damageType;
        game.createDamageNumber(this.x, this.y, finalDamage, displayType);
      }
    }

    if (this.health <= 0) {
      this.active = false;
      return true;
    }
    return false;
  }

  // Apply status effect
  applyStatusEffect(effect, duration, potency = 1) {
    switch (effect) {
      case 'burn':
        this.statusEffects.burn = {
          active: true,
          duration: Math.max(duration, this.statusEffects.burn.duration),
          damage: potency * 10,
          interval: 0.5,
          lastTick: 0
        };
        break;
      
      case 'freeze':
        this.statusEffects.freeze = {
          active: true,
          duration: duration,
          slowAmount: Math.min(0.8, potency * 0.5) // Max 80% slow
        };
        break;
      
      case 'poison':
        const poison = this.statusEffects.poison;
        poison.active = true;
        poison.duration = Math.max(duration, poison.duration);
        poison.damage = potency * 5;
        poison.interval = 1;
        poison.stacks = Math.min(5, poison.stacks + 1); // Max 5 stacks
        break;
      
      case 'slow':
        this.statusEffects.slow = {
          active: true,
          duration: Math.max(duration, this.statusEffects.slow.duration),
          slowAmount: Math.min(0.7, potency * 0.3) // Max 70% slow
        };
        break;
      
      case 'stun':
        this.statusEffects.stun = {
          active: true,
          duration: duration
        };
        break;
    }
  }

  // Update status effects
  updateStatusEffects(dt, game = null) {
    // Burn damage over time
    const burn = this.statusEffects.burn;
    if (burn.active) {
      burn.lastTick += dt;
      if (burn.lastTick >= burn.interval) {
        this.takeDamage(burn.damage, 'burn', game);
        burn.lastTick = 0;
      }
      burn.duration -= dt;
      if (burn.duration <= 0) {
        burn.active = false;
      }
    }

    // Poison damage over time with stacks
    const poison = this.statusEffects.poison;
    if (poison.active) {
      poison.lastTick += dt;
      if (poison.lastTick >= poison.interval) {
        this.takeDamage(poison.damage * poison.stacks, 'poison', game);
        poison.lastTick = 0;
      }
      poison.duration -= dt;
      if (poison.duration <= 0) {
        poison.active = false;
        poison.stacks = 0;
      }
    }

    // Freeze and slow effects
    ['freeze', 'slow', 'stun'].forEach(effect => {
      const status = this.statusEffects[effect];
      if (status.active) {
        status.duration -= dt;
        if (status.duration <= 0) {
          status.active = false;
        }
      }
    });
  }

  // Update special abilities
  updateAbilities(dt, game) {
    // Health regeneration
    const regen = this.abilities.regeneration;
    if (regen.active) {
      regen.lastHeal += dt;
      if (regen.lastHeal >= regen.interval) {
        this.health = Math.min(this.maxHealth, this.health + regen.rate);
        regen.lastHeal = 0;
      }
    }

    // Shield regeneration
    const shieldRegen = this.abilities.shieldRegen;
    if (shieldRegen.active) {
      shieldRegen.lastRegen += dt;
      if (shieldRegen.lastRegen >= shieldRegen.interval) {
        this.shields = Math.min(this.maxShields, this.shields + shieldRegen.rate);
        shieldRegen.lastRegen = 0;
      }
    }

    // Minion spawning (for boss enemies)
    const minions = this.abilities.minionsSpawn;
    if (minions.active && game) {
      minions.lastSpawn += dt;
      if (minions.lastSpawn >= minions.interval) {
        this.spawnMinion(game);
        minions.lastSpawn = 0;
      }
    }

    // Heal nearby enemies
    const heal = this.abilities.heal;
    if (heal.active && game) {
      heal.lastHeal += dt;
      if (heal.lastHeal >= heal.interval) {
        this.healNearbyEnemies(game.enemies);
        heal.lastHeal = 0;
      }
    }
  }

  // Add floating damage number
  addDamageNumber(damage, type = 'normal') {
    this.damageNumbers.push({
      value: Math.round(damage),
      x: this.x + (Math.random() - 0.5) * 20,
      y: this.y - 10,
      life: 1.5,
      type: type
    });
  }

  // Update visual effects
  updateVisualEffects(dt) {
    // Update damage numbers
    this.damageNumbers = this.damageNumbers.filter(num => {
      num.life -= dt;
      num.y -= 50 * dt; // Float upward
      return num.life > 0;
    });
  }

  // Spawn minion (for boss enemies)
  spawnMinion(game) {
    // Count existing minions
    const minionCount = game.enemies.filter(e => e.type === 'minion').length;
    if (minionCount >= this.abilities.minionsSpawn.maxMinions) return;

    // Create minion directly without dynamic import
    const minion = game.createMinionEnemy(this.x, this.y, this.pathIndex);
    if (minion) {
      game.enemies.push(minion);
    }
  }

  // Heal nearby enemies (for healer enemies)
  healNearbyEnemies(enemies) {
    const healRange = this.abilities.heal.range;
    const healAmount = this.abilities.heal.rate;

    enemies.forEach(enemy => {
      if (enemy === this || !enemy.active) return;
      
      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= healRange) {
        enemy.health = Math.min(enemy.maxHealth, enemy.health + healAmount);
        enemy.addDamageNumber(healAmount, 'heal');
      }
    });
  }

  // Check if enemy can be targeted by towers
  canBeTargeted() {
    return !this.isCamouflaged || this.isDetected;
  }

  // Draw the enemy and its health bar
  render(ctx) {
    if (!this.active) return;

    // Don't render camo enemies unless detected
    if (this.isCamouflaged && !this.isDetected) return;

    this._renderEnemy(ctx, this.color);
    this._renderStatusEffects(ctx);
    this._renderDamageNumbers(ctx);
  }

  // Render status effect indicators
  _renderStatusEffects(ctx) {
    let iconX = this.x - this.size;
    const iconY = this.y - this.size - 25;
    const iconSize = 8;

    // Burn effect
    if (this.statusEffects.burn.active) {
      ctx.fillStyle = '#ff4444';
      ctx.font = '12px Arial';
      ctx.fillText('🔥', iconX, iconY);
      iconX += iconSize + 2;
    }

    // Freeze effect
    if (this.statusEffects.freeze.active) {
      ctx.fillStyle = '#4444ff';
      ctx.font = '12px Arial';
      ctx.fillText('❄️', iconX, iconY);
      iconX += iconSize + 2;
    }

    // Poison effect
    if (this.statusEffects.poison.active) {
      ctx.fillStyle = '#44ff44';
      ctx.font = '12px Arial';
      ctx.fillText('☣️', iconX, iconY);
      if (this.statusEffects.poison.stacks > 1) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px Arial';
        ctx.fillText(this.statusEffects.poison.stacks, iconX + 10, iconY - 5);
      }
      iconX += iconSize + 2;
    }

    // Slow effect
    if (this.statusEffects.slow.active) {
      ctx.fillStyle = '#ffff44';
      ctx.font = '12px Arial';
      ctx.fillText('🐌', iconX, iconY);
      iconX += iconSize + 2;
    }

    // Stun effect
    if (this.statusEffects.stun.active) {
      ctx.fillStyle = '#ff44ff';
      ctx.font = '12px Arial';
      ctx.fillText('⭐', iconX, iconY);
    }
  }

  // Render floating damage numbers
  _renderDamageNumbers(ctx) {
    this.damageNumbers.forEach(num => {
      ctx.save();
      ctx.globalAlpha = num.life / 1.5;
      
      let color = '#ffffff';
      switch (num.type) {
        case 'burn': color = '#ff6b47'; break;
        case 'poison': color = '#51cf66'; break;
        case 'shield': color = '#74c0fc'; break;
        case 'heal': color = '#69db7c'; break;
        case 'critical': color = '#ffd43b'; break;
      }
      
      ctx.fillStyle = color;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.font = `bold ${num.type === 'critical' ? '16' : '14'}px Arial`;
      ctx.strokeText(num.value, num.x, num.y);
      ctx.fillText(num.value, num.x, num.y);
      ctx.restore();
    });
  }

  // Base render method for enemy types to use
  _renderEnemy(ctx, color = { primary: '#dc2626', secondary: '#7f1d1d' }) {
    if (!this.active) return;

    // Draw shadow
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(this.x + 2, this.y + this.size + 2, this.size * 0.8, this.size * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw health bar background
    const barWidth = this.size * 2.2;
    const barHeight = 6;
    const barY = this.y - this.size - 12;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(this.x - barWidth / 2, barY, barWidth, barHeight);

    // Draw health bar foreground
    const healthPercent = this.health / this.maxHealth;
    let healthColor;
    if (healthPercent > 0.7) healthColor = '#3fb950';
    else if (healthPercent > 0.4) healthColor = '#fb8500';
    else if (healthPercent > 0.2) healthColor = '#fd7e14';
    else healthColor = '#f85149';

    ctx.fillStyle = healthColor;
    ctx.fillRect(this.x - barWidth / 2, barY, barWidth * healthPercent, barHeight);

    // Draw shield bar if shields exist
    if (this.maxShields > 0) {
      const shieldBarY = barY - 8;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(this.x - barWidth / 2, shieldBarY, barWidth, 4);
      
      const shieldPercent = this.shields / this.maxShields;
      ctx.fillStyle = '#74c0fc';
      ctx.fillRect(this.x - barWidth / 2, shieldBarY, barWidth * shieldPercent, 4);
    }

    // Health bar border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(this.x - barWidth / 2, barY, barWidth, barHeight);

    // Draw enemy body with gradient
    const gradient = ctx.createRadialGradient(this.x - 3, this.y - 3, 2, this.x, this.y, this.size);
    gradient.addColorStop(0, color.primary);
    gradient.addColorStop(0.7, color.secondary);
    gradient.addColorStop(1, '#1a202c');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();

    // Draw shield effect if shields are active
    if (this.shields > 0) {
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = '#74c0fc';
      ctx.lineWidth = 3;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size + 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Draw camo effect if camouflaged
    if (this.isCamouflaged) {
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = '#666666';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size + 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Draw enemy highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(this.x - this.size * 0.3, this.y - this.size * 0.3, this.size * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Draw enemy border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.stroke();

    // Draw boss indicator
    if (this.isBoss) {
      ctx.save();
      ctx.fillStyle = '#ffd43b';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('👑', this.x, this.y - this.size - 30);
      ctx.restore();
    }
  }
}
