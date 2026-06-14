import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Dashboard from './pages/Dashboard';
import ImportView from './pages/ImportView';
import ExpensesList from './pages/ExpensesList';
import AddExpenseView from './pages/AddExpenseView';
import SettleView from './pages/SettleView';
import { Wallet, UploadCloud, List as ListIcon, Plus, UserCheck } from 'lucide-react';
import './index.css';

const API_URL = 'https://place-0v2o.onrender.com/api';

function App() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState('');

  useEffect(() => {
    axios.get(`${API_URL}/users`).then(res => {
      setUsers(res.data);
      if (res.data.length > 0) setCurrentUser(res.data[0].id);
    }).catch(err => console.log('No users yet. Import CSV first.'));
  }, []);

  return (
    <Router>
      <div className="app-container animate-fade-in">
        <header className="header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <h1 className="header-title">FairSplit</h1>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Logged in as:</span>
            <select 
              value={currentUser} 
              onChange={e => setCurrentUser(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: 'bold', outline: 'none' }}
            >
              <option value="">Guest</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>

          <nav style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/" className="btn btn-secondary">
              <Wallet size={18} /> Balances
            </Link>
            <Link to="/expenses" className="btn btn-secondary">
              <ListIcon size={18} /> Expenses
            </Link>
            <Link to="/add" className="btn btn-secondary">
              <Plus size={18} /> Add
            </Link>
            <Link to="/settle" className="btn btn-secondary">
              <UserCheck size={18} /> Settle
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
            <Route path="/add" element={<AddExpenseView />} />
            <Route path="/settle" element={<SettleView />} />
            <Route path="/import" element={<ImportView />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
