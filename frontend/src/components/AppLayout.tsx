import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { IconInstagram, IconBrandX, IconLinkedin, IconTiktok, IconMenu, IconX, IconUser, IconChevronDown, IconChevronRight, IconLogOut, IconSettings, IconScan, IconPackage, IconHeart, IconHistory, IconBookOpen, IconFileText, IconDownload } from './Icons';
import NotificationBell from './notifications/NotificationBell';
import { useNotificationsOptional } from '../context/NotificationContext';
import { SOCIAL_LINKS } from '../config';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { BackToTop } from './BackToTop';
import LoadingScreen from './LoadingScreen';
import { RouteLoadingBar } from './RouteLoadingBar';
import { OfflineBanner } from './OfflineBanner';
import { AddToHomeScreenPrompt } from './AddToHomeScreenPrompt';
import { ApiStatusIndicator } from './ApiStatusIndicator';
import { BottomNav } from './BottomNav';
import { useViewport } from '../hooks/useViewport';
import './AppLayout.css';

type AppLayoutProps = {
  children: React.ReactNode;
};

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, isLoading: authLoading } = useAuth();
  const toast = useToast();
  const notificationCtx = useNotificationsOptional();
  const notificationUnread = (isAuthenticated && notificationCtx?.unreadCount) ? notificationCtx.unreadCount : 0;
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
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);
  const [newsletterMessage, setNewsletterMessage] = useState<'success' | 'error' | null>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  
  // Handle scroll for header shadow (RAF-throttled to avoid per-event re-renders)
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 10);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
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

  // Focus trap and Escape in user dropdown (issue #79)
  useEffect(() => {
    if (!userDropdownOpen || !userDropdownRef.current) return;
    const root = userDropdownRef.current;
    const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusables = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE));
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setUserDropdownOpen(false);
        (document.activeElement as HTMLElement)?.blur();
        return;
      }
      if (e.key !== 'Tab') return;
      const current = document.activeElement as HTMLElement;
      if (!root.contains(current)) return;
      if (e.shiftKey) {
        if (current === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (current === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [userDropdownOpen]);
  
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
      'me': 'Me',
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
      'progress': 'Progress',
      'skin-goals': 'Skin Goals',
      'consent': 'Consent',
      'comparison': 'Comparison',
      'device-context': 'Device & Privacy',
      'admin': 'Admin',
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

  const viewport = useViewport();

  /* App shell (minimal footer, 3-tab nav) only on MOBILE; desktop + tablet keep full layout */
  const pathIsAppRoute = useMemo(() => {
    const p = location.pathname;
    if (p === '/') return true;
    const appPaths = ['/dashboard', '/scan', '/history', '/recommendations', '/discover', '/myshelf', '/scanner', '/profile', '/me', '/routine-builder', '/routines', '/favorites', '/digital-twin', '/onboarding', '/auth', '/comparison', '/progress', '/export', '/notifications', '/skin-goals', '/consent'];
    if (appPaths.some(path => p === path || p.startsWith(path + '/'))) return true;
    if (p.startsWith('/analysis') || p.startsWith('/product/')) return true;
    return false;
  }, [location.pathname]);

  const isAppRoute = viewport === 'mobile' && pathIsAppRoute;

  if (authLoading) {
    return <LoadingScreen message="Loading" fullscreen />;
  }

  return (
    <div
      className={`app-layout clinical-clean-shell${isAppRoute ? ' app-shell-mode' : ''}`}
      data-viewport={viewport}
    >
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
              <Link className={`app-nav-link${location.pathname === '/' ? ' active' : ''}`} to="/" aria-current={location.pathname === '/' ? 'page' : undefined} onMouseEnter={() => { void import('../pages/HomePage'); }}>Home</Link>
              <Link className={`app-nav-link${location.pathname.startsWith('/scan') ? ' active' : ''}`} to="/scan" title="Scan face or product" aria-current={location.pathname.startsWith('/scan') ? 'page' : undefined} onMouseEnter={() => void import('../pages/ScanPage')}>Scan</Link>
              {isAuthenticated && (
                <>
                  <Link className={`app-nav-link${location.pathname.startsWith('/dashboard') ? ' active' : ''}`} to="/dashboard" title="View your dashboard and insights" aria-current={location.pathname.startsWith('/dashboard') ? 'page' : undefined} onMouseEnter={() => void import('../pages/DashboardPage')}>Dashboard</Link>
                  <Link className={`app-nav-link${location.pathname.startsWith('/chat') ? ' active' : ''}`} to="/chat" title="Consult our Skin Expert" aria-current={location.pathname.startsWith('/chat') ? 'page' : undefined} onMouseEnter={() => { void import('../pages/AIChatPage'); }}>Skin Expert</Link>
                </>
              )}
              <div className="app-nav-dropdown">
                <button type="button" className={`app-nav-link app-nav-dropdown-trigger${['/clinical','/search','/progress','/skin-goals','/skin-quiz','/history'].some(p => location.pathname.startsWith(p)) ? ' active' : ''}`}>
                  Features <span className="app-nav-chevron" aria-hidden="true">▾</span>
                </button>
                <div className="app-nav-dropdown-menu">
                  <Link to="/search" className="app-nav-dropdown-item">Search</Link>
                  <Link to="/progress" className="app-nav-dropdown-item">Progress Tracking</Link>
                  <Link to="/skin-goals" className="app-nav-dropdown-item">Skin Goals</Link>
                  <Link to="/skin-quiz" className="app-nav-dropdown-item">Skin Type Quiz</Link>
                  <Link to="/history" className="app-nav-dropdown-item">Scan History</Link>
                  {isAuthenticated && <Link to="/clinical" className="app-nav-dropdown-item">Clinical Dashboard</Link>}
                  <Link to="/ingredients" className="app-nav-dropdown-item">Ingredient Dictionary</Link>
                  <Link to="/blog" className="app-nav-dropdown-item">Blog</Link>
                </div>
              </div>
              <Link className={`app-nav-link${location.pathname.startsWith('/about') ? ' active' : ''}`} to="/about" aria-current={location.pathname.startsWith('/about') ? 'page' : undefined} onMouseEnter={() => { void import('../pages/AboutPage'); }}>About</Link>
              {isAuthenticated && user?.is_admin && (
                <Link className={`app-nav-link${location.pathname.startsWith('/admin') ? ' active' : ''}`} to="/admin" aria-current={location.pathname.startsWith('/admin') ? 'page' : undefined} onMouseEnter={() => { void import('../pages/AdminDashboardPage'); }}>Admin</Link>
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
                        <Link to="/profile" className="app-nav-dropdown-item" onMouseEnter={() => { void import('../pages/ProfileSettingsPage'); }}>
                          <IconUser size={18} strokeWidth={2} />
                          <span>My Profile</span>
                        </Link>
                        <Link to="/profile?tab=settings" className="app-nav-dropdown-item" onMouseEnter={() => { void import('../pages/ProfileSettingsPage'); }}>
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
                  <Link className="app-nav-link" to="/auth" onMouseEnter={() => { void import('../pages/AuthPage'); }}>Sign In</Link>
                  <Link className="app-nav-cta-secondary" to="/auth?mode=register" onMouseEnter={() => { void import('../pages/AuthPage'); }}>Create Account</Link>
                </>
              )}
              
              {!isAuthenticated && !location.pathname.startsWith('/scan') && !location.pathname.startsWith('/analysis') && (
                <Link className="app-nav-cta" to="/scan" title="Start a free skin analysis" onMouseEnter={() => void import('../pages/ScanPage')}>
                  <IconScan size={18} strokeWidth={2} />
                  <span>Start Assessment</span>
                </Link>
              )}
              {isAuthenticated && !location.pathname.startsWith('/dashboard') && (
                <Link className="app-nav-cta" to="/dashboard" title="View your dashboard" onMouseEnter={() => void import('../pages/DashboardPage')}>
                  <span>Dashboard</span>
                </Link>
              )}
            </div>
          </nav>
          
          {isAuthenticated && (
            <div className="app-nav-mobile-bell">
              <NotificationBell />
            </div>
          )}
          {/* Mobile Menu Button (issue #5: badge when unread notifications) */}
          <button 
            className={`app-nav-mobile-toggle${notificationUnread > 0 ? ' has-badge' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : notificationUnread > 0 ? `Open menu (${notificationUnread} notifications)` : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <IconX size={24} strokeWidth={2} /> : <IconMenu size={24} strokeWidth={2} />}
            {notificationUnread > 0 && <span className="app-nav-mobile-toggle-badge" aria-hidden>{notificationUnread > 9 ? '9+' : notificationUnread}</span>}
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
              <Link className={`app-nav-mobile-link${location.pathname === '/' ? ' active' : ''}`} to="/" onTouchStart={() => { void import('../pages/HomePage'); }}>Home</Link>
              <Link className={`app-nav-mobile-link${location.pathname.startsWith('/scan') && !location.search.includes('mode=product') ? ' active' : ''}`} to="/scan" onTouchStart={() => { void import('../pages/ScanPage'); }}>Scan</Link>
              <Link className={`app-nav-mobile-link${location.pathname.startsWith('/dashboard') ? ' active' : ''}`} to="/dashboard" onTouchStart={() => { void import('../pages/DashboardPage'); }}>Dashboard</Link>
              <Link className={`app-nav-mobile-link${location.pathname.startsWith('/digital-twin') ? ' active' : ''}`} to="/digital-twin" onTouchStart={() => { void import('../pages/DigitalTwinTimelinePage'); }}>Digital Twin</Link>
              {isAuthenticated && (
                <Link className={`app-nav-mobile-link${location.pathname.startsWith('/chat') ? ' active' : ''}`} to="/chat" onTouchStart={() => { void import('../pages/AIChatPage'); }}>Skin Expert</Link>
              )}
              {isAuthenticated && (
                <Link className={`app-nav-mobile-link${location.pathname.startsWith('/clinical') ? ' active' : ''}`} to="/clinical" onTouchStart={() => { void import('../pages/ClinicalDashboardPage'); }}>Clinical</Link>
              )}
              <Link className={`app-nav-mobile-link${location.pathname.startsWith('/search') ? ' active' : ''}`} to="/search" onTouchStart={() => { void import('../pages/SearchPage'); }}>Search</Link>
              <Link className={`app-nav-mobile-link${location.pathname.startsWith('/about') ? ' active' : ''}`} to="/about" onTouchStart={() => { void import('../pages/AboutPage'); }}>About</Link>
              {isAuthenticated && user?.is_admin && (
                <Link className={`app-nav-mobile-link${location.pathname.startsWith('/admin') ? ' active' : ''}`} to="/admin" onTouchStart={() => { void import('../pages/AdminDashboardPage'); }}>Admin</Link>
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
                  <Link className={`app-nav-mobile-link sub${location.pathname === '/myshelf' ? ' active' : ''}`} to="/myshelf" onTouchStart={() => { void import('../pages/MyShelfPage'); }}><IconPackage size={16} /> My Shelf</Link>
                  <Link className={`app-nav-mobile-link sub${location.pathname === '/favorites' ? ' active' : ''}`} to="/favorites" onTouchStart={() => { void import('../pages/FavoritesPage'); }}><IconHeart size={16} /> Favorites</Link>
                  <Link className={`app-nav-mobile-link sub${location.pathname.startsWith('/routine-builder') ? ' active' : ''}`} to="/routine-builder" onTouchStart={() => { void import('../pages/RoutineBuilderPage'); }}>Routine Builder</Link>
                  <Link className={`app-nav-mobile-link sub${location.pathname.startsWith('/scan') && location.search.includes('mode=product') ? ' active' : ''}`} to="/scan?mode=product" onTouchStart={() => { void import('../pages/ScanPage'); }}>Product Scanner</Link>
                  <Link className={`app-nav-mobile-link sub${location.pathname === '/recommendations' ? ' active' : ''}`} to="/recommendations" onTouchStart={() => { void import('../pages/Recommendations'); }}>Recommendations</Link>
                  <Link className={`app-nav-mobile-link sub${location.pathname === '/history' ? ' active' : ''}`} to="/history" onTouchStart={() => { void import('../pages/HistoryPage'); }}><IconHistory size={16} /> History</Link>
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
                  <Link className={`app-nav-mobile-link sub${location.pathname === '/ingredients' ? ' active' : ''}`} to="/ingredients" onTouchStart={() => { void import('../pages/IngredientDictionaryPage'); }}><IconFileText size={16} /> Ingredient Dictionary</Link>
                  <Link className={`app-nav-mobile-link sub${location.pathname === '/skin-type-guide' ? ' active' : ''}`} to="/skin-type-guide" onTouchStart={() => { void import('../pages/SkinTypeGuidePage'); }}>Skin Type Guide</Link>
                  <Link className={`app-nav-mobile-link sub${location.pathname === '/tutorials' ? ' active' : ''}`} to="/tutorials" onTouchStart={() => { void import('../pages/VideoTutorialsPage'); }}>Video Tutorials</Link>
                </div>
              </div>

              {/* Issue #10: About/Contact/Privacy in app-shell so footer links reachable */}
              <div className="app-nav-mobile-legal">
                <Link className="app-nav-mobile-link sub" to="/about" onTouchStart={() => { void import('../pages/AboutPage'); }}>About</Link>
                <Link className="app-nav-mobile-link sub" to="/contact" onTouchStart={() => { void import('../pages/ContactPage'); }}>Contact</Link>
                <Link className="app-nav-mobile-link sub" to="/privacy" onTouchStart={() => { void import('../pages/PrivacyPage'); }}>Privacy</Link>
                <Link className="app-nav-mobile-link sub" to="/terms" onTouchStart={() => { void import('../pages/TermsPage'); }}>Terms</Link>
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
                <Link className="app-nav-mobile-link" to="/profile" onTouchStart={() => { void import('../pages/ProfileSettingsPage'); }}><IconUser size={18} /> My Profile</Link>
                <Link className="app-nav-mobile-link" to="/profile?tab=settings" onTouchStart={() => { void import('../pages/ProfileSettingsPage'); }}><IconSettings size={18} /> Settings</Link>
                <Link className="app-nav-mobile-link" to="/export" onTouchStart={() => { void import('../pages/DataExportPage'); }}><IconDownload size={18} /> Data Export</Link>
                <Link className="app-nav-mobile-link" to="/notifications" onTouchStart={() => { void import('../pages/NotificationCenterPage'); }}>Notifications</Link>
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
                <Link className="app-nav-mobile-btn-secondary" to="/auth" onTouchStart={() => { void import('../pages/AuthPage'); }}>Sign In</Link>
                <Link className="app-nav-mobile-btn-primary" to="/auth?mode=register" onTouchStart={() => { void import('../pages/AuthPage'); }}>Create Account</Link>
              </div>
            )}

            {!isAuthenticated && !location.pathname.startsWith('/scan') && (
              <Link className="app-nav-mobile-cta" to="/scan" title="Start a skin assessment" onTouchStart={() => { void import('../pages/ScanPage'); }}>
                <IconScan size={20} strokeWidth={2} />
                <span>Start Assessment</span>
              </Link>
            )}
            {isAuthenticated && !location.pathname.startsWith('/dashboard') && (
              <Link className="app-nav-mobile-cta" to="/dashboard" title="View your dashboard" onTouchStart={() => { void import('../pages/DashboardPage'); }}>
                <span>Dashboard</span>
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
        <div key={location.pathname + location.key} className="page-transition-wrap">
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
              <p>Get weekly skincare insights and personalized recommendations powered by AI.</p>
            </div>
            <form
              className="app-footer-newsletter-form"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const email = (form.querySelector('input[type="email"]') as HTMLInputElement)?.value?.trim();
                if (!email) return;
                setNewsletterMessage(null);
                setNewsletterSubmitting(true);
                setTimeout(() => {
                  toast.info('Newsletter signup coming soon. We’ll save your interest!');
                  setNewsletterSubmitting(false);
                }, 400);
              }}
              aria-label="Newsletter signup"
            >
              <input type="email" placeholder="Enter your email" aria-label="Email for newsletter" disabled={newsletterSubmitting} />
              <button type="submit" aria-label="Subscribe to newsletter" disabled={newsletterSubmitting}>
                {newsletterSubmitting ? 'Subscribing…' : 'Subscribe'}
              </button>
              {newsletterMessage === 'success' && <p className="app-footer-newsletter-feedback" role="status">Thanks! We'll be in touch.</p>}
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
                <Link to="/scan">Scan</Link>
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
                <Link to="/scan?mode=product">Product Scanner</Link>
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
              <ApiStatusIndicator hideWhenConnected />
            </p>
            <p className="app-footer-disclaimer">
              <span className="app-footer-disclaimer-icon">ℹ️</span>
              Informational support only. Consult a qualified clinician for diagnosis or treatment decisions.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Memoize to prevent unnecessary re-renders on parent updates
export default React.memo(AppLayout);
