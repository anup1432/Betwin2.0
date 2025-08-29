import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Deposit from './pages/Deposit';
import Withdraw from './pages/Withdraw';
import Navbar from './components/Navbar';

function App() {
  return (
    <Router>
      <Navbar />
      <div className="container mx-auto p-4">
        <Routes>
          <Route path="/deposit" element={<Deposit />} />
          <Route path="/withdraw" element={<Withdraw />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
