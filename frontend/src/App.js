import React, { useState, useEffect, useContext, useImperativeHandle, useRef } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import Chat from './components/Chat/Chat';
import NavBar from './components/NavBar';
import Platforms from './components/Apps';
import Conversations from './components/Conversations'
import Footer from './components/Footer';
import Login from './components/Login/Login';
import Register from './components/Login/Register';
import ForgotPassword from './components/Login/ForgotPassword';
import ResetPassword from "./components/Login/ResetPassword";
import AppView from './components/AppView';
import { UserProvider } from './components/User/UserContext';

function App() {
  const mainRef = useRef();
  const chatRef = useRef();


  return (
        <UserProvider>
              <Router>
            <Routes>
              <Route path="/" element={<NavBar />} />
              <Route path="/chat/:conversationId" element={<NavBar currentPath={"/chat"} />} />
              <Route path="/chat" element={<NavBar currentPath={"/chat"} />} />
              <Route path="/conversations" element={<NavBar currentPath={"/conversations"} />} />
              <Route path="/requests" element={<NavBar currentPath={"/requests"} />} />
              <Route path="/apps" element={<NavBar currentPath={"/apps"} />} />
              <Route path="/app/:appId" element={<NavBar currentPath={"/app"} />} />
              <Route path="/new-app" element={<NavBar currentPath={"/new-app"} />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
            </Routes>
            </Router>
        </UserProvider>
  );
}

export default App;
