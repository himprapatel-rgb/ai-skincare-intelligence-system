import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ScanPage } from './pages/ScanPage';

/**
 * Main App Component
 * Sets up routing for the application
 */
function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <nav>
            <h1>AI Skincare Intelligence System</h1>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/scan">Face Scan</Link></li>
            </ul>
          </nav>
        </header>

        <main className="App-main">
          <Routes>
            <Route path="/" element={
              <div className="home-page">
                <h2>Welcome to Your Personalized Skincare Journey</h2>
                <p>Get started with an AI-powered face scan to understand your skin better.</p>
                <Link to="/scan" className="cta-button">Start Face Scan</Link>
              </div>
            } />
            <Route path="/scan" element={<ScanPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
