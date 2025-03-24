import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

function Navigation() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  return (
    <nav>
      <div className="nav-container">
        <div className="nav-logo">
          <Link to="/">Vibe AntSim</Link>
        </div>
        <ul className="nav-links">
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/simulation">Simulation</Link>
          </li>
          <li>
            <Link to="/auth">{user ? 'Account' : 'Login / Sign Up'}</Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navigation;