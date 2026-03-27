import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import './SkinTypeQuizPage.css';

interface QuizAnswer {
  question: string;
  options: string[];
  key: string;
}

const QUIZ_QUESTIONS: QuizAnswer[] = [
  {
    key: 'wash_feel',
    question: 'How does your skin feel 30 minutes after washing?',
    options: ['Tight and dry', 'Comfortable and balanced', 'Oily, especially T-zone', 'Oily everywhere', 'Irritated or red'],
  },
  {
    key: 'pore_size',
    question: 'How would you describe your pores?',
    options: ['Barely visible', 'Small, mostly on nose', 'Visible on nose and cheeks', 'Large and visible everywhere', 'Varies by area'],
  },
  {
    key: 'midday',
    question: 'What does your skin look like by midday?',
    options: ['Flaky or patchy', 'Same as morning', 'Shiny T-zone, normal cheeks', 'Shiny all over', 'Red or blotchy patches'],
  },
  {
    key: 'breakouts',
    question: 'How often do you experience breakouts?',
    options: ['Rarely', 'Occasionally around period/stress', 'Regularly on chin and forehead', 'Frequently across face', 'Breakouts with irritation/stinging'],
  },
  {
    key: 'reaction',
    question: 'How does your skin react to new products?',
    options: ['Fine with most products', 'Occasional sensitivity', 'Breaks out if too heavy', 'No issues at all', 'Burns, stings, or turns red easily'],
  },
  {
    key: 'concern',
    question: 'What is your biggest skin concern?',
    options: ['Dryness and flaking', 'Maintaining balance', 'Oil control and shine', 'Acne and breakouts', 'Redness and sensitivity', 'Dark spots and uneven tone', 'Fine lines and wrinkles'],
  },
];

function determineSkinType(answers: Record<string, number>): { type: string; description: string; concerns: string[] } {
  const { wash_feel = 0, pore_size = 0, midday = 0, breakouts = 0, reaction = 0, concern = 0 } = answers;

  // Scoring heuristic
  let dryScore = 0, oilyScore = 0, comboScore = 0, sensitiveScore = 0;

  // wash_feel: 0=dry, 1=normal, 2=combo, 3=oily, 4=sensitive
  if (wash_feel === 0) dryScore += 3;
  if (wash_feel === 1) comboScore += 1;
  if (wash_feel === 2) comboScore += 3;
  if (wash_feel === 3) oilyScore += 3;
  if (wash_feel === 4) sensitiveScore += 3;

  if (pore_size <= 1) dryScore += 2;
  if (pore_size === 2) comboScore += 2;
  if (pore_size >= 3) oilyScore += 2;

  if (midday === 0) dryScore += 2;
  if (midday === 2) comboScore += 2;
  if (midday === 3) oilyScore += 2;
  if (midday === 4) sensitiveScore += 2;

  if (breakouts >= 2) oilyScore += 1;
  if (breakouts === 4) sensitiveScore += 2;

  if (reaction === 4) sensitiveScore += 3;
  if (reaction === 2) oilyScore += 1;

  const scores = { dry: dryScore, oily: oilyScore, combination: comboScore, sensitive: sensitiveScore };
  const maxType = (Object.entries(scores) as [string, number][]).sort((a, b) => b[1] - a[1])[0][0];

  const concerns: string[] = [];
  if (concern === 0) concerns.push('dryness');
  if (concern === 2 || concern === 3) concerns.push('acne');
  if (concern === 4) concerns.push('redness');
  if (concern === 5) concerns.push('dark spots');
  if (concern === 6) concerns.push('wrinkles');
  if (breakouts >= 2) concerns.push('breakouts');
  if (sensitiveScore >= 3) concerns.push('sensitivity');

  const descriptions: Record<string, string> = {
    dry: 'Your skin tends to feel tight and may show flaking. Focus on hydrating ingredients like hyaluronic acid and ceramides.',
    oily: 'Your skin produces excess oil, especially in the T-zone. Look for lightweight, non-comedogenic products with niacinamide.',
    combination: 'Your skin is oily in some areas and dry in others. Use balanced products and zone-specific treatments.',
    sensitive: 'Your skin reacts easily to products and environment. Choose fragrance-free, gentle formulations with soothing ingredients.',
  };

  return {
    type: maxType,
    description: descriptions[maxType] || descriptions.combination,
    concerns: [...new Set(concerns)].slice(0, 4),
  };
}

const SkinTypeQuizPage: React.FC = () => {
  usePageTitle('Skin Type Quiz');
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ type: string; description: string; concerns: string[] } | null>(null);
  const [saving, setSaving] = useState(false);

  const currentQ = QUIZ_QUESTIONS[step];
  const totalSteps = QUIZ_QUESTIONS.length;
  const isComplete = step >= totalSteps;

  const handleSelect = (optionIndex: number) => {
    const newAnswers = { ...answers, [currentQ.key]: optionIndex };
    setAnswers(newAnswers);

    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      // Quiz complete — determine skin type
      const res = determineSkinType(newAnswers);
      setResult(res);
      setStep(totalSteps);
    }
  };

  const handleSaveToProfile = async () => {
    if (!result) return;
    setSaving(true);
    try {
      await api.patch('/profile', {
        skin_type: result.type,
        concerns: result.concerns,
      });
      toast.success('Skin profile updated!');
      navigate('/dashboard');
    } catch {
      toast.error('Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="quiz-page app-page">
      <header className="app-header-card">
        <h1>Skin Type Quiz</h1>
        <p className="app-header-subtitle">Answer {totalSteps} questions to discover your skin type</p>
      </header>

      <div className="app-page-content quiz-container">
        {/* Progress bar */}
        <div className="quiz-progress">
          <div className="quiz-progress-bar" style={{ width: `${((isComplete ? totalSteps : step) / totalSteps) * 100}%` }} />
        </div>
        <p className="quiz-step-label">
          {isComplete ? 'Results' : `Question ${step + 1} of ${totalSteps}`}
        </p>

        {!isComplete && currentQ && (
          <div className="quiz-question-card">
            <h2 className="quiz-question">{currentQ.question}</h2>
            <div className="quiz-options">
              {currentQ.options.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  className={`quiz-option ${answers[currentQ.key] === i ? 'quiz-option--selected' : ''}`}
                  onClick={() => handleSelect(i)}
                >
                  {opt}
                </button>
              ))}
            </div>
            {step > 0 && (
              <button type="button" className="quiz-back" onClick={() => setStep(step - 1)}>
                &larr; Previous question
              </button>
            )}
          </div>
        )}

        {isComplete && result && (
          <div className="quiz-result-card">
            <div className="quiz-result-type">
              <span className="quiz-result-badge">{result.type}</span>
              <h2>Your skin type is <strong>{result.type}</strong></h2>
            </div>
            <p className="quiz-result-desc">{result.description}</p>

            {result.concerns.length > 0 && (
              <div className="quiz-result-concerns">
                <h3>Key concerns identified</h3>
                <div className="quiz-concern-tags">
                  {result.concerns.map(c => (
                    <span key={c} className="quiz-concern-tag">{c}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="quiz-result-actions">
              <button type="button" className="btn btn-primary" onClick={handleSaveToProfile} disabled={saving}>
                {saving ? 'Saving...' : 'Save to My Profile'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/scan')}>
                Start Skin Scan
              </button>
              <button type="button" className="quiz-retake" onClick={() => { setStep(0); setAnswers({}); setResult(null); }}>
                Retake Quiz
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SkinTypeQuizPage;
