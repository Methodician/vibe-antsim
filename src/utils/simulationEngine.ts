// Simulation engine for ant behaviors

// Nest class to represent the ants' home
class Nest {
  x: number;
  y: number;
  radius: number;
  color: string;
  
  constructor(x: number, y: number, radius: number = 30) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = '#8B4513'; // Brown color for the nest
  }
  
  draw(ctx: CanvasRenderingContext2D): void {
    // Draw the outer nest circle
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw the inner nest opening
    ctx.fillStyle = '#5D3A1A'; // Darker brown for the nest entrance
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Create a new ant at a random position within the nest
  createAnt(id: number): Ant {
    // Random angle and distance from center (within nest)
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * this.radius * 0.6;
    
    // Calculate position
    const x = this.x + Math.cos(angle) * distance;
    const y = this.y + Math.sin(angle) * distance;
    
    // Direction points outward from nest center
    const direction = angle;
    
    return new Ant(id, x, y, direction);
  }
}

class Ant {
  id: number;
  x: number;
  y: number;
  direction: number;
  speed: number;
  color: string;
  size: number;
  hasTurnedRecently: boolean;
  homeNest: Nest | null;

  constructor(id: number, x: number, y: number, direction: number = Math.random() * Math.PI * 2) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.direction = direction;
    this.speed = 2;
    this.color = '#333333';
    this.size = 3;
    this.hasTurnedRecently = false;
    this.homeNest = null; // Will be set when the ant is assigned to a nest
  }

  move(width: number, height: number): void {
    // If the ant has a home nest, occasionally head back to the nest
    if (this.homeNest && Math.random() < 0.01) {
      // Calculate angle to the nest
      const dx = this.homeNest.x - this.x;
      const dy = this.homeNest.y - this.y;
      this.direction = Math.atan2(dy, dx);
    } 
    // Random direction change
    else if (Math.random() < 0.05) {
      this.direction += (Math.random() - 0.5) * Math.PI / 4;
    }

    // Move in current direction
    this.x += Math.cos(this.direction) * this.speed;
    this.y += Math.sin(this.direction) * this.speed;

    // Bounce off screen edges instead of wrapping
    if (this.x < 0) {
      this.x = 0;
      this.direction = Math.PI - this.direction;
    }
    if (this.x > width) {
      this.x = width;
      this.direction = Math.PI - this.direction;
    }
    if (this.y < 0) {
      this.y = 0;
      this.direction = -this.direction;
    }
    if (this.y > height) {
      this.y = height;
      this.direction = -this.direction;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw direction indicator
    const headX = this.x + Math.cos(this.direction) * this.size * 2;
    const headY = this.y + Math.sin(this.direction) * this.size * 2;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(headX, headY);
    ctx.stroke();
  }
}

class SimulationEngine {
  ants: Ant[];
  nest: Nest;
  width: number;
  height: number;
  isRunning: boolean;
  animationFrameId: number | null;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.ants = [];
    this.width = canvasWidth;
    this.height = canvasHeight;
    this.isRunning = false;
    this.animationFrameId = null;
    
    // Create nest in the center of the canvas by default
    this.nest = new Nest(canvasWidth / 2, canvasHeight / 2);
  }

  initialize(antCount: number = 20): void {
    this.ants = [];
    for (let i = 0; i < antCount; i++) {
      // Create ant from the nest
      const ant = this.nest.createAnt(i);
      ant.homeNest = this.nest; // Set the ant's home nest
      this.ants.push(ant);
    }
  }
  
  // Updates the number of ants without resetting other simulation properties
  updateAntCount(newCount: number): void {
    const currentCount = this.ants.length;
    
    if (newCount === currentCount) return;
    
    if (newCount > currentCount) {
      // Add more ants from the nest
      for (let i = currentCount; i < newCount; i++) {
        const ant = this.nest.createAnt(i);
        ant.homeNest = this.nest;
        this.ants.push(ant);
      }
    } else {
      // Remove excess ants
      this.ants = this.ants.slice(0, newCount);
    }
  }
  
  // Set a new position for the nest
  setNestPosition(x: number, y: number): void {
    this.nest.x = x;
    this.nest.y = y;
  }

  start(): void {
    if (!this.isRunning) {
      this.isRunning = true;
      this.animate();
    }
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  update(): void {
    for (const ant of this.ants) {
      ant.move(this.width, this.height);
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Clear canvas
    ctx.clearRect(0, 0, this.width, this.height);
    
    // Draw the nest
    this.nest.draw(ctx);
    
    // Draw all ants
    for (const ant of this.ants) {
      ant.draw(ctx);
    }
  }

  animate(): void {
    if (!this.isRunning) return;
    
    this.update();
    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }
}

export { SimulationEngine, Ant, Nest };