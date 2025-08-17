// Tower upgrade system with branching paths
// This file defines upgrade trees for each base tower type

export const UPGRADE_PATHS = {
  basic: {
    name: 'Basic Tower',
    upgrades: {
      guard: {
        name: 'Guard Tower',
        cost: 75,
        description: 'Enhanced armor and damage',
        stats: { damage: 80, range: 3.0, fireRate: 1.4 },
        color: { base: '#7c2d12', barrel: '#991b1b' }
      },
      rapid: {
        name: 'Rapid Tower',
        cost: 70,
        description: 'High fire rate, lower damage',
        stats: { damage: 35, range: 2.8, fireRate: 2.5 },
        color: { base: '#1e40af', barrel: '#1d4ed8' }
      }
    }
  },

  sniper: {
    name: 'Sniper Tower',
    upgrades: {
      railgun: {
        name: 'Railgun Tower',
        cost: 150,
        description: 'Devastating pierce damage',
        stats: { damage: 200, range: 6.0, fireRate: 0.4 },
        color: { base: '#581c87', barrel: '#6b21a8' },
        special: 'pierce' // Can hit multiple enemies in line
      },
      assassin: {
        name: 'Assassin Tower',
        cost: 130,
        description: 'Critical hit chance and stealth detection',
        stats: { damage: 150, range: 4.8, fireRate: 0.8 },
        color: { base: '#374151', barrel: '#111827' },
        special: 'critical' // 25% chance for 3x damage
      }
    }
  },

  cannon: {
    name: 'Cannon Tower',
    upgrades: {
      artillery: {
        name: 'Artillery Tower',
        cost: 120,
        description: 'Massive explosion radius',
        stats: { damage: 90, range: 3.2, fireRate: 0.7 },
        color: { base: '#92400e', barrel: '#b45309' },
        special: 'bigSplash' // Larger splash radius
      },
      mortar: {
        name: 'Mortar Tower',
        cost: 110,
        description: 'Long range indirect fire',
        stats: { damage: 75, range: 5.0, fireRate: 0.9 },
        color: { base: '#65a30d', barrel: '#84cc16' },
        special: 'indirect' // Can hit over obstacles
      }
    }
  },

  laser: {
    name: 'Laser Tower',
    upgrades: {
      plasma: {
        name: 'Plasma Tower',
        cost: 180,
        description: 'Continuous beam damage',
        stats: { damage: 60, range: 3.5, fireRate: 8.0 },
        color: { base: '#dc2626', barrel: '#ef4444' },
        special: 'beam' // Continuous damage while targeting
      },
      ion: {
        name: 'Ion Tower',
        cost: 160,
        description: 'Chain lightning attacks',
        stats: { damage: 80, range: 3.8, fireRate: 1.8 },
        color: { base: '#0891b2', barrel: '#06b6d4' },
        special: 'chain' // Jumps to nearby enemies
      }
    }
  }
};

// Ultimate towers - very expensive but game-changing
export const ULTIMATE_TOWERS = {
  fortress: {
    name: 'Fortress Tower',
    cost: 500,
    description: 'Massive damage and range, buffs nearby towers',
    requirements: ['guard', 'artillery'], // Requires these upgrades first
    stats: { damage: 300, range: 5.5, fireRate: 1.0 },
    color: { base: '#7c2d12', barrel: '#dc2626' },
    special: 'aura' // Buffs nearby towers
  },
  
  orbital: {
    name: 'Orbital Cannon',
    cost: 600,
    description: 'Devastating long-range strikes',
    requirements: ['railgun', 'mortar'],
    stats: { damage: 500, range: 8.0, fireRate: 0.3 },
    color: { base: '#4c1d95', barrel: '#7c3aed' },
    special: 'orbital' // Massive splash damage
  },

  quantum: {
    name: 'Quantum Tower',
    cost: 750,
    description: 'Teleports projectiles, ignores armor',
    requirements: ['plasma', 'ion'],
    stats: { damage: 200, range: 4.0, fireRate: 2.0 },
    color: { base: '#059669', barrel: '#10b981' },
    special: 'quantum' // Instant hit, ignores armor
  }
};

