import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="home-container">
      <div className="hero-section">
        <h1>Vibe Ant Simulation</h1>
        <p className="lead-text">Explore the fascinating world of ant colony behavior through interactive simulation.</p>
        <div className="cta-buttons">
          <Link to="/simulation" className="cta-button primary">
            Try the Simulation
          </Link>
          <Link to="/auth" className="cta-button secondary">
            Sign Up to Save Progress
          </Link>
        </div>
      </div>

      <div className="features-section">
        <h2>Project Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>Real-time Simulation</h3>
            <p>Watch ants move and interact in a dynamic environment with real-time updates and animations.</p>
          </div>
          <div className="feature-card">
            <h3>Customizable Parameters</h3>
            <p>Adjust the number of ants and other simulation parameters to create different scenarios.</p>
          </div>
          <div className="feature-card">
            <h3>Save & Share</h3>
            <p>Create an account to save your favorite simulations and share them with others.</p>
          </div>
          <div className="feature-card">
            <h3>Research & Education</h3>
            <p>Learn about ant colony behavior, swarm intelligence, and emergent properties of complex systems.</p>
          </div>
        </div>
      </div>

      <div className="about-section">
        <h2>About the Project</h2>
        <p>
          The Vibe Ant Simulation is an interactive web application that simulates ant colony behavior. 
          This project demonstrates how simple rules followed by individual ants can lead to complex 
          emergent behavior at the colony level.
        </p>
        <p>
          Built with React, Firebase, and HTML5 Canvas, this simulation allows users to observe and 
          interact with a virtual ant colony, adjusting various parameters to see how they affect the 
          collective behavior of the ants.
        </p>
        <p>
          <Link to="/simulation" className="text-link">
            Try the simulation now →
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Home;