# Ant Simulation Enhancement Plan - Phase 3

## Overview

Phase 3 focuses on implementing colony expansion mechanics through queen ants, multiple nests, and inter-colony dynamics. This phase builds upon the energy system from Phase 1 and the nest dynamics from Phase 2 to create a complex, evolving ecosystem of ant colonies.

## Milestones

### Milestone 1: Queen Ant Implementation

- Develop queen ant class and properties
- Implement queen production mechanics
- Create queen visualization and protection behaviors
- Test and balance queen energy dynamics

### Milestone 2: Colony Expansion Mechanics

- Implement queen migration behaviors
- Create new colony establishment process
- Develop parent-child nest relationships
- Test and validate colony expansion triggers

### Milestone 3: Multi-Colony Ecosystem

- Implement multi-nest management systems
- Create territory and inter-colony dynamics
- Develop ecosystem-wide balancing mechanics
- Final performance optimization and testing

## Implementation Checklist

### 1. Queen Ant Implementation

- [ ] Create `QueenAnt` class extending the base `Ant` class
- [ ] Add special properties for queens (increased size, energy, lifespan)
- [ ] Implement distinctive queen visualization
- [ ] Add queen energy consumption mechanics
- [ ] Create queen protection behavior for worker ants
- [ ] Implement queen production trigger based on nest size/food

### 2. Queen Migration Behavior

- [ ] Add colonization trigger when nest reaches threshold size
- [ ] Implement queen departure behavior from mature nest
- [ ] Create worker ant escort behavior for migrating queens
- [ ] Add food carrying mechanics for colony establishment
- [ ] Implement pathfinding for suitable new nest locations
- [ ] Create visualization for migration process

### 3. New Colony Establishment

- [ ] Implement nest creation at queen's chosen location
- [ ] Add resource allocation from parent to child nest
- [ ] Create initial worker ant spawning at new nest
- [ ] Implement growth rate mechanics for young colonies
- [ ] Add distinct visualization for new vs. mature nests
- [ ] Create "founding colony" protection mechanics

### 4. Multi-Nest Management

- [ ] Extend `SimulationEngine` to handle multiple nests
- [ ] Add nest tracking and identifier system
- [ ] Implement nest selection in UI
- [ ] Create multi-nest statistics panel
- [ ] Add zoom functionality to view entire ecosystem
- [ ] Implement nest lifecycle tracking

### 5. Inter-Colony Dynamics

- [ ] Add territory boundaries for colonies
- [ ] Implement pheromone recognition system (colony-specific scents)
- [ ] Create competition mechanics for food sources
- [ ] Add optional inter-colony aggression
- [ ] Implement colony strength metrics
- [ ] Create alliance/competition mechanics between related colonies

### 6. Ant Specialization

- [ ] Add ant roles (foragers, defenders, nurses)
- [ ] Implement role-specific behaviors
- [ ] Create role distribution optimization based on colony needs
- [ ] Add role visualization
- [ ] Implement role transition mechanics
- [ ] Create specialized ant stats

### 7. Ecosystem Balancing

- [ ] Implement predators or threats to colonies
- [ ] Add environmental factors affecting colony success
- [ ] Create seasonal effects on food availability
- [ ] Implement colony collapse mechanics for struggling colonies
- [ ] Add competition-based food source enrichment
- [ ] Create ecosystem-wide statistics tracking

### 8. UI Enhancements

- [ ] Add colony management panel
- [ ] Implement colony selection interface
- [ ] Create ecosystem overview map
- [ ] Add time controls for long-term simulation
- [ ] Implement colony comparison tools
- [ ] Create expanded statistics dashboard

### 9. Performance Optimization

- [ ] Implement spatial partitioning for multi-colony simulation
- [ ] Add level-of-detail rendering based on zoom level
- [ ] Create performance-tuned colony interaction calculations
- [ ] Implement worker thread processing for intensive operations
- [ ] Add performance profiling and monitoring systems
- [ ] Create auto-scaling complexity based on performance metrics

