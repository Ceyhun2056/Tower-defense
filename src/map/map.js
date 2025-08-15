// Map representation & rendering (Phase 2)
// 0 = grass/buildable, 1 = path

export function initMap() {
  // Larger map for bigger canvas
  const width = 25; // tiles (1200px / 48px = 25)
  const height = 15; // tiles (720px / 48px = 15)
  const tiles = new Array(height).fill(0).map(() => new Array(width).fill(0));

  // Define a more complex path that uses the larger space
  const path = [
    // Start from left, go right
    [0,7],[1,7],[2,7],[3,7],[4,7],[5,7],[6,7],[7,7],
    // Turn up
    [7,6],[7,5],[7,4],[7,3],[7,2],
    // Turn right
    [8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],
    // Turn down
    [17,3],[17,4],[17,5],[17,6],[17,7],[17,8],[17,9],[17,10],[17,11],[17,12],
    // Turn left to exit
    [18,12],[19,12],[20,12],[21,12],[22,12],[23,12],[24,12]
  ];
  path.forEach(([x,y]) => { if (tiles[y]) tiles[y][x] = 1; });

  return { width, height, tiles, path };
}

export function renderMap(ctx, map, gridSize) {
  // Create gradient for grass tiles
  const grassGradient1 = ctx.createLinearGradient(0, 0, gridSize, gridSize);
  grassGradient1.addColorStop(0, '#1a2332');
  grassGradient1.addColorStop(1, '#1e2938');
  
  const grassGradient2 = ctx.createLinearGradient(0, 0, gridSize, gridSize);
  grassGradient2.addColorStop(0, '#1e2938');
  grassGradient2.addColorStop(1, '#1a2332');

  // Create gradient for path tiles
  const pathGradient = ctx.createLinearGradient(0, 0, gridSize, gridSize);
  pathGradient.addColorStop(0, '#8b5a2b');
  pathGradient.addColorStop(0.5, '#6b4a1f');
  pathGradient.addColorStop(1, '#5d3f1a');

  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const tile = map.tiles[y][x];
      const tileX = x * gridSize;
      const tileY = y * gridSize;
      
      if (tile === 1) {
        // Path tile with gradient and texture
        ctx.fillStyle = pathGradient;
        ctx.fillRect(tileX, tileY, gridSize, gridSize);
        
        // Add subtle texture lines
        ctx.strokeStyle = 'rgba(139, 90, 43, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tileX, tileY + gridSize * 0.3);
        ctx.lineTo(tileX + gridSize, tileY + gridSize * 0.3);
        ctx.moveTo(tileX, tileY + gridSize * 0.7);
        ctx.lineTo(tileX + gridSize, tileY + gridSize * 0.7);
        ctx.stroke();
      } else {
        // Grass tile with alternating pattern
        ctx.fillStyle = (x + y) % 2 === 0 ? grassGradient1 : grassGradient2;
        ctx.fillRect(tileX, tileY, gridSize, gridSize);
        
        // Add subtle grass texture dots
        if (Math.random() > 0.7) {
          ctx.fillStyle = 'rgba(46, 160, 67, 0.2)';
          const dotX = tileX + Math.random() * gridSize;
          const dotY = tileY + Math.random() * gridSize;
          ctx.beginPath();
          ctx.arc(dotX, dotY, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }
  
  // Draw path borders for better definition
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      if (map.tiles[y][x] === 1) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x * gridSize + 0.5, y * gridSize + 0.5, gridSize - 1, gridSize - 1);
      }
    }
  }
}
