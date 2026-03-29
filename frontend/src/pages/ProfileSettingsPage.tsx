import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { useShelf } from '../context/ShelfContext';
import { IconBarChart, IconCamera, IconPackage, IconSparkles, IconTrendingUp, IconScan, IconBell, IconLock, IconHelpCircle, IconChevronRight, IconTarget, IconUser, IconFileText, IconMail, IconSun, IconMoon, IconArrowLeft, IconDownload } from '../components/Icons';
import { usePageTitle } from '../hooks/usePageTitle';
import { getScanHistory } from '../services/scanApi';
import { api } from '../services/api';
import { getUploadFullUrl } from '../config';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { hapticMedium, hapticLight } from '../utils/haptic';
import './ProfileSettingsPage.css';

interface UserProfile {
  // Personal Information
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  profilePhoto: string;
  location: string;
  timezone: string;
  
  // Skin Profile
  skinType: string;
  skinTone: string;
  skinUndertone: string;
  skinConcerns: string[];
  
  // Skin Goals
  skinGoals: string[];
  goalPriorities: { [key: string]: number };
  targetTimeline: string;
  
  // Lifestyle & Preferences
  allergies: string[];
  preferredIngredients: string[];
  budgetRange: string;
  brandPreferences: string[];
  climate: string;
  sunExposure: string;
  sleepQuality: string;
  stressLevel: string;
  dietType: string;
  
  // Notifications
  notificationPreferences: {
    email: boolean;
    push: boolean;
    recommendations: boolean;
    routineReminders: boolean;
    weeklySummary: boolean;
  };
  reminderSettings: {
    amReminder: boolean;
    amTime: string;
    pmReminder: boolean;
    pmTime: string;
  };
  
  // Privacy
  privacy: {
    profileVisible: boolean;
    shareData: boolean;
    showProgress: boolean;
  };
}

