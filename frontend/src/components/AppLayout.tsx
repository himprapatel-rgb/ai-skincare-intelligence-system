import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { IconInstagram, IconBrandX, IconLinkedin, IconTiktok, IconMenu, IconX, IconUser, IconChevronDown, IconChevronRight, IconLogOut, IconSettings, IconScan, IconPackage, IconHeart, IconHistory, IconBookOpen, IconFileText, IconDownload } from './Icons';
import { SOCIAL_LINKS } from '../config';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { BackToTop } from './BackToTop';
import { RouteLoadingBar } from './RouteLoadingBar';
import { OfflineBanner } from './OfflineBanner';
import { AddToHomeScreenPrompt } from './AddToHomeScreenPrompt';
import { ApiStatusIndicator } from './ApiStatusIndicator';
import { BottomNav } from './BottomNav';
import './AppLayout.css';

type AppLayoutProps = {
  children: React.ReactNode;
};

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const toast = useToast();
  // Show first name only, or first name + last initial for better display
const fullName = user?.full_name || '';
const nameParts = fullName.split(' ').filter(Boolean);
const displayName = nameParts.length > 1 
  ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`
  : nameParts[0] || user?.email?.split('@')[0] || 'Account';
  const userInitial = (user?.full_name?.[0] || user?.email?.[0] || 'U').toUpperCase();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [featuresExpanded, setFeaturesExpanded] = useState(false);
  const [learnExpanded, setLearnExpanded] = useState(false);
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

  // Task 10000: Mark standalone mode for app-like styling
  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    document.documentElement.dataset.standalone = isStandalone ? 'true' : undefined;
  }, []);
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

  /* Bumble-style super app: app routes (including home) use minimal footer and app shell */
  const isAppRoute = useMemo(() => {
    const p = location.pathname;
    if (p === '/') return true;
    const appPaths = ['/dashboard', '/scan', '/history', '/recommendations', '/discover', '/myshelf', '/scanner', '/profile', '/routine-builder', '/routines', '/favorites', '/digital-twin', '/onboarding', '/auth', '/comparison', '/progress', '/export', '/notifications', '/skin-goals', '/consent'];
    if (appPaths.some(path => p === path || p.startsWith(path + '/'))) return true;
    if (p.startsWith('/analysis') || p.startsWith('/product/')) return true;
    return false;
  }, [location.pathname]);

  return (
    <div className={`app-layout${isAppRoute ? ' app-shell-mode' : ''}`}>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <OfflineBanner />
      <AddToHomeScreenPrompt />
      <RouteLoadingBar />
      <header className={`app-header${scrolled ? ' scrolled' : ''}`}>
        <div className="app-header-container">
          {/* Logo */}
          <Link to="/" className="app-logo">
            <span className="app-logo-mark" aria-hidden="true">
              <IconScan size={18} strokeWidth={2.5} />
            </span>
            <span className="app-logo-text">SkinCare<span className="app-logo-ai">AI</span></span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="app-nav app-nav-desktop" aria-label="Main navigation">
            <div className="app-nav-links">
              <Link className={`app-nav-link${location.pathname === '/' ? ' active' : ''}`} to="/" aria-current={location.pathname === '/' ? 'page' : undefined}>Home</Link>
              <Link className={`app-nav-link${location.pathname.startsWith('/scan') ? ' active' : ''}`} to="/scan" title="Start a free skin analysis" aria-current={location.pathname.startsWith('/scan') ? 'page' : undefined} onMouseEnter={() => void import('../pages/ScanPage')}>Skin Analysis</Link>
              <Link className={`app-nav-link${location.pathname.startsWith('/dashboard') ? ' active' : ''}`} to="/dashboard" title="View your dashboard and insights" aria-current={location.pathname.startsWith('/dashboard') ? 'page' : undefined} onMouseEnter={() => void import('../pages/DashboardPage')}>Dashboard</Link>
              <Link className={`app-nav-link${location.pathname.startsWith('/digital-twin') ? ' active' : ''}`} to="/digital-twin" aria-current={location.pathname.startsWith('/digital-twin') ? 'page' : undefined}>Digital Twin</Link>
              <Link className={`app-nav-link${location.pathname.startsWith('/about') ? ' active' : ''}`} to="/about" aria-current={location.pathname.startsWith('/about') ? 'page' : undefined}>About</Link>
              {isAuthenticated && user?.is_admin && (
                <Link className={`app-nav-link${location.pathname.startsWith('/admin') ? ' active' : ''}`} to="/admin" aria-current={location.pathname.startsWith('/admin') ? 'page' : undefined}>Admin</Link>
              )}
            </div>
            
            <div className="app-nav-actions">
              {isAuthenticated ? (
                <>
                  {/* User Dropdown */}
                  <div className="app-nav-user-dropdown" ref={userDropdownRef}>
                    <button 
                      type="button"
                      className="app-nav-user-trigger"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setUserDropdownOpen((prev) => !prev);
                      }}
                      aria-expanded={userDropdownOpen}
                      aria-controls="user-dropdown-menu"
                      aria-haspopup="menu"
                      aria-label={`Account menu for ${displayName}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') setUserDropdownOpen(false);
                      }}
                    >
                      <span className="app-nav-avatar">{userInitial}</span>
                      <span className="app-nav-user-name">{displayName}</span>
                      <IconChevronDown size={16} strokeWidth={2} className={userDropdownOpen ? 'rotated' : ''} />
                    </button>
                    
                    {userDropdownOpen && (
                      <div id="user-dropdown-menu" className="app-nav-dropdown-menu">
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
                          type="button"
                          className="app-nav-dropdown-item app-nav-dropdown-logout"
                          onClick={() => {
                            logout();
                            navigate('/');
                          }}
                          aria-label="Sign out"
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
              
              {!isAuthenticated && !location.pathname.startsWith('/scan') && !location.pathname.startsWith('/analysis') && (
                <Link className="app-nav-cta" to="/scan" title="Start a free skin analysis" onMouseEnter={() => void import('../pages/ScanPage')}>
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
        
        {/* Mobile menu backdrop - blocks background, click to close (Phase 1 fix) */}
        {mobileMenuOpen && (
          <div
            className="app-nav-mobile-backdrop"
            onClick={() => setMobileMenuOpen(false)}
            onKeyDown={(e) => e.key === 'Escape' && setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}
        {/* Mobile Navigation */}
        <nav className={`app-nav-mobile${mobileMenuOpen ? ' open' : ''}`} aria-label="Mobile navigation">
          <div className="app-nav-mobile-scroll">
            <div className="app-nav-mobile-links">
              <Link className={`app-nav-mobile-link${location.pathname === '/' ? ' active' : ''}`} to="/">Home</Link>
              <Link className={`app-nav-mobile-link${location.pathname.startsWith('/scan') ? ' active' : ''}`} to="/scan">Skin Analysis</Link>
              <Link className={`app-nav-mobile-link${location.pathname.startsWith('/dashboard') ? ' active' : ''}`} to="/dashboard">Dashboard</Link>
              <Link className={`app-nav-mobile-link${location.pathname.startsWith('/digital-twin') ? ' active' : ''}`} to="/digital-twin">Digital Twin</Link>
              <Link className={`app-nav-mobile-link${location.pathname.startsWith('/about') ? ' active' : ''}`} to="/about">About</Link>
              {isAuthenticated && user?.is_admin && (
                <Link className={`app-nav-mobile-link${location.pathname.startsWith('/admin') ? ' active' : ''}`} to="/admin">Admin</Link>
              )}

              {/* Features (expandable) */}
              <div className="app-nav-mobile-section">
                <button
                  type="button"
                  className={`app-nav-mobile-expand${featuresExpanded ? ' expanded' : ''}`}
                  onClick={() => setFeaturesExpanded(!featuresExpanded)}
                  aria-expanded={featuresExpanded}
                  aria-controls="mobile-features"
                >
                  <IconPackage size={18} strokeWidth={2} />
                  <span>Features</span>
                  <IconChevronRight size={18} strokeWidth={2} className="chevron" />
                </button>
                <div id="mobile-features" className={`app-nav-mobile-sublinks${featuresExpanded ? ' open' : ''}`}>
                  <Link className={`app-nav-mobile-link sub${location.pathname === '/myshelf' ? ' active' : ''}`} to="/myshelf"><IconPackage size={16} /> My Shelf</Link>
                  <Link className={`app-nav-mobile-link sub${location.pathname === '/favorites' ? ' active' : ''}`} to="/favorites"><IconHeart size={16} /> Favorites</Link>
                  <Link className={`app-nav-mobile-link sub${location.pathname.startsWith('/routine-builder') ? ' active' : ''}`} to="/routine-builder">Routine Builder</Link>
                  <Link className={`app-nav-mobile-link sub${location.pathname === '/scanner' ? ' active' : ''}`} to="/scanner">Product Scanner</Link>
                  <Link className={`app-nav-mobile-link sub${location.pathname === '/recommendations' ? ' active' : ''}`} to="/recommendations">Recommendations</Link>
                  <Link className={`app-nav-mobile-link sub${location.pathname === '/history' ? ' active' : ''}`} to="/history"><IconHistory size={16} /> History</Link>
                </div>
              </div>

              {/* Learn (expandable) */}
              <div className="app-nav-mobile-section">
                <button
                  type="button"
                  className={`app-nav-mobile-expand${learnExpanded ? ' expanded' : ''}`}
                  onClick={() => setLearnExpanded(!learnExpanded)}
                  aria-expanded={learnExpanded}
                  aria-controls="mobile-learn"
                >
                  <IconBookOpen size={18} strokeWidth={2} />
                  <span>Learn</span>
                  <IconChevronRight size={18} strokeWidth={2} className="chevron" />
                </button>
                <div id="mobile-learn" className={`app-nav-mobile-sublinks${learnExpanded ? ' open' : ''}`}>
                  <Link className={`app-nav-mobile-link sub${location.pathname === '/ingredients' ? ' active' : ''}`} to="/ingredients"><IconFileText size={16} /> Ingredient Dictionary</Link>
                  <Link className={`app-nav-mobile-link sub${location.pathname === '/skin-type-guide' ? ' active' : ''}`} to="/skin-type-guide">Skin Type Guide</Link>
                  <Link className={`app-nav-mobile-link sub${location.pathname === '/tutorials' ? ' active' : ''}`} to="/tutorials">Video Tutorials</Link>
                </div>
              </div>
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
                <Link className="app-nav-mobile-link" to="/profile"><IconUser size={18} /> My Profile</Link>
                <Link className="app-nav-mobile-link" to="/profile?tab=settings"><IconSettings size={18} /> Settings</Link>
                <Link className="app-nav-mobile-link" to="/export"><IconDownload size={18} /> Data Export</Link>
                <Link className="app-nav-mobile-link" to="/notifications">Notifications</Link>
                <button
                  type="button"
                  className="app-nav-mobile-link app-nav-mobile-logout"
                  onClick={() => { logout(); navigate('/'); }}
                >
                  <IconLogOut size={18} />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="app-nav-mobile-auth">
                <Link className="app-nav-mobile-btn-secondary" to="/auth">Sign In</Link>
                <Link className="app-nav-mobile-btn-primary" to="/auth?mode=register">Get Started Free</Link>
              </div>
            )}

            {!isAuthenticated && !location.pathname.startsWith('/scan') && (
              <Link className="app-nav-mobile-cta" to="/scan" title="Start a free skin analysis">
                <IconScan size={20} strokeWidth={2} />
                <span>Start Free Skin Scan</span>
              </Link>
            )}
          </div>
        </nav>
      </header>

      {showBreadcrumbs && !isAppRoute && (
        <div className="app-breadcrumbs" aria-label="Breadcrumb">
          <div className="app-breadcrumbs-container">
            {breadcrumbs.map((crumb, index) => (
              <span key={`${crumb.label}-${index}`} className="app-breadcrumb-item">
                {crumb.to ? (
                  <Link to={crumb.to}>{crumb.label}</Link>
                ) : (
                  <span className="app-breadcrumb-current" aria-current="page">{crumb.label}</span>
                )}
                {index < breadcrumbs.length - 1 && <span className="app-breadcrumb-separator" aria-hidden>›</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      <main className="app-main app-main-with-bottom-nav" id="main-content" role="main">
        <div key={location.pathname} className="page-transition-wrap">
          {children}
        </div>
      </main>

      <BottomNav />
      {location.pathname !== '/profile' && <BackToTop />}

      <footer className="app-footer" role="contentinfo">
        {/* Newsletter Section */}
        <div className="app-footer-newsletter">
          <div className="app-footer-newsletter-content">
            <div className="app-footer-newsletter-text">
              <h3>Get Personalized Skin Tips</h3>
              <p>Join 50,000+ others getting weekly skincare insights powered by AI.</p>
            </div>
            <form
              className="app-footer-newsletter-form"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const email = (form.querySelector('input[type="email"]') as HTMLInputElement)?.value?.trim();
                if (email) {
                  toast.info('Newsletter signup coming soon. We’ll save your interest!');
                }
              }}
              aria-label="Newsletter signup"
            >
              <input type="email" placeholder="Enter your email" aria-label="Email for newsletter" />
              <button type="submit" aria-label="Subscribe to newsletter">Subscribe</button>
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
                <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
                  <IconInstagram size={18} strokeWidth={2} />
                </a>
                <a href={SOCIAL_LINKS.x} target="_blank" rel="noreferrer" aria-label="X">
                  <IconBrandX size={18} />
                </a>
                <a href={SOCIAL_LINKS.tiktok} target="_blank" rel="noreferrer" aria-label="TikTok">
                  <IconTiktok size={18} strokeWidth={2} />
                </a>
                <a href={SOCIAL_LINKS.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn">
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
                <Link to="/contact?subject=feedback">Feedback</Link>
                <Link to="/tutorials">Help</Link>
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
            <p className="app-footer-copyright">
              © 2026 SkinCareAI. All rights reserved.
              <span className="app-footer-version" aria-hidden="true"> v1.0</span>
              {' · '}
              <Link to="/about#whats-new" className="app-footer-whats-new">What&apos;s new</Link>
              <ApiStatusIndicator />
            </p>
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
