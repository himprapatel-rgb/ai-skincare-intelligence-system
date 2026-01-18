import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './CommonStyles.css';
import './SkinGoalsPage.css';

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

      <div className="skin-goals-grid">
        <div className="card">
          <div className="card-header"><h3>Available Goals</h3></div>
          <div className="card-content">
            {goals.map(goal => (
              <button
                key={goal.id}
                type="button"
                onClick={() => toggleGoal(goal.id)}
                className={`skin-goals-item${goal.selected ? ' selected' : ''}`}
                aria-pressed={goal.selected}
              >
                <span className="skin-goals-icon">{goal.icon}</span>
                <span className="skin-goals-text">
                  <span className="skin-goals-title">{goal.name}</span>
                  <span className="skin-goals-desc">{goal.description}</span>
                </span>
                <span className="skin-goals-toggle">{goal.selected ? '✓' : '+'}</span>
              </button>
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
                <div key={goal.id} className="skin-goals-priority">
                  <span className="skin-goals-rank">#{index + 1}</span>
                  <span className="skin-goals-icon">{goal.icon}</span>
                  <span className="skin-goals-name">{goal.name}</span>
                  <span className="skin-goals-controls">
                    <button onClick={() => updatePriority(goal.id, 'up')} disabled={index === 0} type="button">↑</button>
                    <button onClick={() => updatePriority(goal.id, 'down')} disabled={index === selectedGoals.length - 1} type="button">↓</button>
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="skin-goals-actions">
        <Link to="/profile" className="btn btn-secondary">← Back to Profile</Link>
        <button onClick={handleSave} className="btn btn-primary" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Goals'}
        </button>
      </div>
    </div>
  );
};

export default SkinGoalsPage;
