// Simulation engine for ant behaviors

// FoodSource class to represent food in the simulation
class FoodSource {
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

// Nest class to represent the ants' home
class Nest {
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
  returningToNest: boolean;
  carryingFood: boolean;
  foodAmount: number;
  sensorAngle: number;
  sensorDistance: number;
  targetFood: FoodSource | null;

  constructor(
    id: number,
    x: number,
    y: number,
    direction: number = Math.random() * Math.PI * 2
  ) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.direction = direction;
    this.speed = 2;
    this.color = '#333333';
    this.size = 3;
    this.hasTurnedRecently = false;
    this.homeNest = null; // Will be set when the ant is assigned to a nest
    this.returningToNest = false;
    this.carryingFood = false;
    this.foodAmount = 0;
    this.sensorAngle = Math.PI / 4; // 45 degrees
    this.sensorDistance = 20; // pixels
    this.targetFood = null;
  }

  move(
    width: number,
    height: number,
    pheromones: PheromoneGrid,
    foodSources: FoodSource[] = []
  ): void {
    // If not carrying food, look for food sources
    if (!this.carryingFood && !this.returningToNest) {
      this.lookForFood(foodSources);
    }

    // If target food exists, move towards it
    if (this.targetFood && !this.carryingFood) {
      this.moveTowardsFood();
    }

    // If at nest and carrying food, drop it off
    if (this.homeNest && this.carryingFood) {
      const distToNest = Math.sqrt(
        Math.pow(this.x - this.homeNest.x, 2) +
          Math.pow(this.y - this.homeNest.y, 2)
      );

      if (distToNest < this.homeNest.radius * 0.6) {
        // Store the food in the nest
        if (this.homeNest && this.foodAmount > 0) {
          this.homeNest.storeFood(this.foodAmount);
        }

        // Reset ant state
        this.carryingFood = false;
        this.returningToNest = false;
        this.foodAmount = 0;
        this.color = '#333333'; // Back to normal color

        // Head out in a random direction from nest
        this.direction = Math.random() * Math.PI * 2;
      }
    }

    // Leave pheromone trails based on ant state
    if (this.returningToNest && this.carryingFood) {
      const pheromoneStrength = Math.min(5, 1 + this.foodAmount / 10);
      pheromones.addPheromone(
        this.x,
        this.y,
        pheromoneStrength,
        PheromoneType.INBOUND
      );
    } else if (!this.returningToNest) {
      const pheromoneStrength = 1.0;
      pheromones.addPheromone(
        this.x,
        this.y,
        pheromoneStrength,
        PheromoneType.OUTBOUND
      );
    }

    // Determine which pheromone trail to follow based on ant state
    if (this.returningToNest) {
      // Returning ants follow outbound pheromones only
      this.followPheromoneTrail(pheromones, PheromoneType.OUTBOUND);
      // Removed direct heading-toward-nest random adjustment
    } else {
      // Outbound ants follow inbound pheromones only
      this.followPheromoneTrail(pheromones, PheromoneType.INBOUND);
      // Removed random wandering adjustment
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

  // Look for food nearby
  lookForFood(foodSources: FoodSource[]): void {
    // Only look for food if none is targeted and we have food sources
    if (this.targetFood || foodSources.length === 0) return;

    // Check distance to each food source
    for (const food of foodSources) {
      if (food.isDepleted()) continue;

      const distToFood = Math.sqrt(
        Math.pow(this.x - food.x, 2) + Math.pow(this.y - food.y, 2)
      );

      // If within sensing range, target this food
      if (distToFood < this.sensorDistance * 2) {
        this.targetFood = food;
        return;
      }

      // Small chance to randomly discover a food source (simulates smell or other senses)
      if (distToFood < 100 && Math.random() < 0.001) {
        this.targetFood = food;
        return;
      }
    }
  }

  // Move towards targeted food
  moveTowardsFood(): void {
    if (!this.targetFood) return;

    // Calculate direction to food
    const dx = this.targetFood.x - this.x;
    const dy = this.targetFood.y - this.y;
    const angleToFood = Math.atan2(dy, dx);

    // Gradually turn towards food
    const angleDiff = angleToFood - this.direction;
    // Normalize the angle difference to [-π, π]
    const normalizedAngleDiff = Math.atan2(
      Math.sin(angleDiff),
      Math.cos(angleDiff)
    );
    // Turn towards food with some randomness
    this.direction += normalizedAngleDiff * 0.3 + (Math.random() - 0.5) * 0.1;

    // Check if we've reached the food
    const distToFood = Math.sqrt(dx * dx + dy * dy);
    if (distToFood < this.targetFood.radius) {
      this.collectFood();
    }
  }

  // Collect food from the target food source
  collectFood(): void {
    if (!this.targetFood) return;

    // Collect food amount (between 10 and 20 units)
    const amountToTake = 10 + Math.floor(Math.random() * 10);
    this.foodAmount = this.targetFood.takeFood(amountToTake);

    if (this.foodAmount > 0) {
      // Start returning to nest
      this.carryingFood = true;
      this.returningToNest = true;
      this.color = '#cc6600'; // Brownish orange when carrying food
    }

    // Reset target food if depleted
    if (this.targetFood.isDepleted()) {
      this.targetFood = null;
    } else {
      // Otherwise, head back away from the food
      this.direction = Math.atan2(
        this.y - this.targetFood.y,
        this.x - this.targetFood.x
      );
      this.targetFood = null;
    }
  }

  // Method to help ants follow pheromone trails
  followPheromoneTrail(pheromones: PheromoneGrid, type: PheromoneType): void {
    // Check pheromone levels at three points:
    const leftX =
      this.x +
      Math.cos(this.direction - this.sensorAngle) * this.sensorDistance;
    const leftY =
      this.y +
      Math.sin(this.direction - this.sensorAngle) * this.sensorDistance;
    const leftPheromone = pheromones.getPheromone(leftX, leftY, type);

    const aheadX = this.x + Math.cos(this.direction) * this.sensorDistance;
    const aheadY = this.y + Math.sin(this.direction) * this.sensorDistance;
    const aheadPheromone = pheromones.getPheromone(aheadX, aheadY, type);

    const rightX =
      this.x +
      Math.cos(this.direction + this.sensorAngle) * this.sensorDistance;
    const rightY =
      this.y +
      Math.sin(this.direction + this.sensorAngle) * this.sensorDistance;
    const rightPheromone = pheromones.getPheromone(rightX, rightY, type);

    // If no pheromones detected, allow aimless wandering
    if (leftPheromone === 0 && aheadPheromone === 0 && rightPheromone === 0) {
      this.direction += (Math.random() - 0.5) * 0.2;
      return;
    }

    // Determine direction with the strongest pheromone
    const maxPheromone = Math.max(
      leftPheromone,
      aheadPheromone,
      rightPheromone
    );
    const turnStrength = 0.2; // Fixed turn strength

    if (leftPheromone === maxPheromone && leftPheromone > aheadPheromone) {
      const turnFactor = Math.min(1, (leftPheromone - aheadPheromone) / 5);
      this.direction -= turnStrength * turnFactor;
    } else if (
      rightPheromone === maxPheromone &&
      rightPheromone > aheadPheromone
    ) {
      const turnFactor = Math.min(1, (rightPheromone - aheadPheromone) / 5);
      this.direction += turnStrength * turnFactor;
    }
    // If ahead is strongest, maintain current course.
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // Draw ant body
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

    // If carrying food, draw a small circle on top
    if (this.carryingFood) {
      ctx.fillStyle = '#44AA00'; // Green food
      // Size of food depends on amount
      const foodSize = Math.min(
        this.size * 0.8,
        this.size * 0.4 + this.foodAmount * 0.02
      );
      ctx.beginPath();
      ctx.arc(this.x, this.y, foodSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // For debugging, optionally draw the ant's sensors
    if (false) {
      // Set to false to hide sensors, true to see them
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';

      // Left sensor
      const leftX =
        this.x +
        Math.cos(this.direction - this.sensorAngle) * this.sensorDistance;
      const leftY =
        this.y +
        Math.sin(this.direction - this.sensorAngle) * this.sensorDistance;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(leftX, leftY);
      ctx.stroke();

      // Right sensor
      const rightX =
        this.x +
        Math.cos(this.direction + this.sensorAngle) * this.sensorDistance;
      const rightY =
        this.y +
        Math.sin(this.direction + this.sensorAngle) * this.sensorDistance;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(rightX, rightY);
      ctx.stroke();

      // Front sensor
      const frontX = this.x + Math.cos(this.direction) * this.sensorDistance;
      const frontY = this.y + Math.sin(this.direction) * this.sensorDistance;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(frontX, frontY);
      ctx.stroke();
    }
  }
}

// Enum for pheromone types
enum PheromoneType {
  INBOUND = 0, // From ants returning to nest with food
  OUTBOUND = 1, // From ants leaving nest, searching for food
}

// Pheromone class to manage pheromone grid
class PheromoneGrid {
  // Two separate grids for different pheromone types
  inboundGrid: number[][]; // Pheromones from ants with food returning to nest
  outboundGrid: number[][]; // Pheromones from ants leaving the nest
  width: number;
  height: number;
  cellSize: number;
  decayRate: number;

  constructor(
    width: number,
    height: number,
    cellSize: number = 5,
    decayRate: number = 0.995
  ) {
    this.width = Math.ceil(width / cellSize);
    this.height = Math.ceil(height / cellSize);
    this.cellSize = cellSize;
    this.decayRate = decayRate;

    // Initialize empty grids
    this.inboundGrid = Array(this.height)
      .fill(0)
      .map(() => Array(this.width).fill(0));
    this.outboundGrid = Array(this.height)
      .fill(0)
      .map(() => Array(this.width).fill(0));
  }

  // Add pheromone at a position with specified type
  addPheromone(
    x: number,
    y: number,
    amount: number = 1,
    type: PheromoneType = PheromoneType.INBOUND
  ): void {
    const gridX = Math.floor(x / this.cellSize);
    const gridY = Math.floor(y / this.cellSize);

    // Check bounds
    if (gridX >= 0 && gridX < this.width && gridY >= 0 && gridY < this.height) {
      if (type === PheromoneType.INBOUND) {
        this.inboundGrid[gridY][gridX] += amount;
        // Cap at maximum pheromone level
        this.inboundGrid[gridY][gridX] = Math.min(
          this.inboundGrid[gridY][gridX],
          10
        );
      } else {
        this.outboundGrid[gridY][gridX] += amount;
        // Cap at maximum pheromone level
        this.outboundGrid[gridY][gridX] = Math.min(
          this.outboundGrid[gridY][gridX],
          10
        );
      }
    }
  }

  // Get pheromone value at a position for a specific pheromone type
  getPheromone(
    x: number,
    y: number,
    type: PheromoneType = PheromoneType.INBOUND
  ): number {
    const gridX = Math.floor(x / this.cellSize);
    const gridY = Math.floor(y / this.cellSize);

    // Check bounds
    if (gridX >= 0 && gridX < this.width && gridY >= 0 && gridY < this.height) {
      return type === PheromoneType.INBOUND
        ? this.inboundGrid[gridY][gridX]
        : this.outboundGrid[gridY][gridX];
    }
    return 0;
  }

  // Calculate the average pheromone in an area for a specific type
  getAveragePheromone(
    x: number,
    y: number,
    radius: number,
    type: PheromoneType = PheromoneType.INBOUND
  ): number {
    const grid =
      type === PheromoneType.INBOUND ? this.inboundGrid : this.outboundGrid;
    let total = 0;
    let count = 0;

    const gridRadius = Math.ceil(radius / this.cellSize);
    const centerGridX = Math.floor(x / this.cellSize);
    const centerGridY = Math.floor(y / this.cellSize);

    for (let offsetY = -gridRadius; offsetY <= gridRadius; offsetY++) {
      for (let offsetX = -gridRadius; offsetX <= gridRadius; offsetX++) {
        const gridX = centerGridX + offsetX;
        const gridY = centerGridY + offsetY;

        if (
          gridX >= 0 &&
          gridX < this.width &&
          gridY >= 0 &&
          gridY < this.height
        ) {
          total += grid[gridY][gridX];
          count++;
        }
      }
    }

    return count > 0 ? total / count : 0;
  }

  // Apply decay to all pheromones
  decay(): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        // Decay inbound pheromones
        this.inboundGrid[y][x] *= this.decayRate;
        if (this.inboundGrid[y][x] < 0.01) {
          this.inboundGrid[y][x] = 0;
        }

        // Decay outbound pheromones
        this.outboundGrid[y][x] *= this.decayRate;
        if (this.outboundGrid[y][x] < 0.01) {
          this.outboundGrid[y][x] = 0;
        }
      }
    }
  }

  // Draw the pheromone grid with higher color contrast for inbound and outbound trails
  draw(ctx: CanvasRenderingContext2D): void {
    const originalAlpha = ctx.globalAlpha;
    // Set transparency for pheromones
    ctx.globalAlpha = 0.2;

    // Draw inbound pheromones (vivid red)
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const inboundLevel = this.inboundGrid[y][x];
        if (inboundLevel > 0) {
          const intensity = Math.min(255, Math.floor(inboundLevel * 25));
          ctx.fillStyle = `rgb(${intensity}, 0, 0)`;
          ctx.fillRect(
            x * this.cellSize,
            y * this.cellSize,
            this.cellSize,
            this.cellSize
          );
        }
      }
    }

