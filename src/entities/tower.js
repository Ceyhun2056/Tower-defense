export class Tower {
  constructor(x, y, gridSize) {
    this.x = x;
    this.y = y;
    this.gridSize = gridSize;
    this.centerX = x * gridSize + gridSize / 2;
    this.centerY = y * gridSize + gridSize / 2;
    this.range = 2.5; // in grid cells
    this.damage = 50; // increased from 25 to 50
    this.fireRate = 1; // shots per second
    this.lastShot = 0;
    this.target = null;
    this.cost = 50;
    this.level = 1;
    this.type = 'basic';
    this.projectileSpeed = 300;
    this.color = { base: '#4a5568', barrel: '#2d3748' };
  }

  // Find the nearest enemy within range
  findTarget(enemies) {
    let nearestEnemy = null;
    let nearestDistance = this.range * this.gridSize;

    for (const enemy of enemies) {
      if (!enemy.active) continue;
      
      const dx = enemy.x - this.centerX;
      const dy = enemy.y - this.centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= nearestDistance) {
        nearestDistance = distance;
        nearestEnemy = enemy;
      }
    }
    
    this.target = nearestEnemy;
    return nearestEnemy;
  }

  // Update tower logic - find target and shoot
  update(dt, enemies, game) {
    this.lastShot += dt;
    
    // Find a new target if current one is invalid
    if (!this.target || !this.target.active) {
      this.findTarget(enemies);
    }
    
    // Check if current target is still in range
    if (this.target) {
      const dx = this.target.x - this.centerX;
      const dy = this.target.y - this.centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > this.range * this.gridSize) {
        this.target = null;
        this.findTarget(enemies);
      }
    }
    
    // Shoot at target if ready
    if (this.target && this.lastShot >= 1 / this.fireRate) {
      this.shoot(game);
      this.lastShot = 0;
    }
  }

  // Shoot at the current target by creating a projectile
  shoot(game) {
    if (this.target && game) {
      game.createProjectile(this.centerX, this.centerY, this.target, this.damage, this.projectileSpeed);
    }
  }

  // Render the tower and its range (when hovered)
  render(ctx, showRange = false) {
    // Draw range circle if requested
    if (showRange) {
      ctx.save();
      ctx.strokeStyle = 'rgba(63, 185, 80, 0.4)';
      ctx.fillStyle = 'rgba(63, 185, 80, 0.1)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, this.range * this.gridSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Draw tower shadow
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#000';
    ctx.fillRect(
      this.x * this.gridSize + 10,
      this.y * this.gridSize + 10,
      this.gridSize - 16,
      this.gridSize - 16
    );
    ctx.restore();

    // Draw tower base with gradient
    const baseGradient = ctx.createLinearGradient(
      this.x * this.gridSize,
      this.y * this.gridSize,
      this.x * this.gridSize + this.gridSize,
      this.y * this.gridSize + this.gridSize
    );
    baseGradient.addColorStop(0, '#6e7681');
    baseGradient.addColorStop(1, '#4a5568');

    ctx.fillStyle = baseGradient;
    ctx.fillRect(
      this.x * this.gridSize + 8,
      this.y * this.gridSize + 8,
      this.gridSize - 16,
      this.gridSize - 16
    );

    // Draw tower base border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      this.x * this.gridSize + 8,
      this.y * this.gridSize + 8,
      this.gridSize - 16,
      this.gridSize - 16
    );

    // Draw tower barrel with gradient
    const barrelGradient = ctx.createRadialGradient(
      this.centerX - 4, this.centerY - 4, 2,
      this.centerX, this.centerY, 12
    );
    barrelGradient.addColorStop(0, '#8b949e');
    barrelGradient.addColorStop(1, '#2d3748');

    ctx.fillStyle = barrelGradient;
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, 12, 0, Math.PI * 2);
    ctx.fill();

    // Draw barrel border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, 12, 0, Math.PI * 2);
    ctx.stroke();

    // Draw tower cannon pointing towards target
    if (this.target && this.target.active) {
      ctx.save();
      const dx = this.target.x - this.centerX;
      const dy = this.target.y - this.centerY;
      const angle = Math.atan2(dy, dx);
      
      ctx.translate(this.centerX, this.centerY);
      ctx.rotate(angle);
      
      // Draw cannon barrel with gradient
      const cannonGradient = ctx.createLinearGradient(0, -3, 0, 3);
      cannonGradient.addColorStop(0, '#4a5568');
      cannonGradient.addColorStop(1, '#1a202c');
      
      ctx.fillStyle = cannonGradient;
      ctx.fillRect(-2, -3, 20, 6);
      
      // Cannon barrel border
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(-2, -3, 20, 6);
      
      // Muzzle
      ctx.fillStyle = '#1a202c';
      ctx.fillRect(18, -2, 2, 4);
      
      ctx.restore();
    }

    // Draw tower center highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(this.centerX - 3, this.centerY - 3, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Base render method for tower types to use
  _renderTower(ctx, showRange = false, color = { base: '#4a5568', barrel: '#2d3748' }) {
    // Draw range circle if requested
    if (showRange) {
      ctx.save();
      ctx.strokeStyle = 'rgba(74, 85, 104, 0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, this.range * this.gridSize, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Draw tower base
    const size = this.gridSize * 0.7;
    ctx.save();
    
    // Create gradient for tower base
    const gradient = ctx.createRadialGradient(
      this.centerX, this.centerY, 0,
      this.centerX, this.centerY, size / 2
    );
    gradient.addColorStop(0, color.base);
    gradient.addColorStop(1, '#1a202c');
    
    ctx.fillStyle = gradient;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    ctx.fillRect(
      this.centerX - size / 2,
      this.centerY - size / 2,
      size,
      size
    );
    
    // Tower base outline
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      this.centerX - size / 2,
      this.centerY - size / 2,
      size,
      size
    );
    
    ctx.restore();

    // Draw cannon barrel (if there's a target)
    if (this.target && this.target.active) {
      ctx.save();
      const dx = this.target.x - this.centerX;
      const dy = this.target.y - this.centerY;
      const angle = Math.atan2(dy, dx);
      
      ctx.translate(this.centerX, this.centerY);
      ctx.rotate(angle);
      
      // Create gradient for cannon barrel
      const barrelGradient = ctx.createLinearGradient(0, -3, 0, 3);
      barrelGradient.addColorStop(0, color.barrel);
      barrelGradient.addColorStop(1, '#0d1117');
      
      ctx.fillStyle = barrelGradient;
      ctx.fillRect(-2, -3, 20, 6);
      
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(-2, -3, 20, 6);
      
      ctx.restore();
    }

    // Draw tower center highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(this.centerX - 3, this.centerY - 3, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}
