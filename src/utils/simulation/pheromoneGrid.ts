// Manages the pheromone layers in the simulation environment

// Enum for pheromone types
export enum PheromoneType {
  INBOUND = 0, // From ants returning to nest with food (Green trail)
  OUTBOUND = 1, // From ants leaving nest, searching for food (Blue trail)
}

export class PheromoneGrid {
  // Two separate grids for different pheromone types
  inboundGrid!: number[][]; // Pheromones from ants with food returning to nest
  outboundGrid!: number[][]; // Pheromones from ants leaving the nest
  width: number; // Grid width in cells
  height: number; // Grid height in cells
  cellSize: number; // Size of each grid cell in pixels
  decayRate: number;
  diffusionRate: number;
  maxPheromone: number; // Maximum strength per cell

  constructor(
    canvasWidth: number,
    canvasHeight: number,
    cellSize: number = 5,
    decayRate: number = 0.995,
    diffusionRate: number = 0.01, // Default diffusion rate
    maxPheromone: number = 10 // Default max strength
  ) {
    this.width = Math.ceil(canvasWidth / cellSize);
    this.height = Math.ceil(canvasHeight / cellSize);
    this.cellSize = cellSize;
    this.decayRate = decayRate;
    this.diffusionRate = diffusionRate;
    this.maxPheromone = maxPheromone;

    // Initialize grids
    this.reset(); // Use reset method for initialization
  }

  reset(): void {
    // Initialize grids with zeros
    this.inboundGrid = Array(this.height)
      .fill(0)
      .map(() => Array(this.width).fill(0));
    this.outboundGrid = Array(this.height)
      .fill(0)
      .map(() => Array(this.width).fill(0));
  }

  // Add pheromone at a specific world coordinate
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
      const grid =
        type === PheromoneType.INBOUND ? this.inboundGrid : this.outboundGrid;
      grid[gridY][gridX] += amount;
      // Cap at maximum pheromone level
      grid[gridY][gridX] = Math.min(grid[gridY][gridX], this.maxPheromone);
    }
  }

  // Get pheromone value at a specific world coordinate
  getPheromone(
    x: number,
    y: number,
    type: PheromoneType = PheromoneType.INBOUND
  ): number {
    const gridX = Math.floor(x / this.cellSize);
    const gridY = Math.floor(y / this.cellSize);

    // Check bounds
    if (gridX >= 0 && gridX < this.width && gridY >= 0 && gridY < this.height) {
      const grid =
        type === PheromoneType.INBOUND ? this.inboundGrid : this.outboundGrid;
      return grid[gridY][gridX];
    }
    return 0; // Return 0 if out of bounds
  }

  // Apply decay to all pheromones
  decay(): void {
    const decayGrid = (grid: number[][]): void => {
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          grid[y][x] *= this.decayRate;
          // Set very low values to 0 to prevent floating point issues and improve performance
          if (grid[y][x] < 0.01) {
            grid[y][x] = 0;
          }
        }
      }
    };
    decayGrid(this.inboundGrid);
    decayGrid(this.outboundGrid);
  }

  // Apply diffusion using a simple box blur approach
  diffuse(): void {
    if (this.diffusionRate <= 0) return;

    const applyDiffusion = (grid: number[][]): number[][] => {
      const newGrid = Array(this.height)
        .fill(0)
        .map(() => Array(this.width).fill(0));
      const kernelSize = 1; // Radius of diffusion (1 means 3x3 neighborhood)
      const diffusionFactor = this.diffusionRate / (kernelSize * 2 + 1) ** 2; // Normalize rate

      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          let sum = 0;
          let count = 0; // Keep track of valid neighbors including self

          // Iterate over the neighborhood (e.g., 3x3 centered at x, y)
          for (let dy = -kernelSize; dy <= kernelSize; dy++) {
            for (let dx = -kernelSize; dx <= kernelSize; dx++) {
              const ny = y + dy;
              const nx = x + dx;

              // Check if neighbor is within grid bounds
              if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
                sum += grid[ny][nx]; // Get value from original grid
                count++;
              }
            }
          }

          // Calculate the diffused value: original * (1-rate) + average * rate
          const average = count > 0 ? sum / count : grid[y][x]; // Use current value if no neighbors (edge case)
          // Calculate based on difference from average, clamped at 0 and maxPheromone
          const diffusedValue =
            grid[y][x] + (average - grid[y][x]) * diffusionFactor; // Use the normalized factor
          newGrid[y][x] = Math.max(
            0,
            Math.min(this.maxPheromone, diffusedValue)
          );

          // Ensure diffused value doesn't exceed max
          // newGrid[y][x] = Math.min(this.maxPheromone, average); // Simpler average blur
        }
      }
      return newGrid;
    };

    this.inboundGrid = applyDiffusion(this.inboundGrid);
    this.outboundGrid = applyDiffusion(this.outboundGrid);
  }

  // Draw the pheromone grid
  draw(ctx: CanvasRenderingContext2D): void {
    const originalAlpha = ctx.globalAlpha;
    const cellSize = this.cellSize;

    const drawGrid = (grid: number[][], colorRgb: string): void => {
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const level = grid[y][x];
          if (level > 0.01) {
            // Only draw if above threshold
            // Alpha based on pheromone strength relative to max
            const alpha = Math.min(1, level / this.maxPheromone);
            ctx.globalAlpha = alpha * 0.6; // Apply base transparency
            ctx.fillStyle = colorRgb;
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
          }
        }
      }
    };

    // Draw inbound pheromones (Green)
    drawGrid(this.inboundGrid, 'rgb(0, 200, 0)'); // Brighter Green

    // Draw outbound pheromones (Blue)
    drawGrid(this.outboundGrid, 'rgb(0, 0, 255)'); // Standard Blue

    // Restore alpha
    ctx.globalAlpha = originalAlpha;
  }

  // Note: getAveragePheromone method removed as it wasn't used by the Ant class.
  //       The direct getPheromone calls are sufficient for the current logic.
  // Note: getRandomNeighbor and the random diffusion within decay() removed in favor of the separate diffuse() method.
} // End PheromoneGrid class
