// Theme System for Tower Defense
export const THEMES = {
  default: {
    name: 'Default',
    towers: {
      basic: { base: '#8B4513', barrel: '#A0522D' },
      fire: { base: '#dc2626', barrel: '#ef4444' },
      ice: { base: '#0284c7', barrel: '#0ea5e9' },
      poison: { base: '#16a34a', barrel: '#22c55e' },
      lightning: { base: '#eab308', barrel: '#facc15' },
      amplifier: { base: '#06b6d4', barrel: '#0891b2' },
      guard: { base: '#7c3aed', barrel: '#8b5cf6' },
      rapid: { base: '#f97316', barrel: '#fb923c' },
      sniper: { base: '#4B0082', barrel: '#6A0DAD' },
      railgun: { base: '#475569', barrel: '#64748b' },
      assassin: { base: '#1f2937', barrel: '#374151' },
      cannon: { base: '#8B4513', barrel: '#A0522D' },
      laser: { base: '#4169E1', barrel: '#1E90FF' }
    },
    ui: {
      background: '#1a202c',
      text: '#ffffff',
      accent: '#63b3ed'
    }
  },
  
  neon: {
    name: 'Neon',
    towers: {
      basic: { base: '#FF00FF', barrel: '#FF69B4' },
      fire: { base: '#FF4500', barrel: '#FF6347' },
      ice: { base: '#00FFFF', barrel: '#40E0D0' },
      poison: { base: '#00FF7F', barrel: '#32CD32' },
      lightning: { base: '#FFFF00', barrel: '#FFD700' },
      amplifier: { base: '#FF1493', barrel: '#FF69B4' },
      guard: { base: '#9370DB', barrel: '#BA55D3' },
      rapid: { base: '#FFA500', barrel: '#FF8C00' },
      sniper: { base: '#00FFFF', barrel: '#00CED1' },
      railgun: { base: '#C0C0C0', barrel: '#E6E6FA' },
      assassin: { base: '#800080', barrel: '#9932CC' },
      cannon: { base: '#FFFF00', barrel: '#FFD700' },
      laser: { base: '#00FF00', barrel: '#32CD32' }
    },
    ui: {
      background: '#0a0a0a',
      text: '#00ffff',
      accent: '#ff00ff'
    }
  },
  
  military: {
    name: 'Military',
    towers: {
      basic: { base: '#556B2F', barrel: '#6B8E23' },
      fire: { base: '#8B4513', barrel: '#A0522D' },
      ice: { base: '#2F4F4F', barrel: '#708090' },
      poison: { base: '#228B22', barrel: '#32CD32' },
      lightning: { base: '#DAA520', barrel: '#FFD700' },
      amplifier: { base: '#4682B4', barrel: '#87CEEB' },
      guard: { base: '#483D8B', barrel: '#6A5ACD' },
      rapid: { base: '#CD853F', barrel: '#DEB887' },
      sniper: { base: '#2F4F4F', barrel: '#708090' },
      railgun: { base: '#696969', barrel: '#A9A9A9' },
      assassin: { base: '#2F2F2F', barrel: '#4F4F4F' },
      cannon: { base: '#8B7355', barrel: '#A0522D' },
      laser: { base: '#2F4F4F', barrel: '#4682B4' }
    },
    ui: {
      background: '#2d3748',
      text: '#e2e8f0',
      accent: '#68d391'
    }
  },
  
  steampunk: {
    name: 'Steampunk',
    towers: {
      basic: { base: '#CD853F', barrel: '#DEB887' },
      fire: { base: '#B22222', barrel: '#DC143C' },
      ice: { base: '#4682B4', barrel: '#5F9EA0' },
      poison: { base: '#8FBC8F', barrel: '#98FB98' },
      lightning: { base: '#DAA520', barrel: '#F0E68C' },
      amplifier: { base: '#20B2AA', barrel: '#48D1CC' },
      guard: { base: '#9932CC', barrel: '#BA55D3' },
      rapid: { base: '#FF6347', barrel: '#FF7F50' },
      sniper: { base: '#8B4513', barrel: '#A0522D' },
      railgun: { base: '#708090', barrel: '#BC8F8F' },
      assassin: { base: '#2F4F4F', barrel: '#696969' },
      cannon: { base: '#B8860B', barrel: '#DAA520' },
      laser: { base: '#4169E1', barrel: '#6495ED' }
    },
    ui: {
      background: '#4a3728',
      text: '#f7fafc',
      accent: '#d69e2e'
    }
  }
};

export class ThemeManager {
  constructor() {
    this.currentTheme = 'default';
    this.loadTheme();
  }
  
  setTheme(themeName) {
    if (THEMES[themeName]) {
      this.currentTheme = themeName;
      this.applyTheme();
      this.saveTheme();
    }
  }
  
  getCurrentTheme() {
    return THEMES[this.currentTheme];
  }
  
  getTowerColors(towerType) {
    const theme = this.getCurrentTheme();
    return theme.towers[towerType] || theme.towers.basic;
  }
  
  applyTheme() {
    const theme = this.getCurrentTheme();
    const root = document.documentElement;
    
    // Apply CSS custom properties for UI theme
    root.style.setProperty('--theme-bg', theme.ui.background);
    root.style.setProperty('--theme-text', theme.ui.text);
    root.style.setProperty('--theme-accent', theme.ui.accent);
  }
  
  saveTheme() {
    localStorage.setItem('towerDefenseTheme', this.currentTheme);
  }
  
  loadTheme() {
    const saved = localStorage.getItem('towerDefenseTheme');
    if (saved && THEMES[saved]) {
      this.currentTheme = saved;
      this.applyTheme();
    }
  }
  
  getThemeList() {
    return Object.keys(THEMES).map(key => ({
      id: key,
      name: THEMES[key].name
    }));
  }
}
