// Simulation engine for ant behaviors

class Ant {
  constructor(id, x, y, direction = Math.random() * Math.PI * 2) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.direction = direction;
    this.speed = 2;
    this.color = '#333333';
    this.size = 3;
    this.hasTurnedRecently = false;
  }

  move(width, height) {
    // Random direction change
    if (Math.random() < 0.05) {
      this.direction += (Math.random() - 0.5) * Math.PI / 4;
    }

    // Move in current direction
    this.x += Math.cos(this.direction) * this.speed;
    this.y += Math.sin(this.direction) * this.speed;

    // Wrap around screen edges
    if (this.x < 0) this.x = width;
    if (this.x > width) this.x = 0;
    if (this.y < 0) this.y = height;
    if (this.y > height) this.y = 0;
  }

  draw(ctx) {
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
  constructor(canvasWidth, canvasHeight) {
    this.ants = [];
    this.width = canvasWidth;
    this.height = canvasHeight;
    this.isRunning = false;
    this.animationFrameId = null;
  }

  initialize(antCount = 20) {
    this.ants = [];
    for (let i = 0; i < antCount; i++) {
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      this.ants.push(new Ant(i, x, y));
    }
  }

  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.animate();
    }
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  update() {
    for (const ant of this.ants) {
      ant.move(this.width, this.height);
    }
  }

  render(ctx) {
    // Clear canvas
    ctx.clearRect(0, 0, this.width, this.height);
    
    // Draw all ants
    for (const ant of this.ants) {
      ant.draw(ctx);
    }
  }

  animate() {
    if (!this.isRunning) return;
    
    this.update();
    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }
}

export { SimulationEngine, Ant };