### 10. Visual Debugging Tools

- [ ] Implement territory boundary visualization
- [ ] Create colony relationship indicators
- [ ] Add ant role and state debugging overlays
- [ ] Implement food competition visualization
- [ ] Create queen/migration path visualization
- [ ] Add ecosystem health indicators

### 11. Data Persistence

- [ ] Implement ecosystem state serialization
- [ ] Create save/load functionality for multi-colony states
- [ ] Add colony lineage tracking and visualization
- [ ] Implement colony evolution history recording
- [ ] Create ecosystem comparison tools
- [ ] Add milestone event recording for interesting developments

## Technical Implementation Details

### Queen Ant Class

```typescript
class QueenAnt extends Ant {
  // Queen-specific properties
  isQueen: boolean = true;
  fertility: number; // Ability to produce new ants
  matingStatus: boolean; // Whether queen has mated
  escortAnts: Ant[]; // Worker ants protecting the queen
  targetNestLocation: { x: number; y: number } | null; // For migration
  colonyEstablishmentProgress: number; // Progress toward new colony
  colonyResourcesCarried: number; // Food carried for new colony
  parentNestId: number | null; // Original nest ID
  migrationPath: { x: number; y: number }[]; // Recorded path for visualization
  age: number; // Age in simulation ticks
  lifespanMax: number; // Maximum lifespan
  stateHistory: QueenState[]; // Historical state for analysis

  // Queen-specific methods
  migrateToNewLocation(): void; // Begin migration process
  selectNestLocation(): { x: number; y: number }; // Find suitable new nest site
  establishColony(): Nest | null; // Create new nest when ready
  produceNewAnt(): Ant; // Create new ants at a higher rate
  summonEscort(): void; // Request worker ants for protection
  assessColonyHealth(): number; // Evaluate colony status
  saveState(): QueenState; // For data persistence
  loadState(state: QueenState): void; // Restore from saved state
}

// For persistence and history
interface QueenState {
  position: { x: number; y: number };
  energy: number;
  fertility: number;
  migrationStatus: boolean;
  establishmentProgress: number;
  resourcesCarried: number;
  escortCount: number;
  timestamp: number;
}
```

### Multi-Nest Management

```typescript
class SimulationEngine {
  // Extended to handle multiple nests
  nests: Nest[]; // Array of all nests in simulation
  activeNestIndex: number; // Currently selected nest
  nestRelationships: Map<number, Map<number, NestRelationship>>; // Track relations between nests
  ecosystemMetrics: EcosystemMetrics; // Overall ecosystem health and statistics
  performanceMonitor: PerformanceMonitor; // Track performance metrics
  debugOptions: DebugOptions; // Visual debugging settings
  spatialIndex: SpatialIndex; // For efficient spatial queries

  // New methods
  addNest(nest: Nest): number; // Add new nest to simulation, return ID
  removeNest(nestId: number): boolean; // Remove collapsed/abandoned nest
  selectNest(nestId: number): void; // Change focus to specific nest
  getNestById(nestId: number): Nest | undefined; // Get nest reference
  updateAllNests(): void; // Update all nests in simulation
  calculateInterColonyDynamics(): void; // Handle nest interactions
  assignAntsToNest(ants: Ant[], nestId: number): void; // Associate ants with nest
  saveEcosystemState(): EcosystemState; // Save entire ecosystem for persistence
  loadEcosystemState(state: EcosystemState): void; // Restore from saved state
  measurePerformance(): void; // Update performance metrics
  adjustSimulationComplexity(performanceScore: number): void; // Scale based on performance
  renderDebugVisualizations(ctx: CanvasRenderingContext2D): void; // Draw debug overlays
}

// Nest relationship tracking
enum NestRelationship {
  PARENT, // This nest created the other nest
  CHILD, // This nest was created by the other nest
  ALLIED, // Cooperative relationship
  NEUTRAL, // No significant relationship
  COMPETING, // Competition for resources
  HOSTILE, // Active interference
}

// Performance monitoring
interface PerformanceMonitor {
  frameRate: number;
  antUpdateTime: number;
  nestUpdateTime: number;
  interactionTime: number;
  renderTime: number;
  totalEntities: number;
  historyLength: number;
  metrics: PerformanceMetrics[];

  startTimer(operation: string): void;
  stopTimer(operation: string): number;
  recordMetrics(): void;
  getAverageMetric(metric: string): number;
  detectBottlenecks(): string[];
}

// Debug visualization options
interface DebugOptions {
  showTerritories: boolean;
  showRelationships: boolean;
  showAntRoles: boolean;
  showFoodCompetition: boolean;
  showQueenPaths: boolean;
  showPerformanceMetrics: boolean;
  highlightColony: number | null;
}
```

