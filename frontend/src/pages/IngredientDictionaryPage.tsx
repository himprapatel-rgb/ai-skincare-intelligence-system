import React from 'react';
import './IngredientDictionaryPage.css';

const IngredientDictionaryPage: React.FC = () => {
  return (
    <div className="ingredient-page">
      <div className="page-container ingredient-container">
        <div className="page-header">
          <h1>Ingredient Dictionary</h1>
          <p>Search ingredients and learn how they support your skin goals.</p>
        </div>

        <div className="ingredient-search">
          <input type="text" placeholder="Search ingredients (e.g., niacinamide)" />
          <button className="btn-primary">Search</button>
        </div>

        <div className="ingredient-grid">
          <div className="ingredient-card">
            <h3>Niacinamide</h3>
            <p>Supports barrier strength, reduces redness, and balances oil.</p>
            <span>Best for: sensitivity, redness, oiliness</span>
          </div>
          <div className="ingredient-card">
            <h3>Hyaluronic Acid</h3>
            <p>Humectant that draws moisture to the skin for lasting hydration.</p>
            <span>Best for: dehydration, dryness</span>
          </div>
          <div className="ingredient-card">
            <h3>Retinol</h3>
            <p>Encourages cell turnover to improve texture and fine lines.</p>
            <span>Best for: texture, wrinkles</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IngredientDictionaryPage;
