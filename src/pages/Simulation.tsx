import React, { useState, useEffect, useRef } from 'react';
import { SimulationEngine } from '../utils/simulationEngine';
import './Simulation.css'; // Assuming you have some CSS

const Simulation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simulationRef = useRef<SimulationEngine | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [antCount, setAntCount] = useState<number>(50); // Default 50 ants
  const [pheromoneDecayRate, setPheromoneDecayRate] = useState<number>(0.995);
  const [foodSpawnInterval, setFoodSpawnInterval] = useState<number>(10000);
  const [diffusionRate, setDiffusionRate] = useState<number>(0.05);
  const [debugMode, setDebugMode] = useState<boolean>(false); // State for debug mode
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
    simulation.setDiffusionRate(diffusionRate);
    simulation.setDebugMode(debugMode); // Ensure debug mode is set

    // Initialize with the given ant count
    simulation.initialize(count);

    // Render the initial state
    simulation.render(ctx);

    isInitializedRef.current = true;

    // Reset stats display immediately
    updateStats();
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
    simulationRef.current?.setDiffusionRate(diffusionRate);
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

  // Function to handle canvas click for nest placement
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const simulation = simulationRef.current;
    if (!canvas || !simulation) return;

    // Get click coordinates relative to canvas
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Update nest position
    simulation.setNestPosition(x, y);

    // Reinitialize to place ants at the new nest location
    const wasRunning = isRunning;
    // Stop simulation *before* reinitializing
    if (wasRunning) {
      stopSimulation(); // This now handles stopping animation loop and stats interval
    }

    // Reinitialize immediately
    initializeSimulation(antCount);

    // Restart if it was running before
    if (wasRunning) {
      // Use setTimeout to allow React state update to process before restarting
      setTimeout(() => startSimulation(), 50);
    } else {
      // If it wasn't running, render the new initial state
      const ctx = canvas.getContext('2d');
      if (ctx) simulation.render(ctx);
    }
  };

  return (
    <div>
      <h1>Ant Simulation - Phase 1: Energy</h1>

      {/* Stats display */}
      <div className="simulation-stats">
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

      {/* Basic controls */}
      <div className="simulation-controls">
        <button onClick={startSimulation} disabled={isRunning}>
          Start
        </button>
        <button onClick={stopSimulation} disabled={!isRunning}>
          Stop
        </button>
        <button onClick={resetSimulation}>Reset</button>
      </div>

      {/* Advanced controls */}
      <div className="advanced-controls">
        <h3>Simulation Parameters</h3>
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
              max="0.5" // Max diffusion rate
              step="0.01"
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

      <div className="simulation-container">
        <p className="nest-instruction">
          Click canvas to place nest & reset simulation.
        </p>
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="simulation-canvas"
          onClick={handleCanvasClick}
        />
      </div>
    </div>
  );
};

export default Simulation;
