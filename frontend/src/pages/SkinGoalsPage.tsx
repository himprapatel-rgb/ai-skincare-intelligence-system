import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './CommonStyles.css';

interface SkinGoal {
  id: string;
  name: string;
  icon: string;
  description: string;
  selected: boolean;
  priority: number;
}

/**
 * Skin Goals Page (US-402)
 * Set and prioritize personal skincare goals for personalized recommendations
 */
const SkinGoalsPage: React.FC = () => {
  const [goals, setGoals] = useState<SkinGoal[]>([
    { id: '1', name: 'Clear Acne', icon: '🩹', description: 'Reduce breakouts and blemishes', selected: true, priority: 1 },
    { id: '2', name: 'Anti-Aging', icon: '✨', description: 'Reduce fine lines and wrinkles', selected: false, priority: 0 },
    { id: '3', name: 'Hydration', icon: '💧', description: 'Improve skin moisture levels', selected: true, priority: 2 },
    { id: '4', name: 'Even Skin Tone', icon: '🌟', description: 'Reduce dark spots and hyperpigmentation', selected: false, priority: 0 },
    { id: '5', name: 'Oil Control', icon: '🧴', description: 'Manage excess sebum production', selected: false, priority: 0 },
    { id: '6', name: 'Sensitive Skin Care', icon: '🌸', description: 'Gentle care for reactive skin', selected: false, priority: 0 },
    { id: '7', name: 'Sun Protection', icon: '☀️', description: 'Protect against UV damage', selected: true, priority: 3 },
    { id: '8', name: 'Pore Minimizing', icon: '🔍', description: 'Reduce appearance of pores', selected: false, priority: 0 },
  ]);
  const [isSaving, setIsSaving] = useState(false);

  const toggleGoal = (id: string) => {
    setGoals(prev => prev.map(goal => {
      if (goal.id === id) {
        const newSelected = !goal.selected;
        return { ...goal, selected: newSelected, priority: newSelected ? Math.max(...prev.map(g => g.priority)) + 1 : 0 };
      }
      return goal;
    }));
  };

  const updatePriority = (id: string, direction: 'up' | 'down') => {
    const selectedGoals = goals.filter(g => g.selected).sort((a, b) => a.priority - b.priority);
    const index = selectedGoals.findIndex(g => g.id === id);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === selectedGoals.length - 1)) return;
    
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = selectedGoals[index].priority;
    selectedGoals[index].priority = selectedGoals[swapIndex].priority;
    selectedGoals[swapIndex].priority = temp;
    
    setGoals(prev => prev.map(g => {
      const updated = selectedGoals.find(sg => sg.id === g.id);
      return updated || g;
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Save to backend
    await new Promise(r => setTimeout(r, 1000));
    setIsSaving(false);
    alert('Goals saved successfully!');
  };

  const selectedGoals = goals.filter(g => g.selected).sort((a, b) => a.priority - b.priority);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🎯 Skin Goals</h1>
        <p>Select and prioritize your skincare goals for personalized recommendations</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="card">
          <div className="card-header"><h3>Available Goals</h3></div>
          <div className="card-content">
            {goals.map(goal => (
              <div key={goal.id} onClick={() => toggleGoal(goal.id)} style={{ display: 'flex', alignItems: 'center', padding: '12px', marginBottom: '8px', background: goal.selected ? 'var(--primary)' : 'var(--bg-secondary)', borderRadius: '8px', cursor: 'pointer', color: goal.selected ? 'white' : 'inherit' }}>
                <span style={{ fontSize: '24px', marginRight: '12px' }}>{goal.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold' }}>{goal.name}</div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>{goal.description}</div>
                </div>
                <span>{goal.selected ? '✓' : '+'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3>Your Priorities ({selectedGoals.length} selected)</h3></div>
          <div className="card-content">
            {selectedGoals.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '24px' }}>Select goals from the left panel</p>
            ) : (
              selectedGoals.map((goal, index) => (
                <div key={goal.id} style={{ display: 'flex', alignItems: 'center', padding: '12px', marginBottom: '8px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 'bold', marginRight: '12px', color: 'var(--primary)' }}>#{index + 1}</span>
                  <span style={{ fontSize: '24px', marginRight: '12px' }}>{goal.icon}</span>
                  <div style={{ flex: 1 }}>{goal.name}</div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => updatePriority(goal.id, 'up')} disabled={index === 0} style={{ padding: '4px 8px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer' }}>↑</button>
                    <button onClick={() => updatePriority(goal.id, 'down')} disabled={index === selectedGoals.length - 1} style={{ padding: '4px 8px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer' }}>↓</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between' }}>
        <Link to="/profile" className="btn btn-secondary">← Back to Profile</Link>
        <button onClick={handleSave} className="btn btn-primary" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Goals'}
        </button>
      </div>
    </div>
  );
};

export default SkinGoalsPage;
