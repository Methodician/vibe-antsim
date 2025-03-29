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

// Define Hunger State Enum (as suggested in phase-1.md)
export enum HungerState {
  FULL, // Recently fed, high energy
  NORMAL, // Adequate energy
  HUNGRY, // Low energy, seeking food
  STARVING, // Critical energy, returning to nest or death imminent
}

class Ant {
  id: number;
  x: number;
  y: number;
  direction: number;
  speed: number;
  baseSpeed: number; // Store base speed separately
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

  // --- New Energy Properties ---
  energy: number;
  maxEnergy: number;
  energyConsumptionRate: number; // Base rate per update tick
  hungerState: HungerState;
  starvationThreshold: number; // Energy level that triggers starvation behavior
  criticalEnergyThreshold: number; // Energy level below which death occurs (usually 0)
  isDead: boolean; // Flag for death state
  // --- End New Energy Properties ---

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
    this.baseSpeed = 1.5 + Math.random() * 0.5; // Base speed
    this.speed = this.baseSpeed; // Initial speed
    this.color = '#333'; // Dark grey
    this.size = 4;
    this.hasTurnedRecently = false;
    this.homeNest = null; // Will be set by SimulationEngine
    this.returningToNest = false;
    this.carryingFood = false;
    this.foodAmount = 0;
    this.sensorAngle = Math.PI / 4; // 45 degrees sensor spread
    this.sensorDistance = 30;
    this.targetFood = null;

