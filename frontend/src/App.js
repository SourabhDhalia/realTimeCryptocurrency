// App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import ChartPage from "./components/ChartPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chart/:symbol" element={<ChartPage />} />
      </Routes>
    </Router>
  );
}

export default App;