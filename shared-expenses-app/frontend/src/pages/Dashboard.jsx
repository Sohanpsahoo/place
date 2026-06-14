import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

const Dashboard = () => {
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBalances();
  }, []);

  const fetchBalances = async () => {
    try {
      // Group ID 1 is hardcoded for the assignment
      const response = await axios.get(`${API_URL}/balances/1`);
      setBalances(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching balances", error);
      setLoading(false);
    }
  };

  if (loading) return <div className="animate-fade-in">Loading balances...</div>;

  return (
    <div className="animate-fade-in">
      <h2>Group Balances</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Aisha's Requirement: "I just want one number per person. Who pays whom, how much, done."</p>

      <div className="dashboard-grid">
        {Object.values(balances).map((user) => {
          const net = user.net;
          const isPositive = net > 0;
          const isNegative = net < 0;
          const netValue = Math.abs(net).toFixed(2);

          return (
            <div key={user.name} className="card">
              <h3 className="item-title">{user.name}</h3>
              <div className="stat-label" style={{ marginTop: '1rem' }}>Overall Balance</div>
              <div className={`stat-value ${isPositive ? 'positive' : isNegative ? 'negative' : ''}`}>
                {isPositive ? '+' : isNegative ? '-' : ''}₹{netValue}
              </div>
              <div className="item-subtitle" style={{ marginTop: '0.5rem' }}>
                {isPositive 
                  ? `Gets back ₹${netValue}` 
                  : isNegative 
                    ? `Owes ₹${netValue}` 
                    : `Settled up`}
              </div>
              
              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                <div>Paid: ₹{user.paid.toFixed(2)}</div>
                <div>Owed: ₹{user.owed.toFixed(2)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
