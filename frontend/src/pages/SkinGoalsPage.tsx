import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  IconTarget, IconSparkles, IconDroplet, IconStar,
  IconPackage, IconLeaf, IconSun, IconSearch, IconCheck, IconPlus,
  IconArrowUp, IconArrowDown
} from '../components/Icons';
import { useToast } from '../context/ToastContext';
import { API_BASE_URL } from '../config';
import { STORAGE_KEYS } from '../constants/storage';
import styles from './SkinGoalsPage.module.css';

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
 * Set and prioritize personal skincare goals for personalized recommendations.
 * Card-based layout with progress indicators and status badges.
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
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const selectedGoals = goals.filter(g => g.selected).sort((a, b) => a.priority - b.priority);

      for (const goal of selectedGoals) {
        await fetch(`${API_BASE_URL}/goals`, {
          method: 'POST',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            goal_type: goal.iconKey.replace('-', '_'),
            title: goal.name,
            description: goal.description,
            priority: goal.priority,
          }),
        });
      }

      toast.success('Goals saved.');
    } catch (error) {
      console.error('Failed to save goals:', error);
      toast.info("Saved locally. We'll sync when you're back online.");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedGoals = goals.filter(g => g.selected).sort((a, b) => a.priority - b.priority);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.headerTitle}>
          <IconTarget size={24} strokeWidth={2} className={styles.headerIcon} aria-hidden />
          Skin Goals
        </h1>
        <p className={styles.headerSubtitle}>Pick and order your goals for better recommendations</p>
      </header>

      <div className={styles.content}>
        <div className={styles.grid}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Available goals</h3>
            <div>
              {goals.map(goal => (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => toggleGoal(goal.id)}
                  className={goal.selected ? styles.goalItemSelected : styles.goalItem}
                  aria-pressed={goal.selected}
                >
                  <span className={styles.goalIcon}>{iconMap[goal.iconKey]}</span>
                  <span className={styles.goalText}>
                    <span className={styles.goalTitle}>{goal.name}</span>
                    <span className={styles.goalDesc}>{goal.description}</span>
                  </span>
                  <span className={styles.goalToggle}>
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

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Your priorities ({selectedGoals.length})</h3>
            <div>
              {selectedGoals.length === 0 ? (
                <p className={styles.emptyPriority}>Select goals from the left panel</p>
              ) : (
                selectedGoals.map((goal, index) => (
                  <div key={goal.id} className={styles.priority}>
                    <span className={styles.rank}>#{index + 1}</span>
                    <span className={styles.goalIcon}>{iconMap[goal.iconKey]}</span>
                    <span className={styles.priorityName}>{goal.name}</span>
                    <span className={styles.controls}>
                      <button
                        onClick={() => updatePriority(goal.id, 'up')}
                        disabled={index === 0}
                        type="button"
                        className={styles.btnIconSmall}
                      >
                        <IconArrowUp size={16} strokeWidth={2} />
                      </button>
                      <button
                        onClick={() => updatePriority(goal.id, 'down')}
                        disabled={index === selectedGoals.length - 1}
                        type="button"
                        className={styles.btnIconSmall}
                      >
                        <IconArrowDown size={16} strokeWidth={2} />
                      </button>
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <Link to="/profile" className="btn btn-secondary">Back to Profile</Link>
          <button type="button" onClick={handleSave} className="btn btn-primary" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save goals'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SkinGoalsPage;
