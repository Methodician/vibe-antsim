import React, { useState, useEffect, useRef } from 'react';
import { SimulationEngine } from '../utils/simulationEngine';

const Simulation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simulationRef = useRef<SimulationEngine | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [antCount, setAntCount] = useState<number>(20);
  const [pheromoneDecayRate, setPheromoneDecayRate] = useState<number>(0.995);
  const [foodSpawnInterval, setFoodSpawnInterval] = useState<number>(10000);
  const [stats, setStats] = useState({
    time: '00:00',
    foodCollected: 0,
    foodAvailable: 0,
    antsForaging: 0,
    antsReturning: 0,
    totalAnts: 0,
  });
  const isInitializedRef = useRef<boolean>(false);
  const statsIntervalRef = useRef<number | null>(null);

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
    };
  }, []); // Empty dependency array means this runs only once

  // Function to initialize or reinitialize the simulation with a given ant count
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
    }

    // Set simulation parameters
    simulation.setPheromoneDecayRate(pheromoneDecayRate);
    simulation.setFoodSpawnInterval(foodSpawnInterval);

    // Initialize with the given ant count
    simulation.initialize(count);

    // Render the initial state
    simulation.render(ctx);

    isInitializedRef.current = true;

    // Reset stats display
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

      // Set up render loop
      const renderLoop = () => {
        if (!simulation.isRunning) return;
        simulation.render(ctx);
        requestAnimationFrame(renderLoop);
      };

      renderLoop();

      // Start stats update interval
      statsIntervalRef.current = window.setInterval(updateStats, 500);
    } else {
      simulation.stop();

      // Stop stats interval
      if (statsIntervalRef.current) {
        window.clearInterval(statsIntervalRef.current);
        statsIntervalRef.current = null;
      }

      // Final stats update
      updateStats();
    }
  }, [isRunning]);

  // Update simulation parameters when controls change
  useEffect(() => {
    const simulation = simulationRef.current;
    if (!simulation) return;

    simulation.setPheromoneDecayRate(pheromoneDecayRate);
  }, [pheromoneDecayRate]);

  useEffect(() => {
    const simulation = simulationRef.current;
    if (!simulation) return;

    simulation.setFoodSpawnInterval(foodSpawnInterval);
  }, [foodSpawnInterval]);

  // Function to update statistics
  const updateStats = () => {
    const simulation = simulationRef.current;
    if (!simulation) return;

    const time = simulation.getFormattedTime();
    const foodStats = simulation.getFoodStats();
    const antStats = simulation.getAntStats();

    setStats({
      time,
      foodCollected: foodStats.collected,
      foodAvailable: foodStats.available,
      antsForaging: antStats.foraging,
      antsReturning: antStats.returning,
      totalAnts: antStats.total,
    });
  };

  const startSimulation = () => {
    setIsRunning(true);
  };

  const stopSimulation = () => {
    setIsRunning(false);
  };

  const resetSimulation = () => {
    const simulation = simulationRef.current;
    if (!simulation) return;

    // Clear old pheromones before reinitializing
    simulation.resetPheromones();

    // Initialize with current ant count
    initializeSimulation(antCount);
  };

  const handleAntCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const count = parseInt(e.target.value, 10);
    setAntCount(count);

    const simulation = simulationRef.current;
    if (!simulation) return;

    // If simulation is running, update ant count without stopping
    if (isRunning) {
      simulation.updateAntCount(count);
    } else {
      // If simulation is stopped, fully reinitialize
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

  // Function to handle canvas click for nest placement
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const simulation = simulationRef.current;
    if (!simulation) return;

    // Get click coordinates relative to canvas
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Update nest position
    simulation.setNestPosition(x, y);

    // Reinitialize to place ants at the new nest location
    const wasRunning = isRunning;
    if (wasRunning) {
      stopSimulation();
    }

    // Ensure pheromones are cleared
    if (simulation) {
      simulation.resetPheromones();
    }

    // Wait a moment before reinitializing
    setTimeout(() => {
      initializeSimulation(antCount);
      if (wasRunning) {
        startSimulation();
      }
    }, 50);
  };

  return (
    <div>
      <h1>Ant Simulation</h1>

      {/* Stats display */}
      <div className="simulation-stats">
        <div className="stats-container">
          <div className="stat-item">
            <span className="stat-label">Time:</span>
            <span className="stat-value">{stats.time}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Food Collected:</span>
            <span className="stat-value">{stats.foodCollected}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Food Available:</span>
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
        </div>
      </div>

      {/* Basic controls */}
      <div className="simulation-controls">
        <button onClick={startSimulation} disabled={isRunning}>
          Start Simulation
        </button>
        <button onClick={stopSimulation} disabled={!isRunning}>
          Stop Simulation
        </button>
        <button onClick={resetSimulation}>Reset Simulation</button>
      </div>

      {/* Advanced controls */}
      <div className="advanced-controls">
        <h3>Simulation Parameters</h3>
        <div className="control-grid">
          <div className="control-item">
            <label htmlFor="antCount">Number of Ants: {antCount}</label>
            <input
              type="range"
              id="antCount"
              min="1"
              max="100"
              value={antCount}
              onChange={handleAntCountChange}
            />
          </div>

          <div className="control-item">
            <label htmlFor="pheromoneDecay">
              Pheromone Decay Rate: {pheromoneDecayRate.toFixed(3)}
            </label>
            <input
              type="range"
              id="pheromoneDecay"
              min="0.9"
              max="0.999"
              step="0.001"
              value={pheromoneDecayRate}
              onChange={handlePheromoneDecayChange}
            />
            <small>Lower values = faster decay, fainter trails</small>
          </div>

          <div className="control-item">
            <label htmlFor="foodSpawnInterval">
              Food Spawn Interval: {(foodSpawnInterval / 1000).toFixed(1)}s
            </label>
            <input
              type="range"
              id="foodSpawnInterval"
              min="5000"
              max="30000"
              step="1000"
              value={foodSpawnInterval}
              onChange={handleFoodSpawnIntervalChange}
            />
            <small>Time between new food sources appearing</small>
          </div>
        </div>
      </div>

      <div className="simulation-container">
        <p className="nest-instruction">
          Click anywhere on the canvas to place the ant nest
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
