# Ant Simulation Enhancement Plan - Phase 1

## Overview

Phase 1 focuses on implementing an energy system for ants, including energy consumption, hunger states, and starvation mechanics. This phase forms the foundation for the more complex nest dynamics in Phase 2.

## Implementation Checklist

### 1. Ant Energy Properties

- [ ] Add `energy` and `maxEnergy` properties to `Ant` class
- [ ] Add `energyConsumptionRate` property to control energy depletion
- [ ] Implement energy visualization (color coding or indicators)
- [ ] Create energy state thresholds (full, normal, hungry, starving)
- [ ] Add `lastFedTime` property to track feeding intervals

### 2. Energy Consumption Mechanics

- [ ] Implement base energy consumption over time
- [ ] Add movement-based energy consumption
- [ ] Add carrying-food energy penalty
- [ ] Create speed adjustments based on energy levels
- [ ] Implement varied consumption rates based on ant activities

### 3. Hunger State Behavior

- [ ] Create behavioral changes for hungry ants
- [ ] Implement starving ant behavior prioritizing nest return
- [ ] Add visual indicators for different hunger states
- [ ] Implement desperate food-seeking behavior for starving ants
- [ ] Add randomized energy thresholds for individual ant variation

### 4. Starvation Mechanics

- [ ] Implement ant death when energy depleted
- [ ] Add visual effects for dying ants
- [ ] Create corpse objects that can be consumed by other ants (optional)
- [ ] Implement colony statistics tracking for starvation deaths
- [ ] Add UI indicators for colony health based on starvation rate

### 5. Food Energy Value System

- [ ] Assign energy values to food sources
- [ ] Implement energy restoration when food is consumed
- [ ] Add food quality variation (different energy values)
- [ ] Create food type specialization for different ant roles (optional)
- [ ] Implement diminishing returns for consecutive feeding

### 6. Return-to-Nest Behavior

- [ ] Create emergency return-to-nest trigger when starving
- [ ] Implement direct pathfinding to nest for hungry ants
- [ ] Add pheromone preference adjustments for hungry ants
- [ ] Create temporary energy boost for critical returns
- [ ] Implement nest-seeking sensor range increase for hungry ants

### 7. UI Enhancements for Energy System

- [ ] Add energy level indicators for selected ants
- [ ] Create colony-wide energy statistics panel
- [ ] Implement starvation risk warning indicators
- [ ] Add energy consumption rate controls
- [ ] Create visualizations for energy flow in the colony

### 8. Testing and Balancing

- [ ] Balance energy consumption against food availability
- [ ] Test starvation rates with different parameters
- [ ] Verify return-to-nest behavior effectiveness
- [ ] Analyze colony sustainability with energy constraints
- [ ] Tune energy restoration rates from feeding

## Technical Implementation Details

### Ant Class Extensions

```typescript
class Ant {
  // Existing properties
  id: number;
  x: number;
  y: number;
  direction: number;
  speed: number;
  color: string;
  // ... other existing properties

  // New energy-related properties
  energy: number; // Current energy level
  maxEnergy: number; // Maximum energy capacity
  energyConsumptionRate: number; // Base rate of energy consumption
  hungerState: HungerState; // Enum for hunger states
  lastFedTime: number; // Timestamp of last feeding
  starvationThreshold: number; // Energy level that triggers starvation behavior
  criticalEnergyThreshold: number; // Energy level that risks death

  // New methods
  consumeEnergy(amount: number): void; // Reduce energy by amount
  restoreEnergy(amount: number): void; // Increase energy by amount
  updateHungerState(): void; // Update hunger state based on current energy
  seekFood(): void; // Behavior when hungry
  returnToNestForFood(): void; // Emergency return to nest when starving
  die(): void; // Handle ant death from starvation
  getEnergyColorIndicator(): string; // Get color based on energy state
  adjustSpeedByEnergy(): void; // Modify speed based on energy levels
}

// Hunger state enum
enum HungerState {
  FULL, // Recently fed, high energy
  NORMAL, // Adequate energy
  HUNGRY, // Low energy, seeking food
  STARVING, // Critical energy, returning to nest or death imminent
}
```

### Visualization Enhancements

```typescript
// Energy state visualization in ant.draw method
draw(ctx: CanvasRenderingContext2D): void {
  // Set color based on hunger state
  let antColor;
  switch(this.hungerState) {
    case HungerState.FULL:
      antColor = '#333333'; // Normal color
      break;
    case HungerState.NORMAL:
      antColor = '#444444'; // Slightly darker
      break;
    case HungerState.HUNGRY:
      antColor = '#664444'; // Reddish tint
      break;
    case HungerState.STARVING:
      antColor = '#990000'; // Bright red (danger)
      break;
    default:
      antColor = this.color;
  }

  // Draw ant body with hunger-based color
  ctx.fillStyle = antColor;
  ctx.beginPath();
  ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
  ctx.fill();

  // Draw energy level indicator (small bar above ant)
  const energyRatio = this.energy / this.maxEnergy;
  const barWidth = this.size * 2;
  const barHeight = 2;

  ctx.fillStyle = this.getEnergyBarColor(energyRatio);
  ctx.fillRect(
    this.x - barWidth/2,
    this.y - this.size - 4,
    barWidth * energyRatio,
    barHeight
  );

  // Continue with existing drawing code...
}
```

### Behavior Modifications

```typescript
// Modify the ant.move method to include energy considerations
move(width: number, height: number, pheromones: PheromoneGrid, foodSources: FoodSource[] = []): void {
  // Consume energy based on activity
  const baseConsumption = this.energyConsumptionRate;
  let activityMultiplier = 1.0;

  // Carrying food costs more energy
  if (this.carryingFood) {
    activityMultiplier *= 1.5;
  }

  // Moving fast costs more energy
  activityMultiplier *= (this.speed / 2.0);

  // Apply energy consumption
  this.consumeEnergy(baseConsumption * activityMultiplier);

  // Update hunger state
  this.updateHungerState();

  // Adjust behavior based on hunger
  if (this.hungerState === HungerState.STARVING) {
    this.returnToNestForFood();
  } else if (this.hungerState === HungerState.HUNGRY && !this.carryingFood) {
    // Prioritize food seeking when hungry
    this.seekFood(foodSources);
  }

  // Check for death by starvation
  if (this.energy <= 0) {
    this.die();
    return;
  }

  // Continue with regular movement logic...
}
```

### SimulationEngine Extensions

```typescript
class SimulationEngine {
  // New properties
  starvationDeaths: number; // Track ant deaths by starvation
  averageColonyEnergy: number; // Average energy level across all ants

  // New methods
  updateAntEnergy(): void; // Update energy states for all ants
  removeDeadAnts(): void; // Remove ants that have died from starvation
  calculateEnergyStatistics(): void; // Calculate colony-wide energy stats
}
```

## UI Control Additions

- Energy consumption rate slider
- Starvation visualization toggle
- Energy indicators toggle
- Colony energy statistics panel
- Hunger behavior adjustment controls

## Balance Considerations

- Energy consumption should be balanced against food collection rates
- Starvation should be a real threat but not make the simulation impossible
- Energy states should meaningfully affect ant behavior
- Return-to-nest behavior should be effective but not perfect
- Energy restoration from food should be balanced with consumption rates

## Next Steps After Completion

After implementing the energy system in Phase 1, the simulation will have ants with finite resources that must be managed. This provides the foundation for Phase 2's nest dynamics, as the nest will need to manage food resources effectively to maintain and grow the ant population. The energy system also introduces meaningful stakes to the simulation where poor resource management can lead to colony decline.
