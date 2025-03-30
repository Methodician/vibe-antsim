// Represents food sources in the simulation environment

export class FoodSource {
  x: number;
  y: number;
  radius: number;
  amount: number;
  maxAmount: number;
  color: string;

  constructor(x: number, y: number, amount: number = 100, radius: number = 15) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.amount = amount;
    this.maxAmount = amount;
    this.color = '#44AA00'; // Green color for food
  }

  // Take some food from the source
  takeFood(amount: number): number {
    const amountTaken = Math.min(this.amount, amount);
    this.amount -= amountTaken;
    return amountTaken;
  }

  // Check if food source is depleted
  isDepleted(): boolean {
    return this.amount <= 0;
  }

  // Draw the food source
  draw(ctx: CanvasRenderingContext2D): void {
    if (this.isDepleted()) return;

    // Calculate size based on remaining amount
    const sizeRatio = this.amount / this.maxAmount;
    const currentRadius = this.radius * (0.5 + 0.5 * sizeRatio);

    // Draw food pile
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
    ctx.fill();

    // Draw a darker outline
    ctx.strokeStyle = '#2D7200';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
    ctx.stroke();
  }
}
