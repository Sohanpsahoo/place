import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Tag, DollarSign } from 'lucide-react';

const API_URL = 'http://127.0.0.1:8000/api';

const ExpensesList = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await axios.get(`${API_URL}/expenses/1`);
      setExpenses(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching expenses", error);
      setLoading(false);
    }
  };

  if (loading) return <div className="animate-fade-in">Loading expenses...</div>;

  return (
    <div className="animate-fade-in">
      <h2>All Expenses</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Rohan's Requirement: "No magic numbers. If the app says I owe ₹2,300, I want to see exactly which expenses make that up."</p>

      <div className="list-container">
        {expenses.map((exp) => (
          <div key={exp.id} className="card list-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>{exp.description}</h3>
                <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar size={14} />
                    {new Date(exp.date).toLocaleDateString()}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Tag size={14} />
                    {exp.is_settlement ? 'Settlement' : 'Expense'}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="stat-value" style={{ fontSize: '1.5rem', marginTop: 0 }}>
                  ₹{exp.converted_amount_inr.toFixed(2)}
                </div>
                {exp.currency !== 'INR' && (
                  <div className="item-subtitle">Original: {exp.amount} {exp.currency}</div>
                )}
              </div>
            </div>
            
            <div style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
              <div style={{ fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Paid By
              </div>
              <div style={{ marginBottom: '1rem' }}>User ID: {exp.paid_by_id}</div>

              <div style={{ fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Split Breakdown
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
                {exp.splits && exp.splits.map((split, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: 'var(--surface)', borderRadius: '4px' }}>
                    <span>User ID: {split.user_id}</span>
                    <span style={{ fontWeight: '600' }}>₹{split.amount_owed.toFixed(2)}</span>
                  </div>
                ))}
                {(!exp.splits || exp.splits.length === 0) && (
                  <span style={{ color: 'var(--text-muted)' }}>No splits recorded.</span>
                )}
              </div>
            </div>
          </div>
        ))}

        {expenses.length === 0 && (
          <div className="card text-center" style={{ color: 'var(--text-muted)' }}>
            No expenses found for this group. Import the CSV to get started.
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpensesList;
