import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconSun, IconMoon, IconBell, IconArrowUp, IconArrowDown, IconX, IconCheck, IconInfo, IconGripVertical } from '../components/Icons';
import { usePageTitle } from '../hooks/usePageTitle';
import './RoutineBuilderPage.css';

interface RoutineStep {
  id: string;
  time: 'morning' | 'evening';
  order: number;
  productId?: string;
  productName?: string;
  category: string;
}

type ApiRoutineProduct = {
  product_id: string;
  step_order?: number | null;
  notes?: string | null;
};

type ApiRoutine = {
  id: string;
  routine_type?: string;
  products?: ApiRoutineProduct[];
};

interface ReminderSettings {
  enabled: boolean;
  morningTime: string;
  eveningTime: string;
  days: string[];
}

const RoutineBuilderPage: React.FC = () => {
  usePageTitle('Routine Builder');
  const navigate = useNavigate();
  const [activeTime, setActiveTime] = useState<'morning' | 'evening'>('morning');
  const [morningRoutine, setMorningRoutine] = useState<RoutineStep[]>([
    { id: '1', time: 'morning', order: 1, category: 'Cleanser', productName: 'Gentle Foam Cleanser' },
    { id: '2', time: 'morning', order: 2, category: 'Toner' },
    { id: '3', time: 'morning', order: 3, category: 'Serum', productName: 'Vitamin C Serum' },
    { id: '4', time: 'morning', order: 4, category: 'Moisturizer', productName: 'Daily Moisturizer' },
    { id: '5', time: 'morning', order: 5, category: 'Sunscreen', productName: 'SPF 50' }
  ]);
  const [eveningRoutine, setEveningRoutine] = useState<RoutineStep[]>([
    { id: '6', time: 'evening', order: 1, category: 'Cleanser', productName: 'Double Cleanser' },
    { id: '7', time: 'evening', order: 2, category: 'Toner' },
    { id: '8', time: 'evening', order: 3, category: 'Treatment', productName: 'Retinol' },
    { id: '9', time: 'evening', order: 4, category: 'Moisturizer', productName: 'Night Cream' }
  ]);
  const [routineIds, setRoutineIds] = useState<{ morning?: string; evening?: string }>({});
  const [isLoading, setIsLoading] = useState(true);

  const categories = ['Cleanser', 'Toner', 'Essence', 'Serum', 'Treatment', 'Eye Cream', 'Moisturizer', 'Oil', 'Sunscreen'];
  
  // Suggested order based on category (lower number = apply first)
  const categoryOrder: Record<string, number> = {
    'Cleanser': 1,
    'Toner': 2,
    'Essence': 3,
    'Serum': 4,
    'Treatment': 5,
    'Eye Cream': 6,
    'Moisturizer': 7,
    'Oil': 8,
    'Sunscreen': 9
  };

  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>({
    enabled: false,
    morningTime: '08:00',
    eveningTime: '20:00',
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  });

  const [showReminderSettings, setShowReminderSettings] = useState(false);

  const currentRoutine = activeTime === 'morning' ? morningRoutine : eveningRoutine;
  const setCurrentRoutine = activeTime === 'morning' ? setMorningRoutine : setEveningRoutine;

  useEffect(() => {
    const fetchRoutines = async () => {
      try {
        setIsLoading(true);
        const API_BASE = import.meta.env.VITE_API_URL || 'https://ai-skincare-intelligence-system-production.up.railway.app/api/v1';
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_BASE}/routines`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!response.ok) {
          throw new Error('Failed to load routines');
        }
        const routines: ApiRoutine[] = await response.json();
        const mapRoutineSteps = (routine: ApiRoutine): RoutineStep[] => {
          const products = routine.products || [];
          const routineTime: RoutineStep['time'] = routine.routine_type === 'evening' ? 'evening' : 'morning';
          return products
            .sort((a, b) => (a.step_order || 0) - (b.step_order || 0))
            .map((product, index) => ({
              id: `${product.product_id}-${index}`,
              time: routineTime,
              order: index + 1,
              productId: product.product_id,
              category: product.notes || 'Serum',
            }));
        };

        const morning = routines.find((item) => item.routine_type === 'morning');
        const evening = routines.find((item) => item.routine_type === 'evening');

        if (morning) {
          setMorningRoutine(mapRoutineSteps(morning));
          setRoutineIds((prev) => ({ ...prev, morning: morning.id }));
        }
        if (evening) {
          setEveningRoutine(mapRoutineSteps(evening));
          setRoutineIds((prev) => ({ ...prev, evening: evening.id }));
        }
      } catch (error) {
        console.error('Failed to load routines:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoutines();
  }, []);

  // Auto-suggest product order based on category
  const suggestOrder = () => {
    const sorted = [...currentRoutine].sort((a, b) => {
      const orderA = categoryOrder[a.category] || 999;
      const orderB = categoryOrder[b.category] || 999;
      return orderA - orderB;
    });
    
    sorted.forEach((step, index) => {
      step.order = index + 1;
    });
    
    setCurrentRoutine(sorted);
  };

  const handleAddStep = () => {
    const newStep: RoutineStep = {
      id: Date.now().toString(),
      time: activeTime,
      order: currentRoutine.length + 1,
      category: 'Serum'
    };
    setCurrentRoutine([...currentRoutine, newStep]);
  };

  const handleRemoveStep = (id: string) => {
    setCurrentRoutine(currentRoutine.filter(s => s.id !== id));
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === currentRoutine.length - 1) return;

    const newRoutine = [...currentRoutine];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newRoutine[index], newRoutine[targetIndex]] = [newRoutine[targetIndex], newRoutine[index]];
    newRoutine.forEach((step, idx) => {
      step.order = idx + 1;
    });
    setCurrentRoutine(newRoutine);
  };

  const handleUpdateCategory = (id: string, category: string) => {
    setCurrentRoutine(currentRoutine.map(s => s.id === id ? { ...s, category } : s));
  };

  const handleSelectProduct = () => {
    navigate('/myshelf');
  };

  const handleSaveRoutine = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'https://ai-skincare-intelligence-system-production.up.railway.app/api/v1';
      const token = localStorage.getItem('auth_token');
      const steps = currentRoutine;
      const description = steps
        .map((step, index) => `${index + 1}. ${step.category}${step.productName ? ` - ${step.productName}` : ''}`)
        .join('\n');
      const payload = {
        name: activeTime === 'morning' ? 'Morning Routine' : 'Evening Routine',
        description,
        routine_type: activeTime,
        is_active: true,
        products: steps
          .filter((step) => step.productId)
          .map((step, index) => ({
            product_id: step.productId,
            step_order: index + 1,
            notes: step.category,
          })),
      };

      const existingId = routineIds[activeTime];
      const response = await fetch(`${API_BASE}/routines${existingId ? `/${existingId}` : ''}`, {
        method: existingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to save routine');
      }

      if (!existingId) {
        const saved = await response.json();
        setRoutineIds((prev) => ({ ...prev, [activeTime]: saved.id }));
      }
      alert('Routine saved successfully!');
    } catch (error) {
      console.error('Failed to save routine:', error);
      alert('Failed to save routine. Please try again.');
    }
  };

  return (
    <div className="routine-builder-page">
      <div className="routine-header">
        <h1>Routine Builder</h1>
        <p>Create your personalized skincare routine</p>
      </div>

      <div className="time-selector">
        <button 
          className={`time-btn ${activeTime === 'morning' ? 'active' : ''}`}
          onClick={() => setActiveTime('morning')}
        >
          <IconSun size={20} strokeWidth={2} style={{ marginRight: '8px' }} />
          Morning Routine
        </button>
        <button 
          className={`time-btn ${activeTime === 'evening' ? 'active' : ''}`}
          onClick={() => setActiveTime('evening')}
        >
          <IconMoon size={20} strokeWidth={2} style={{ marginRight: '8px' }} />
          Evening Routine
        </button>
      </div>

      {/* Product Order Suggestions */}
      {currentRoutine.length > 1 && (
        <div className="routine-suggestions">
          <div className="suggestion-card">
            <IconInfo size={20} strokeWidth={2} />
            <div className="suggestion-content">
              <h4>Optimize Product Order</h4>
              <p>Reorder your products based on skincare best practices (thinnest to thickest)</p>
            </div>
            <button onClick={suggestOrder} className="btn-suggest">
              Auto-Order
            </button>
          </div>
        </div>
      )}

      <div className="routine-steps">
        {isLoading ? (
          <div className="empty-state">
            <p>Loading your routines...</p>
          </div>
        ) : currentRoutine.length === 0 ? (
          <div className="empty-state">
            <p>No steps in your {activeTime} routine yet</p>
            <button onClick={handleAddStep} className="btn-primary">Add First Step</button>
          </div>
        ) : (
          <>
            {currentRoutine.map((step, index) => (
              <div key={step.id} className="step-card">
                <div className="step-drag-handle" aria-hidden="true" title="Reorder step">
                  <IconGripVertical size={20} strokeWidth={2} />
                </div>
                <div className="step-number">{step.order}</div>
                <div className="step-content">
                  <div className="step-field">
                    <label>Category:</label>
                    <select 
                      value={step.category}
                      onChange={(e) => handleUpdateCategory(step.id, e.target.value)}
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="step-field">
                    {step.productName ? (
                      <div className="selected-product">
                        <span>{step.productName}</span>
                        <button onClick={handleSelectProduct} className="btn-link">Change</button>
                      </div>
                    ) : (
                      <button onClick={handleSelectProduct} className="btn-secondary">
                        Select Product
                      </button>
                    )}
                  </div>
                </div>
                <div className="step-actions">
                  <button 
                    onClick={() => handleMoveStep(index, 'up')}
                    disabled={index === 0}
                    title="Move up"
                    className="btn-icon-action"
                  >
                    <IconArrowUp size={18} strokeWidth={2} />
                  </button>
                  <button 
                    onClick={() => handleMoveStep(index, 'down')}
                    disabled={index === currentRoutine.length - 1}
                    title="Move down"
                    className="btn-icon-action"
                  >
                    <IconArrowDown size={18} strokeWidth={2} />
                  </button>
                  <button 
                    onClick={() => handleRemoveStep(step.id)}
                    className="btn-icon-action btn-remove"
                    title="Remove"
                  >
                    <IconX size={18} strokeWidth={2} />
                  </button>
                </div>
              </div>
            ))}
            <button onClick={handleAddStep} className="btn-add-step">
              + Add Step
            </button>
          </>
        )}
      </div>

      <div className="routine-education">
        <h3>Ingredient Education</h3>
        <div className="education-grid">
          <div>
            <h4>Why Order Matters</h4>
            <p>Layering thin-to-thick helps actives absorb before occlusives seal them in.</p>
          </div>
          <div>
            <h4>Interaction Warnings</h4>
            <p>Avoid combining strong acids with retinol in the same routine to limit irritation.</p>
          </div>
          <div>
            <h4>Time-of-Day Guidance</h4>
            <p>Use antioxidants in the morning and retinoids at night for best results.</p>
          </div>
        </div>
      </div>

      <div className="routine-tips">
        <h3>Skincare Tips</h3>
        <ul>
          <li>Always apply products from thinnest to thickest consistency</li>
          <li>Wait 1-2 minutes between each step for better absorption</li>
          <li>Use sunscreen as the last step in your morning routine</li>
          <li>Patch test new products before adding to your routine</li>
        </ul>
      </div>

      {/* Reminder Settings */}
      <div className="routine-reminders">
        <div className="reminder-header">
          <div className="reminder-title">
            <IconBell size={20} strokeWidth={2} />
            <h3>Reminder Notifications</h3>
          </div>
          <button 
            onClick={() => setShowReminderSettings(!showReminderSettings)}
            className="btn-toggle"
          >
            {showReminderSettings ? 'Hide' : 'Show'} Settings
          </button>
        </div>
        
        {showReminderSettings && (
          <div className="reminder-settings-card">
            <div className="reminder-setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={reminderSettings.enabled}
                  onChange={(e) => setReminderSettings({...reminderSettings, enabled: e.target.checked})}
                />
                Enable reminders
              </label>
            </div>
            
            {reminderSettings.enabled && (
              <>
                <div className="reminder-time-settings">
                  <div className="time-setting">
                    <label>
                      <IconSun size={16} strokeWidth={2} />
                      Morning Time:
                    </label>
                    <input
                      type="time"
                      value={reminderSettings.morningTime}
                      onChange={(e) => setReminderSettings({...reminderSettings, morningTime: e.target.value})}
                    />
                  </div>
                  <div className="time-setting">
                    <label>
                      <IconMoon size={16} strokeWidth={2} />
                      Evening Time:
                    </label>
                    <input
                      type="time"
                      value={reminderSettings.eveningTime}
                      onChange={(e) => setReminderSettings({...reminderSettings, eveningTime: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="reminder-days">
                  <label>Remind me on:</label>
                  <div className="days-grid">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                      <label key={day} className="day-checkbox">
                        <input
                          type="checkbox"
                          checked={reminderSettings.days.includes(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][idx])}
                          onChange={(e) => {
                            const fullDay = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][idx];
                            if (e.target.checked) {
                              setReminderSettings({
                                ...reminderSettings,
                                days: [...reminderSettings.days, fullDay]
                              });
                            } else {
                              setReminderSettings({
                                ...reminderSettings,
                                days: reminderSettings.days.filter((d: string) => d !== fullDay)
                              });
                            }
                          }}
                        />
                        {day}
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="routine-actions">
        <button onClick={() => navigate('/myshelf')} className="btn-secondary">
          View My Shelf
        </button>
        <button onClick={handleSaveRoutine} className="btn-primary">
          <IconCheck size={18} strokeWidth={2} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Save Routine
        </button>
      </div>
    </div>
  );
};

export default RoutineBuilderPage;
