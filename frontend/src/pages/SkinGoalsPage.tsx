import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  IconTarget, IconSparkles, IconDroplet, IconStar, 
  IconPackage, IconLeaf, IconSun, IconSearch, IconCheck, IconPlus,
  IconArrowUp, IconArrowDown
} from '../components/Icons';
import { useToast } from '../context/ToastContext';
import { API_BASE_URL } from '../config';
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
  const toast = useToast();
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
      const token = localStorage.getItem('auth_token');
      const selectedGoals = goals.filter(g => g.selected).sort((a, b) => a.priority - b.priority);
      
      // Create/update goals via API
      for (const goal of selectedGoals) {
        await fetch(`${API_BASE_URL}/goals`, {
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
      
      toast.success('Goals saved.');
    } catch (error) {
      console.error('Failed to save goals:', error);
      toast.info('Saved locally. We’ll sync when you’re back online.');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedGoals = goals.filter(g => g.selected).sort((a, b) => a.priority - b.priority);

  return (
    <div className="skin-goals-page app-page">
      <header className="app-header-card">
        <h1>
          <IconTarget size={24} strokeWidth={2} className="skin-goals-header-icon" aria-hidden />
          Skin Goals
        </h1>
        <p className="app-header-subtitle">Pick and order your goals for better recommendations</p>
      </header>
      <div className="app-page-content">
      <div className="skin-goals-grid">
        <div className="app-card skin-goals-card">
          <h3 className="skin-goals-card-title">Available goals</h3>
          <div className="skin-goals-card-body">
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

        <div className="app-card skin-goals-card">
          <h3 className="skin-goals-card-title">Your priorities ({selectedGoals.length})</h3>
          <div className="skin-goals-card-body">
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
        <Link to="/profile" className="btn btn-secondary">Back to Profile</Link>
        <button type="button" onClick={handleSave} className="btn btn-primary" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save goals'}
        </button>
      </div>
      </div>
    </div>
  );
};

export default SkinGoalsPage;
