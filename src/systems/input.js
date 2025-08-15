export class Input {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.game = game;
    this.rect = canvas.getBoundingClientRect();
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
  }
  
  _posFromEvent(e) {
    const x = (e.clientX - this.rect.left) / this.rect.width * this.canvas.width;
    const y = (e.clientY - this.rect.top) / this.rect.height * this.canvas.height;
    return { x, y };
  }
  
  _posFromTouch(touch) {
    const x = (touch.clientX - this.rect.left) / this.rect.width * this.canvas.width;
    const y = (touch.clientY - this.rect.top) / this.rect.height * this.canvas.height;
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
    
    if (cellX >= 0 && cellY >= 0 && cellX < this.game.map.width && cellY < this.game.map.height) {
      // Try to place a tower
      this.game.placeTower(cellX, cellY);
    }
  }
}
