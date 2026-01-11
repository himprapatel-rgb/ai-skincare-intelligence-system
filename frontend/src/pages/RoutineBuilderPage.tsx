import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RoutineBuilderPage.css';

interface RoutineStep {
  id: string;
  time: 'morning' | 'evening';
  order: number;
  productId?: string;
  productName?: string;
  category: string;
}

const RoutineBuilderPage: React.FC = () => {
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

  const categories = ['Cleanser', 'Toner', 'Essence', 'Serum', 'Treatment', 'Eye Cream', 'Moisturizer', 'Oil', 'Sunscreen'];

  const currentRoutine = activeTime === 'morning' ? morningRoutine : eveningRoutine;
  const setCurrentRoutine = activeTime === 'morning' ? setMorningRoutine : setEveningRoutine;

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

  const handleSelectProduct = _(id: string) => {
    navigate('/myshelf');
  };

  const handleSaveRoutine = async () => {
    try {
      // TODO: API call to save routine
      alert('Routine saved successfully!');
    } catch (error) {
      console.error('Failed to save routine:', error);
    }
  };

  return (
    <div className="routine-builder-page">
      <div className="routine-header">
        <h1>Routine Builder</h1>
        <p className="subtitle">Create your personalized skincare routine</p>
      </div>

      <div className="time-selector">
        <button 
          className={activeTime === 'morning' ? 'active' : ''}
          onClick={() => setActiveTime('morning')}
        >
          ☀ Morning Routine
        </button>
        <button 
          className={activeTime === 'evening' ? 'active' : ''}
          onClick={() => setActiveTime('evening')}
        >
          ☽ Evening Routine
        </button>
      </div>

      <div className="routine-steps">
        {currentRoutine.length === 0 ? (
          <div className="empty-state">
            <p>No steps in your {activeTime} routine yet</p>
            <button className="btn-primary" onClick={handleAddStep}>Add First Step</button>
          </div>
        ) : (
          <>
            {currentRoutine.map((step, index) => (
              <div key={step.id} className="routine-step">
                <div className="step-order">{step.order}</div>
                
                <div className="step-content">
                  <div className="step-category">
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
                  
                  <div className="step-product">
                    {step.productName ? (
                      <div className="selected-product">
                        <span>{step.productName}</span>
                        <button onClick={() => handleSelectProduct(step.id)}>Change</button>
                      </div>
                    ) : (
                      <button className="btn-outline" onClick={() => handleSelectProduct(step.id)}>
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
                  >
                    ↑
                  </button>
                  <button 
                    onClick={() => handleMoveStep(index, 'down')}
                    disabled={index === currentRoutine.length - 1}
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button 
                    onClick={() => handleRemoveStep(step.id)}
                    className="btn-remove"
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
            
            <button className="btn-add-step" onClick={handleAddStep}>
              + Add Step
            </button>
          </>
        )}
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

      <div className="routine-actions">
        <button className="btn-secondary" onClick={() => navigate('/myshelf')}>
          View My Shelf
        </button>
        <button className="btn-primary" onClick={handleSaveRoutine}>
          Save Routine
        </button>
      </div>
    </div>
  );
};

export default RoutineBuilderPage;
