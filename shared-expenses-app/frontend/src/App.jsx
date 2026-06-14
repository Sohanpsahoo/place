import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ImportView from './pages/ImportView';
import ExpensesList from './pages/ExpensesList';
import { Wallet, UploadCloud, List as ListIcon } from 'lucide-react';
import './index.css';

function App() {
  return (
    <Router>
      <div className="app-container animate-fade-in">
        <header className="header">
          <h1 className="header-title">FairSplit</h1>
          <nav style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/" className="btn btn-secondary">
              <Wallet size={18} /> Balances
            </Link>
            <Link to="/expenses" className="btn btn-secondary">
              <ListIcon size={18} /> Expenses
            </Link>
            <Link to="/import" className="btn btn-primary">
              <UploadCloud size={18} /> Import CSV
            </Link>
          </nav>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/expenses" element={<ExpensesList />} />
            <Route path="/import" element={<ImportView />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
