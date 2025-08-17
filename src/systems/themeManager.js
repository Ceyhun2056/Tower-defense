// Theme System for Tower Defense
export const THEMES = {
  default: {
    name: 'Default',
    towers: {
      basic: { base: '#8B4513', barrel: '#A0522D' },
      sniper: { base: '#4B0082', barrel: '#6A0DAD' },
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
      sniper: { base: '#00FFFF', barrel: '#00CED1' },
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
      sniper: { base: '#2F4F4F', barrel: '#708090' },
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
      basic: { base: '#8B4513', barrel: '#DAA520' },
      sniper: { base: '#A0522D', barrel: '#CD853F' },
      cannon: { base: '#B8860B', barrel: '#FFD700' },
      laser: { base: '#D2691E', barrel: '#FF8C00' }
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
