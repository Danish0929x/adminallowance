import './App.css';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import CheckAllowance from './components/CheckAllowance';
import Home from './components/Home';
import Transfer from './components/Transfer';

function App() {
  return (
    <Router>
      <div className="App">
        <nav style={{ padding: '20px', borderBottom: '1px solid #ccc' }}>
          <Link to="/" style={{ marginRight: '20px' }}>Home</Link>
          <Link to="/check-allowance" style={{ marginRight: '20px' }}>Check Allowance</Link>
          <Link to="/transfer">Transfer</Link>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/check-allowance" element={<CheckAllowance />} />
          <Route path="/transfer" element={<Transfer />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;