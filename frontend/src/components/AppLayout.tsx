import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { IconInstagram, IconBrandX, IconLinkedin, IconTiktok, IconMenu, IconX, IconUser, IconChevronDown, IconLogOut, IconSettings, IconScan } from './Icons';
import { useAuth } from '../context/AuthContext';
import './AppLayout.css';

type AppLayoutProps = {
  children: React.ReactNode;
};

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  // Show first name only, or first name + last initial for better display
const fullName = user?.full_name || '';
const nameParts = fullName.split(' ').filter(Boolean);
const displayName = nameParts.length > 1 
  ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`
  : nameParts[0] || user?.email?.split('@')[0] || 'Account';
  const userInitial = (user?.full_name?.[0] || user?.email?.[0] || 'U').toUpperCase();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  
  // Handle scroll for header shadow
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);
  const breadcrumbs = useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    const labelMap: Record<string, string> = {
      'scan': 'Scan',
      'analysis': 'Analysis',
      'digital-twin': 'Digital Twin',
      'routine-builder': 'Routine Builder',
      'favorites': 'Favorites',
      'myshelf': 'My Shelf',
      'scanner': 'Product Scanner',
      'notifications': 'Notifications',
      'profile': 'Profile',
      'dashboard': 'Dashboard',
      'history': 'History',
      'recommendations': 'Recommendations',
      'about': 'About',
      'contact': 'Contact',
      'privacy': 'Privacy',
      'terms': 'Terms',
      'auth': 'Login',
      'onboarding': 'Onboarding',
      'export': 'Data Export',
      'blog': 'Blog',
      'ingredients': 'Ingredient Dictionary',
      'skin-type-guide': 'Skin Type Guide',
      'tutorials': 'Video Tutorials',
    };
    const crumbs = [{ label: 'Home', to: '/' }];
    if (segments.length === 0) return crumbs;
    let path = '';
    segments.forEach((segment, index) => {
      path += `/${segment}`;
      const isLast = index === segments.length - 1;
      const isDynamic = segment.length > 12 || /[0-9]/.test(segment);
      const label = labelMap[segment] || (isDynamic ? 'Details' : segment.replace(/-/g, ' '));
      crumbs.push({ label: label.replace(/\b\w/g, (char) => char.toUpperCase()), to: isLast ? '' : path });
    });
    return crumbs;
  }, [location.pathname]);
  const showBreadcrumbs = location.pathname !== '/';

  return (
    <div className="app-layout">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className={`app-header${scrolled ? ' scrolled' : ''}`}>
        <div className="app-header-container">
          {/* Logo */}
          <Link to="/" className="app-logo">
            <span className="app-logo-mark">
              <IconScan size={18} strokeWidth={2.5} />
            </span>
            <span className="app-logo-text">SkinCare<span className="app-logo-ai">AI</span></span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="app-nav app-nav-desktop">
            <div className="app-nav-links">
              <Link className={`app-nav-link${location.pathname === '/' ? ' active' : ''}`} to="/">Home</Link>
              <Link className={`app-nav-link${location.pathname.startsWith('/scan') ? ' active' : ''}`} to="/scan">Skin Analysis</Link>
              <Link className={`app-nav-link${location.pathname.startsWith('/dashboard') ? ' active' : ''}`} to="/dashboard">Dashboard</Link>
              <Link className={`app-nav-link${location.pathname.startsWith('/digital-twin') ? ' active' : ''}`} to="/digital-twin">Digital Twin</Link>
              <Link className={`app-nav-link${location.pathname.startsWith('/about') ? ' active' : ''}`} to="/about">About</Link>
              {isAuthenticated && user?.is_admin && (
                <Link className={`app-nav-link${location.pathname.startsWith('/admin') ? ' active' : ''}`} to="/admin">Admin</Link>
              )}
            </div>
            
            <div className="app-nav-actions">
              {isAuthenticated ? (
                <>
                  {/* User Dropdown */}
                  <div className="app-nav-user-dropdown" ref={userDropdownRef}>
                    <button 
                      className="app-nav-user-trigger"
                      onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                      aria-expanded={userDropdownOpen}
                    >
                      <span className="app-nav-avatar">{userInitial}</span>
                      <span className="app-nav-user-name">{displayName}</span>
                      <IconChevronDown size={16} strokeWidth={2} className={userDropdownOpen ? 'rotated' : ''} />
                    </button>
                    
                    {userDropdownOpen && (
                      <div className="app-nav-dropdown-menu">
                        <div className="app-nav-dropdown-header">
                          <span className="app-nav-avatar app-nav-avatar-lg">{userInitial}</span>
                          <div>
                            <p className="app-nav-dropdown-name">{displayName}</p>
                            <p className="app-nav-dropdown-email">{user?.email}</p>
                          </div>
                        </div>
                        <div className="app-nav-dropdown-divider" />
                        <Link to="/profile" className="app-nav-dropdown-item">
                          <IconUser size={18} strokeWidth={2} />
                          <span>My Profile</span>
                        </Link>
                        <Link to="/profile?tab=settings" className="app-nav-dropdown-item">
                          <IconSettings size={18} strokeWidth={2} />
                          <span>Settings</span>
                        </Link>
                        <div className="app-nav-dropdown-divider" />
                        <button
                          className="app-nav-dropdown-item app-nav-dropdown-logout"
                          onClick={() => {
                            logout();
                            navigate('/');
                          }}
                        >
                          <IconLogOut size={18} strokeWidth={2} />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link className="app-nav-link" to="/auth">Sign In</Link>
                  <Link className="app-nav-cta-secondary" to="/auth?mode=register">Get Started</Link>
                </>
              )}
              
              {!location.pathname.startsWith('/scan') && !location.pathname.startsWith('/analysis') && (
                <Link className="app-nav-cta" to="/scan">
                  <IconScan size={18} strokeWidth={2} />
                  <span>Free Scan</span>
                </Link>
              )}
            </div>
          </nav>
          
          {/* Mobile Menu Button */}
          <button 
            className="app-nav-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <IconX size={24} strokeWidth={2} /> : <IconMenu size={24} strokeWidth={2} />}
          </button>
        </div>
        
        {/* Mobile Navigation */}
        <nav className={`app-nav-mobile${mobileMenuOpen ? ' open' : ''}`}>
          <div className="app-nav-mobile-links">
            <Link className={`app-nav-mobile-link${location.pathname === '/' ? ' active' : ''}`} to="/">Home</Link>
            <Link className={`app-nav-mobile-link${location.pathname.startsWith('/scan') ? ' active' : ''}`} to="/scan">Skin Analysis</Link>
            <Link className={`app-nav-mobile-link${location.pathname.startsWith('/dashboard') ? ' active' : ''}`} to="/dashboard">Dashboard</Link>
            <Link className={`app-nav-mobile-link${location.pathname.startsWith('/digital-twin') ? ' active' : ''}`} to="/digital-twin">Digital Twin</Link>
            <Link className={`app-nav-mobile-link${location.pathname.startsWith('/about') ? ' active' : ''}`} to="/about">About</Link>
            {isAuthenticated && user?.is_admin && (
              <Link className={`app-nav-mobile-link${location.pathname.startsWith('/admin') ? ' active' : ''}`} to="/admin">Admin</Link>
            )}
          </div>
          
          <div className="app-nav-mobile-divider" />
          
          {isAuthenticated ? (
            <div className="app-nav-mobile-user">
              <div className="app-nav-mobile-user-info">
                <span className="app-nav-avatar">{userInitial}</span>
                <div>
                  <p className="app-nav-mobile-user-name">{displayName}</p>
                  <p className="app-nav-mobile-user-email">{user?.email}</p>
                </div>
              </div>
              <Link className="app-nav-mobile-link" to="/profile">My Profile</Link>
              <Link className="app-nav-mobile-link" to="/notifications">Notifications</Link>
              <button
                className="app-nav-mobile-link app-nav-mobile-logout"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="app-nav-mobile-auth">
              <Link className="app-nav-mobile-btn-secondary" to="/auth">Sign In</Link>
              <Link className="app-nav-mobile-btn-primary" to="/auth?mode=register">Get Started Free</Link>
            </div>
          )}
          
          {!location.pathname.startsWith('/scan') && (
            <Link className="app-nav-mobile-cta" to="/scan">
              <IconScan size={20} strokeWidth={2} />
              <span>Start Free Skin Scan</span>
            </Link>
          )}
        </nav>
      </header>

      {showBreadcrumbs && (
        <div className="app-breadcrumbs" aria-label="Breadcrumb">
          <div className="app-breadcrumbs-container">
            {breadcrumbs.map((crumb, index) => (
              <span key={`${crumb.label}-${index}`} className="app-breadcrumb-item">
                {crumb.to ? (
                  <Link to={crumb.to}>{crumb.label}</Link>
                ) : (
                  <span className="app-breadcrumb-current">{crumb.label}</span>
                )}
                {index < breadcrumbs.length - 1 && <span className="app-breadcrumb-separator">/</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      <main className="app-main" id="main-content">
        {children}
      </main>

      <footer className="app-footer">
        {/* Newsletter Section */}
        <div className="app-footer-newsletter">
          <div className="app-footer-newsletter-content">
            <div className="app-footer-newsletter-text">
              <h3>Get Personalized Skin Tips</h3>
              <p>Join 50,000+ others getting weekly skincare insights powered by AI.</p>
            </div>
            <form className="app-footer-newsletter-form" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Enter your email" aria-label="Email for newsletter" />
              <button type="submit">Subscribe</button>
            </form>
          </div>
        </div>
        
        {/* Main Footer */}
        <div className="app-footer-main">
          <div className="app-footer-container">
            {/* Brand Column */}
            <div className="app-footer-brand">
              <Link to="/" className="app-footer-logo">
                <span className="app-footer-logo-mark">
                  <IconScan size={16} strokeWidth={2.5} />
                </span>
                <span className="app-footer-logo-text">SkinCare<span className="app-logo-ai">AI</span></span>
              </Link>
              <p className="app-footer-tagline">Clinical-grade skin analysis powered by advanced AI. Your personalized path to healthier skin.</p>
              <div className="app-footer-socials">
                <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
                  <IconInstagram size={18} strokeWidth={2} />
                </a>
              <a href="https://x.com" target="_blank" rel="noreferrer" aria-label="X">
                <IconBrandX size={18} />
              </a>
                <a href="https://tiktok.com" target="_blank" rel="noreferrer" aria-label="TikTok">
                  <IconTiktok size={18} strokeWidth={2} />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn">
                  <IconLinkedin size={18} strokeWidth={2} />
                </a>
              </div>
            </div>
            
            {/* Links Columns */}
            <div className="app-footer-links">
              <div className="app-footer-column">
                <h4>Product</h4>
                <Link to="/scan">Skin Analysis</Link>
                <Link to="/recommendations">Recommendations</Link>
                <Link to="/digital-twin">Digital Twin</Link>
                <Link to="/dashboard">Dashboard</Link>
                <Link to="/history">History</Link>
                {isAuthenticated ? (
                  <Link to="/profile">My Account</Link>
                ) : (
                  <Link to="/auth">Login / Register</Link>
                )}
              </div>
              <div className="app-footer-column">
                <h4>Features</h4>
                <Link to="/routine-builder">Routine Builder</Link>
                <Link to="/favorites">Favorites</Link>
                <Link to="/myshelf">My Shelf</Link>
                <Link to="/scanner">Product Scanner</Link>
                <Link to="/ingredients">Ingredient Dictionary</Link>
                <Link to="/skin-type-guide">Skin Type Guide</Link>
              </div>
              <div className="app-footer-column">
                <h4>Company</h4>
                <Link to="/about">About Us</Link>
                <Link to="/contact">Contact</Link>
                <Link to="/blog">Blog</Link>
                <Link to="/tutorials">Video Tutorials</Link>
              </div>
              <div className="app-footer-column">
                <h4>Legal</h4>
                <Link to="/privacy">Privacy Policy</Link>
                <Link to="/terms">Terms of Service</Link>
                <Link to="/privacy#delete">Delete My Data</Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="app-footer-bottom">
          <div className="app-footer-bottom-container">
            <p className="app-footer-copyright">© 2026 SkinCareAI. All rights reserved.</p>
            <p className="app-footer-disclaimer">
              <span className="app-footer-disclaimer-icon">ℹ️</span>
              Not a medical device. For informational purposes only.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;
