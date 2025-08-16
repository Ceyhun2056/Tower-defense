export class Projectile {
  constructor(startX, startY, target, damage, speed = 300, special = null, specialData = null) {
    this.x = startX;
    this.y = startY;
    this.target = target;
    this.damage = damage;
    this.speed = speed; // pixels per second (increased for better hit rate)
    this.size = 4; // radius (slightly larger for better collision)
    this.active = true;
    this.hasHit = false;
    this.type = 'basic'; // default projectile type
    this.splashRadius = 0; // for cannon-type projectiles
    this.special = special; // Special effect type (pierce, chain, burn, freeze, etc.)
    this.specialData = specialData || {}; // Additional data for special effects
    this.piercedEnemies = []; // Track pierced enemies for pierce effect
    this.chainTargets = []; // Track chain targets
    
    // Calculate predictive targeting - aim where the enemy will be
    if (target && target.active) {
      // Predict where enemy will be when projectile reaches it
      const timeToReach = this.calculateInterceptTime(startX, startY, target);
      const predictedX = target.x + (target.path && target.pathIndex < target.path.length - 1 ? 
        this.predictEnemyPosition(target, timeToReach).x - target.x : 0);
      const predictedY = target.y + (target.path && target.pathIndex < target.path.length - 1 ? 
        this.predictEnemyPosition(target, timeToReach).y - target.y : 0);
      
      const dx = predictedX - startX;
      const dy = predictedY - startY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        this.velocityX = (dx / distance) * speed;
        this.velocityY = (dy / distance) * speed;
      } else {
        this.velocityX = 0;
        this.velocityY = 0;
      }
    }
  }

  calculateInterceptTime(startX, startY, target) {
    const dx = target.x - startX;
    const dy = target.y - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance / this.speed;
  }

  predictEnemyPosition(enemy, timeAhead) {
    // Simple prediction: assume enemy continues at current speed
    const moveDistance = enemy.speed * enemy.gridSize * timeAhead;
    
    if (!enemy.path || enemy.pathIndex >= enemy.path.length - 1) {
      return { x: enemy.x, y: enemy.y };
    }

    // Calculate position along path after time
    let remainingDistance = moveDistance;
    let currentIndex = enemy.pathIndex;
    let currentX = enemy.x;
    let currentY = enemy.y;

    while (remainingDistance > 0 && currentIndex < enemy.path.length - 1) {
      const nextWaypoint = enemy.path[currentIndex + 1];
      const targetX = nextWaypoint.x * enemy.gridSize + enemy.gridSize / 2;
      const targetY = nextWaypoint.y * enemy.gridSize + enemy.gridSize / 2;
      
      const segmentDx = targetX - currentX;
      const segmentDy = targetY - currentY;
      const segmentDistance = Math.sqrt(segmentDx * segmentDx + segmentDy * segmentDy);
      
      if (remainingDistance >= segmentDistance) {
        // Move to next waypoint
        currentX = targetX;
        currentY = targetY;
        remainingDistance -= segmentDistance;
        currentIndex++;
      } else {
        // Partial movement along current segment
        const ratio = remainingDistance / segmentDistance;
        currentX += segmentDx * ratio;
        currentY += segmentDy * ratio;
        remainingDistance = 0;
      }
    }

    return { x: currentX, y: currentY };
  }

  update(dt, game = null) {
    if (!this.active || this.hasHit) return;

    // Update position
    this.x += this.velocityX * dt;
    this.y += this.velocityY * dt;

    // Check collision with target - use larger collision radius for more forgiving hits
    if (this.target && this.target.active) {
      // For pierce projectiles, check if we've already hit this enemy
      if (this.special === 'pierce' && this.piercedEnemies.includes(this.target)) {
        // Find new target for pierce projectile
        this.findNewPierceTarget(game);
      } else {
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // More generous collision detection
        const collisionRadius = this.target.size + this.size + 2;
        if (distance < collisionRadius) {
          this.hit(game);
          return;
        }
      }
    } else if (this.special === 'pierce' && game) {
      // Pierce projectile lost its target, find a new one
      this.findNewPierceTarget(game);
    }

    // Remove if too far off screen (prevent memory leaks)
    if (this.x < -100 || this.x > 2000 || this.y < -100 || this.y > 2000) {
      this.active = false;
    }
  }

  hit(game = null) {
    if (this.hasHit && this.special !== 'pierce') return;
    
    // Apply damage to target
    if (this.target && this.target.active) {
      // Handle special effects
      this.applySpecialEffects(this.target, game);
      
      // Apply damage
      this.target.takeDamage(this.damage);
      
      // For pierce projectiles, track hit enemies but don't deactivate
      if (this.special === 'pierce') {
        this.piercedEnemies.push(this.target);
        const maxPierces = this.specialData.pierceCount || 3;
        if (this.piercedEnemies.length >= maxPierces) {
          this.hasHit = true;
          this.active = false;
        }
        return; // Don't deactivate yet
      }
    }
    
    this.hasHit = true;
    this.active = false;
    
    // Handle splash damage for cannon projectiles
    if (this.splashRadius > 0 && game) {
      game.enemies.forEach(enemy => {
        if (enemy !== this.target && enemy.active) {
          const dx = enemy.x - this.x;
          const dy = enemy.y - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance <= this.splashRadius * game.gridSize) {
            // Splash damage decreases with distance
            const splashDamage = Math.floor(this.damage * 0.6 * (1 - distance / (this.splashRadius * game.gridSize)));
            if (splashDamage > 0) {
              enemy.takeDamage(splashDamage);
              // Apply special effects to splash targets too
              this.applySpecialEffects(enemy, game);
            }
          }
        }
      });
    }
    
    // Handle chain lightning effect
    if (this.special === 'chain' && game) {
      this.handleChainEffect(game);
    }
  }

  applySpecialEffects(enemy, game) {
    if (!this.special || !enemy.active) return;
    
    switch (this.special) {
      case 'burn':
        enemy.applyStatusEffect('burn', this.specialData.duration || 3, this.specialData.damagePerSecond || 5);
        break;
      case 'freeze':
        enemy.applyStatusEffect('freeze', this.specialData.duration || 2, this.specialData.slowAmount || 0.5);
        break;
      case 'poison':
        enemy.applyStatusEffect('poison', this.specialData.duration || 4, this.specialData.damagePerSecond || 3);
        break;
      case 'slow':
        enemy.applyStatusEffect('slow', this.specialData.duration || 3, this.specialData.slowAmount || 0.3);
        break;
      case 'stun':
        enemy.applyStatusEffect('stun', this.specialData.duration || 1);
        break;
    }
  }

  handleChainEffect(game) {
    const chainRange = this.specialData.chainRange || 100;
    const chainCount = this.specialData.chainCount || 2;
    const damageReduction = this.specialData.damageReduction || 0.8;
    
    let currentTarget = this.target;
    let currentDamage = this.damage * damageReduction;
    
    for (let i = 0; i < chainCount && currentTarget; i++) {
      // Find nearest enemy within chain range
      let nearestEnemy = null;
      let nearestDistance = Infinity;
      
      game.enemies.forEach(enemy => {
        if (enemy !== currentTarget && enemy.active && !this.chainTargets.includes(enemy)) {
          const dx = enemy.x - currentTarget.x;
          const dy = enemy.y - currentTarget.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance <= chainRange && distance < nearestDistance) {
            nearestDistance = distance;
            nearestEnemy = enemy;
          }
        }
      });
      
      if (nearestEnemy) {
        this.chainTargets.push(nearestEnemy);
        nearestEnemy.takeDamage(Math.floor(currentDamage));
        this.applySpecialEffects(nearestEnemy, game);
        currentTarget = nearestEnemy;
        currentDamage *= damageReduction;
      } else {
        break;
      }
    }
  }

  render(ctx) {
    if (!this.active) return;

    // Draw projectile with better visuals
    const glowSize = this.size * 1.5;
    
    // Outer glow
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#ffdd44';
    ctx.beginPath();
    ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Different projectile visuals based on type
    switch (this.type) {
      case 'cannon':
        // Cannon projectile - larger, darker
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#fca5a5';
        ctx.beginPath();
        ctx.arc(this.x - this.size * 0.4, this.y - this.size * 0.4, this.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'laser':
        // Laser projectile - bright blue with strong glow
        ctx.save();
        ctx.shadowColor = '#4338ca';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#4338ca';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#a5b4fc';
        ctx.beginPath();
        ctx.arc(this.x - this.size * 0.2, this.y - this.size * 0.2, this.size * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        break;
        
      default:
        // Basic projectile
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Core highlight
        ctx.fillStyle = '#fff8dc';
        ctx.beginPath();
        ctx.arc(this.x - this.size * 0.3, this.y - this.size * 0.3, this.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        break;
    }

    // Motion trail effect
    ctx.save();
    ctx.globalAlpha = 0.4;
    for (let i = 1; i <= 3; i++) {
      const trailX = this.x - this.velocityX * 0.005 * i;
      const trailY = this.y - this.velocityY * 0.005 * i;
      const trailSize = this.size * (1 - i * 0.2);
      ctx.globalAlpha = 0.4 / i;
      
      // Trail color based on projectile type
      switch (this.type) {
        case 'cannon':
          ctx.fillStyle = '#dc2626';
          break;
        case 'laser':
          ctx.fillStyle = '#4338ca';
          break;
        default:
          ctx.fillStyle = '#ffd700';
      }
      
      ctx.beginPath();
      ctx.arc(trailX, trailY, trailSize, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  findNewPierceTarget(game) {
    if (!game || !game.enemies) return;
    
    // Find nearest enemy that hasn't been pierced yet
    let nearestEnemy = null;
    let nearestDistance = Infinity;
    const maxSearchRange = 150; // Max range to search for new targets
    
    game.enemies.forEach(enemy => {
      if (enemy.active && !this.piercedEnemies.includes(enemy)) {
        const dx = enemy.x - this.x;
        const dy = enemy.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= maxSearchRange && distance < nearestDistance) {
          nearestDistance = distance;
          nearestEnemy = enemy;
        }
      }
    });
    
    if (nearestEnemy) {
      this.target = nearestEnemy;
      // Update velocity to aim at new target
      const dx = nearestEnemy.x - this.x;
      const dy = nearestEnemy.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        this.velocityX = (dx / distance) * this.speed;
        this.velocityY = (dy / distance) * this.speed;
      }
    } else {
      // No more targets, deactivate
      this.active = false;
    }
  }
}
