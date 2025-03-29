# Ant Simulation Enhancement Plan - Phase 3

## Overview

Phase 3 focuses on implementing colony expansion mechanics through queen ants, multiple nests, and inter-colony dynamics. This phase builds upon the energy system from Phase 1 and the nest dynamics from Phase 2 to create a complex, evolving ecosystem of ant colonies.

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

  // Queen-specific methods
  migrateToNewLocation(): void; // Begin migration process
  selectNestLocation(): { x: number; y: number }; // Find suitable new nest site
  establishColony(): Nest | null; // Create new nest when ready
  produceNewAnt(): Ant; // Create new ants at a higher rate
  summonEscort(): void; // Request worker ants for protection
  assessColonyHealth(): number; // Evaluate colony status
}
```

### Multi-Nest Management

```typescript
class SimulationEngine {
  // Extended to handle multiple nests
  nests: Nest[]; // Array of all nests in simulation
  activeNestIndex: number; // Currently selected nest
  nestRelationships: Map<number, Map<number, NestRelationship>>; // Track relations between nests

  // New methods
  addNest(nest: Nest): number; // Add new nest to simulation, return ID
  removeNest(nestId: number): boolean; // Remove collapsed/abandoned nest
  selectNest(nestId: number): void; // Change focus to specific nest
  getNestById(nestId: number): Nest | undefined; // Get nest reference
  updateAllNests(): void; // Update all nests in simulation
  calculateInterColonyDynamics(): void; // Handle nest interactions
  assignAntsToNest(ants: Ant[], nestId: number): void; // Associate ants with nest
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

  // New methods
  produceQueen(): QueenAnt | null; // Create queen ant when conditions are met
  calculateExpansionReadiness(): boolean; // Determine if ready to expand
  allocateResourcesForExpansion(amount: number): number; // Set aside resources
  claimTerritory(): void; // Expand or contract territorial boundaries
  interactWithForeignAnt(ant: Ant): void; // Handle ants from other colonies
  calculateColonyStrength(): number; // Overall measure of colony power
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
// Draw nest with territory indicator
Nest.draw(ctx: CanvasRenderingContext2D): void {
  // Draw territory boundary
  ctx.strokeStyle = `rgba(${this.colonyScent % 255}, ${(this.colonyScent * 3) % 255}, ${(this.colonyScent * 7) % 255}, 0.3)`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(this.x, this.y, this.territory.radius, 0, Math.PI * 2);
  ctx.stroke();

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

  // Continue with normal nest drawing...
}
```

### Ecosystem Visualization

```typescript
// Add ecosystem-level visualization to simulation render
SimulationEngine.prototype.renderEcosystem = function (
  ctx: CanvasRenderingContext2D
): void {
  // Draw connections between related nests
  ctx.lineWidth = 1;

  this.nests.forEach((parentNest) => {
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
  });

  // Draw territory borders and overlaps
  // (more visualization code...)
};
```

## UI Control Additions

- Colony selection dropdown/map
- Queen production controls
- Expansion threshold adjustments
- Colony relationship management
- Territory visualization toggles
- Ecosystem statistics panel
- Time acceleration controls for long-term simulation

## Balance Considerations

- Queen production should be a significant investment for the colony
- New colonies should be vulnerable but have growth potential
- Inter-colony competition should be meaningful but not dominant
- Resources should balance between colony maintenance and expansion
- Ecosystem should reach natural equilibrium over time
- Colony specialization should offer different but valid strategies

## Next Steps After Completion

With the implementation of Phase 3, the ant simulation will become a complex ecosystem with evolving colony dynamics, territorial expansion, and emergent behaviors. Future enhancements could include introducing different ant species with specialized traits, more complex environmental factors, genetic adaptations over generations, or predator species that add another level of complexity to the simulation.