    // --- Initialize Energy Properties ---
    this.maxEnergy = 1000; // Example value, adjust as needed
    this.energy = this.maxEnergy;
    this.energyConsumptionRate = 0.2; // Example base consumption rate per tick
    this.hungerState = HungerState.FULL;
    this.starvationThreshold = this.maxEnergy * 0.2; // e.g., 20% energy
    this.criticalEnergyThreshold = 0;
    this.isDead = false;
    // --- End Initialize Energy Properties ---
  }

  // --- New Energy Methods ---
  consumeEnergy(amount: number): void {
    if (this.isDead) return;
    this.energy -= amount;
    if (this.energy <= this.criticalEnergyThreshold) {
      this.energy = 0;
      this.die();
    }
  }

  restoreEnergy(amount: number): void {
    // Note: Actual restoration logic will be tied to Phase 2 (feeding at nest)
    // For now, this method exists but isn't called in the default flow.
    if (this.isDead) return;
    this.energy = Math.min(this.maxEnergy, this.energy + amount);
    this.updateHungerState(); // Update state after potentially gaining energy
  }

  updateHungerState(): void {
    if (this.isDead) return;
    const energyRatio = this.energy / this.maxEnergy;

    if (energyRatio <= this.criticalEnergyThreshold / this.maxEnergy) {
      // Already handled by consumeEnergy -> die()
    } else if (energyRatio <= this.starvationThreshold / this.maxEnergy) {
      this.hungerState = HungerState.STARVING;
    } else if (energyRatio <= 0.5) {
      // Example: below 50% is hungry
      this.hungerState = HungerState.HUNGRY;
    } else if (energyRatio <= 0.9) {
      // Example: 50-90% is normal
      this.hungerState = HungerState.NORMAL;
    } else {
      this.hungerState = HungerState.FULL; // Above 90% is full
    }
  }

  adjustSpeedByEnergy(): void {
    if (this.isDead) return;
    // Reduce speed when low on energy, slightly faster when full?
    const energyRatio = this.energy / this.maxEnergy;
    if (this.hungerState === HungerState.STARVING) {
      this.speed = this.baseSpeed * 0.7; // Slower when starving
    } else if (this.hungerState === HungerState.HUNGRY) {
      this.speed = this.baseSpeed * 0.9; // Slightly slower when hungry
    } else {
      this.speed = this.baseSpeed; // Normal speed otherwise
      // Optionally slightly faster when FULL:
      // this.speed = this.baseSpeed * (this.hungerState === HungerState.FULL ? 1.1 : 1.0);
    }
  }

  die(): void {
    this.isDead = true;
    this.speed = 0;
    // Optional: Change color or visual state to indicate death
    this.color = '#8B0000'; // Dark red
    // Stop any ongoing actions
    this.carryingFood = false;
    this.returningToNest = false;
    this.targetFood = null;
    // Potentially drop food if carrying? Not specified, leaving as is.
  }
  // --- End New Energy Methods ---

  move(
    width: number,
    height: number,
    pheromones: PheromoneGrid,
    foodSources: FoodSource[] = []
  ): void {
    if (this.isDead) return; // Don't move if dead

    // --- Energy Consumption ---
    let currentConsumption = this.energyConsumptionRate;
    // Moving consumes base energy
    currentConsumption += this.speed * 0.1; // Cost increases with speed
    if (this.carryingFood) {
      currentConsumption *= 1.5; // Carrying food costs more
    }
    this.consumeEnergy(currentConsumption);
    // Check if died from consumption
    if (this.isDead) return;
    // --- End Energy Consumption ---

    // --- Update State Based on Energy ---
    this.updateHungerState();
    this.adjustSpeedByEnergy();
    // --- End Update State Based on Energy ---

    // --- Behavior Modifications Based on Hunger ---
    // Starving ants prioritize returning to the nest
    if (this.hungerState === HungerState.STARVING && !this.returningToNest) {
      console.log(`Ant ${this.id} is starving, returning to nest.`);
      this.returningToNest = true;
      this.carryingFood = false; // Drop food if starving
      this.foodAmount = 0;
      this.targetFood = null; // Stop targeting food
    }

    // Hungry ants prioritize looking for food if not already carrying/returning
    // (This is implicitly handled by the existing logic, but could be strengthened)
    // e.g., increase sensor range or sensitivity when hungry but not starving.
    // --- End Behavior Modifications ---

    // Original movement logic starts here...
    // ... (rest of the move method, including wall avoidance, pheromone following, food seeking) ...
    // ... Ensure that state changes like this.returningToNest = true trigger appropriate pheromone following ...

    // Example modification: Ensure returning ants follow OUTBOUND trails
    if (this.returningToNest) {
      // Check if near nest
      if (
        this.homeNest &&
        Math.hypot(this.x - this.homeNest.x, this.y - this.homeNest.y) <
          this.homeNest.radius + 10
      ) {
        if (this.carryingFood) {
          this.homeNest.storeFood(this.foodAmount);
          this.foodAmount = 0;
          this.carryingFood = false;
          // If starving, stay near nest (or implement feeding in Phase 2)
          // If just returning with food, turn around
          if (this.hungerState !== HungerState.STARVING) {
            this.returningToNest = false;
            this.direction += Math.PI; // Turn around
          } else {
            // Starving ant reached nest - currently does nothing until Phase 2 feeding
            // Could potentially just stop moving or wander near nest
            this.speed = 0; // Stop for now
          }
        } else {
          // Arrived at nest without food (likely starving)
          // Wait for Phase 2 feeding. For now, just stop.
          this.speed = 0;
          // Could potentially despawn or have different behavior here.
          // If NOT starving but returned for other reasons?
          if (this.hungerState !== HungerState.STARVING) {
            this.returningToNest = false; // No longer needs to return
          }
        }
      } else {
        // Follow OUTBOUND pheromones back to the nest
        this.followPheromoneTrail(pheromones, PheromoneType.OUTBOUND);
        // Lay down INBOUND pheromones if carrying food (original logic)
        // If starving and returning, should it lay pheromones? Phase 1 plan doesn't specify. Let's assume not.
        if (this.carryingFood) {
          pheromones.addPheromone(this.x, this.y, 1, PheromoneType.INBOUND);
        }
      }
    } else if (this.carryingFood) {
      // This part should be mostly covered by setting returningToNest = true when picking food
      // Redundant check for safety:
      if (!this.returningToNest) this.returningToNest = true;
      pheromones.addPheromone(this.x, this.y, 1, PheromoneType.INBOUND);
    } else {
      // Not returning, not carrying food: Explore / Seek Food
      this.lookForFood(foodSources);
      if (!this.targetFood) {
        // Follow INBOUND pheromones away from the nest if not targeting food
        this.followPheromoneTrail(pheromones, PheromoneType.INBOUND);
        // Lay down OUTBOUND pheromones when exploring
        pheromones.addPheromone(this.x, this.y, 1, PheromoneType.OUTBOUND);
      } else {
        // Moving towards food, potentially lay weaker outbound trail or none?
        // Let's stick with laying outbound for now.
        pheromones.addPheromone(this.x, this.y, 1, PheromoneType.OUTBOUND);
      }
    }

    // ... (rest of move logic: moveTowardsFood, wall avoidance, update position) ...
    // Make sure to check !this.isDead before updating position
    if (!this.isDead) {
      // Update position based on direction and speed
      this.x += Math.cos(this.direction) * this.speed;
      this.y += Math.sin(this.direction) * this.speed;

      // Wall avoidance / boundary checks
      let bounced = false;
      let turned = false;
      const margin = 5; // Distance from edge to start turning

      // Left wall
      if (this.x < margin) {
        this.x = margin;
        this.direction = Math.PI - this.direction;
        bounced = true;
      }
      // Right wall
      else if (this.x > width - margin) {
        this.x = width - margin;
        this.direction = Math.PI - this.direction;
        bounced = true;
      }

      // Top wall
      if (this.y < margin) {
        this.y = margin;
        this.direction = -this.direction;
        bounced = true;
      }
      // Bottom wall
      else if (this.y > height - margin) {
        this.y = height - margin;
        this.direction = -this.direction;
        bounced = true;
      }

      // Normalize direction after bounce
      if (bounced) {
        this.direction = Math.atan2(
          Math.sin(this.direction),
          Math.cos(this.direction)
        );
        this.hasTurnedRecently = true; // Treat bounce as a turn to prevent sticking
        setTimeout(() => {
          this.hasTurnedRecently = false;
        }, 150); // Longer cooldown after bounce
      }

      // Prevent getting stuck in corners / rapid turning
      if (turned) {
        this.hasTurnedRecently = true;
        setTimeout(() => {
          this.hasTurnedRecently = false;
        }, 100); // Reset after a short duration
      }
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
    // Random chance to ignore pheromones
    if (Math.random() < 0.01) {
      this.direction += (Math.random() - 0.5) * 2.0;
      return;
    }
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

    // If pheromones lead nowhere for too long, reset ant direction
    if (Math.random() < 0.001) {
      this.direction = Math.random() * Math.PI * 2;
      // Possibly reset returningToNest or carryingFood if stuck
    }
  }

  draw(ctx: CanvasRenderingContext2D, debugMode: boolean = false): void {
    if (this.isDead && !debugMode) return; // Don't draw dead ants unless debugging

    // Determine color based on state
    let antColor;
    if (this.isDead) {
      antColor = '#4d0000'; // Darker red for dead ant body
    } else {
      switch (this.hungerState) {
        case HungerState.FULL:
          antColor = '#333333'; // Normal dark grey
          break;
        case HungerState.NORMAL:
          antColor = '#555555'; // Lighter grey
          break;
        case HungerState.HUNGRY:
          antColor = '#FFA500'; // Orange for hungry
          break;
        case HungerState.STARVING:
          antColor = '#FF0000'; // Red for starving
          break;
        default:
          antColor = this.color; // Fallback to original color
      }
    }

    // Draw ant body
    ctx.fillStyle = antColor;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();

    // Draw direction indicator (optional, keep from original if desired)
    const dirX = this.x + Math.cos(this.direction) * (this.size + 2);
    const dirY = this.y + Math.sin(this.direction) * (this.size + 2);
    ctx.strokeStyle = '#FFF'; // White direction line
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(dirX, dirY);
    ctx.stroke();

    // Draw energy level indicator (small bar above ant)
    if (!this.isDead) {
      const energyRatio = this.energy / this.maxEnergy;
      const barWidth = this.size * 2;
      const barHeight = 2;
      const barX = this.x - barWidth / 2;
      const barY = this.y - this.size - 4;

      // Background of the bar (empty part)
      ctx.fillStyle = '#555'; // Dark grey background
      ctx.fillRect(barX, barY, barWidth, barHeight);

      // Filled part of the bar
      const energyBarColor =
        energyRatio > 0.5
          ? '#00FF00'
          : energyRatio > 0.2
          ? '#FFFF00'
          : '#FF0000'; // Green > Yellow > Red
      ctx.fillStyle = energyBarColor;
      ctx.fillRect(barX, barY, barWidth * energyRatio, barHeight);
    }

    // Draw carrying food indicator
    if (this.carryingFood) {
      ctx.fillStyle = '#00FF00'; // Green dot for food
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- Debug Mode Visualizations ---
    if (debugMode) {
      // Draw hunger state text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '8px Arial';
      ctx.textAlign = 'center';
      const stateText = this.isDead ? 'DEAD' : HungerState[this.hungerState];
      ctx.fillText(
        stateText,
        this.x,
        this.y + this.size + 8 // Below the ant
      );

      // Draw energy value
      if (!this.isDead) {
        ctx.fillText(
          `${Math.round(this.energy)}/${this.maxEnergy}`,
          this.x,
          this.y + this.size + 18 // Further below
        );
      }

      // Draw sensor lines (optional, keep from original if desired)
      // ... existing sensor drawing logic ...
    }
    ctx.textAlign = 'start'; // Reset text align
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
  diffusionRate: number = 0.05;

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
    this.diffusionRate = 0.05; // Initialize here too

    // Initialize grids with zeros
    this.inboundGrid = Array(this.height)
      .fill(0)
      .map(() => Array(this.width).fill(0));
    this.outboundGrid = Array(this.height)
      .fill(0)
      .map(() => Array(this.width).fill(0));
  }

  // --- New Reset Method ---
  reset(): void {
    // Re-initialize grids with zeros
    this.inboundGrid = Array(this.height)
      .fill(0)
      .map(() => Array(this.width).fill(0));
    this.outboundGrid = Array(this.height)
      .fill(0)
      .map(() => Array(this.width).fill(0));
  }
  // --- End New Reset Method ---

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

        // Random diffusion of inbound pheromones
        if (this.inboundGrid[y][x] > 0 && Math.random() < 0.01) {
          const neighbor = this.getRandomNeighbor(x, y);
          const moveAmount = this.inboundGrid[y][x] * this.diffusionRate;
          this.inboundGrid[y][x] -= moveAmount;
          this.inboundGrid[neighbor.y][neighbor.x] += moveAmount;
        }

        // Random diffusion of outbound pheromones
        if (this.outboundGrid[y][x] > 0 && Math.random() < 0.01) {
          const neighbor = this.getRandomNeighbor(x, y);
          const moveAmount = this.outboundGrid[y][x] * this.diffusionRate;
          this.outboundGrid[y][x] -= moveAmount;
          this.outboundGrid[neighbor.y][neighbor.x] += moveAmount;
        }
      }
    }
  }

  // Helper method for random diffusion
  getRandomNeighbor(x: number, y: number): { x: number; y: number } {
    const offsets = [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
    ];
    const choice = offsets[Math.floor(Math.random() * offsets.length)];
    const nx = Math.min(Math.max(x + choice.x, 0), this.width - 1);
    const ny = Math.min(Math.max(y + choice.y, 0), this.height - 1);
    return { x: nx, y: ny };
  }

  // Draw the pheromone grid with higher color contrast for inbound and outbound trails
  draw(ctx: CanvasRenderingContext2D): void {
    const originalAlpha = ctx.globalAlpha;

    // Draw inbound pheromones at full red with variable alpha
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const inboundLevel = this.inboundGrid[y][x];
        if (inboundLevel > 0) {
          const inboundAlpha = Math.min(1, inboundLevel * 0.1);
          ctx.globalAlpha = inboundAlpha;
          ctx.fillStyle = 'rgb(0, 162, 24)';
          ctx.fillRect(
            x * this.cellSize,
            y * this.cellSize,
            this.cellSize,
            this.cellSize
          );
        }
      }
    }

    // Draw outbound pheromones at full blue with variable alpha
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const outboundLevel = this.outboundGrid[y][x];
        if (outboundLevel > 0) {
          const outboundAlpha = Math.min(1, outboundLevel * 0.1);
          ctx.globalAlpha = outboundAlpha;
          ctx.fillStyle = 'rgb(106, 55, 246)';
          ctx.fillRect(
            x * this.cellSize,
            y * this.cellSize,
            this.cellSize,
            this.cellSize
          );
        }
      }
    }

    // Restore alpha
    ctx.globalAlpha = originalAlpha;
  }

  // --- New Diffuse Method ---
  diffuse(): void {
    if (this.diffusionRate <= 0) return;

    const diffuseGrid = (grid: number[][]): number[][] => {
      const newGrid = grid.map((row) => [...row]); // Create a copy to read from

      for (let r = 0; r < this.height; r++) {
        for (let c = 0; c < this.width; c++) {
          let totalPheromone = 0;
          let neighborCount = 0;

          // Check neighbors (including diagonals)
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue; // Skip self

              const nr = r + dr;
              const nc = c + dc;

              if (nr >= 0 && nr < this.height && nc >= 0 && nc < this.width) {
                totalPheromone += grid[nr][nc]; // Use original grid value for calculation
                neighborCount++;
              }
            }
          }

          if (neighborCount > 0) {
            // Calculate diffused amount: (average neighbor value - current value) * rate
            const averageNeighbor = totalPheromone / neighborCount;
            const currentVal = grid[r][c]; // Use original value
            const diffusedAmount =
              (averageNeighbor - currentVal) * this.diffusionRate;
            newGrid[r][c] = Math.max(0, currentVal + diffusedAmount); // Apply diffusion to the copy, clamp at 0
          }
        }
      }
      return newGrid; // Return the updated grid
    };

    this.inboundGrid = diffuseGrid(this.inboundGrid);
    this.outboundGrid = diffuseGrid(this.outboundGrid);
  }
  // --- End New Diffuse Method ---
}

