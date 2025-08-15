import { Enemy } from './enemy.js';

export class BasicEnemy extends Enemy {
  constructor(path, wave, gridSize) {
    super(path, wave, gridSize);
    this.type = 'basic';
    this.health = 80 + (wave - 1) * 20;
    this.maxHealth = this.health;
    this.speed = 1;
    this.reward = 10;
    this.size = 12;
    this.color = { primary: '#dc2626', secondary: '#7f1d1d' };
  }

  render(ctx) {
    this._renderEnemy(ctx, this.color);
  }
}

export class FastEnemy extends Enemy {
  constructor(path, wave, gridSize) {
    super(path, wave, gridSize);
    this.type = 'fast';
    this.health = 50 + (wave - 1) * 15;
    this.maxHealth = this.health;
    this.speed = 2; // faster speed
    this.reward = 15;
    this.size = 10;
    this.color = { primary: '#059669', secondary: '#047857' };
  }

  render(ctx) {
    this._renderEnemy(ctx, this.color);
    
    // Add speed lines to indicate fast movement
    if (this.path && this.pathIndex < this.path.length - 1) {
      ctx.save();
      const dx = this.path[this.pathIndex + 1].x - this.path[this.pathIndex].x;
      const dy = this.path[this.pathIndex + 1].y - this.path[this.pathIndex].y;
      const angle = Math.atan2(dy, dx);
      
      ctx.translate(this.x, this.y);
      ctx.rotate(angle);
      
      ctx.strokeStyle = 'rgba(5, 150, 105, 0.6)';
      ctx.lineWidth = 2;
      
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-15 - i * 5, -3 + i * 3);
        ctx.lineTo(-8 - i * 5, -3 + i * 3);
        ctx.stroke();
      }
      
      ctx.restore();
    }
  }
}

export class TankEnemy extends Enemy {
  constructor(path, wave, gridSize) {
    super(path, wave, gridSize);
    this.type = 'tank';
    this.health = 200 + (wave - 1) * 50;
    this.maxHealth = this.health;
    this.speed = 0.6; // slower but tankier
    this.reward = 25;
    this.size = 16;
    this.color = { primary: '#4338ca', secondary: '#1e1b4b' };
  }

  render(ctx) {
    this._renderEnemy(ctx, this.color);
    
    // Add armor plating effect
    ctx.save();
    ctx.fillStyle = 'rgba(67, 56, 202, 0.3)';
    ctx.strokeStyle = 'rgba(67, 56, 202, 0.8)';
    ctx.lineWidth = 2;
    
    // Armor segments
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const segmentX = this.x + Math.cos(angle) * (this.size * 0.6);
      const segmentY = this.y + Math.sin(angle) * (this.size * 0.6);
      
      ctx.beginPath();
      ctx.arc(segmentX, segmentY, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    
    ctx.restore();
  }
}

export class FlyingEnemy extends Enemy {
  constructor(path, wave, gridSize) {
    super(path, wave, gridSize);
    this.type = 'flying';
    this.health = 60 + (wave - 1) * 18;
    this.maxHealth = this.health;
    this.speed = 1.5;
    this.reward = 20;
    this.size = 11;
    this.color = { primary: '#7c3aed', secondary: '#5b21b6' };
    this.floatOffset = Math.random() * Math.PI * 2; // Random float animation
  }

  update(dt) {
    super.update(dt);
    this.floatOffset += dt * 4; // Floating animation speed
  }

  render(ctx) {
    // Add floating effect
    const originalY = this.y;
    this.y += Math.sin(this.floatOffset) * 3;
    
    this._renderEnemy(ctx, this.color);
    
    // Add wing effect
    ctx.save();
    ctx.fillStyle = 'rgba(124, 58, 237, 0.4)';
    const wingSpan = this.size + Math.sin(this.floatOffset * 2) * 3;
    
    // Wings
    ctx.beginPath();
    ctx.ellipse(this.x - wingSpan * 0.6, this.y, wingSpan * 0.4, wingSpan * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.ellipse(this.x + wingSpan * 0.6, this.y, wingSpan * 0.4, wingSpan * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
    
    // Restore original Y position
    this.y = originalY;
  }
}

// Enemy factory function
export function createEnemy(type, path, wave, gridSize) {
  switch (type) {
    case 'fast':
      return new FastEnemy(path, wave, gridSize);
    case 'tank':
      return new TankEnemy(path, wave, gridSize);
    case 'flying':
      return new FlyingEnemy(path, wave, gridSize);
    default:
      return new BasicEnemy(path, wave, gridSize);
  }
}
