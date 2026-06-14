import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api"';

const SettleView = () => {
  const [users, setUsers] = useState([]);
  const [payerId, setPayerId] = useState('');
  const [payeeId, setPayeeId] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    axios.get(`${API_URL}/users`).then(res => setUsers(res.data));
  }, []);

  const handleSettle = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/settle?payer_id=${payerId}&payee_id=${payeeId}&amount=${amount}`);
      setStatus('Settlement recorded successfully!');
      setAmount('');
    } catch (err) {
      setStatus('Error recording settlement.');
    }
  };

  return (
    <div className="card animate-fade-in" style={{ maxWidth: '500px', margin: '0 auto' }}>
      <h2>Settle Up</h2>
      <p className="item-subtitle" style={{ marginBottom: '1.5rem' }}>Record a payment to settle debts.</p>
      
      {status && <div style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>{status}</div>}

      <form onSubmit={handleSettle} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Who Paid?</label>
          <select value={payerId} onChange={e => setPayerId(e.target.value)} required style={{ width: '100%', padding: '0.5rem', background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'white', borderRadius: '4px' }}>
            <option value="">Select User</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Who Received?</label>
          <select value={payeeId} onChange={e => setPayeeId(e.target.value)} required style={{ width: '100%', padding: '0.5rem', background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'white', borderRadius: '4px' }}>
            <option value="">Select User</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Amount (₹)</label>
          <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required style={{ width: '100%', padding: '0.5rem', background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'white', borderRadius: '4px' }} />
        </div>

        <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Record Payment</button>
      </form>
    </div>
  );
};

export default SettleView;
