import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import Chat from './components/Chat/Chat';
import NavBar from './components/NavBar';
import Platforms from './components/Platforms';
import Footer from './components/Footer';

function App() {
  return (
    <div>
        <Router>
            <Routes>
              <Route path="/" element={<NavBar />} />
              <Route path="/chat" element={<NavBar currentPath={"/chat"} />} />
              <Route path="/platforms" element={<NavBar currentPath={"/platforms"} />} />
              <Route path="/new-platform" element={<NavBar currentPath={"/new-platform"} />} />
            </Routes>
        </Router>
    </div>
  );
}

export default App;
