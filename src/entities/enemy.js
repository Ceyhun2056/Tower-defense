export class Enemy {
  constructor(path, wave = 1, gridSize = 48) {
    this.path = path.map(([x, y]) => ({ x, y })); // Convert array format to object format
    this.pathIndex = 0;
    this.gridSize = gridSize;
    this.x = this.path[0].x * this.gridSize + this.gridSize / 2;
    this.y = this.path[0].y * this.gridSize + this.gridSize / 2;
    this.speed = 2; // cells per second
    this.health = 100;
    this.maxHealth = 100;
    this.size = 12; // radius
    this.active = true;
    this.reward = 10;
    this.type = 'basic';
    this.wave = wave;
    this.color = { primary: '#dc2626', secondary: '#7f1d1d' };
  }

  // Move towards the next waypoint in the path
  update(dt) {
    if (!this.active || this.pathIndex >= this.path.length - 1) {
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
  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.active = false;
      return true;
    }
    return false;
  }

  // Draw the enemy and its health bar
  render(ctx) {
    this._renderEnemy(ctx, this.color);
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
  }
}
