# Ant Simulation Enhancement Plan - Phase 2

## Overview

Phase 2 focuses on implementing nest dynamics including food consumption mechanics, ant spawning capabilities, and nest growth visualization. This phase builds upon the energy system established in Phase 1 and prepares for colony expansion in Phase 3.

## Milestones

### Milestone 1: Nest Food Storage & Consumption

- Implement nest food storage mechanics
- Add food consumption based on nest size and population
- Create nest health indicators
- Test and balance basic food economy

### Milestone 2: Ant Spawning & Feeding

- Implement ant spawning system
- Create feeding mechanics for hungry ants
- Develop spawn cost and timing systems
- Test and validate population sustainability

### Milestone 3: Nest Growth & Advanced Features

- Implement nest growth mechanics
- Develop food storage capacity system
- Create UI and visualization enhancements
- Final balance and performance testing

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
- [ ] Set up performance benchmarking for nest operations

### 8. Testing and Balancing

- [ ] Test nest growth rates with various parameters
- [ ] Balance food consumption rates against food collection rates
- [ ] Test ant population stability under different conditions
- [ ] Verify nest survival mechanics during food scarcity
- [ ] Tune spawn rates for different simulation scenarios

### 9. Visual Debugging Tools

- [ ] Implement nest resource visualization overlay
- [ ] Create ant feeding status indicators
- [ ] Add spawn radius visualization
- [ ] Develop nest health state indicators
- [ ] Implement food flow visualization

### 10. Data Persistence

- [ ] Create colony state serialization format
- [ ] Implement save functionality for nest and ant states
- [ ] Add load capability to restore simulation state
- [ ] Create auto-save feature for long-running simulations
- [ ] Add simulation snapshot comparison tools

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
  nestStateHistory: NestState[]; // Track nest state over time for analysis

  // New methods
  consumeFood(): number; // Returns amount consumed, affects nest health
  spawnNewAnt(): Ant | null; // Creates new ant if possible, returns null if not
  growNest(): boolean; // Attempt to grow nest, returns success
  shrinkNest(): void; // Reduce nest size due to food shortage
  feedAnt(ant: Ant, amount: number): number; // Give food to ant, returns amount given
  calculateSpawnRate(): number; // Get current spawn rate based on nest size
  updateNestSize(): void; // Update nest size based on food and ant population
  saveState(): NestState; // Serialize nest state for persistence
  loadState(state: NestState): void; // Restore nest from saved state
}

// Nest state for persistence
interface NestState {
  position: { x: number; y: number };
  size: number;
  foodStored: number;
  lastConsumption: number;
  lastSpawn: number;
  health: number;
  timestamp: number;
}
```

### SimulationEngine Extensions

```typescript
class SimulationEngine {
  // New properties
  nestFoodConsumptionEnabled: boolean; // Toggle for nest consumption
  antSpawningEnabled: boolean; // Toggle for auto-spawning
  nestGrowthEnabled: boolean; // Toggle for nest growth
  debugMode: boolean; // Toggle for visualization debugging
  performanceMetrics: {
    nestOperationTime: number;
    spawnOperationTime: number;
    feedingOperationTime: number;
    avgFrameRate: number;
  };

  // New methods
  updateNestDynamics(): void; // Handle nest-related updates each tick
  handleAntFeeding(): void; // Process ants requesting food from nest
  calculateOptimalAntPopulation(): number; // Based on available food sources
  measurePerformance(): void; // Track frame rate and operation times
  toggleDebugMode(): void; // Toggle debugging visualizations
  saveSimulationState(): SimulationState; // Save entire simulation state
  loadSimulationState(state: SimulationState): void; // Restore from saved state
}