### Enhanced Nest Class

```typescript
class Nest {
  // New properties for colony expansion
  id: number; // Unique identifier
  age: number; // Time since establishment
  queenPresent: boolean; // Whether nest has a queen
  queen: QueenAnt | null; // Reference to queen
  maturity: NestMaturity; // Development stage
  parentNestId: number | null; // ID of nest that created this one
  childNestIds: number[]; // IDs of nests created by this one
  expansionReady: boolean; // Whether nest is ready to spawn a queen
  territory: { x: number; y: number; radius: number }; // Area claimed by nest
  colonyScent: number; // Unique identifier for pheromones
  ants: { [role: string]: number }; // Count of ants by role
  relationshipStrengths: Map<number, number>; // Relationship strength with other nests
  stateHistory: NestState[]; // Historical states for analysis
  performanceImpact: number; // Measure of performance cost

  // New methods
  produceQueen(): QueenAnt | null; // Create queen ant when conditions are met
  calculateExpansionReadiness(): boolean; // Determine if ready to expand
  allocateResourcesForExpansion(amount: number): number; // Set aside resources
  claimTerritory(): void; // Expand or contract territorial boundaries
  interactWithForeignAnt(ant: Ant): void; // Handle ants from other colonies
  calculateColonyStrength(): number; // Overall measure of colony power
  optimizeForPerformance(level: number): void; // Adjust detail level
  saveState(): NestState; // For data persistence
  loadState(state: NestState): void; // Restore from saved state
}

// Nest maturity stages
enum NestMaturity {
  FOUNDING, // New nest, vulnerable
  GROWING, // Established but still developing
  MATURE, // Fully developed, stable
  DECLINING, // Past prime, potentially struggling
  COLLAPSING, // On verge of extinction
}
```

### Territory Visualization