// Support towers that buff nearby towers or debuff enemies
export const SUPPORT_TOWERS = {
  amplifier: {
    name: 'Amplifier Tower',
    cost: 120,
    description: 'Increases damage of nearby towers by 50%',
    stats: { damage: 0, range: 4.0, fireRate: 0 },
    color: { base: '#7c3aed', barrel: '#8b5cf6' },
    special: 'damageAura'
  },

  radar: {
    name: 'Radar Tower',
    cost: 100,
    description: 'Increases range of nearby towers, reveals camo',
    stats: { damage: 0, range: 4.5, fireRate: 0 },
    color: { base: '#0891b2', barrel: '#06b6d4' },
    special: 'rangeAura'
  },

  slowField: {
    name: 'Slow Field Tower',
    cost: 90,
    description: 'Slows all enemies in large radius',
    stats: { damage: 0, range: 3.5, fireRate: 0 },
    color: { base: '#0369a1', barrel: '#0284c7' },
    special: 'slowAura'
  }
};

// Elemental towers with special effects
export const ELEMENTAL_TOWERS = {
  fire: {
    name: 'Fire Tower',
    cost: 110,
    description: 'Burns enemies for damage over time',
    stats: { damage: 70, range: 2.8, fireRate: 1.5 },
    color: { base: '#dc2626', barrel: '#ef4444' },
    special: 'burn'
  },

  ice: {
    name: 'Ice Tower',
    cost: 105,
    description: 'Slows enemies and can freeze them',
    stats: { damage: 60, range: 3.0, fireRate: 1.2 },
    color: { base: '#0284c7', barrel: '#0ea5e9' },
    special: 'freeze'
  },

  poison: {
    name: 'Poison Tower',
    cost: 95,
    description: 'Poison spreads to nearby enemies',
    stats: { damage: 50, range: 2.5, fireRate: 1.0 },
    color: { base: '#16a34a', barrel: '#22c55e' },
    special: 'poison'
  },

  lightning: {
    name: 'Lightning Tower',
    cost: 125,
    description: 'Chains between multiple enemies',
    stats: { damage: 85, range: 3.2, fireRate: 1.3 },
    color: { base: '#7c3aed', barrel: '#8b5cf6' },
    special: 'lightning'
  }
};

// Helper function to get all available upgrades for a tower
export function getAvailableUpgrades(tower, playerMoney) {
  const upgrades = [];
  
  // Check regular upgrades
  if (UPGRADE_PATHS[tower.type]) {
    Object.entries(UPGRADE_PATHS[tower.type].upgrades).forEach(([key, upgrade]) => {
      upgrades.push({
        id: key,
        ...upgrade,
        affordable: playerMoney >= upgrade.cost,
        type: 'upgrade'
      });
    });
  }

  // Check ultimate towers (if player has required upgrades)
  Object.entries(ULTIMATE_TOWERS).forEach(([key, ultimate]) => {
    if (ultimate.requirements && ultimate.requirements.includes(tower.upgradeType)) {
      upgrades.push({
        id: key,
        ...ultimate,
        affordable: playerMoney >= ultimate.cost,
        type: 'ultimate'
      });
    }
  });

  return upgrades;
}

// Helper function to get tower info by type
export function getTowerInfo(towerType) {
  // Check base towers first
  const baseTowers = {
    basic: { cost: 50, name: 'Basic Tower' },
    sniper: { cost: 100, name: 'Sniper Tower' },
    cannon: { cost: 80, name: 'Cannon Tower' },
    laser: { cost: 120, name: 'Laser Tower' }
  };

  if (baseTowers[towerType]) {
    return baseTowers[towerType];
  }

  // Check elemental towers
  if (ELEMENTAL_TOWERS[towerType]) {
    return ELEMENTAL_TOWERS[towerType];
  }

  // Check support towers
  if (SUPPORT_TOWERS[towerType]) {
    return SUPPORT_TOWERS[towerType];
  }

  // Check upgrades in all paths
  for (const path of Object.values(UPGRADE_PATHS)) {
    if (path.upgrades[towerType]) {
      return path.upgrades[towerType];
    }
  }

  // Check ultimate towers
  if (ULTIMATE_TOWERS[towerType]) {
    return ULTIMATE_TOWERS[towerType];
  }

  return { cost: 0, name: 'Unknown' };
}

