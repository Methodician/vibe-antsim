# Ant Simulation Enhancement Plan - Phase 2

## Overview

Phase 2 focuses on implementing nest dynamics including food consumption mechanics, ant spawning capabilities, and nest growth visualization. This phase builds upon the existing simulation and prepares for colony expansion in Phase 3.

## Implementation Checklist

### 1. Nest Food Consumption Mechanics

- [ ] Add `foodConsumptionRate` property to `Nest` class
- [ ] Implement periodic food consumption based on nest size and ant population
- [ ] Create food reserve threshold for nest survival
- [ ] Add nest starvation mechanics when food reserves are depleted
- [ ] Implement visual indicators for nest food levels

### 2. Ant Spawning System

- [ ] Add `spawnAntInterval` property to control spawn timing
- [ ] Add `spawnAntCost` property to determine food cost per new ant
- [ ] Implement timer-based spawning mechanism
- [ ] Add food requirement check before spawning
- [ ] Create method to generate new ants at the nest
- [ ] Scale spawn rate with nest size (larger nests spawn more frequently)
- [ ] Add configuration options in UI for spawn rate adjustment

### 3. Ant Feeding Mechanics

- [ ] Add `feedAnt()` method to `Nest` class
- [ ] Implement ant "hungry" state detection and visualization
- [ ] Create feeding priority system for different ant states
- [ ] Add feeding animation/indication when ants receive food
- [ ] Implement food transfer from nest to ant
- [ ] Add feeding cooldown timer to prevent continuous feeding

### 4. Nest Growth Visualization

- [ ] Add `nestSize` property that scales with food stored
- [ ] Implement visual scaling of nest based on size property
- [ ] Create growth thresholds for discrete size changes
- [ ] Add visual effects for nest growth/shrinking events
- [ ] Implement size-dependent nest appearance changes
- [ ] Add UI display for current nest size

### 5. Food Storage Capacity

- [ ] Implement maximum food storage based on nest size
- [ ] Add visual indicator for nest storage capacity
- [ ] Create mechanics for excess food usage (growth or spawning)
- [ ] Implement food spoilage for long-term storage (optional)

### 6. UI Enhancements

- [ ] Add nest statistics panel (size, food, spawn rate, etc.)
- [ ] Create toggles for nest mechanics (enable/disable auto-spawning)
- [ ] Implement nest food consumption rate controls
- [ ] Add visualization options for nest state

### 7. Performance Optimization

- [ ] Optimize nest-related calculations for large ant populations
- [ ] Implement spatial partitioning for nest-ant interactions
- [ ] Add level-of-detail system for nest visualization based on zoom
- [ ] Optimize food consumption calculations

### 8. Testing and Balancing

- [ ] Test nest growth rates with various parameters
- [ ] Balance food consumption rates against food collection rates
- [ ] Test ant population stability under different conditions
- [ ] Verify nest survival mechanics during food scarcity
- [ ] Tune spawn rates for different simulation scenarios

## Technical Implementation Details

### Nest Class Extensions

```typescript
class Nest {
  // Existing properties
  x: number;
  y: number;
  radius: number;
  color: string;
  foodStored: number;

  // New properties
  nestSize: number; // Current size level of the nest
  maxFoodCapacity: number; // Maximum food storage based on size
  foodConsumptionRate: number; // Base food consumption per tick
  foodConsumptionInterval: number; // How often food is consumed
  lastFoodConsumptionTime: number; // Timestamp of last consumption
  spawnAntCost: number; // Food required to spawn a new ant
  spawnAntInterval: number; // Milliseconds between spawn attempts
  lastAntSpawnTime: number; // Timestamp of last spawn
  nestHealthy: boolean; // Indicates if nest has sufficient food
  growthThreshold: number; // Food surplus required for growth
  shrinkThreshold: number; // Food deficit that triggers shrinking

  // New methods
  consumeFood(): number; // Returns amount consumed, affects nest health
  spawnNewAnt(): Ant | null; // Creates new ant if possible, returns null if not
  growNest(): boolean; // Attempt to grow nest, returns success
  shrinkNest(): void; // Reduce nest size due to food shortage
  feedAnt(ant: Ant, amount: number): number; // Give food to ant, returns amount given
  calculateSpawnRate(): number; // Get current spawn rate based on nest size
  updateNestSize(): void; // Update nest size based on food and ant population
}
```

### SimulationEngine Extensions

```typescript
class SimulationEngine {
  // New properties
  nestFoodConsumptionEnabled: boolean; // Toggle for nest consumption
  antSpawningEnabled: boolean; // Toggle for auto-spawning
  nestGrowthEnabled: boolean; // Toggle for nest growth

  // New methods
  updateNestDynamics(): void; // Handle nest-related updates each tick
  handleAntFeeding(): void; // Process ants requesting food from nest
  calculateOptimalAntPopulation(): number; // Based on available food sources
}
```

### Visualization Enhancements

```typescript
// Nest size visualization changes
Nest.draw(ctx: CanvasRenderingContext2D): void {
  // Vary nest size based on nestSize property
  const displayRadius = this.radius * (0.8 + (this.nestSize * 0.2));

  // Change nest appearance based on health
  const nestColor = this.nestHealthy ? this.color : '#654321'; // Darker when unhealthy

  // Draw food capacity indicator
  const fillRatio = this.foodStored / this.maxFoodCapacity;

  // Implement all drawing logic...
}
```

## UI Control Additions

- Food consumption rate slider
- Auto-spawn toggle switch
- Nest growth toggle switch
- Nest statistics display panel
- Nest size indicator
- Food capacity visualization

## Balance Considerations

- Nest food consumption should be carefully balanced with collection rates
- Spawn rates should maintain stable but growing ant populations
- Growth thresholds should reward successful colonies without making growth too easy
- Ant energy consumption should balance with feeding mechanics

## Next Steps After Completion

Once Phase 2 is complete, the simulation will have a dynamic nest system with resource management, population control, and visual feedback. This will set the foundation for Phase 3, which will introduce queen ants and colony expansion mechanics.