// For persistence
interface SimulationState {
  timestamp: number;
  nestStates: NestState[];
  antStates: AntState[];
  foodSourceStates: FoodSourceState[];
  simulationParameters: SimulationParameters;
}
```

### Visualization Enhancements

```typescript
// Nest size visualization with debug mode
Nest.draw(ctx: CanvasRenderingContext2D, debugMode: boolean = false): void {
  // Vary nest size based on nestSize property
  const displayRadius = this.radius * (0.8 + (this.nestSize * 0.2));

  // Change nest appearance based on health
  const nestColor = this.nestHealthy ? this.color : '#654321'; // Darker when unhealthy

  // Draw nest core
  ctx.fillStyle = nestColor;
  ctx.beginPath();
  ctx.arc(this.x, this.y, displayRadius, 0, Math.PI * 2);
  ctx.fill();

  // Draw food capacity indicator
  const fillRatio = this.foodStored / this.maxFoodCapacity;
  const foodBarWidth = displayRadius * 1.5;
  const foodBarHeight = 4;

  // Draw capacity bar
  ctx.fillStyle = '#333333';
  ctx.fillRect(
    this.x - foodBarWidth/2,
    this.y + displayRadius + 6,
    foodBarWidth,
    foodBarHeight
  );

  // Draw current food level
  ctx.fillStyle = fillRatio > 0.5 ? '#00FF00' : fillRatio > 0.25 ? '#FFFF00' : '#FF0000';
  ctx.fillRect(
    this.x - foodBarWidth/2,
    this.y + displayRadius + 6,
    foodBarWidth * fillRatio,
    foodBarHeight
  );

  // Debug visualizations
  if (debugMode) {
    // Draw spawn radius
    ctx.strokeStyle = '#00FF00';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(this.x, this.y, displayRadius * 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw nest stats
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '10px Arial';
    ctx.fillText(
      `Size: ${this.nestSize} | Food: ${Math.round(this.foodStored)}/${this.maxFoodCapacity}`,
      this.x - foodBarWidth/2,
      this.y + displayRadius + 20
    );
    ctx.fillText(
      `Spawn Rate: ${(60000/this.spawnAntInterval).toFixed(1)}/min | Healthy: ${this.nestHealthy ? 'Yes' : 'No'}`,
      this.x - foodBarWidth/2,
      this.y + displayRadius + 32
    );
  }
}
```

## Modular Implementation Strategy

To ensure the system can function with partial implementation, the nest dynamics will be developed in layers:

1. **Core Layer**: Basic food storage and consumption
2. **Feeding Layer**: Ant feeding and hunger resolution
3. **Spawning Layer**: New ant generation
4. **Growth Layer**: Nest size changes based on food surplus

Each layer should be functional on its own, allowing for incremental testing and deployment. If any layer proves too challenging, the system can still function with the previous layers intact.

## UI Control Additions

- Food consumption rate slider
- Auto-spawn toggle switch
- Nest growth toggle switch
- Nest statistics display panel
- Nest size indicator
- Food capacity visualization
- Debug mode toggle
- Performance metrics display
- Save/Load simulation buttons
- Snapshot comparison tool

## Balance Considerations

- Nest food consumption should be carefully balanced with collection rates
- Spawn rates should maintain stable but growing ant populations
- Growth thresholds should reward successful colonies without making growth too easy
- Ant energy consumption should balance with feeding mechanics
- Storage capacity should scale appropriately with nest size

## Performance Considerations

- Use spatial partitioning to optimize nest-ant interactions
- Implement level-of-detail rendering for nests based on zoom level
- Batch process feeding requests to reduce calculation overhead
- Consider using worker threads for intensive nest calculations
- Use statistical sampling for large ant populations rather than processing each ant individually

## Data Persistence Strategy

- Save simulation state at regular intervals
- Create compact serialization format focusing on essential state
- Implement incremental saves to track simulation evolution
- Add manual save capability for interesting colony states
- Include simulation parameters in saved states for proper restoration

## Next Steps After Completion

Once Phase 2 is complete, the simulation will have a dynamic nest system with resource management, population control, and visual feedback. This creates a sustainable ecosystem that can support the more complex mechanics of Phase 3, which will introduce queen ants, colony expansion, and multi-colony dynamics.

The completed nest dynamics system also opens the possibility for introducing environmental factors like seasons or disasters that affect food availability and nest health, creating additional challenges for colony survival.
