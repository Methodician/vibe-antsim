import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Components
import Navigation from './components/Navigation';

// Pages
import Home from './pages/Home';
import Simulation from './pages/Simulation';
import AuthPage from './pages/AuthPage';

const App: React.FC = () => {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <main className="App-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/simulation" element={<Simulation />} />
            <Route path="/auth" element={<AuthPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;