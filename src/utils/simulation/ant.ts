// Represents individual ants in the simulation

import { Nest } from './nest';
import { FoodSource } from './foodSource';
import { PheromoneGrid, PheromoneType } from './pheromoneGrid';

// Define Hunger State Enum
export enum HungerState {
  FULL, // Recently fed, high energy
  NORMAL, // Adequate energy
  HUNGRY, // Low energy, seeking food
  STARVING, // Critical energy, returning to nest or death imminent
}

export class Ant {
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

  // --- Energy Properties ---
  energy: number;
  maxEnergy: number;
  energyConsumptionRate: number; // Base rate per update tick
  hungerState: HungerState;
  starvationThreshold: number; // Energy level that triggers starvation behavior
  criticalEnergyThreshold: number; // Energy level below which death occurs (usually 0)
  isDead: boolean; // Flag for death state
  // --- End Energy Properties ---

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

  // --- Energy Methods ---
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
  // --- End Energy Methods ---

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
      // console.log(`Ant ${this.id} is starving, returning to nest.`); // Optional logging
      this.returningToNest = true;
      this.carryingFood = false; // Drop food if starving
      this.foodAmount = 0;
      this.targetFood = null; // Stop targeting food
    }

    // --- Movement Logic ---

    // Prioritize moving towards targeted food if set
    if (this.targetFood) {
      this.moveTowardsFood();
    }

    // Handle returning to nest behavior
    if (this.returningToNest) {
      // Check if near nest
      if (
        this.homeNest &&
        Math.hypot(this.x - this.homeNest.x, this.y - this.homeNest.y) <
          this.homeNest.radius + 5 // Reduced range for arrival check
      ) {
        if (this.carryingFood) {
          this.homeNest.storeFood(this.foodAmount);
          this.totalFoodCollected += this.foodAmount; // Update simulation-wide stat
          this.foodAmount = 0;
          this.carryingFood = false;
          this.color = '#333'; // Reset color after dropping food

          // If starving, stay near nest (or implement feeding in Phase 2)
          // If just returning with food, turn around
          if (this.hungerState !== HungerState.STARVING) {
            this.returningToNest = false;
            this.direction += Math.PI + (Math.random() - 0.5) * 0.5; // Turn around with slight randomness
          } else {
            // Starving ant reached nest - currently stops until Phase 2 feeding
            this.speed = 0; // Stop movement
            // Could eventually transition to a 'feeding' state here
          }
        } else {
          // Arrived at nest without food (likely starving or lost target)
          if (this.hungerState === HungerState.STARVING) {
            // Starving ant reached nest - stop until Phase 2 feeding
            this.speed = 0;
          } else {
            // Returned for other reasons (e.g., lost target), turn around and explore
            this.returningToNest = false;
            this.direction += Math.PI + (Math.random() - 0.5) * 0.5;
          }
        }
      } else if (this.homeNest) {
        // Not at nest yet, move towards it
        const dx = this.homeNest.x - this.x;
        const dy = this.homeNest.y - this.y;
        const angleToNest = Math.atan2(dy, dx);
        const angleDiff = angleToNest - this.direction;
        const normalizedAngleDiff = Math.atan2(
          Math.sin(angleDiff),
          Math.cos(angleDiff)
        );
        this.direction += normalizedAngleDiff * 0.2; // Gentle turn towards nest

        // Optionally follow OUTBOUND pheromones back (helps find the way)
        this.followPheromoneTrail(pheromones, PheromoneType.OUTBOUND, 0.1); // Lower weight when directly homing

        // Lay down INBOUND pheromones if carrying food
        if (this.carryingFood) {
          pheromones.addPheromone(this.x, this.y, 2, PheromoneType.INBOUND); // Stronger signal when carrying
        }
      }
    }
    // Explore / Seek Food / Follow Trail if not returning and not actively moving to food
    else if (!this.targetFood) {
      this.lookForFood(foodSources); // Check for nearby food first
      if (!this.targetFood) {
        // If still no target after looking
        // Follow INBOUND pheromones (strongest signals likely lead to food)
        this.followPheromoneTrail(pheromones, PheromoneType.INBOUND, 0.3); // Higher weight for trail following

        // Add some random turning to prevent getting stuck
        if (Math.random() < 0.1) {
          this.direction += (Math.random() - 0.5) * 0.5;
        }

        // Lay down OUTBOUND pheromones when exploring
        pheromones.addPheromone(this.x, this.y, 1, PheromoneType.OUTBOUND);
      } else {
        // Found food via lookForFood, lay outbound pheromone while approaching
        pheromones.addPheromone(this.x, this.y, 1, PheromoneType.OUTBOUND);
      }
    }

    // --- Update Position & Wall Avoidance ---
    // Normalize direction before moving
    this.direction = Math.atan2(
      Math.sin(this.direction),
      Math.cos(this.direction)
    );

    // Update position based on direction and speed
    this.x += Math.cos(this.direction) * this.speed;
    this.y += Math.sin(this.direction) * this.speed;

    // Wall avoidance / boundary checks
    const margin = 5; // Distance from edge to start turning
    let bounced = false;

    // Left wall
    if (this.x < margin) {
      this.x = margin;
      this.direction = Math.PI - this.direction + (Math.random() - 0.5) * 0.2; // Add randomness on bounce
      bounced = true;
    }
    // Right wall
    else if (this.x > width - margin) {
      this.x = width - margin;
      this.direction = Math.PI - this.direction + (Math.random() - 0.5) * 0.2;
      bounced = true;
    }

    // Top wall
    if (this.y < margin) {
      this.y = margin;
      this.direction = -this.direction + (Math.random() - 0.5) * 0.2;
      bounced = true;
    }
    // Bottom wall
    else if (this.y > height - margin) {
      this.y = height - margin;
      this.direction = -this.direction + (Math.random() - 0.5) * 0.2;
      bounced = true;
    }

    // Normalize direction after bounce
    if (bounced) {
      this.direction = Math.atan2(
        Math.sin(this.direction),
        Math.cos(this.direction)
      );
      this.hasTurnedRecently = true;
      // Use a simple flag reset mechanism instead of setTimeout for performance
      // This requires a check at the start of the turn logic potentially.
      // For now, let's remove the setTimeout. We can add a counter if needed.
    } else {
      this.hasTurnedRecently = false; // Reset if no bounce occurred
    }
  } // End move method

  // Look for food nearby
  lookForFood(foodSources: FoodSource[]): void {
    // Only look for food if not carrying, not returning, and food exists
    if (
      this.carryingFood ||
      this.returningToNest ||
      foodSources.length === 0 ||
      this.targetFood
    )
      return;

    let closestFood: FoodSource | null = null;
    let minDistanceSq = this.sensorDistance * this.sensorDistance * 4; // Check within double sensor range initially

    for (const food of foodSources) {
      if (food.isDepleted()) continue;

      const dx = food.x - this.x;
      const dy = food.y - this.y;
      const distSq = dx * dx + dy * dy;

      // If within sensing range, consider this food
      if (distSq < minDistanceSq) {
        minDistanceSq = distSq;
        closestFood = food;
      }
    }

    // If found food within range, target it
    if (closestFood) {
      this.targetFood = closestFood;
    }
    // Add small chance to randomly "smell" food further away
    else if (foodSources.length > 0 && Math.random() < 0.005) {
      const randomFood =
        foodSources[Math.floor(Math.random() * foodSources.length)];
      if (!randomFood.isDepleted()) {
        // Check if it's reasonably far but not *too* far
        const dx = randomFood.x - this.x;
        const dy = randomFood.y - this.y;
        const distSq = dx * dx + dy * dy;
        if (
          distSq < (this.sensorDistance * 10) ** 2 &&
          distSq > minDistanceSq
        ) {
          // Within 10x sensor range
          this.targetFood = randomFood;
        }
      }
    }
  }

  // Move towards targeted food
  moveTowardsFood(): void {
    if (!this.targetFood || this.targetFood.isDepleted()) {
      this.targetFood = null; // Clear target if it's gone or depleted
      return;
    }

    // Calculate direction to food
    const dx = this.targetFood.x - this.x;
    const dy = this.targetFood.y - this.y;
    const distanceToFood = Math.sqrt(dx * dx + dy * dy);
    const angleToFood = Math.atan2(dy, dx);

    // Gradually turn towards food
    const angleDiff = angleToFood - this.direction;
    const normalizedAngleDiff = Math.atan2(
      Math.sin(angleDiff),
      Math.cos(angleDiff)
    );
    // Turn faster when closer or angle difference is larger
    const turnSpeed = Math.max(0.1, 0.5 * Math.abs(normalizedAngleDiff)); // Adjust turn speed dynamically
    this.direction += normalizedAngleDiff * turnSpeed;

    // Check if we've reached the food source radius
    if (distanceToFood < this.targetFood.radius + this.size) {
      // Use combined radius
      this.collectFood();
    }
  }

  // Collect food from the target food source
  collectFood(): void {
    if (!this.targetFood || this.targetFood.isDepleted()) {
      this.targetFood = null;
      return;
    }

    // Collect a fixed amount for simplicity now, could be variable later
    const amountToTake = 10; // Example: take 10 units
    this.foodAmount = this.targetFood.takeFood(amountToTake);

    if (this.foodAmount > 0) {
      // Start returning to nest
      this.carryingFood = true;
      this.returningToNest = true;
      this.color = '#cc6600'; // Brownish orange when carrying food
      this.targetFood = null; // Stop targeting this food source
      // Turn around to head back towards the general direction of the nest (initial turn)
      if (this.homeNest) {
        const angleToNest = Math.atan2(
          this.homeNest.y - this.y,
          this.homeNest.x - this.x
        );
        this.direction = angleToNest + (Math.random() - 0.5) * 0.2; // Head towards nest +/- randomness
      } else {
        this.direction += Math.PI; // Simple 180 turn if nest isn't set (shouldn't happen)
      }
    } else {
      // Food source might be depleted just as we arrived
      this.targetFood = null; // Reset target
    }
  }

  // Method to help ants follow pheromone trails
  followPheromoneTrail(
    pheromones: PheromoneGrid,
    type: PheromoneType,
    weight: number = 0.5
  ): void {
    if (this.hasTurnedRecently) return; // Don't check trails immediately after a bounce/turn

    // Define sensor points relative to ant's direction
    const sensorDist = this.sensorDistance;
    const sensorAngleRad = this.sensorAngle; // Use the class property

    const aheadX = this.x + Math.cos(this.direction) * sensorDist;
    const aheadY = this.y + Math.sin(this.direction) * sensorDist;
    const leftX =
      this.x + Math.cos(this.direction - sensorAngleRad) * sensorDist;
    const leftY =
      this.y + Math.sin(this.direction - sensorAngleRad) * sensorDist;
    const rightX =
      this.x + Math.cos(this.direction + sensorAngleRad) * sensorDist;
    const rightY =
      this.y + Math.sin(this.direction + sensorAngleRad) * sensorDist;

    // Get pheromone levels at sensor points
    const aheadPheromone = pheromones.getPheromone(aheadX, aheadY, type);
    const leftPheromone = pheromones.getPheromone(leftX, leftY, type);
    const rightPheromone = pheromones.getPheromone(rightX, rightY, type);

    const totalPheromone = leftPheromone + aheadPheromone + rightPheromone;

    // If no pheromones detected nearby, apply slight random turn
    if (totalPheromone < 0.1) {
      // Use a small threshold
      if (Math.random() < 0.15) {
        // Increase random turn chance slightly
        this.direction += (Math.random() - 0.5) * 0.4; // Slightly wider random turn
      }
      return;
    }

    // Steer towards stronger pheromones
    const turnStrength = 0.3 * weight; // Base turning strength modified by weight
    let turnAdjustment = 0;

    if (leftPheromone > aheadPheromone && leftPheromone > rightPheromone) {
      // Strongest left
      turnAdjustment = -turnStrength * (leftPheromone / totalPheromone); // Weighted turn based on relative strength
    } else if (
      rightPheromone > aheadPheromone &&
      rightPheromone > leftPheromone
    ) {
      // Strongest right
      turnAdjustment = turnStrength * (rightPheromone / totalPheromone); // Weighted turn
    }
    // If ahead is strongest or equal, continue mostly straight (small adjustment is fine)
    else if (aheadPheromone > 0) {
      // Bias towards moving forward if pheromones exist ahead
      // Optional: small centering adjustment if left/right are imbalanced but less than ahead
      turnAdjustment =
        (turnStrength * 0.1 * (rightPheromone - leftPheromone)) /
        totalPheromone;
    }

    // Apply the turn adjustment
    this.direction += turnAdjustment;

    // Chance to ignore trail and explore randomly, reduced frequency
    if (Math.random() < 0.01) {
      this.direction += (Math.random() - 0.5) * 1.0; // Wider random turn when ignoring trail
    }
  } // End followPheromoneTrail

  draw(ctx: CanvasRenderingContext2D, debugMode: boolean = false): void {
    if (this.isDead && !debugMode) return; // Don't draw dead ants unless debugging

    // Determine color based on state
    let antColor;
    if (this.isDead) {
      antColor = '#4d0000'; // Darker red for dead ant body
    } else if (this.carryingFood) {
      antColor = '#cc6600'; // Use carrying food color regardless of hunger when carrying
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
          : energyRatio > this.starvationThreshold / this.maxEnergy // Use threshold for yellow/red transition
          ? '#FFFF00'
          : '#FF0000'; // Green > Yellow > Red
      ctx.fillStyle = energyBarColor;
      ctx.fillRect(barX, barY, barWidth * energyRatio, barHeight);
    }

    // Draw carrying food indicator (small dot on top) - redundant if color changes, but can keep
    if (this.carryingFood) {
      ctx.fillStyle = '#44AA00'; // Green dot for food representation
      ctx.beginPath();
      // Position dot slightly ahead of the ant's center in its direction of movement
      const foodDotX = this.x + Math.cos(this.direction) * (this.size * 0.6);
      const foodDotY = this.y + Math.sin(this.direction) * (this.size * 0.6);
      ctx.arc(foodDotX, foodDotY, this.size * 0.4, 0, Math.PI * 2); // Smaller dot
      ctx.fill();
    }

    // --- Debug Mode Visualizations ---
    if (debugMode) {
      ctx.save(); // Save context state for debug drawing

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

      // Draw sensor lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'; // Semi-transparent white
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      // Left sensor
      const leftX =
        this.x +
        Math.cos(this.direction - this.sensorAngle) * this.sensorDistance;
      const leftY =
        this.y +
        Math.sin(this.direction - this.sensorAngle) * this.sensorDistance;
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(leftX, leftY);
      // Ahead sensor
      const aheadX = this.x + Math.cos(this.direction) * this.sensorDistance;
      const aheadY = this.y + Math.sin(this.direction) * this.sensorDistance;
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(aheadX, aheadY);
      // Right sensor
      const rightX =
        this.x +
        Math.cos(this.direction + this.sensorAngle) * this.sensorDistance;
      const rightY =
        this.y +
        Math.sin(this.direction + this.sensorAngle) * this.sensorDistance;
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(rightX, rightY);
      ctx.stroke();

      // Draw target line if targeting food
      if (this.targetFood) {
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)'; // Semi-transparent green
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.targetFood.x, this.targetFood.y);
        ctx.stroke();
      }
      // Draw homing line if returning to nest
      else if (this.returningToNest && this.homeNest) {
        ctx.strokeStyle = 'rgba(255, 0, 255, 0.5)'; // Semi-transparent magenta
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.homeNest.x, this.homeNest.y);
        ctx.stroke();
      }

      ctx.restore(); // Restore context state
    }
  } // End draw method

  // Add totalFoodCollected property to be updated by the Ant
  // This isn't ideal OO design, but necessary for the current stat tracking in SimulationEngine
  // A better approach might involve event emitters or passing callbacks.
  totalFoodCollected: number = 0;
} // End Ant class
