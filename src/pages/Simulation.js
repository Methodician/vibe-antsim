import React, { useState, useEffect, useRef } from 'react';
import { SimulationEngine } from '../utils/simulationEngine';

function Simulation() {
  const canvasRef = useRef(null);
  const simulationRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  const [antCount, setAntCount] = useState(20);
  
  // Initialize simulation on component mount
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Create simulation engine
    simulationRef.current = new SimulationEngine(width, height);
    simulationRef.current.initialize(antCount);
    
    // Draw initial state
    simulationRef.current.render(ctx);
    
    // Cleanup on unmount
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, [antCount]);
  
  // Handle simulation running state changes
  useEffect(() => {
    const simulation = simulationRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
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
    setIsRunning(false);
    
    // Use setTimeout to ensure the simulation has stopped
    setTimeout(() => {
      const simulation = simulationRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      simulation.initialize(antCount);
      simulation.render(ctx);
    }, 50);
  };
  
  const handleAntCountChange = (e) => {
    const count = parseInt(e.target.value, 10);
    setAntCount(count);
    resetSimulation();
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
        <button onClick={resetSimulation}>
          Reset Simulation
        </button>
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
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={600} 
        className="simulation-canvas"
      />
    </div>
  );
}

export default Simulation;