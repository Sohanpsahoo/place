import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

const AddExpenseView = () => {
  const [users, setUsers] = useState([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidById, setPaidById] = useState('');
  const [splitType, setSplitType] = useState('equal');
  const [status, setStatus] = useState('');

  useEffect(() => {
    axios.get(`${API_URL}/users`).then(res => setUsers(res.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    
    let splits = [];
    if (splitType === 'equal') {
      const perPerson = parsedAmount / users.length;
      splits = users.map(u => ({ user_id: u.id, amount_owed: perPerson }));
    }
    
    // For brevity in hackathon, only implemented equal split in the manual UI.
    // The backend supports all via the payload structure and CSV.
    
    const payload = {
      paid_by_id: parseInt(paidById),
      amount: parsedAmount,
      currency: "INR",
      converted_amount_inr: parsedAmount,
      date: new Date().toISOString(),
      description,
      is_settlement: false,
      splits
    };

    try {
      await axios.post(`${API_URL}/expenses`, payload);
      setStatus('Expense added successfully!');
      setDescription('');
      setAmount('');
    } catch (err) {
      setStatus('Error adding expense.');
    }
  };

  return (
    <div className="card animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2>Add Expense</h2>
      <p className="item-subtitle" style={{ marginBottom: '1.5rem' }}>Manually record a new shared expense.</p>
      
      {status && <div style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>{status}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Description</label>
          <input type="text" value={description} onChange={e => setDescription(e.target.value)} required style={{ width: '100%', padding: '0.5rem', background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'white', borderRadius: '4px' }} />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Amount (₹)</label>
          <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required style={{ width: '100%', padding: '0.5rem', background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'white', borderRadius: '4px' }} />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Paid By</label>
          <select value={paidById} onChange={e => setPaidById(e.target.value)} required style={{ width: '100%', padding: '0.5rem', background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'white', borderRadius: '4px' }}>
            <option value="">Select User</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Split Type</label>
          <select value={splitType} onChange={e => setSplitType(e.target.value)} style={{ width: '100%', padding: '0.5rem', background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'white', borderRadius: '4px' }}>
            <option value="equal">Equal</option>
            <option value="unequal">Unequal (UI WIP)</option>
            <option value="percentage">Percentage (UI WIP)</option>
          </select>
          <small style={{ color: 'var(--text-muted)' }}>Note: Only 'Equal' is fully implemented in the manual UI. All types are supported via CSV.</small>
        </div>

        <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Add Expense</button>
      </form>
    </div>
  );
};

export default AddExpenseView;