class SimulationEngine {
  ants: Ant[];
  nest: Nest;
  width: number;
  height: number;
  isRunning: boolean;
  pheromones: PheromoneGrid;
  foodSources: FoodSource[];
  lastFoodSpawnTime: number;
  foodSpawnInterval: number;

  // --- Statistics ---
  simulationStartTime: number;
  totalFoodCollected: number;
  activeAnts: number; // Will now reflect non-dead ants
  foragingAnts: number;
  returningAnts: number;
  starvationDeaths: number; // New stat
  // --- End Statistics ---

  debugMode: boolean = false; // Add debug mode flag

  constructor(canvasWidth: number, canvasHeight: number) {
    this.width = canvasWidth;
    this.height = canvasHeight;
    this.ants = [];
    this.nest = new Nest(this.width / 2, this.height / 2); // Default position
    this.isRunning = false;
    this.pheromones = new PheromoneGrid(
      this.width,
      this.height,
      5, // Cell size
      0.995 // Default decay rate
    );
    this.foodSources = [];
    this.lastFoodSpawnTime = 0;
    this.foodSpawnInterval = 10000; // Default interval (10 seconds)

    // --- Initialize Stats ---
    this.simulationStartTime = 0;
    this.totalFoodCollected = 0;
    this.activeAnts = 0;
    this.foragingAnts = 0;
    this.returningAnts = 0;
    this.starvationDeaths = 0; // Initialize starvation deaths
    // --- End Initialize Stats ---
  }