    // Draw outbound pheromones (vivid blue)
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const outboundLevel = this.outboundGrid[y][x];
        if (outboundLevel > 0) {
          const intensity = Math.min(255, Math.floor(outboundLevel * 25));
          ctx.fillStyle = `rgb(0, 0, ${intensity})`;
          ctx.fillRect(
            x * this.cellSize,
            y * this.cellSize,
            this.cellSize,
            this.cellSize
          );
        }
      }
    }

    // Restore original alpha
    ctx.globalAlpha = originalAlpha;
  }
}

class SimulationEngine {
  ants: Ant[];
  nest: Nest;
  width: number;
  height: number;
  isRunning: boolean;
  animationFrameId: number | null;
  pheromones: PheromoneGrid;
  foodSources: FoodSource[];
  lastFoodSpawnTime: number;
  foodSpawnInterval: number;

  // Simulation statistics
  simulationStartTime: number;
  totalFoodCollected: number;
  activeAnts: number;
  foragingAnts: number;
  returningAnts: number;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.ants = [];
    this.width = canvasWidth;
    this.height = canvasHeight;
    this.isRunning = false;
    this.animationFrameId = null;

    // Create nest in the center of the canvas by default
    this.nest = new Nest(canvasWidth / 2, canvasHeight / 2);