const ProfileSettingsPage: React.FC = () => {
  usePageTitle('Profile Settings');
  const { user, logout } = useAuth();
  const { totalCount: shelfProductCount } = useShelf();
  const navigate = useNavigate();
  const toast = useToast();
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const initialProfileRef = useRef<UserProfile | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const settingsFormRef = useRef<HTMLFormElement>(null);
  const successMessageRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; phone?: string }>({});
  const [isDirty, setIsDirty] = useState(false);
  const tabParam = searchParams.get('tab');
  const validTabs = ['personal', 'skin', 'goals', 'lifestyle', 'notifications', 'privacy', 'stats'] as const;
  const tabFromUrl = tabParam === 'settings' ? 'notifications' : tabParam;
  const initialTab = (tabFromUrl && validTabs.includes(tabFromUrl as typeof validTabs[number]) ? tabFromUrl : 'personal') as typeof validTabs[number];
  const [activeTab, setActiveTabState] = useState<typeof validTabs[number]>(initialTab);
  const setActiveTab = useCallback((tab: typeof validTabs[number]) => {
    setActiveTabState(tab);
    setSearchParams({ tab }, { replace: true });
  }, [setSearchParams]);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [showChangeEmailModal, setShowChangeEmailModal] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const deleteConfirmInputRef = useRef<HTMLInputElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pullStartY = useRef(0);
  const [rechartsModule, setRechartsModule] = useState<typeof import('recharts') | null>(null);
  
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    profilePhoto: '',
    location: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    skinType: 'combination',
    skinTone: 'medium',
    skinUndertone: 'neutral',
    skinConcerns: [],
    skinGoals: [],
    goalPriorities: {},
    targetTimeline: '90days',
    allergies: [],
    preferredIngredients: [],
    budgetRange: 'medium',
    brandPreferences: [],
    climate: 'temperate',
    sunExposure: 'moderate',
    sleepQuality: 'good',
    stressLevel: 'moderate',
    dietType: 'balanced',
    notificationPreferences: {
      email: true,
      push: true,
      recommendations: true,
      routineReminders: true,
      weeklySummary: true
    },
    reminderSettings: {
      amReminder: true,
      amTime: '07:00',
      pmReminder: true,
      pmTime: '21:00'
    },
    privacy: {
      profileVisible: true,
      shareData: false,
      showProgress: true
    }
  });

  // Stats data
  const [stats, setStats] = useState({
    skinHealthScore: 0,
    totalScans: 0,
    productsInShelf: shelfProductCount,
    activeRoutines: 0
  });
  const [progressData, setProgressData] = useState<Array<{ date: string; score: number }>>([]);

  // Options
  const skinTypes = ['Normal', 'Dry', 'Oily', 'Combination', 'Sensitive'];
  const skinTones = ['Fair', 'Light', 'Medium', 'Tan', 'Deep', 'Dark'];
  const undertones = ['Cool', 'Warm', 'Neutral', 'Olive'];
  const genderOptions = ['Female', 'Male', 'Non-binary', 'Prefer not to say'];
  
  const skinConcernOptions = [
    'Acne/Breakouts', 'Aging/Wrinkles', 'Dark Spots/Hyperpigmentation',
    'Dryness', 'Oiliness', 'Redness/Rosacea', 'Large Pores', 'Dullness', 'Uneven Texture'
  ];
  
  const skinGoalOptions = [
    'Clear Skin', 'Anti-aging', 'Hydration', 'Brightening', 'Even Skin Tone', 'Minimize Pores'
  ];
  
  const allergyOptions = [
    'Fragrances', 'Parabens', 'Sulfates', 'Alcohol', 'Essential Oils',
    'Retinol', 'AHA/BHA', 'Niacinamide', 'Vitamin C'
  ];
  
  const ingredientOptions = [
    'Vitamin C',
    'Hyaluronic Acid',
    'Retinol',
    'Niacinamide',
    'Salicylic Acid',
    'Glycolic Acid',
    'Ceramides',
    'Peptides',
    'Squalane',
    'Tea Tree Oil'
  ];
  
  const budgetOptions = [
    { value: 'budget', label: 'Budget (Under €20)' },
    { value: 'medium', label: 'Mid-range (€20-€50)' },
    { value: 'premium', label: 'Premium (€50-€100)' },
    { value: 'luxury', label: 'Luxury (€100+)' }
  ];
  
  const timelineOptions = [
    { value: '30days', label: '30 Days' },
    { value: '90days', label: '90 Days' },
    { value: '6months', label: '6 Months' },
    { value: '1year', label: '1 Year' }
  ];

  const fetchUserProfile = useCallback(async () => {
    if (!user) return;  // Wait for user to load from AuthContext before fetching profile
    try {
      const res = await api.get<{
        first_name?: string | null;
        last_name?: string | null;
        profile_photo_url?: string | null;
        phone_number?: string | null;
        [k: string]: unknown;
      }>('/profile');
      const p = res.data;
      const fullName = [p.first_name, p.last_name].filter(Boolean).join(' ') || user?.full_name || '';
      let photoUrl = p.profile_photo_url || '';
      if (photoUrl && !photoUrl.startsWith('http')) {
        photoUrl = getUploadFullUrl(photoUrl);
      }
      const updates: Partial<typeof profile> = {
        name: fullName || user?.full_name || '',
        email: user?.email || '',
        profilePhoto: photoUrl,
        phone: p.phone_number || '',
      };
      // Load skin profile fields if available
      if (typeof p.skin_type === 'string' && p.skin_type) updates.skinType = p.skin_type;
      if (Array.isArray(p.concerns) && p.concerns.length > 0) updates.skinConcerns = p.concerns as string[];
      if (Array.isArray(p.allergies) && p.allergies.length > 0) updates.allergies = p.allergies as string[];
      setProfile((prev) => {
        const next = { ...prev, ...updates };
        initialProfileRef.current = next;
        return next;
      });
      setIsDirty(false);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        // Profile not created yet; use user data from AuthContext
        setProfile((prev) => ({
          ...prev,
          name: user?.full_name || '',
          email: user?.email || ''
        }));
      }
    }
  }, [user]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  useEffect(() => {
    if (activeTab !== 'stats') return;
    let isMounted = true;
    const loadStats = async () => {
      try {
        const historyData = await getScanHistory();
        const scans = (historyData as Record<string, unknown>).data as Array<Record<string, unknown>> || (historyData as Record<string, unknown>).scans as Array<Record<string, unknown>> || [];
        const completedScans = scans.filter((scan) => String(scan.status || '') !== 'failed');
        const scores = completedScans
          .map((scan) => {
            const summary = (scan.summary || {}) as Record<string, unknown>;
            const overallScore = typeof summary.overall_score === 'number'
              ? Math.round(summary.overall_score)
              : null;
            return overallScore ?? null;
          })
          .filter((score): score is number => typeof score === 'number' && !Number.isNaN(score));
        const avgScore = scores.length > 0
          ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
          : 0;
        const sorted = completedScans
          .filter((scan) => typeof scan.created_at === 'string')
          .sort((a, b) => new Date(String(a.created_at)).getTime() - new Date(String(b.created_at)).getTime());
        const labelCounts: Record<string, number> = {};
        const progress = sorted.slice(-8).map((scan) => {
          const summary = (scan.summary || {}) as Record<string, unknown>;
          const rawScore = typeof summary.overall_score === 'number'
            ? Math.round(summary.overall_score)
            : avgScore;
          const baseLabel = new Date(String(scan.created_at)).toLocaleDateString('en', { month: 'short', day: 'numeric' });
          labelCounts[baseLabel] = (labelCounts[baseLabel] || 0) + 1;
          return {
            date: labelCounts[baseLabel] > 1 ? `${baseLabel} • ${labelCounts[baseLabel]}` : baseLabel,
            score: rawScore
          };
        });
        if (!isMounted) return;
        setStats({
          skinHealthScore: avgScore,
          totalScans: scans.length,
          productsInShelf: shelfProductCount,
          activeRoutines: 0
        });
        setProgressData(progress);
      } catch (err) {
        console.error('Failed to load stats:', err);
      }
    };

    loadStats();
    return () => {
      isMounted = false;
    };
  }, [activeTab, shelfProductCount]);

  // Update shelf count when it changes
  useEffect(() => {
    setStats(prev => ({ ...prev, productsInShelf: shelfProductCount }));
  }, [shelfProductCount]);

  useEffect(() => {
    if (activeTab !== 'stats' || rechartsModule) return;
    let isMounted = true;
    import('recharts')
      .then((mod) => {
        if (isMounted) setRechartsModule(mod);
      })
      .catch(() => {
        if (isMounted) setRechartsModule(null);
      });
    return () => {
      isMounted = false;
    };
  }, [activeTab, rechartsModule]);

  useEffect(() => {
    if (!initialProfileRef.current) {
      return;
    }
    const current = JSON.stringify(profile);
    const initial = JSON.stringify(initialProfileRef.current);
    setIsDirty(current !== initial);
  }, [profile]);

  /* Sticky header: show compact bar when scrolled past hero */
  useEffect(() => {
    const onScroll = () => setHeaderScrolled(window.scrollY > 120);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Unsaved changes: warn when leaving (Task 33) */
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) e.preventDefault();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handlePullStart = (e: React.TouchEvent) => {
    pullStartY.current = e.touches[0].clientY;
  };
  const handlePullMove = (e: React.TouchEvent) => {
    if (window.scrollY > 0) return;
    const y = e.touches[0].clientY;
    const diff = y - pullStartY.current;
    if (diff > 0) setPullDistance(Math.min(diff * 0.5, 80));
  };
  const handlePullEnd = () => {
    if (pullDistance >= 60 && !isRefreshing) {
      setIsRefreshing(true);
      fetchUserProfile().finally(() => {
        setIsRefreshing(false);
        setPullDistance(0);
        toast.success('Profile refreshed');
      });
    } else {
      setPullDistance(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: { name?: string; email?: string; phone?: string } = {};
    if (!profile.name.trim()) {
      nextErrors.name = 'Full name is required.';
    }
    if (!profile.email.trim()) {
      nextErrors.email = 'Email address is required.';
    }
    const phoneTrimmed = profile.phone.trim();
    if (phoneTrimmed && !/^\+?[\d\s\-().]{7,20}$/.test(phoneTrimmed)) {
      nextErrors.phone = 'Please enter a valid phone number (e.g. +353 1 234 5678).';
    }
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setError('Please fix the highlighted fields.');
      /* Scroll to first invalid field (Task 36) */
      requestAnimationFrame(() => {
        const el = nextErrors.name
          ? nameInputRef.current
          : nextErrors.email
            ? document.getElementById('email')
            : phoneInputRef.current;
        (el as HTMLElement | null)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        (el as HTMLInputElement | null)?.focus?.();
      });
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      const nameParts = profile.name.trim().split(/\s+/, 2);
      const first_name = nameParts[0] || '';
      const last_name = nameParts[1] || '';
      const profile_photo_url = profile.profilePhoto?.startsWith('data:') ? undefined : (profile.profilePhoto || undefined);
      await api.patch('/profile', {
        first_name,
        last_name,
        phone_number: profile.phone || undefined,
        profile_photo_url,
        skin_type: profile.skinType || undefined,
        concerns: profile.skinConcerns?.length > 0 ? profile.skinConcerns : undefined,
        allergies: profile.allergies?.length > 0 ? profile.allergies : undefined,
      });
      setSuccess(true);
      toast.success('Profile updated successfully.');
      hapticMedium();
      initialProfileRef.current = profile;
      setIsDirty(false);
      setTimeout(() => setSuccess(false), 3000);
      /* Focus success message for accessibility (Task 20) */
      requestAnimationFrame(() => successMessageRef.current?.focus());
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number; data?: { detail?: string } } })?.response?.status;
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      if (status === 404) {
        setError('Profile not found. Complete onboarding first to create your profile.');
        toast.error('Complete onboarding first.');
      } else {
        setError(detail || 'Failed to update profile. Please try again.');
        toast.error('Failed to update profile.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleArrayToggle = (field: keyof UserProfile, value: string) => {
    setProfile(prev => {
      const currentArray = prev[field] as string[];
      return {
        ...prev,
        [field]: currentArray.includes(value)
          ? currentArray.filter(item => item !== value)
          : [...currentArray, value]
      };
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPEG, PNG, WebP, GIF).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB.');
      return;
    }
    setPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post<{ url: string }>('/profile/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const relativeUrl = res.data?.url || '';
      const fullUrl = relativeUrl.startsWith('http') ? relativeUrl : getUploadFullUrl(relativeUrl);
      setProfile(prev => ({ ...prev, profilePhoto: fullUrl }));
      setIsDirty(true);
      toast.success('Profile photo ready. Click Save to persist.');
    } catch (err) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Upload failed.';
      toast.error(msg);
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleProtectedAction = (message: string) => {
    toast.info(message);
  };

  const openDeleteConfirm = () => {
    setDeleteConfirmText('');
    setDeleteConfirmOpen(true);
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setDeleteConfirmText('');
  };

  const deleteModalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!deleteConfirmOpen) return;
    const t = setTimeout(() => deleteConfirmInputRef.current?.focus(), 50);
    const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeDeleteConfirm();
        return;
      }
      if (e.key !== 'Tab') return;
      const el = deleteModalRef.current;
      if (!el) return;
      const focusables = el.querySelectorAll<HTMLElement>(FOCUSABLE);
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const current = document.activeElement as HTMLElement;
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
    window.addEventListener('keydown', onKeyDown);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [deleteConfirmOpen]);

  const doDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    try {
      await api.delete('/profile');
      setDeleteConfirmOpen(false);
      setDeleteConfirmText('');
      toast.success('Account deleted. You have been signed out.');
      logout();
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to delete account. Contact support if this persists.';
      toast.error(msg);
    }
  };

  return (
    <div className="profile-settings-page settings-page-app clinical-page">
      {/* Mobile: back to Me at top (Task 3) */}
      <div className="profile-top-bar mobile-only">
        <Link to="/me" className="profile-back-link" aria-label="Back to profile">
          <IconArrowLeft size={24} strokeWidth={2} />
          <span>Profile</span>
        </Link>
      </div>
      {/* Sticky header on scroll - compact avatar + name */}
      <header
        className={`profile-sticky-header${headerScrolled ? ' visible' : ''}`}
        aria-hidden={!headerScrolled}
      >
        <div className="profile-sticky-header-inner">
          <Link to="/me" className="profile-sticky-back" aria-label="Back to profile"> <IconArrowLeft size={24} strokeWidth={2} /> </Link>
          <div className="profile-sticky-avatar">
            {profile.profilePhoto ? (
              <img loading="lazy" src={profile.profilePhoto} alt="Profile photo" width={36} height={36} />
            ) : (
              <span>{(profile.name || 'U').charAt(0).toUpperCase()}</span>
            )}
          </div>
          <span className="profile-sticky-name">{profile.name || 'Profile'}</span>
        </div>
      </header>

      {/* Pull-to-refresh indicator (mobile) */}
      <div
        className="profile-pull-refresh"
        onTouchStart={handlePullStart}
        onTouchMove={handlePullMove}
        onTouchEnd={handlePullEnd}
        onTouchCancel={handlePullEnd}
      >
        <div
          className="profile-pull-indicator"
          style={{ opacity: pullDistance / 60 }}
          aria-hidden={pullDistance === 0 && !isRefreshing}
        >
          <div className="profile-pull-indicator-inner" style={{ transform: `translateY(${Math.min(pullDistance, 60)}px)` }}>
            {isRefreshing ? (
              <span className="profile-pull-spinner" aria-label="Refreshing" />
            ) : (
              <span className="profile-pull-text">Pull to refresh</span>
            )}
          </div>
        </div>
      </div>

      {/* App-style profile header card */}
      <div className="profile-header-card">
        <div className="profile-avatar-container">
          <div className="profile-avatar-wrap">
            {profile.profilePhoto ? (
              <img loading="lazy" src={profile.profilePhoto} alt="Profile photo" className="profile-avatar" width={100} height={100} />
            ) : (
              <div className="profile-avatar-placeholder">{(profile.name || 'U').charAt(0).toUpperCase()}</div>
            )}
          </div>
          <button
            type="button"
            className="avatar-edit-button"
            onClick={() => fileInputRef.current?.click()}
            disabled={photoUploading}
            aria-label={photoUploading ? 'Uploading photo…' : 'Change profile photo'}
            aria-busy={photoUploading}
          >
            {photoUploading ? <LoadingSpinner size="small" message="" /> : <IconCamera size={18} strokeWidth={2} />}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="visually-hidden"
          />
          <span className="profile-avatar-hint">Change photo</span>
        </div>
        <h1 className="profile-header-name">{profile.name || 'Your Name'}</h1>
        <p className="profile-header-email">{profile.email || 'email@example.com'}</p>
        <div className="profile-stats-row">
          <button type="button" className="stat-item stat-item-link" onClick={() => navigate('/dashboard')}>
            <span className="stat-value">{stats.skinHealthScore}%</span>
            <span className="stat-label">Skin Score</span>
          </button>
          <div className="stat-item">
            <span className="stat-value">{stats.totalScans}</span>
            <span className="stat-label">Scans</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{shelfProductCount}</span>
            <span className="stat-label">Products</span>
          </div>
        </div>
      </div>

      <div className="profile-container">
        <div className="profile-container-inner">
          {isDirty && (
            <div className="profile-unsaved-bar">
              <span className="unsaved-pill">Unsaved changes</span>
            </div>
          )}

          <form ref={settingsFormRef} onSubmit={handleSubmit} className="settings-form" id="profile-settings-form">
            <div className="profile-layout profile-layout-app">
              <aside className="profile-sidebar profile-sidebar-app">
                {/* MY SKIN */}
                <div className="settings-section">
                  <h2 className="section-title">My Skin</h2>
                  <div className="settings-group">
                    <button type="button" className={`settings-item${activeTab === 'goals' ? ' active' : ''}`} onClick={() => setActiveTab('goals')}>
                      <span className="settings-icon purple"><IconTarget size={20} strokeWidth={2} /></span>
                      <span className="settings-label">Skin Goals</span>
                      <IconChevronRight size={20} strokeWidth={2} className="settings-arrow" />
                    </button>
                    <button type="button" className={`settings-item${activeTab === 'skin' ? ' active' : ''}`} onClick={() => setActiveTab('skin')}>
                      <span className="settings-icon purple"><IconSparkles size={20} strokeWidth={2} /></span>
                      <span className="settings-label">Skin Type</span>
                      <span className="settings-value">{profile.skinType}</span>
                      <IconChevronRight size={20} strokeWidth={2} className="settings-arrow" />
                    </button>
                    <button type="button" className={`settings-item${activeTab === 'skin' ? ' active' : ''}`} onClick={() => setActiveTab('skin')}>
                      <span className="settings-icon blue"><IconPackage size={20} strokeWidth={2} /></span>
                      <span className="settings-label">Concerns</span>
                      <span className="settings-value">{profile.skinConcerns?.length || 0} selected</span>
                      <IconChevronRight size={20} strokeWidth={2} className="settings-arrow" />
                    </button>
                    <Link to="/routine-builder" className="settings-item">
                      <span className="settings-icon green"><IconPackage size={20} strokeWidth={2} /></span>
                      <span className="settings-label">Current Routine</span>
                      <IconChevronRight size={20} strokeWidth={2} className="settings-arrow" />
                    </Link>
                  </div>
                </div>

                {/* ACCOUNT */}
                <div className="settings-section">
                  <h2 className="section-title">Account</h2>
                  <div className="settings-group">
                    <button type="button" className={`settings-item${activeTab === 'personal' ? ' active' : ''}`} onClick={() => setActiveTab('personal')}>
                      <span className="settings-icon blue"><IconUser size={20} strokeWidth={2} /></span>
                      <span className="settings-label">Personal Info</span>
                      <IconChevronRight size={20} strokeWidth={2} className="settings-arrow" />
                    </button>
                    <Link to="/password-reset" className="settings-item">
                      <span className="settings-icon purple"><IconLock size={20} strokeWidth={2} /></span>
                      <span className="settings-label">Password</span>
                      <span className="settings-value">Change password</span>
                      <IconChevronRight size={20} strokeWidth={2} className="settings-arrow" />
                    </Link>
                    <button type="button" className={`settings-item${activeTab === 'stats' ? ' active' : ''}`} onClick={() => setActiveTab('stats')}>
                      <span className="settings-icon blue"><IconBarChart size={20} strokeWidth={2} /></span>
                      <span className="settings-label">Statistics</span>
                      <IconChevronRight size={20} strokeWidth={2} className="settings-arrow" />
                    </button>
                  </div>
                </div>

                {/* PREFERENCES */}
                <div className="settings-section">
                  <h2 className="section-title">Preferences</h2>
                  <div className="settings-group">
                    <button type="button" className={`settings-item${activeTab === 'notifications' ? ' active' : ''}`} onClick={() => setActiveTab('notifications')}>
                      <span className="settings-icon purple"><IconBell size={20} strokeWidth={2} /></span>
                      <span className="settings-label">Notifications</span>
                      <IconChevronRight size={20} strokeWidth={2} className="settings-arrow" />
                    </button>
                    <button type="button" className={`settings-item${activeTab === 'privacy' ? ' active' : ''}`} onClick={() => setActiveTab('privacy')}>
                      <span className="settings-icon green"><IconLock size={20} strokeWidth={2} /></span>
                      <span className="settings-label">Privacy</span>
                      <IconChevronRight size={20} strokeWidth={2} className="settings-arrow" />
                    </button>
                    <button type="button" className={`settings-item${activeTab === 'lifestyle' ? ' active' : ''}`} onClick={() => setActiveTab('lifestyle')}>
                      <span className="settings-icon blue"><IconSparkles size={20} strokeWidth={2} /></span>
                      <span className="settings-label">Lifestyle</span>
                      <IconChevronRight size={20} strokeWidth={2} className="settings-arrow" />
                    </button>
                  </div>
                </div>

                {/* SUPPORT */}
                <div className="settings-section">
                  <h2 className="section-title">Support</h2>
                  <div className="settings-group">
                    <Link to="/export" className="settings-item">
                      <span className="settings-icon green"><IconDownload size={20} strokeWidth={2} /></span>
                      <span className="settings-label">Export my data</span>
                      <span className="settings-value">GDPR</span>
                      <IconChevronRight size={20} strokeWidth={2} className="settings-arrow" />
                    </Link>
                    <Link to="/contact" className="settings-item">
                      <span className="settings-icon blue"><IconHelpCircle size={20} strokeWidth={2} /></span>
                      <span className="settings-label">Help &amp; Support</span>
                      <IconChevronRight size={20} strokeWidth={2} className="settings-arrow" />
                    </Link>
                    <Link to="/contact" className="settings-item">
                      <span className="settings-icon green"><IconMail size={20} strokeWidth={2} /></span>
                      <span className="settings-label">Contact Us</span>
                      <IconChevronRight size={20} strokeWidth={2} className="settings-arrow" />
                    </Link>
                    <Link to="/terms" className="settings-item">
                      <span className="settings-icon purple"><IconFileText size={20} strokeWidth={2} /></span>
                      <span className="settings-label">Terms &amp; Privacy</span>
                      <IconChevronRight size={20} strokeWidth={2} className="settings-arrow" />
                    </Link>
                    <Link to="/consent" className="settings-item">
                      <span className="settings-icon blue"><IconLock size={20} strokeWidth={2} /></span>
                      <span className="settings-label">Privacy preferences</span>
                      <span className="settings-value">Manage consent</span>
                      <IconChevronRight size={20} strokeWidth={2} className="settings-arrow" />
                    </Link>
                  </div>
                </div>

                {/* Sign Out, Delete Account + Version */}
                <div className="profile-footer-actions">
                  <button type="button" className="sign-out-button" onClick={() => { logout(); navigate('/'); }}>
                    Sign Out
                  </button>
                  <button
                    type="button"
                    className="delete-account-button"
                    onClick={openDeleteConfirm}
                  >
                    Delete Account
                  </button>
                  <p className="profile-version">Version 1.0.0</p>
                </div>
              </aside>

            <section className="profile-content">
          {/* PERSONAL INFORMATION TAB */}
          {activeTab === 'personal' && (
            <div className="tab-content">
              <div className="section-card">
                <div className="section-card-header">
                  <h2>Personal Information</h2>
                  <p className="section-subtitle">Keep your profile details accurate for tailored recommendations.</p>
                </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    value={profile.name}
                    onChange={(e) => {
                      setProfile({ ...profile, name: e.target.value });
                      if (fieldErrors.name) {
                        setFieldErrors((prev) => ({ ...prev, name: undefined }));
                      }
                    }}
                    required
                    aria-required="true"
                    aria-invalid={Boolean(fieldErrors.name)}
                    aria-describedby={fieldErrors.name ? 'name-error' : undefined}
                  />
                  {fieldErrors.name && <span id="name-error" className="field-error" role="alert">{fieldErrors.name}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    value={profile.email}
                    readOnly
                    aria-invalid={Boolean(fieldErrors.email)}
                  />
                  {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
                  <div className="inline-action">
                    <p className="help-text">Email changes require verification.</p>
                    <button
                      type="button"
                      className="btn-link change-email-btn"
                      onClick={() => setShowChangeEmailModal(true)}
                    >
                      Change Email
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Phone Number (Optional)</label>
                  <input
                    ref={phoneInputRef}
                    type="tel"
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => {
                      setProfile({ ...profile, phone: e.target.value });
                      if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: undefined }));
                    }}
                    placeholder="+353 1 234 5678"
                    aria-invalid={Boolean(fieldErrors.phone)}
                    aria-describedby={fieldErrors.phone ? 'phone-error' : undefined}
                  />
                  {fieldErrors.phone && <span id="phone-error" className="field-error">{fieldErrors.phone}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="dateOfBirth">Date of Birth</label>
                  <input type="date" id="dateOfBirth" value={profile.dateOfBirth} onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="gender">Gender</label>
                  <select id="gender" value={profile.gender} onChange={(e) => setProfile({ ...profile, gender: e.target.value })}>
                    <option value="">Select...</option>
                    {genderOptions.map(g => <option key={g} value={g.toLowerCase()}>{g}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="location">Location</label>
                  <input type="text" id="location" value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })} placeholder="City, Country" />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="timezone">Timezone</label>
                <select id="timezone" value={profile.timezone} onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}>
                  <option value="Europe/Dublin">Europe/Dublin (GMT)</option>
                  <option value="Europe/London">Europe/London (GMT/BST)</option>
                  <option value="Europe/Paris">Europe/Paris (CET)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                </select>
              </div>
              </div>
            </div>
          )}

          {/* SKIN PROFILE TAB */}
          {activeTab === 'skin' && (
            <div id="panel-skin" role="tabpanel" aria-labelledby="tab-skin" className="tab-content">
              <div className="section-card">
                <div className="section-card-header">
                  <h2>Skin Profile</h2>
                  <p className="section-subtitle">Help us understand your skin to refine analysis quality.</p>
                </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="skinType">Skin Type</label>
                  <select id="skinType" value={profile.skinType} onChange={(e) => setProfile({ ...profile, skinType: e.target.value })}>
                    {skinTypes.map(type => <option key={type} value={type.toLowerCase()}>{type}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="skinTone">Skin Tone</label>
                  <select id="skinTone" value={profile.skinTone} onChange={(e) => setProfile({ ...profile, skinTone: e.target.value })}>
                    {skinTones.map(tone => <option key={tone} value={tone.toLowerCase()}>{tone}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="skinUndertone">Skin Undertone</label>
                <select id="skinUndertone" value={profile.skinUndertone} onChange={(e) => setProfile({ ...profile, skinUndertone: e.target.value })}>
                  {undertones.map(ut => <option key={ut} value={ut.toLowerCase()}>{ut}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Primary Skin Concerns (Select all that apply)</label>
                <div className="checkbox-grid">
                  {skinConcernOptions.map(concern => (
                    <label key={concern} className="checkbox-card">
                      <input type="checkbox" checked={profile.skinConcerns.includes(concern)} onChange={() => handleArrayToggle('skinConcerns', concern)} />
                      <span>{concern}</span>
                    </label>
                  ))}
                </div>
              </div>
              </div>
            </div>
          )}

          {/* SKIN GOALS TAB */}
          {activeTab === 'goals' && (
            <div className="tab-content">
              <div className="section-card">
                <div className="section-card-header">
                  <h2>Skin Goals</h2>
                  <p className="section-subtitle">Set priorities so we can personalize routines and insights.</p>
                </div>
              
              <div className="form-group">
                <label>Priority Goals (Select your top goals)</label>
                <div className="checkbox-grid">
                  {skinGoalOptions.map(goal => (
                    <label key={goal} className="checkbox-card">
                      <input type="checkbox" checked={profile.skinGoals.includes(goal)} onChange={() => handleArrayToggle('skinGoals', goal)} />
                      <span>{goal}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="targetTimeline">Target Timeline</label>
                <select id="targetTimeline" value={profile.targetTimeline} onChange={(e) => setProfile({ ...profile, targetTimeline: e.target.value })}>
                  {timelineOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <p className="help-text">Set a realistic timeline to achieve your skin goals</p>
              </div>
              </div>
            </div>
          )}

          {/* LIFESTYLE TAB */}
          {activeTab === 'lifestyle' && (
            <div id="panel-lifestyle" role="tabpanel" aria-labelledby="tab-lifestyle" className="tab-content">
              <div className="section-card">
                <div className="section-card-header">
                  <h2>Lifestyle & Preferences</h2>
                  <p className="section-subtitle">Let us know what products and routines fit your life.</p>
                </div>
              
              <div className="form-group">
                <label>Allergies / Sensitivities (Ingredients to avoid)</label>
                <div className="checkbox-grid">
                  {allergyOptions.map(allergy => (
                    <label key={allergy} className="checkbox-card">
                      <input type="checkbox" checked={profile.allergies.includes(allergy)} onChange={() => handleArrayToggle('allergies', allergy)} />
                      <span>{allergy}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Preferred Ingredients</label>
                <div className="checkbox-grid">
                  {ingredientOptions.map(ing => (
                    <label key={ing} className="checkbox-card">
                      <input type="checkbox" checked={profile.preferredIngredients.includes(ing)} onChange={() => handleArrayToggle('preferredIngredients', ing)} />
                      <span>{ing}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="budgetRange">Budget Range</label>
                  <select id="budgetRange" value={profile.budgetRange} onChange={(e) => setProfile({ ...profile, budgetRange: e.target.value })}>
                    {budgetOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="climate">Climate</label>
                  <select id="climate" value={profile.climate} onChange={(e) => setProfile({ ...profile, climate: e.target.value })}>
                    <option value="humid">Humid</option>
                    <option value="dry">Dry</option>
                    <option value="temperate">Temperate</option>
                    <option value="tropical">Tropical</option>
                    <option value="cold">Cold</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="sunExposure">Sun Exposure</label>
                  <select id="sunExposure" value={profile.sunExposure} onChange={(e) => setProfile({ ...profile, sunExposure: e.target.value })}>
                    <option value="minimal">Minimal (Mostly indoors)</option>
                    <option value="moderate">Moderate</option>
                    <option value="high">High (Outdoor work/activities)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="sleepQuality">Sleep Quality</label>
                  <select id="sleepQuality" value={profile.sleepQuality} onChange={(e) => setProfile({ ...profile, sleepQuality: e.target.value })}>
                    <option value="poor">Poor (Less than 5 hours)</option>
                    <option value="fair">Fair (5-6 hours)</option>
                    <option value="good">Good (7-8 hours)</option>
                    <option value="excellent">Excellent (8+ hours)</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="stressLevel">Stress Level</label>
                  <select id="stressLevel" value={profile.stressLevel} onChange={(e) => setProfile({ ...profile, stressLevel: e.target.value })}>
                    <option value="low">Low</option>
                    <option value="moderate">Moderate</option>
                    <option value="high">High</option>
                    <option value="very-high">Very High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="dietType">Diet Type</label>
                  <select id="dietType" value={profile.dietType} onChange={(e) => setProfile({ ...profile, dietType: e.target.value })}>
                    <option value="balanced">Balanced</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="vegan">Vegan</option>
                    <option value="keto">Keto</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className="tab-content">
              <div className="section-card">
                <div className="section-card-header">
                  <h2>Notification Preferences</h2>
                  <p className="section-subtitle">Choose how and when you want to hear from us.</p>
                </div>
              
              <div className="form-group">
                <label className="switch-label">
                  <input
                    type="checkbox"
                    role="switch"
                    aria-checked={profile.notificationPreferences.email}
                    aria-label="Email notifications"
                    checked={profile.notificationPreferences.email}
                    onChange={(e) => {
                      hapticLight();
                      setProfile({ ...profile, notificationPreferences: { ...profile.notificationPreferences, email: e.target.checked } });
                    }}
                  />
                  <span>Email Notifications</span>
                </label>
                <p className="help-text">Receive updates and recommendations via email</p>
              </div>

              <div className="form-group">
                <label className="switch-label">
                  <input type="checkbox" checked={profile.notificationPreferences.push} onChange={(e) => setProfile({ ...profile, notificationPreferences: { ...profile.notificationPreferences, push: e.target.checked } })} />
                  <span>Push Notifications</span>
                </label>
                <p className="help-text">Get instant alerts on your device</p>
              </div>

              <div className="form-group">
                <label className="switch-label">
                  <input type="checkbox" checked={profile.notificationPreferences.recommendations} onChange={(e) => setProfile({ ...profile, notificationPreferences: { ...profile.notificationPreferences, recommendations: e.target.checked } })} />
                  <span>Product Recommendations</span>
                </label>
                <p className="help-text">Receive personalized product suggestions</p>
              </div>

              <div className="form-group">
                <label className="switch-label">
                  <input type="checkbox" checked={profile.notificationPreferences.weeklySummary} onChange={(e) => setProfile({ ...profile, notificationPreferences: { ...profile.notificationPreferences, weeklySummary: e.target.checked } })} />
                  <span>Weekly Summary</span>
                </label>
                <p className="help-text">Get a weekly report of your skin progress</p>
              </div>

              <h3>Routine Reminders</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="switch-label">
                    <input type="checkbox" checked={profile.reminderSettings.amReminder} onChange={(e) => setProfile({ ...profile, reminderSettings: { ...profile.reminderSettings, amReminder: e.target.checked } })} />
                    <span>Morning Routine Reminder</span>
                  </label>
                  {profile.reminderSettings.amReminder && (
                    <input type="time" value={profile.reminderSettings.amTime} onChange={(e) => setProfile({ ...profile, reminderSettings: { ...profile.reminderSettings, amTime: e.target.value } })} />
                  )}
                </div>
                <div className="form-group">
                  <label className="switch-label">
                    <input type="checkbox" checked={profile.reminderSettings.pmReminder} onChange={(e) => setProfile({ ...profile, reminderSettings: { ...profile.reminderSettings, pmReminder: e.target.checked } })} />
                    <span>Evening Routine Reminder</span>
                  </label>
                  {profile.reminderSettings.pmReminder && (
                    <input type="time" value={profile.reminderSettings.pmTime} onChange={(e) => setProfile({ ...profile, reminderSettings: { ...profile.reminderSettings, pmTime: e.target.value } })} />
                  )}
                </div>
              </div>
              </div>
            </div>
          )}

          {/* PRIVACY TAB */}
          {activeTab === 'privacy' && (
            <div id="panel-privacy" role="tabpanel" aria-labelledby="tab-privacy" className="tab-content">
              <div className="section-card">
                <div className="section-card-header">
                  <h2>Privacy & Account Settings</h2>
                  <p className="section-subtitle">Control visibility, data sharing, and account security.</p>
                </div>
              
              <div className="form-group">
                <label className="switch-label">
                  <input
                    type="checkbox"
                    role="switch"
                    aria-checked={profile.privacy.profileVisible}
                    aria-label="Public profile visible to others"
                    checked={profile.privacy.profileVisible}
                    onChange={(e) => {
                      hapticLight();
                      setProfile({ ...profile, privacy: { ...profile.privacy, profileVisible: e.target.checked } });
                    }}
                  />
                  <span>Public Profile</span>
                </label>
                <p className="help-text">Make your profile visible to other users</p>
              </div>

              <div className="form-group">
                <label className="switch-label">
                  <input type="checkbox" checked={profile.privacy.shareData} onChange={(e) => setProfile({ ...profile, privacy: { ...profile.privacy, shareData: e.target.checked } })} />
                  <span>Share Data for Research</span>
                </label>
                <p className="help-text">Help improve recommendations with anonymized data</p>
              </div>

              <div className="form-group">
                <label className="switch-label">
                  <input type="checkbox" checked={profile.privacy.showProgress} onChange={(e) => setProfile({ ...profile, privacy: { ...profile.privacy, showProgress: e.target.checked } })} />
                  <span>Show Progress Photos</span>
                </label>
                <p className="help-text">Display before/after comparison photos</p>
              </div>

              <div className="section-divider"></div>

              <h3>Appearance</h3>
              <div className="theme-toggle-group" role="group" aria-label="Theme">
                <button
                  type="button"
                  className={`theme-option${theme === 'light' ? ' active' : ''}`}
                  onClick={() => { setTheme('light'); hapticMedium(); }}
                  aria-pressed={theme === 'light'}
                >
                  <IconSun size={18} strokeWidth={2} />
                  <span>Light</span>
                </button>
                <button
                  type="button"
                  className={`theme-option${theme === 'dark' ? ' active' : ''}`}
                  onClick={() => { setTheme('dark'); hapticMedium(); }}
                  aria-pressed={theme === 'dark'}
                >
                  <IconMoon size={18} strokeWidth={2} />
                  <span>Dark</span>
                </button>
                <button
                  type="button"
                  className={`theme-option${theme === 'system' ? ' active' : ''}`}
                  onClick={() => { setTheme('system'); hapticMedium(); }}
                  aria-pressed={theme === 'system'}
                >
                  <span>System</span>
                </button>
              </div>
              <p className="help-text">Use system setting to follow your device light/dark mode.</p>

              <div className="section-divider"></div>

              <h3>Account Security</h3>
              <div className="action-buttons">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => navigate('/password-reset')}
                >
                  Change Password
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => handleProtectedAction('Connected accounts are coming soon.')}
                >
                  Connected Accounts
                </button>
              </div>

              <div className="section-divider"></div>

              <h3>Data Management</h3>
              <div className="action-buttons">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => navigate('/export')}
                >
                  Export My Data
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={openDeleteConfirm}
                >
                  Delete Account
                </button>
              </div>

              <div className="privacy-info">
                <p>We take your privacy seriously. Your data is encrypted and never sold.</p>
                <Link to="/privacy" className="privacy-link">Read our Privacy Policy</Link>
              </div>
              </div>
            </div>
          )}

          {/* STATISTICS TAB */}
          {activeTab === 'stats' && (
            <div id="panel-stats" role="tabpanel" aria-labelledby="tab-stats" className="tab-content">
              <div className="section-card">
                <div className="section-card-header">
                  <h2>Your Statistics</h2>
                  <p className="section-subtitle">Track your progress and scan history at a glance.</p>
                </div>
              
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">
                    <IconBarChart size={32} strokeWidth={2} />
                  </div>
                  <div className="stat-value">{stats.skinHealthScore}%</div>
                  <div className="stat-label">Skin Health Score</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">
                    <IconCamera size={32} strokeWidth={2} />
                  </div>
                  <div className="stat-value">{stats.totalScans}</div>
                  <div className="stat-label">Total Scans</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">
                    <IconPackage size={32} strokeWidth={2} />
                  </div>
                  <div className="stat-value">{stats.productsInShelf}</div>
                <div className="stat-label">My Products</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">
                    <IconSparkles size={32} strokeWidth={2} />
                  </div>
                  <div className={`stat-value${stats.activeRoutines === 0 ? ' zero' : ''}`}>{stats.activeRoutines}</div>
                  <div className="stat-label">Active Routines</div>
                </div>
              </div>

              <div className="progress-section">
                <h3>Progress Over Time</h3>
                <div className="progress-chart-card">
                  {progressData.length > 0 ? (
                    rechartsModule ? (
                      <rechartsModule.ResponsiveContainer width="100%" height={240}>
                        <rechartsModule.LineChart data={progressData}>
                          <rechartsModule.XAxis dataKey="date" tickLine={false} axisLine={false} />
                          <rechartsModule.YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
                          <rechartsModule.Tooltip />
                          <rechartsModule.Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={3} dot={false} />
                        </rechartsModule.LineChart>
                      </rechartsModule.ResponsiveContainer>
                    ) : (
                      <div className="progress-chart-placeholder">
                        <p>
                          <IconTrendingUp size={20} strokeWidth={2} className="icon-inline" />
                          Loading chart…
                        </p>
                      </div>
                    )
                  ) : (
                    <div className="progress-chart-placeholder">
                      <p>
                        <IconTrendingUp size={20} strokeWidth={2} className="icon-inline" />
                        No progress data yet
                      </p>
                      <p className="help-text">Complete a scan to see your trend line.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="stats-quick-links">
                <Link to="/history" className="btn-secondary">View scan history</Link>
                <Link to="/digital-twin" className="btn-secondary">View Digital Twin</Link>
              </div>

              <div className="comparison-section">
                <h3>Before/After Comparison</h3>
                <div className="comparison-placeholder">
                  <p>
                    <IconScan size={20} strokeWidth={2} className="icon-inline" />
                    Upload photos to see your transformation
                  </p>
                  <button type="button" className="btn-secondary" onClick={() => navigate('/comparison')}>View Comparison</button>
                </div>
              </div>
              </div>
            </div>
          )}
            </section>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">Profile updated successfully!</div>}
          
          <div className="form-actions-bar">
            <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading} aria-busy={loading}>
              {loading ? <><LoadingSpinner size="small" message="" /> Saving...</> : 'Save Changes'}
            </button>
            <button type="button" className="btn-secondary" onClick={fetchUserProfile}>
              Reset
            </button>
            </div>
          </div>

          {/* Floating Save - only when form is dirty (mobile-friendly) */}
          {isDirty && (
            <div className="profile-floating-save">
              <button
                type="button"
                className="profile-floating-save-btn"
                onClick={() => settingsFormRef.current?.requestSubmit()}
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? <><LoadingSpinner size="small" message="" /> Saving...</> : 'Save Changes'}
              </button>
            </div>
          )}

        </form>
        </div>
      </div>

      {/* Change Email modal */}
      {showChangeEmailModal && (
        <div
          className="profile-modal-backdrop"
          onClick={() => setShowChangeEmailModal(false)}
          onKeyDown={(e) => e.key === 'Escape' && setShowChangeEmailModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="change-email-title"
        >
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <h2 id="change-email-title">Change Email</h2>
            <p className="profile-modal-text">
              To change your email we need to verify your identity. We&apos;ll send a verification link to your new address.
            </p>
            <p className="profile-modal-text">
              Contact support to request an email change and we&apos;ll guide you through verification.
            </p>
            <div className="profile-modal-actions">
              <a href="mailto:support@pellicura.com?subject=Email%20change%20request" className="btn-primary">
                Email support
              </a>
              <button type="button" className="btn-secondary" onClick={() => setShowChangeEmailModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete account confirmation: type DELETE to confirm (issue #44) */}
      {deleteConfirmOpen && (
        <div className="profile-delete-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-account-title" onClick={(e) => e.target === e.currentTarget && closeDeleteConfirm()}>
          <div ref={deleteModalRef} className="profile-delete-modal">
            <h2 id="delete-account-title">Delete account</h2>
            <p>This will permanently remove your account and all data. This cannot be undone.</p>
            <p className="profile-delete-modal-instruction">Type <strong>DELETE</strong> below to confirm.</p>
            <input
              ref={deleteConfirmInputRef}
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="profile-delete-modal-input"
              aria-label="Type DELETE to confirm"
              autoComplete="off"
            />
            <div className="profile-delete-modal-actions">
              <button type="button" className="btn-secondary" onClick={closeDeleteConfirm}>Cancel</button>
              <button
                type="button"
                className="delete-account-button"
                disabled={deleteConfirmText !== 'DELETE'}
                onClick={doDeleteAccount}
              >
                Delete my account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSettingsPage;
