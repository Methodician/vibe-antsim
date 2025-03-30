import React, { useState, useEffect, useRef } from 'react';
import { SimulationEngine } from '../utils/simulation/simulationEngine';
import { Ant, HungerState } from '../utils/simulation/ant'; // Import Ant and HungerState
import './Simulation.css'; // Assuming you have some CSS

const Simulation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simulationRef = useRef<SimulationEngine | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [antCount, setAntCount] = useState<number>(50); // Default 50 ants
  const [pheromoneDecayRate, setPheromoneDecayRate] = useState<number>(0.995);
  const [foodSpawnInterval, setFoodSpawnInterval] = useState<number>(10000);
  const [diffusionRate, setDiffusionRate] = useState<number>(0.005);
  const [debugMode, setDebugMode] = useState<boolean>(true); // State for debug mode
  const [selectedAntDetails, setSelectedAntDetails] = useState<Ant | null>(
    null
  ); // State for selected ant details
  const [stats, setStats] = useState({
    time: '00:00',
    foodCollected: 0, // Now represents nest storage
    foodAvailable: 0,
    antsForaging: 0,
    antsReturning: 0,
    totalAnts: 0, // Living ants
    starvationDeaths: 0, // New stat
  });
  const isInitializedRef = useRef<boolean>(false);
  const statsIntervalRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null); // Ref for animation frame

  // Create simulation engine once on component mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Create simulation engine
    simulationRef.current = new SimulationEngine(width, height);
    simulationRef.current.setDebugMode(debugMode); // Set initial debug mode

    // Initialize with default ant count
    initializeSimulation(antCount);

    // Cleanup on unmount
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
      if (statsIntervalRef.current) {
        window.clearInterval(statsIntervalRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current); // Cancel animation frame on unmount
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once

  // Function to initialize or reinitialize the simulation
  const initializeSimulation = (count: number) => {
    const simulation = simulationRef.current;
    const canvas = canvasRef.current;

    if (!simulation || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Stop the simulation if it's running
    if (simulation.isRunning) {
      simulation.stop();
      setIsRunning(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current); // Stop animation loop
        animationFrameRef.current = null;
      }
      if (statsIntervalRef.current) {
        // Also clear stats interval
        window.clearInterval(statsIntervalRef.current);
        statsIntervalRef.current = null;
      }
    }

    // Set simulation parameters
    simulation.setPheromoneDecayRate(pheromoneDecayRate);
    simulation.setFoodSpawnInterval(foodSpawnInterval);
    simulation.setPheromoneDiffusionRate(diffusionRate);
    simulation.setDebugMode(debugMode); // Ensure debug mode is set

    // Initialize with the given ant count
    simulation.initialize(count);

    // Render the initial state
    simulation.render(ctx);

    isInitializedRef.current = true;

    // Reset stats display immediately
    updateStats();
    setSelectedAntDetails(null); // Clear selected ant on initialize
  };

  // Handle simulation running state changes
  useEffect(() => {
    const simulation = simulationRef.current;
    const canvas = canvasRef.current;

    if (!simulation || !canvas || !isInitializedRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (isRunning) {
      simulation.start();

      // Define the render loop using requestAnimationFrame
      const renderLoop = () => {
        if (!simulationRef.current || !simulationRef.current.isRunning) {
          animationFrameRef.current = null; // Ensure ref is cleared if stopped externally
          return;
        }

        // 1. Update the simulation state
        simulationRef.current.update();

        // 2. Render the updated state
        simulationRef.current.render(ctx);

        // 3. Schedule the next frame
        animationFrameRef.current = requestAnimationFrame(renderLoop);
      };

      // Start the render loop
      renderLoop();

      // Start stats update interval
      statsIntervalRef.current = window.setInterval(updateStats, 500); // Update stats less frequently
    } else {
      simulation.stop(); // Stops the internal animation loop

      if (animationFrameRef.current) {
        // Clean up frame ref if manually stopped
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // Stop stats interval
      if (statsIntervalRef.current) {
        window.clearInterval(statsIntervalRef.current);
        statsIntervalRef.current = null;
      }

      // Perform a final render and stats update when stopping
      simulation.render(ctx);
      updateStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  // Update simulation parameters when controls change
  useEffect(() => {
    simulationRef.current?.setPheromoneDecayRate(pheromoneDecayRate);
  }, [pheromoneDecayRate]);

  useEffect(() => {
    simulationRef.current?.setFoodSpawnInterval(foodSpawnInterval);
  }, [foodSpawnInterval]);

  useEffect(() => {
    simulationRef.current?.setPheromoneDiffusionRate(diffusionRate);
  }, [diffusionRate]);

  // Update debug mode when state changes
  useEffect(() => {
    simulationRef.current?.setDebugMode(debugMode);
    // Re-render once to apply debug mode visually if stopped
    if (!isRunning && simulationRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) simulationRef.current.render(ctx);
    }
  }, [debugMode, isRunning]); // Add isRunning dependency

  // Update selected ant details when simulation state changes (e.g., ant dies)
  useEffect(() => {
    if (simulationRef.current) {
      // Sync UI state with engine state if the selected ant differs (e.g., deselected in engine)
      if (selectedAntDetails !== simulationRef.current.selectedAnt) {
        setSelectedAntDetails(simulationRef.current.selectedAnt);
      }
    }
  }, [stats, selectedAntDetails]); // Re-check when stats update (as update runs in engine) or if selectedAntDetails changes

  // Function to update statistics
  const updateStats = () => {
    const simulation = simulationRef.current;
    if (!simulation) return;

    const time = simulation.getFormattedTime();
    const foodStats = simulation.getFoodStats();
    const antStats = simulation.getAntStats();

    setStats({
      time,
      foodCollected: Math.round(foodStats.collected),
      foodAvailable: foodStats.available,
      antsForaging: antStats.foraging,
      antsReturning: antStats.returning,
      totalAnts: antStats.total,
      starvationDeaths: antStats.dead, // Get dead count
    });

    // Update selected ant details as well (might change state like energy)
    if (simulationRef.current && simulationRef.current.selectedAnt) {
      // Update the details state with the current state of the selected ant
      // Assign the actual Ant instance directly
      setSelectedAntDetails(simulationRef.current.selectedAnt);
    } else if (selectedAntDetails !== null) {
      // If engine has no selected ant but UI state does, clear UI state
      setSelectedAntDetails(null);
    }
  };

  const startSimulation = () => setIsRunning(true);
  const stopSimulation = () => setIsRunning(false);

  const resetSimulation = () => {
    const simulation = simulationRef.current;
    if (!simulation) return;

    // No need to manually clear pheromones, initialize handles it
    // simulation.resetPheromones();

    // Initialize with current ant count
    initializeSimulation(antCount);
    setSelectedAntDetails(null); // Clear selection on reset
  };

  const handleAntCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const count = parseInt(e.target.value, 10);
    if (isNaN(count) || count < 1) return; // Basic validation
    setAntCount(count);

    const simulation = simulationRef.current;
    if (!simulation) return;

    // If simulation is running, update ant count dynamically
    if (isRunning) {
      simulation.updateAntCount(count);
    } else {
      // If simulation is stopped, fully reinitialize with the new count
      initializeSimulation(count);
    }
  };

  const handlePheromoneDecayChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseFloat(e.target.value);
    setPheromoneDecayRate(value);
  };

  const handleFoodSpawnIntervalChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseInt(e.target.value, 10);
    setFoodSpawnInterval(value);
  };

  const handleDiffusionRateChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseFloat(e.target.value);
    setDiffusionRate(value);
    // No need to call engine directly, useEffect handles it
  };

  const handleDebugModeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDebugMode(e.target.checked);
  };

  // Modified function to handle canvas click for ANT SELECTION
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const simulation = simulationRef.current;
    if (!canvas || !simulation) return;

    // Get click coordinates relative to canvas
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // --- Ant Selection Logic ---
    simulation.selectAntAt(x, y);
    // Update state with the selected ant object (or null)
    setSelectedAntDetails(
      simulation.selectedAnt // Assign the actual instance or null
    );
    // --- End Ant Selection ---

    /* --- Old Nest Placement Logic (Removed Commented Out Block) --- */
    // Removed the large block of commented-out code here for clarity.
  };

  // Helper to format hunger state
  const formatHungerState = (state: HungerState | undefined): string => {
    if (state === undefined) return 'N/A';
    return HungerState[state];
  };

  return (
    <div>
      <h1>Ant Simulation - Phase 1: Energy</h1>

      {/* Basic controls (Moved to top) */}
      <div className="simulation-controls">
        <button onClick={startSimulation} disabled={isRunning}>
          Start
        </button>
        <button onClick={stopSimulation} disabled={!isRunning}>
          Stop
        </button>
        <button onClick={resetSimulation}>Reset</button>
      </div>

      {/* Simulation Canvas Container (Moved up) */}
      <div className="simulation-container">
        <p className="nest-instruction">Click canvas to select an ant.</p>
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="simulation-canvas"
          onClick={handleCanvasClick} // Click now selects ants
        />
      </div>

      {/* --- Selected Ant Details Display (Moved below canvas) --- */}
      {selectedAntDetails && (
        <div className="selected-ant-details">
          <h3>Selected Ant (ID: {selectedAntDetails.id})</h3>
          <div className="stats-container">
            <div className="stat-item">
              <span className="stat-label">State:</span>
              <span className="stat-value">
                {formatHungerState(selectedAntDetails.hungerState)}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Energy:</span>
              <span className="stat-value">
                {selectedAntDetails.energy.toFixed(1)} /{' '}
                {selectedAntDetails.maxEnergy}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Position:</span>
              <span className="stat-value">
                ({selectedAntDetails.x.toFixed(0)},{' '}
                {selectedAntDetails.y.toFixed(0)})
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Direction:</span>
              <span className="stat-value">
                {(selectedAntDetails.direction * (180 / Math.PI)).toFixed(0)}°
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Speed:</span>
              <span className="stat-value">
                {selectedAntDetails.speed.toFixed(2)}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Carrying Food:</span>
              <span className="stat-value">
                {selectedAntDetails.carryingFood ? 'Yes' : 'No'} (
                {selectedAntDetails.foodAmount})
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Returning Nest:</span>
              <span className="stat-value">
                {selectedAntDetails.returningToNest ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Targeting Food:</span>
              <span className="stat-value">
                {selectedAntDetails.targetFood
                  ? `Yes (${selectedAntDetails.targetFood.x.toFixed(
                      0
                    )},${selectedAntDetails.targetFood.y.toFixed(0)})`
                  : 'No'}
              </span>
            </div>
            {/* Add more properties using the same stat-item structure */}
          </div>
        </div>
      )}
      {/* --- End Selected Ant Details --- */}

      {/* Stats display (Moved below canvas/details) */}
      <div className="simulation-stats">
        <h3>Simulation Stats</h3>
        <div className="stats-container">
          <div className="stat-item">
            <span className="stat-label">Time:</span>
            <span className="stat-value">{stats.time}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Nest Food:</span> {/* Renamed */}
            <span className="stat-value">{stats.foodCollected}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Available Food:</span> {/* Renamed */}
            <span className="stat-value">{stats.foodAvailable}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Ants Foraging:</span>
            <span className="stat-value">{stats.antsForaging}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Ants Returning:</span>
            <span className="stat-value">{stats.antsReturning}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Living Ants:</span>{' '}
            {/* Changed label */}
            <span className="stat-value">{stats.totalAnts}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Starvation Deaths:</span>
            <span className="stat-value">{stats.starvationDeaths}</span>
          </div>
        </div>
      </div>

      {/* Advanced controls (Moved to bottom) */}
      <div className="advanced-controls">
        <h3>Advanced Controls</h3>
        <div className="control-grid">
          <div className="control-item">
            <label htmlFor="antCount">Ant Count: {antCount}</label>
            <input
              type="range"
              id="antCount"
              min="1"
              max="200" // Increased max
              value={antCount}
              onChange={handleAntCountChange}
            />
          </div>

          <div className="control-item">
            <label htmlFor="pheromoneDecay">
              Pheromone Decay: {pheromoneDecayRate.toFixed(3)}
            </label>
            <input
              type="range"
              id="pheromoneDecay"
              min="0.980" // Wider range
              max="0.999"
              step="0.001"
              value={pheromoneDecayRate}
              onChange={handlePheromoneDecayChange}
            />
          </div>

          <div className="control-item">
            <label htmlFor="foodSpawnInterval">
              Food Spawn (s): {(foodSpawnInterval / 1000).toFixed(1)}
            </label>
            <input
              type="range"
              id="foodSpawnInterval"
              min="3000" // Faster option
              max="30000"
              step="1000"
              value={foodSpawnInterval}
              onChange={handleFoodSpawnIntervalChange}
            />
          </div>

          <div className="control-item">
            <label htmlFor="diffusionRate">
              Pheromone Diffusion: {diffusionRate.toFixed(2)}
            </label>
            <input
              type="range"
              id="diffusionRate"
              min="0"
              max="0.05" // Max diffusion rate
              step="0.001"
              value={diffusionRate}
              onChange={handleDiffusionRateChange}
            />
            <small>Higher values = faster spread/blur</small>
          </div>

          <div className="control-item checkbox-item">
            <input
              type="checkbox"
              id="debugMode"
              checked={debugMode}
              onChange={handleDebugModeChange}
            />
            <label htmlFor="debugMode">Debug Mode</label>
            <small>(Show pheromones, energy/state text)</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Simulation;
