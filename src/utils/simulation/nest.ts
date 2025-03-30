// Represents the ants' home nest

import { Ant } from './ant'; // Import Ant for createAnt method

export class Nest {
  x: number;
  y: number;
  radius: number;
  color: string;
  foodStored: number;

  constructor(x: number, y: number, radius: number = 30) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = '#8B4513'; // Brown color for the nest
    this.foodStored = 0;
  }

  // Store food brought back by ants
  storeFood(amount: number): void {
    this.foodStored += amount;
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

    // Draw food indicator if food has been collected
    if (this.foodStored > 0) {
      // Draw small green dots representing stored food
      const maxDots = Math.min(20, Math.floor(this.foodStored / 10));
      ctx.fillStyle = '#44AA00'; // Green color for food

      for (let i = 0; i < maxDots; i++) {
        const angle = (i / maxDots) * Math.PI * 2;
        const distance = this.radius * 0.4;
        const dotX = this.x + Math.cos(angle) * distance;
        const dotY = this.y + Math.sin(angle) * distance;

        ctx.beginPath();
        ctx.arc(dotX, dotY, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw food count text above nest
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        `Food: ${this.foodStored}`,
        this.x,
        this.y - this.radius - 10
      );
      ctx.textAlign = 'start'; // Reset text align
    }
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

    // Need to pass `this` (the nest) when creating the ant
    // However, the Ant constructor doesn't take the nest directly.
    // The SimulationEngine sets ant.homeNest after creation.
    // So, we just return a new Ant here.
    return new Ant(id, x, y, direction);
  }
}
