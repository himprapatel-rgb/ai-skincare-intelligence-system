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
const 30
  = (_id: string) => {
    navigate('/myshelf');
  };
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

  const 69
