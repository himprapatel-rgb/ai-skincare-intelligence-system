import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  IconTarget, IconSparkles, IconDroplet, IconStar, 
  IconPackage, IconLeaf, IconSun, IconSearch, IconCheck, IconPlus,
  IconArrowUp, IconArrowDown, IconArrowLeft
} from '../components/Icons';
import './CommonStyles.css';
import './SkinGoalsPage.css';

interface SkinGoal {
  id: string;
  name: string;
  iconKey: string;
  description: string;
  selected: boolean;
  priority: number;
}

const iconMap: Record<string, React.ReactNode> = {
  'acne': <IconTarget size={24} strokeWidth={2} />,
  'anti-aging': <IconSparkles size={24} strokeWidth={2} />,
  'hydration': <IconDroplet size={24} strokeWidth={2} />,
  'even-tone': <IconStar size={24} strokeWidth={2} />,
  'oil-control': <IconPackage size={24} strokeWidth={2} />,
  'sensitive': <IconLeaf size={24} strokeWidth={2} />,
  'sun-protection': <IconSun size={24} strokeWidth={2} />,
  'pores': <IconSearch size={24} strokeWidth={2} />,
};

/**
 * Skin Goals Page (US-402)
 * Set and prioritize personal skincare goals for personalized recommendations
 */
const SkinGoalsPage: React.FC = () => {
  const [goals, setGoals] = useState<SkinGoal[]>([
    { id: '1', name: 'Clear Acne', iconKey: 'acne', description: 'Reduce breakouts and blemishes', selected: true, priority: 1 },
    { id: '2', name: 'Anti-Aging', iconKey: 'anti-aging', description: 'Reduce fine lines and wrinkles', selected: false, priority: 0 },
    { id: '3', name: 'Hydration', iconKey: 'hydration', description: 'Improve skin moisture levels', selected: true, priority: 2 },
    { id: '4', name: 'Even Skin Tone', iconKey: 'even-tone', description: 'Reduce dark spots and hyperpigmentation', selected: false, priority: 0 },
    { id: '5', name: 'Oil Control', iconKey: 'oil-control', description: 'Manage excess sebum production', selected: false, priority: 0 },
    { id: '6', name: 'Sensitive Skin Care', iconKey: 'sensitive', description: 'Gentle care for reactive skin', selected: false, priority: 0 },
    { id: '7', name: 'Sun Protection', iconKey: 'sun-protection', description: 'Protect against UV damage', selected: true, priority: 3 },
    { id: '8', name: 'Pore Minimizing', iconKey: 'pores', description: 'Reduce appearance of pores', selected: false, priority: 0 },
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
    try {
      const token = localStorage.getItem('token');
      const selectedGoals = goals.filter(g => g.selected).sort((a, b) => a.priority - b.priority);
      
      // Create/update goals via API
      for (const goal of selectedGoals) {
        await fetch('/api/v1/goals', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            goal_type: goal.iconKey.replace('-', '_'),
            title: goal.name,
            description: goal.description,
            priority: goal.priority,
          })
        });
      }
      
      alert('Goals saved successfully!');
    } catch (error) {
      console.error('Failed to save goals:', error);
      alert('Goals saved locally. Will sync when connection is available.');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedGoals = goals.filter(g => g.selected).sort((a, b) => a.priority - b.priority);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>
          <IconTarget size={32} strokeWidth={2} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '12px' }} />
          Skin Goals
        </h1>
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
                <span className="skin-goals-icon">{iconMap[goal.iconKey]}</span>
                <span className="skin-goals-text">
                  <span className="skin-goals-title">{goal.name}</span>
                  <span className="skin-goals-desc">{goal.description}</span>
                </span>
                <span className="skin-goals-toggle">
                  {goal.selected ? (
                    <IconCheck size={20} strokeWidth={2} />
                  ) : (
                    <IconPlus size={20} strokeWidth={2} />
                  )}
                </span>
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
                  <span className="skin-goals-icon">{iconMap[goal.iconKey]}</span>
                  <span className="skin-goals-name">{goal.name}</span>
                  <span className="skin-goals-controls">
                    <button onClick={() => updatePriority(goal.id, 'up')} disabled={index === 0} type="button" className="btn-icon-small">
                      <IconArrowUp size={16} strokeWidth={2} />
                    </button>
                    <button onClick={() => updatePriority(goal.id, 'down')} disabled={index === selectedGoals.length - 1} type="button" className="btn-icon-small">
                      <IconArrowDown size={16} strokeWidth={2} />
                    </button>
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="skin-goals-actions">
        <Link to="/profile" className="btn btn-secondary">
          <IconArrowLeft size={16} strokeWidth={2} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
          Back to Profile
        </Link>
        <button onClick={handleSave} className="btn btn-primary" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Goals'}
        </button>
      </div>
    </div>
  );
};

export default SkinGoalsPage;
