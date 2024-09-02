import { useState } from 'react'
import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ListPolicy from './components/ListPolicy/ListPolicy';
import MyPolicies from './components/UserBought/MyPolicies';
import BuyPolicy from './components/BuyPolicy'
import MyClaims from './components/MyClaims/MyClaims';

function App() {
  
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ListPolicy />} />
        <Route path="/myPolicies" element={<MyPolicies />} />
        <Route path ="/myClaims" element={<MyClaims/>}/>
      </Routes>
    </Router>
  );
}

export default App