  initialize(antCount: number = 20): void {
    this.ants = [];
    this.foodSources = [];
    this.pheromones.reset(); // Reset pheromones completely

    // Reset stats
    this.simulationStartTime = Date.now();
    this.totalFoodCollected = 0;
    this.starvationDeaths = 0; // Reset deaths on initialize
    this.nest.foodStored = 0; // Reset nest food storage

    // Create ants near the nest
    for (let i = 0; i < antCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * (this.nest.radius * 0.8);
      const antX = this.nest.x + Math.cos(angle) * radius;
      const antY = this.nest.y + Math.sin(angle) * radius;

      const ant = new Ant(i, antX, antY);
      ant.homeNest = this.nest; // Assign home nest
      this.ants.push(ant);
    }

    // Initial food sources
    this.spawnFoodSource();
    this.spawnFoodSource();
    this.lastFoodSpawnTime = Date.now();

    // Initial stat update (REMOVED - stats are reset above)
    // this.updateStats();
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
      if (this.simulationStartTime === 0) {
        // If starting from a paused state after initialization but before first run
        this.simulationStartTime = Date.now() - this.getElapsedTime() * 1000; // Preserve elapsed time
      } else if (this.ants.length > 0 && this.activeAnts === 0) {
        // If starting after being stopped, reset start time offset
        this.simulationStartTime = Date.now();
      }
    }
  }

  stop(): void {
    if (this.isRunning) {
      this.isRunning = false;
      // Store elapsed time to resume correctly potentially (handled in start)
    }
  }

  update(): void {
    if (!this.isRunning) return;

    const now = Date.now();

    // Update pheromones (decay and diffusion)
    this.pheromones.decay();
    this.pheromones.diffuse(); // Call diffusion if implemented

    // Update ants
    let currentActive = 0;
    let currentForaging = 0;
    let currentReturning = 0;
    let newlyDead = 0;

    // Use a standard loop, as modifying array during iteration can be tricky
    for (let i = 0; i < this.ants.length; i++) {
      const ant = this.ants[i];
      if (!ant.isDead) {
        ant.move(this.width, this.height, this.pheromones, this.foodSources);
        // Check again if ant died during move()
        if (!ant.isDead) {
          currentActive++;
          if (ant.carryingFood || ant.returningToNest) {
            currentReturning++;
          } else {
            currentForaging++;
          }
        } else {
          newlyDead++; // Count ants that died this frame
        }
      }
    }

    // --- Remove Dead Ants ---
    // Filter out dead ants AFTER the update loop
    const previousAntCount = this.ants.length;
    this.ants = this.ants.filter((ant) => !ant.isDead);
    const deadThisFrame = previousAntCount - this.ants.length; // More accurate count of removed ants
    this.starvationDeaths += deadThisFrame;
    // --- End Remove Dead Ants ---

    // Update food sources (e.g., check depletion, maybe regrowth later)
    this.foodSources = this.foodSources.filter((fs) => !fs.isDepleted());

    // Spawn new food periodically
    if (now - this.lastFoodSpawnTime > this.foodSpawnInterval) {
      this.spawnFoodSource();
      this.lastFoodSpawnTime = now;
    }

    // Update stats for display
    this.activeAnts = this.ants.length; // Update active count after filtering
    this.foragingAnts = currentForaging;
    this.returningAnts = currentReturning;
    // totalFoodCollected is updated within ant.move when dropping food at nest
    // averageColonyEnergy calculation (optional for now, more relevant in Phase 2)
    /*
    let totalEnergy = 0;
    this.ants.forEach(ant => { totalEnergy += ant.energy; });
    this.averageColonyEnergy = this.ants.length > 0 ? totalEnergy / this.ants.length : 0;
    */
  }

  // Update render to pass debugMode
  render(ctx: CanvasRenderingContext2D): void {
    // Clear canvas
    ctx.clearRect(0, 0, this.width, this.height);

    // Draw background elements if any (e.g., pheromones in debug mode)
    if (this.debugMode) {
      this.pheromones.draw(ctx);
    }

    // Draw Nest
    this.nest.draw(ctx);

    // Draw Food Sources
    this.foodSources.forEach((food) => food.draw(ctx));

    // Draw Ants
    // Draw living ants first
    this.ants.forEach((ant) => {
      if (!ant.isDead) {
        ant.draw(ctx, this.debugMode);
      }
    });
    // Draw dead ants on top if in debug mode
    if (this.debugMode) {
      this.ants.forEach((ant) => {
        if (ant.isDead) {
          ant.draw(ctx, this.debugMode);
        }
      });
    }
  }

  // Update Stats Getters
  getElapsedTime(): number {
    if (this.simulationStartTime === 0) return 0;
    // If running, calculate from start time. If stopped, use the time when stop was called?
    // For simplicity, assume Date.now() works whether running or stopped to show last known elapsed time.
    return (Date.now() - this.simulationStartTime) / 1000; // in seconds
  }

  getFormattedTime(): string {
    const totalSeconds = Math.floor(this.getElapsedTime());
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
      2,
      '0'
    )}`;
  }

  getAntStats(): {
    total: number;
    foraging: number;
    returning: number;
    dead: number;
  } {
    // Recalculate on demand to ensure accuracy after updates/filtering
    let foraging = 0;
    let returning = 0;
    this.ants.forEach((ant) => {
      if (!ant.isDead) {
        // Only count living ants for foraging/returning
        if (ant.carryingFood || ant.returningToNest) {
          returning++;
        } else {
          foraging++;
        }
      }
    });
    return {
      total: this.ants.length, // Total living ants
      foraging: foraging,
      returning: returning,
      dead: this.starvationDeaths, // Total accumulated deaths
    };
  }

  // getFoodStats remains largely the same, but ensure nest food is accurate
  getFoodStats(): { collected: number; available: number } {
    const available = this.foodSources.reduce(
      (sum, source) => sum + source.amount,
      0
    );
    // collected should reflect food stored in the nest
    return {
      collected: this.nest.foodStored,
      available: Math.round(available),
    };
  }

  // --- New Methods ---
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  // Add methods to set new parameters if needed (e.g., energy consumption rate)
  setEnergyConsumptionRate(rate: number): void {
    this.ants.forEach((ant) => (ant.energyConsumptionRate = rate));
    // Maybe store a default rate to apply to new ants?
  }

  // --- End New Methods ---

  // --- Add Missing Setters ---
  setPheromoneDecayRate(rate: number): void {
    if (this.pheromones) {
      this.pheromones.decayRate = rate;
    }
  }

  setFoodSpawnInterval(interval: number): void {
    this.foodSpawnInterval = interval;
  }

  setDiffusionRate(rate: number): void {
    if (this.pheromones) {
      this.pheromones.diffusionRate = rate;
    }
  }
  // --- End Missing Setters ---

  // ... existing setPheromoneDecayRate, setFoodSpawnInterval, resetPheromones, setDiffusionRate methods ...
}

export { SimulationEngine, Ant, Nest, PheromoneGrid, FoodSource };
