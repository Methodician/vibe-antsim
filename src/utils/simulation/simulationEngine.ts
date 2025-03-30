// Main Simulation Engine class

// Import necessary components from their new modules
import { FoodSource } from './foodSource';
import { Nest } from './nest';
import { Ant, HungerState } from './ant';
import { PheromoneGrid, PheromoneType } from './pheromoneGrid';

// --- Remove Class Definitions Here ---
// FoodSource class definition removed...
// Nest class definition removed...
// HungerState enum definition removed...
// Ant class definition removed...
// PheromoneType enum definition removed...
// PheromoneGrid class definition removed...
// --- End Removed Definitions ---

export class SimulationEngine {
  ants: Ant[];
  nest: Nest;
  width: number;
  height: number;
  isRunning: boolean;
  pheromones: PheromoneGrid;
  foodSources: FoodSource[];
  lastFoodSpawnTime: number;
  foodSpawnInterval: number;
  selectedAnt: Ant | null = null; // Add property to hold the selected ant

  // --- Statistics ---
  simulationStartTime: number;
  starvationDeaths: number; // New stat
  // --- End Statistics ---

  debugMode: boolean = false; // Add debug mode flag

  constructor(canvasWidth: number, canvasHeight: number) {
    this.width = canvasWidth;
    this.height = canvasHeight;
    this.ants = [];
    this.nest = new Nest(this.width / 2, this.height / 2); // Default position
    this.isRunning = false;
    this.pheromones = new PheromoneGrid(this.width, this.height);
    this.foodSources = [];
    this.lastFoodSpawnTime = 0;
    this.foodSpawnInterval = 10000; // Default interval (10 seconds)
    this.selectedAnt = null; // Initialize in constructor as well

    // --- Initialize Stats ---
    this.simulationStartTime = 0;
    // this.totalFoodCollected = 0; // Removed, use nest.foodStored
    this.starvationDeaths = 0; // Initialize starvation deaths
    // --- End Initialize Stats ---
  }

  initialize(antCount: number = 50): void {
    // Increased default ant count slightly
    this.ants = [];
    this.foodSources = [];
    this.pheromones.reset(); // Reset pheromones completely
    this.nest = new Nest(this.nest.x, this.nest.y); // Reset nest (position kept, food reset)

    // Reset stats
    this.simulationStartTime = Date.now();
    this.starvationDeaths = 0; // Reset deaths on initialize
    this.selectedAnt = null; // Reset selected ant on initialize

    // Create ants near the nest
    for (let i = 0; i < antCount; i++) {
      // Use nest's createAnt method
      const ant = this.nest.createAnt(i);
      ant.homeNest = this.nest; // Assign home nest
      // Initialize ant energy relative to maxEnergy with some variance
      ant.energy = ant.maxEnergy * (0.8 + Math.random() * 0.2);
      ant.updateHungerState(); // Set initial state based on energy
      this.ants.push(ant);
    }

    // Initial food sources
    this.spawnFoodSource(this.width * 0.1, this.height * 0.1, 200); // Spawn near corner
    this.spawnFoodSource(this.width * 0.9, this.height * 0.9, 200); // Spawn near opposite corner
    this.spawnFoodSource(); // Spawn one randomly
    this.lastFoodSpawnTime = Date.now();

    this.updateAntStats(); // Perform initial calculation of stats
  }