```typescript
// Draw nest with territory indicator and debug information
Nest.draw(ctx: CanvasRenderingContext2D, debugOptions: DebugOptions): void {
  // Draw territory boundary if enabled
  if (debugOptions.showTerritories || this.id === debugOptions.highlightColony) {
    ctx.strokeStyle = `rgba(${this.colonyScent % 255}, ${(this.colonyScent * 3) % 255}, ${(this.colonyScent * 7) % 255}, 0.3)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.territory.radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Draw nest maturity indicator
  let maturityColor;
  switch(this.maturity) {
    case NestMaturity.FOUNDING: maturityColor = '#90EE90'; break; // Light green
    case NestMaturity.GROWING: maturityColor = '#32CD32'; break; // Lime green
    case NestMaturity.MATURE: maturityColor = '#008000'; break; // Green
    case NestMaturity.DECLINING: maturityColor = '#A0522D'; break; // Brown
    case NestMaturity.COLLAPSING: maturityColor = '#8B0000'; break; // Dark red
  }

  // Draw outer nest indicator with maturity color
  ctx.fillStyle = maturityColor;
  ctx.beginPath();
  ctx.arc(this.x, this.y, this.radius * 1.2, 0, Math.PI * 2);
  ctx.fill();

  // Normal nest drawing code here...

  // Debug information if enabled
  if (debugOptions.showTerritories || this.id === debugOptions.highlightColony) {
    // Draw colony stats
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '10px Arial';
    ctx.fillText(
      `Nest #${this.id} | Size: ${this.nestSize} | Age: ${this.age}`,
      this.x - 50,
      this.y + this.radius + 15
    );
    ctx.fillText(
      `Ants: ${Object.values(this.ants).reduce((a, b) => a + b, 0)} | Queen: ${this.queenPresent ? 'Yes' : 'No'}`,
      this.x - 50,
      this.y + this.radius + 30
    );
    ctx.fillText(
      `Children: ${this.childNestIds.length} | Maturity: ${NestMaturity[this.maturity]}`,
      this.x - 50,
      this.y + this.radius + 45
    );
  }
}
```

### Ecosystem Visualization

```typescript
// Add ecosystem-level visualization to simulation render
SimulationEngine.prototype.renderEcosystem = function (
  ctx: CanvasRenderingContext2D
): void {
  // Skip detailed rendering at low performance
  if (
    this.performanceMonitor.frameRate < 15 &&
    !this.debugOptions.showRelationships
  ) {
    return;
  }

  // Draw connections between related nests if enabled or in focus
  if (this.debugOptions.showRelationships) {
    ctx.lineWidth = 1;

    this.nests.forEach((parentNest) => {
      // Draw only if parent nest is highlighted or all relationships shown
      if (
        this.debugOptions.highlightColony === null ||
        parentNest.id === this.debugOptions.highlightColony
      ) {
        parentNest.childNestIds.forEach((childId) => {
          const childNest = this.getNestById(childId);
          if (childNest) {
            // Draw line connecting parent to child nest
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.moveTo(parentNest.x, parentNest.y);
            ctx.lineTo(childNest.x, childNest.y);
            ctx.stroke();

            // Draw directional arrow
            const angle = Math.atan2(
              childNest.y - parentNest.y,
              childNest.x - parentNest.x
            );
            const arrowSize = 10;
            const arrowX = childNest.x - Math.cos(angle) * childNest.radius;
            const arrowY = childNest.y - Math.sin(angle) * childNest.radius;

            ctx.beginPath();
            ctx.moveTo(arrowX, arrowY);
            ctx.lineTo(
              arrowX - arrowSize * Math.cos(angle - Math.PI / 6),
              arrowY - arrowSize * Math.sin(angle - Math.PI / 6)
            );
            ctx.lineTo(
              arrowX - arrowSize * Math.cos(angle + Math.PI / 6),
              arrowY - arrowSize * Math.sin(angle + Math.PI / 6)
            );
            ctx.closePath();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fill();
          }
        });
      }
    });
  }

  // Draw performance metrics if enabled
  if (this.debugOptions.showPerformanceMetrics) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(10, 10, 200, 120);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px Arial';
    ctx.fillText(
      `FPS: ${this.performanceMonitor.frameRate.toFixed(1)}`,
      20,
      30
    );
    ctx.fillText(`Nests: ${this.nests.length}`, 20, 50);
    ctx.fillText(
      `Total Ants: ${this.performanceMonitor.totalEntities}`,
      20,
      70
    );
    ctx.fillText(
      `Update Time: ${
        this.performanceMonitor.antUpdateTime +
        this.performanceMonitor.nestUpdateTime
      }ms`,
      20,
      90
    );
    ctx.fillText(
      `Render Time: ${this.performanceMonitor.renderTime}ms`,
      20,
      110
    );
  }

  // Draw queen migration paths if enabled
  if (this.debugOptions.showQueenPaths) {
    this.nests.forEach((nest) => {
      if (nest.queen && nest.queen.migrationPath.length > 1) {
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)'; // Gold color
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(
          nest.queen.migrationPath[0].x,
          nest.queen.migrationPath[0].y
        );

        for (let i = 1; i < nest.queen.migrationPath.length; i++) {
          ctx.lineTo(
            nest.queen.migrationPath[i].x,
            nest.queen.migrationPath[i].y
          );
        }

        ctx.stroke();
      }
    });
  }
};
```

## Modular Implementation Strategy

To ensure the system can function with partial implementation, the colony expansion features will be developed in layers:

1. **Core Layer**: Basic queen implementation and multi-nest tracking
2. **Expansion Layer**: Queen migration and new colony establishment
3. **Interaction Layer**: Inter-colony dynamics and territory
4. **Specialization Layer**: Ant roles and colony optimization
5. **Ecosystem Layer**: Environmental factors and predators

Each layer should be functional on its own, allowing for incremental testing and deployment. If any layer proves too challenging or performance-intensive, the system can still function with previous layers intact.

## Performance Optimization Strategy

Phase 3 introduces significant complexity that may impact performance. The following strategies will be implemented:

1. **Spatial Partitioning**: Use grid or quadtree systems to optimize spatial queries
2. **Level of Detail Rendering**: Adjust visualization detail based on zoom level
3. **Worker Threads**: Offload intensive calculations to background threads
4. **Entity Consolidation**: Group similar entities for batch processing
5. **Adaptive Complexity**: Automatically adjust simulation complexity based on performance
6. **Statistical Approximation**: For distant colonies, use statistical models rather than individual ant calculations

The simulation will include performance monitoring tools to identify bottlenecks and adjust accordingly.

## Data Persistence Strategy

To preserve interesting colony developments in long-running simulations:

1. **State Serialization**: Create a complete snapshot of all colonies and ants
2. **Incremental History**: Record key events and state changes over time
3. **Colony Lineage**: Track the genealogy of nests for evolutionary analysis
4. **Milestone Events**: Record significant events like colony establishments or collapses
5. **Comparison Tools**: Allow loading multiple saved states for comparison
6. **Auto-save**: Periodically save the simulation state to prevent data loss

## Visual Debugging Tools

To help understand and troubleshoot complex colony behaviors:

1. **Territory Overlays**: Visualize colony boundaries and conflicts
2. **Relationship Indicators**: Show connections between parent and child colonies
3. **Ant Role Visualization**: Color-code ants by role or colony
4. **Resource Competition**: Visualize competition for food sources
5. **Migration Trails**: Show paths of queens during migration
6. **Colony Health Indicators**: Visual cues for colony status

## UI Control Additions

- Colony selection dropdown/map
- Queen production controls
- Expansion threshold adjustments
- Colony relationship management
- Territory visualization toggles
- Ecosystem statistics panel
- Time acceleration controls for long-running simulation
- Performance monitoring dashboard
- Debug visualization options panel
- Save/load ecosystem controls
- Colony history timeline viewer

## Balance Considerations

- Queen production should be a significant investment for the colony
- New colonies should be vulnerable but have growth potential
- Inter-colony competition should be meaningful but not dominant
- Resources should balance between colony maintenance and expansion
- Ecosystem should reach natural equilibrium over time
- Colony specialization should offer different but valid strategies
- Performance impact should be considered in all balance decisions

## Next Steps After Completion

With the implementation of Phase 3, the ant simulation will become a complex ecosystem with evolving colony dynamics, territorial expansion, and emergent behaviors. Future enhancements could include:

1. **Species Diversity**: Introduce different ant species with specialized traits
2. **Advanced Environment**: Add more complex terrain and environmental factors
3. **Genetic Evolution**: Implement trait inheritance and mutation systems
4. **Predator Species**: Add creatures that prey on ants for additional ecosystem dynamics
5. **User Intervention Tools**: Allow users to influence the ecosystem in various ways
6. **3D Visualization**: Extend the simulation into a three-dimensional space