    // Initialize food sources array
    this.foodSources = [];
    this.lastFoodSpawnTime = Date.now();
    this.foodSpawnInterval = 10000; // 10 seconds between food spawns

    // Initialize pheromone grid
    this.pheromones = new PheromoneGrid(canvasWidth, canvasHeight);

    // Initialize statistics
    this.simulationStartTime = Date.now();
    this.totalFoodCollected = 0;
    this.activeAnts = 0;
    this.foragingAnts = 0;
    this.returningAnts = 0;
  }

  initialize(antCount: number = 20): void {
    this.ants = [];
    for (let i = 0; i < antCount; i++) {
      // Create ant from the nest
      const ant = this.nest.createAnt(i);
      ant.homeNest = this.nest; // Set the ant's home nest
      this.ants.push(ant);
    }

    // Clear existing food sources
    this.foodSources = [];
    this.spawnFoodSource();

    // Create initial food sources
    this.spawnFoodSource();
    this.spawnFoodSource();

    // Reset statistics
    this.simulationStartTime = Date.now();
    this.totalFoodCollected = 0;
    this.activeAnts = 0;
    this.foragingAnts = 0;
    this.returningAnts = 0;

    // Reset nest food counter
    this.nest.foodStored = 0;

    // Clear all pheromones
    this.resetPheromones();
  }

  // Create a random food source
  spawnFoodSource(): void {
    // Don't spawn too many food sources
    if (this.foodSources.length >= 10) return;

    // Find a position that's not too close to the nest
    let x, y, distToNest;
    let attempts = 0;
    do {
      x = Math.random() * this.width;
      y = Math.random() * this.height;
      distToNest = Math.sqrt(
        Math.pow(x - this.nest.x, 2) + Math.pow(y - this.nest.y, 2)
      );
      attempts++;
    } while (distToNest < this.nest.radius * 3 && attempts < 20);

    // Create and add the food source
    const foodAmount = 50 + Math.floor(Math.random() * 150); // Random food amount between 50 and 200
    const food = new FoodSource(x, y, foodAmount);
    this.foodSources.push(food);

    // Update last spawn time
    this.lastFoodSpawnTime = Date.now();
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
    // Apply pheromone decay
    this.pheromones.decay();

    // Check if it's time to spawn new food
    const currentTime = Date.now();
    if (currentTime - this.lastFoodSpawnTime > this.foodSpawnInterval) {
      this.spawnFoodSource();
    }

    // Remove depleted food sources
    this.foodSources = this.foodSources.filter((food) => !food.isDepleted());

    // Reset counters for this update cycle
    this.activeAnts = this.ants.length;
    this.foragingAnts = 0;
    this.returningAnts = 0;

    // Update all ants
    for (const ant of this.ants) {
      // Update ant behaviors
      ant.move(this.width, this.height, this.pheromones, this.foodSources);

      // Count ants by state
      if (ant.carryingFood && ant.returningToNest) {
        this.returningAnts++;
      } else {
        this.foragingAnts++;
      }
    }

    // Update total food collected based on nest's stored food
    this.totalFoodCollected = this.nest.foodStored;
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Clear canvas
    ctx.clearRect(0, 0, this.width, this.height);

    // Draw pheromone trails
    this.pheromones.draw(ctx);

    // Draw the nest
    this.nest.draw(ctx);

    // Draw all food sources
    for (const food of this.foodSources) {
      food.draw(ctx);
    }

    // Draw all ants
    for (const ant of this.ants) {
      ant.draw(ctx);
    }
  }

  animate(): void {
    if (!this.isRunning) return;

    this.update();
    this.render(document.querySelector('canvas')!.getContext('2d')!);
    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }

  // Get elapsed simulation time in seconds
  getElapsedTime(): number {
    return Math.floor((Date.now() - this.simulationStartTime) / 1000);
  }

  // Get formatted simulation time (MM:SS)
  getFormattedTime(): string {
    const totalSeconds = this.getElapsedTime();
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  }

  // Get ant activity stats
  getAntStats(): { total: number; foraging: number; returning: number } {
    return {
      total: this.activeAnts,
      foraging: this.foragingAnts,
      returning: this.returningAnts,
    };
  }

  // Get food statistics
  getFoodStats(): { collected: number; available: number } {
    // Calculate available food in all food sources
    const availableFood = this.foodSources.reduce(
      (total, food) => total + food.amount,
      0
    );

    return {
      collected: this.totalFoodCollected,
      available: availableFood,
    };
  }

  // Set pheromone decay rate
  setPheromoneDecayRate(rate: number): void {
    if (rate >= 0.9 && rate <= 0.999) {
      this.pheromones.decayRate = rate;
    }
  }

  // Set food spawn interval (in milliseconds)
  setFoodSpawnInterval(interval: number): void {
    if (interval >= 5000 && interval <= 30000) {
      this.foodSpawnInterval = interval;
    }
  }

  // Reset the pheromone grid
  resetPheromones(): void {
    // Reinitialize the pheromone grid with the same parameters
    this.pheromones = new PheromoneGrid(this.width, this.height);
  }
}

export { SimulationEngine, Ant, Nest, PheromoneGrid, FoodSource };
