import React, { useState, useEffect, useRef } from 'react';
import { SimulationEngine } from '../utils/simulationEngine';

const Simulation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simulationRef = useRef<SimulationEngine | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [antCount, setAntCount] = useState<number>(20);
  const isInitializedRef = useRef<boolean>(false);
  
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
    };
  }, []);  // Empty dependency array means this runs only once
  
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
    
    // Initialize with the given ant count
    simulation.initialize(count);
    
    // Render the initial state
    simulation.render(ctx);
    
    isInitializedRef.current = true;
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
    } else {
      simulation.stop();
    }
  }, [isRunning]);
  
  const startSimulation = () => {
    setIsRunning(true);
  };
  
  const stopSimulation = () => {
    setIsRunning(false);
  };
  
  const resetSimulation = () => {
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
      <div className="simulation-controls">
        <button onClick={startSimulation} disabled={isRunning}>
          Start Simulation
        </button>
        <button onClick={stopSimulation} disabled={!isRunning}>
          Stop Simulation
        </button>
        <button onClick={resetSimulation}>Reset Simulation</button>
        <div className="ant-count-control">
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
      </div>
      <div className="simulation-container">
        <p className="nest-instruction">Click anywhere on the canvas to place the ant nest</p>
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