// Achievement System
export const ACHIEVEMENTS = {
  'first_blood': {
    id: 'first_blood',
    name: 'First Blood',
    description: 'Kill your first enemy',
    reward: 50,
    icon: '🩸',
    unlocked: false
  },
  'wave_survivor': {
    id: 'wave_survivor',
    name: 'Wave Survivor',
    description: 'Reach wave 10',
    reward: 100,
    icon: '🌊',
    unlocked: false
  },
  'boss_slayer': {
    id: 'boss_slayer',
    name: 'Boss Slayer',
    description: 'Defeat your first boss enemy',
    reward: 200,
    icon: '👑',
    unlocked: false
  },
  'tower_master': {
    id: 'tower_master',
    name: 'Tower Master',
    description: 'Build 10 towers in a single game',
    reward: 150,
    icon: '🏗️',
    unlocked: false
  },
  'upgrade_enthusiast': {
    id: 'upgrade_enthusiast',
    name: 'Upgrade Enthusiast',
    description: 'Upgrade a tower to maximum level',
    reward: 250,
    icon: '⬆️',
    unlocked: false
  },
  'money_saver': {
    id: 'money_saver',
    name: 'Money Saver',
    description: 'Accumulate 1000 gold',
    reward: 100,
    icon: '💰',
    unlocked: false
  },
  'perfectionist': {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Complete 5 waves without losing health',
    reward: 300,
    icon: '❤️',
    unlocked: false
  },
  'elemental_master': {
    id: 'elemental_master',
    name: 'Elemental Master',
    description: 'Use all 4 elemental tower types',
    reward: 200,
    icon: '🔥',
    unlocked: false
  }
};

export class AchievementManager {
  constructor(game) {
    this.game = game;
    this.achievements = { ...ACHIEVEMENTS };
    this.notifications = [];
    this.stats = {
      enemiesKilled: 0,
      towersBuilt: 0,
      wavesCompleted: 0,
      bossesKilled: 0,
      perfectWaves: 0,
      lastLifeCount: 20,
      elementalTowersUsed: new Set()
    };
    
    this.loadProgress();
  }
  
  checkAchievements() {
    const state = this.game.state;
    
    // First Blood
    if (this.stats.enemiesKilled >= 1 && !this.achievements.first_blood.unlocked) {
      this.unlockAchievement('first_blood');
    }
    
    // Wave Survivor
    if (state.wave >= 10 && !this.achievements.wave_survivor.unlocked) {
      this.unlockAchievement('wave_survivor');
    }
    
    // Tower Master
    if (this.stats.towersBuilt >= 10 && !this.achievements.tower_master.unlocked) {
      this.unlockAchievement('tower_master');
    }
    
    // Money Saver
    if (state.money >= 1000 && !this.achievements.money_saver.unlocked) {
      this.unlockAchievement('money_saver');
    }
    
    // Perfectionist - check if completed waves without losing health
    if (state.lives === this.stats.lastLifeCount) {
      this.stats.perfectWaves++;
      if (this.stats.perfectWaves >= 5 && !this.achievements.perfectionist.unlocked) {
        this.unlockAchievement('perfectionist');
      }
    } else {
      this.stats.perfectWaves = 0; // Reset if lost health
    }
    this.stats.lastLifeCount = state.lives;
    
    // Elemental Master
    if (this.stats.elementalTowersUsed.size >= 4 && !this.achievements.elemental_master.unlocked) {
      this.unlockAchievement('elemental_master');
    }
  }
  
  unlockAchievement(achievementId) {
    const achievement = this.achievements[achievementId];
    if (!achievement || achievement.unlocked) return;
    
    achievement.unlocked = true;
    
    // Give reward
    this.game.state.money += achievement.reward;
    
    // Create notification
    this.notifications.push({
      id: achievementId,
      name: achievement.name,
      description: achievement.description,
      reward: achievement.reward,
      icon: achievement.icon,
      time: Date.now(),
      life: 4 // seconds to show
    });
    
    this.saveProgress();
    this.game._notifyState();
  }
  
  onEnemyKilled(enemy) {
    this.stats.enemiesKilled++;
    if (enemy.isBoss) {
      this.stats.bossesKilled++;
      if (!this.achievements.boss_slayer.unlocked) {
        this.unlockAchievement('boss_slayer');
      }
    }
    this.checkAchievements();
  }
  
  onTowerBuilt(towerType) {
    this.stats.towersBuilt++;
    
    // Track elemental towers
    if (['fire', 'ice', 'poison', 'lightning'].includes(towerType)) {
      this.stats.elementalTowersUsed.add(towerType);
    }
    
    this.checkAchievements();
  }
  
  onTowerUpgraded(tower) {
    // Check if tower reached maximum upgrade level
    if (tower.upgradeLevel >= 3 && !this.achievements.upgrade_enthusiast.unlocked) {
      this.unlockAchievement('upgrade_enthusiast');
    }
  }
  
  onWaveCompleted() {
    this.stats.wavesCompleted++;
    this.checkAchievements();
  }
  
  updateNotifications(dt) {
    this.notifications = this.notifications.filter(notification => {
      notification.life -= dt;
      return notification.life > 0;
    });
  }
  
  renderNotifications(ctx) {
    this.notifications.forEach((notification, index) => {
      const y = 80 + index * 80;
      const x = ctx.canvas.width - 350;
      const alpha = Math.min(1, notification.life);
      
      ctx.save();
      ctx.globalAlpha = alpha;
      
      // Background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(x, y, 320, 70);
      
      // Border
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, 320, 70);
      
      // Icon
      ctx.font = '24px Arial';
      ctx.fillStyle = '#ffd700';
      ctx.fillText(notification.icon, x + 10, y + 35);
      
      // Title
      ctx.font = 'bold 16px Arial';
      ctx.fillStyle = '#ffd700';
      ctx.fillText('Achievement Unlocked!', x + 50, y + 20);
      
      // Name
      ctx.font = 'bold 14px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(notification.name, x + 50, y + 35);
      
      // Description and reward
      ctx.font = '12px Arial';
      ctx.fillStyle = '#cccccc';
      ctx.fillText(notification.description, x + 50, y + 50);
      ctx.fillText(`+$${notification.reward}`, x + 250, y + 50);
      
      ctx.restore();
    });
  }
  
  getUnlockedCount() {
    return Object.values(this.achievements).filter(a => a.unlocked).length;
  }
  
  getTotalCount() {
    return Object.keys(this.achievements).length;
  }
  
  saveProgress() {
    const saveData = {
      achievements: this.achievements,
      stats: {
        ...this.stats,
        elementalTowersUsed: Array.from(this.stats.elementalTowersUsed)
      }
    };
    localStorage.setItem('towerDefenseAchievements', JSON.stringify(saveData));
  }
  
  loadProgress() {
    const saved = localStorage.getItem('towerDefenseAchievements');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.achievements = { ...ACHIEVEMENTS, ...data.achievements };
        if (data.stats) {
          this.stats = {
            ...this.stats,
            ...data.stats,
            elementalTowersUsed: new Set(data.stats.elementalTowersUsed || [])
          };
        }
      } catch (e) {
        console.warn('Failed to load achievement progress:', e);
      }
    }
  }
}