  // Create a food source, optionally at a specific location
  spawnFoodSource(x?: number, y?: number, amount?: number): void {
    // Limit max food sources
    const maxFoodSources = 5; // Limit concurrent food sources
    if (
      this.foodSources.filter((fs) => !fs.isDepleted()).length >= maxFoodSources
    )
      return;

    let foodX: number, foodY: number;
    const foodAmount = amount ?? 100 + Math.floor(Math.random() * 150); // Random food amount between 100 and 250 if not specified
    const minNestDist = this.nest.radius * 4; // Minimum distance from nest center

    if (x !== undefined && y !== undefined) {
      foodX = x;
      foodY = y;
    } else {
      // Find a random position not too close to the nest or other food
      let attempts = 0;
      const minFoodDistSq = (this.pheromones.cellSize * 10) ** 2; // Min distance between food sources squared

      do {
        foodX = Math.random() * (this.width - 20) + 10; // Avoid extreme edges
        foodY = Math.random() * (this.height - 20) + 10;
        const distToNestSq =
          (foodX - this.nest.x) ** 2 + (foodY - this.nest.y) ** 2;

        let tooCloseToOtherFood = false;
        for (const otherFood of this.foodSources) {
          if (!otherFood.isDepleted()) {
            const distToOtherFoodSq =
              (foodX - otherFood.x) ** 2 + (foodY - otherFood.y) ** 2;
            if (distToOtherFoodSq < minFoodDistSq) {
              tooCloseToOtherFood = true;
              break;
            }
          }
        }

        if (distToNestSq >= minNestDist * minNestDist && !tooCloseToOtherFood) {
          break; // Found suitable position
        }
        attempts++;
      } while (attempts < 50); // Limit attempts to prevent infinite loop

      // If still couldn't find a good spot after attempts, place randomly anyway (maybe log warning)
      if (attempts >= 50) {
        console.warn(
          'Could not find ideal random spot for food source, placing potentially close to nest/other food.'
        );
      }
    }

    // Create and add the food source
    const food = new FoodSource(foodX, foodY, foodAmount);
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
      for (let i = 0; i < newCount - currentCount; i++) {
        const ant = this.nest.createAnt(this.ants.length + i); // Use nest's creator
        ant.homeNest = this.nest;
        ant.energy = ant.maxEnergy; // Start new ants with full energy
        ant.updateHungerState();
        this.ants.push(ant);
      }
    } else {
      // Remove excess ants (removes the newest ants first).
      this.ants.length = newCount; // More direct way to truncate the array
      // If an ant being removed was selected, deselect it.
      if (this.selectedAnt && !this.ants.includes(this.selectedAnt)) {
        this.selectedAnt = null;
      }
    }
    this.updateAntStats(); // Update stats after changing count
  }

  setNestPosition(x: number, y: number): void {
    this.nest.x = x;
    this.nest.y = y;
    // Optional: Consider if ants should immediately know the new nest location
    // For simplicity, they will find it naturally via homing behavior.
  }

  start(): void {
    if (!this.isRunning) {
      this.isRunning = true;
      // Adjust start time to account for paused duration
      const elapsedTime =
        this.simulationStartTime > 0
          ? Date.now() - this.simulationStartTime
          : 0;
      this.simulationStartTime = Date.now() - elapsedTime;
    }
  }

  stop(): void {
    if (this.isRunning) {
      this.isRunning = false;
      // simulationStartTime retains the initial start time + pauses handled in start()
    }
  }

  update(): void {
    if (!this.isRunning) return;

    const now = Date.now();

    // 1. Update pheromones (decay and diffusion)
    this.pheromones.decay();
    this.pheromones.diffuse();

    // 2. Update ants
    // Iterate forward and build a new array of live ants or update in place
    for (const ant of this.ants) {
      if (!ant.isDead) {
        ant.move(this.width, this.height, this.pheromones, this.foodSources);
      }
    }

    // Filter dead ants *after* all updates are done for the tick
    const initialAntCount = this.ants.length;
    this.ants = this.ants.filter((ant) => !ant.isDead);
    const deadThisFrame = initialAntCount - this.ants.length;
    this.starvationDeaths += deadThisFrame;

    // 3. Update food sources (remove depleted ones)
    this.foodSources = this.foodSources.filter((fs) => !fs.isDepleted());

    // 4. Spawn new food periodically
    // Check interval and if there's space for more food
    const maxFoodSources = 5; // Consider making this a class property or constant
    if (
      this.foodSources.filter((fs) => !fs.isDepleted()).length <
        maxFoodSources &&
      now - this.lastFoodSpawnTime > this.foodSpawnInterval
    ) {
      this.spawnFoodSource(); // Spawn randomly
    }

    // 5. Update aggregate statistics
    this.updateAntStats(); // Update counts of foraging/returning ants

    // Ensure selected ant exists and is still alive
    // (Already handled by the filter and updateAntCount checks implicitly)
    if (this.selectedAnt && this.selectedAnt.isDead) {
      this.selectedAnt = null; // Deselect if dead
    }
  } // End update method

  render(ctx: CanvasRenderingContext2D): void {
    // Clear canvas
    // ctx.clearRect(0, 0, this.width, this.height); // Keep for full redraw
    // Optimization: Fill with a background color instead of clearing transparent
    ctx.fillStyle = '#f0f0f0'; // Light background
    ctx.fillRect(0, 0, this.width, this.height);

    // Draw Pheromones (only in debug mode)
    if (this.debugMode) {
      this.pheromones.draw(ctx);
    }

    // Draw Nest
    this.nest.draw(ctx);

    // Draw Food Sources
    this.foodSources.forEach((food) => food.draw(ctx));

    // Draw Ants
    // Draw dead ants first (below living ants) if in debug mode
    if (this.debugMode) {
      this.ants.forEach((ant) => {
        if (ant.isDead) {
          ant.draw(ctx, this.debugMode);
        }
      });
    }
    // Draw living ants on top
    this.ants.forEach((ant) => {
      if (!ant.isDead) {
        // Pass whether this ant is the selected one to the draw method
        ant.draw(ctx, this.debugMode, ant === this.selectedAnt);
      }
    });
  } // End render method

  // --- Statistics Getters ---
  getElapsedTime(): number {
    if (!this.isRunning && this.simulationStartTime === 0) return 0; // Not started yet
    if (!this.isRunning) {
      // If stopped, return the time elapsed up to the point it was stopped
      // This requires storing the stop time or calculating based on current time and adjusted start time
      // Simplest is to return time since adjusted start, which effectively freezes time when stopped
      return (Date.now() - this.simulationStartTime) / 1000;
    }
    // If running or was previously run
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

  // Add internal state for ant stats to avoid recalculating every frame if not needed
  _antStats = { total: 0, foraging: 0, returning: 0 };

  updateAntStats(): void {
    let foraging = 0;
    let returning = 0;
    this.ants.forEach((ant) => {
      // Only count living ants
      if (!ant.isDead) {
        if (ant.carryingFood || ant.returningToNest) {
          returning++;
        } else {
          foraging++;
        }
      }
    });
    this._antStats = {
      total: this.ants.length, // Total living ants
      foraging: foraging,
      returning: returning,
    };
  }

  getAntStats(): {
    total: number;
    foraging: number;
    returning: number;
    dead: number; // Include total deaths count
  } {
    // Return the cached stats + the persistent death count
    return { ...this._antStats, dead: this.starvationDeaths };
  }

  getFoodStats(): { collected: number; available: number } {
    const available = this.foodSources.reduce(
      (sum, source) => sum + source.amount,
      0
    );
    // Collected food is stored in the nest
    return {
      collected: this.nest.foodStored,
      available: Math.round(available),
    };
  }

  // --- Control Methods ---
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  // Example: Set energy consumption rate for all current ants
  // Note: New ants created later won't have this rate unless the Ant constructor default is also changed or managed.
  setAntEnergyConsumptionRate(rate: number): void {
    if (rate >= 0) {
      this.ants.forEach((ant) => (ant.energyConsumptionRate = rate));
      console.log(
        `Set energy consumption rate for ${this.ants.length} ants to ${rate}`
      );
    }
  }

  setAntBaseSpeed(speed: number): void {
    if (speed > 0) {
      this.ants.forEach((ant) => {
        ant.baseSpeed = speed;
        // Optionally update current speed immediately based on energy state
        ant.adjustSpeedByEnergy();
      });
      console.log(`Set base speed for ${this.ants.length} ants to ${speed}`);
    }
  }

  setAntSensorDistance(distance: number): void {
    if (distance > 0) {
      this.ants.forEach((ant) => (ant.sensorDistance = distance));
      console.log(
        `Set sensor distance for ${this.ants.length} ants to ${distance}`
      );
    }
  }

  setAntSensorAngle(angleDegrees: number): void {
    if (angleDegrees > 0 && angleDegrees < 180) {
      const angleRadians = angleDegrees * (Math.PI / 180);
      this.ants.forEach((ant) => (ant.sensorAngle = angleRadians));
      console.log(
        `Set sensor angle for ${this.ants.length} ants to ${angleDegrees}°`
      );
    }
  }

  setMaxEnergy(maxEnergy: number): void {
    if (maxEnergy > 0) {
      this.ants.forEach((ant) => {
        const ratio = ant.energy / ant.maxEnergy; // Preserve current energy ratio
        ant.maxEnergy = maxEnergy;
        ant.energy = maxEnergy * ratio; // Scale current energy
        ant.starvationThreshold = maxEnergy * 0.2; // Recalculate threshold
        ant.updateHungerState(); // Update state based on new max
      });
      console.log(
        `Set max energy for ${this.ants.length} ants to ${maxEnergy}`
      );
    }
  }

  setPheromoneDecayRate(rate: number): void {
    if (this.pheromones && rate >= 0 && rate <= 1) {
      this.pheromones.decayRate = rate;
    }
  }

  setPheromoneDiffusionRate(rate: number): void {
    if (this.pheromones && rate >= 0 && rate <= 1) {
      this.pheromones.diffusionRate = rate;
    }
  }

  setPheromoneMaxStrength(maxStrength: number): void {
    if (this.pheromones && maxStrength > 0) {
      this.pheromones.maxPheromone = maxStrength;
      console.log(`Set max pheromone strength to ${maxStrength}`);
    }
  }

  setFoodSpawnInterval(intervalMillis: number): void {
    if (intervalMillis >= 0) {
      this.foodSpawnInterval = intervalMillis;
    }
  }

  resetSimulation(): void {
    this.stop(); // Stop simulation if running
    this.initialize(this.ants.length > 0 ? this.ants.length : 50); // Re-initialize with current ant count or default
    this.selectedAnt = null; // Ensure reset on simulation reset
    console.log('Simulation reset.');
  }

  selectAntAt(
    clickX: number,
    clickY: number,
    selectionRadius: number = 10 // Consider making this slightly larger for easier clicking
  ): void {
    let foundAnt: Ant | null = null;
    let minDistanceSq = selectionRadius * selectionRadius;

    // Iterate backwards to prioritize ants drawn on top (usually later in the array)
    for (let i = this.ants.length - 1; i >= 0; i--) {
      const ant = this.ants[i];
      if (ant.isDead) continue; // Don't select dead ants

      const dx = ant.x - clickX;
      const dy = ant.y - clickY;
      const distanceSq = dx * dx + dy * dy;

      if (distanceSq < minDistanceSq) {
        minDistanceSq = distanceSq;
        foundAnt = ant;
      }
    }

    this.selectedAnt = foundAnt;
    // Optional: Remove console logs for production/cleaner output
    // if (this.selectedAnt) {
    //   console.log(`Selected Ant ID: ${this.selectedAnt.id}`); // Log selection
    // } else {
    //   console.log('No ant selected.');
    // }
  }
}

// Remove the old combined export if it exists
// export { SimulationEngine, Ant, Nest, PheromoneGrid, FoodSource };
// Keep only the necessary export if this file is the main entry point for the simulation logic
// export { SimulationEngine }; // Or export more if needed externally
