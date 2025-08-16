export class Input {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.game = game;
    this.rect = canvas.getBoundingClientRect();
    this.dpr = window.devicePixelRatio || 1;
    window.addEventListener('resize', () => this._updateRect());
    canvas.addEventListener('mousemove', e => this._onMove(e));
    canvas.addEventListener('mouseleave', () => { this.game.hoverCell = null; });
    canvas.addEventListener('click', e => this._onClick(e));
    
    // Add touch event handlers
    canvas.addEventListener('touchstart', e => this._onTouchStart(e));
    canvas.addEventListener('touchmove', e => this._onTouchMove(e));
    canvas.addEventListener('touchend', () => { this.game.hoverCell = null; });
  }
  
  _updateRect() { 
    this.rect = this.canvas.getBoundingClientRect();
    // Also store device pixel ratio for coordinate conversion
    this.dpr = window.devicePixelRatio || 1;
  }
  
  _posFromEvent(e) {
    // Calculate position accounting for canvas scaling and device pixel ratio
    const rect = this.rect;
    const canvasWidth = this.canvas.width / this.dpr;
    const canvasHeight = this.canvas.height / this.dpr;
    
    const x = (e.clientX - rect.left) * (canvasWidth / rect.width);
    const y = (e.clientY - rect.top) * (canvasHeight / rect.height);
    return { x, y };
  }
  
  _posFromTouch(touch) {
    // Calculate position accounting for canvas scaling and device pixel ratio
    const rect = this.rect;
    const canvasWidth = this.canvas.width / this.dpr;
    const canvasHeight = this.canvas.height / this.dpr;
    
    const x = (touch.clientX - rect.left) * (canvasWidth / rect.width);
    const y = (touch.clientY - rect.top) * (canvasHeight / rect.height);
    return { x, y };
  }
  
  _onMove(e) {
    const { x, y } = this._posFromEvent(e);
    this._updateHoverCell(x, y);
  }
  
  _onTouchMove(e) {
    e.preventDefault();
    if (e.touches.length > 0) {
      const { x, y } = this._posFromTouch(e.touches[0]);
      this._updateHoverCell(x, y);
    }
  }
  
  _updateHoverCell(x, y) {
    const g = this.game.gridSize;
    const cellX = Math.floor(x / g);
    const cellY = Math.floor(y / g);
    if (cellX >= 0 && cellY >= 0 && cellX < this.game.map.width && cellY < this.game.map.height) {
      this.game.hoverCell = { x: cellX, y: cellY };
    } else {
      this.game.hoverCell = null;
    }
  }
  
  _onTouchStart(e) {
    e.preventDefault();
    if (e.touches.length > 0) {
      const { x, y } = this._posFromTouch(e.touches[0]);
      this.handleCanvasClick(x, y);
    }
  }
  
  _onClick(e) {
    const { x, y } = this._posFromEvent(e);
    this.handleCanvasClick(x, y);
  }
  
  // Public method for handling clicks/touches
  handleCanvasClick(x, y) {
    if (!this.game.running) return;
    
    const g = this.game.gridSize;
    const cellX = Math.floor(x / g);
    const cellY = Math.floor(y / g);
    
    // Ensure coordinates are within valid map bounds
    if (cellX >= 0 && cellY >= 0 && cellX < this.game.map.width && cellY < this.game.map.height) {
      // Check if there's a tower at this position
      const existingTower = this.game.towers.find(tower => tower.x === cellX && tower.y === cellY);
      
      if (existingTower) {
        // Show upgrade UI for the clicked tower
        if (this.upgradeUI) {
          // Convert canvas coordinates back to screen coordinates for UI positioning
          const screenX = (x / (this.canvas.width / this.dpr)) * this.rect.width + this.rect.left;
          const screenY = (y / (this.canvas.height / this.dpr)) * this.rect.height + this.rect.top;
          this.upgradeUI.show(existingTower, screenX, screenY);
        }
      } else {
        // Try to place a tower
        this.game.placeTower(cellX, cellY);
      }
    }
  }
}
