import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { IconBarChart, IconCamera, IconPackage, IconSparkles, IconTrendingUp, IconScan } from '../components/Icons';
import { mockProducts } from '../data/mockProducts';
import { getScanHistory } from '../services/scanApi';
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const initialProfileRef = useRef<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string }>({});
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'skin' | 'goals' | 'lifestyle' | 'notifications' | 'privacy' | 'stats'>('personal');
  
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
    productsInShelf: mockProducts.length,
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

  const tabs = [
    { id: 'personal', label: 'Personal' },
    { id: 'skin', label: 'Skin Profile' },
    { id: 'goals', label: 'Goals' },
    { id: 'lifestyle', label: 'Lifestyle' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'privacy', label: 'Privacy' },
    { id: 'stats', label: 'Statistics' }
  ] as const;

  const fetchUserProfile = useCallback(async () => {
    try {
      setProfile((prev) => {
        const nextProfile = {
          ...prev,
          name: user?.full_name || 'User',
          email: user?.email || 'user@example.com'
        };
        initialProfileRef.current = nextProfile;
        return nextProfile;
      });
      setIsDirty(false);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const historyData = await getScanHistory();
        const scans = (historyData as { scans?: Array<Record<string, unknown>> }).scans || [];
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
        setStats({
          skinHealthScore: avgScore,
          totalScans: scans.length,
          productsInShelf: mockProducts.length,
          activeRoutines: 0
        });
        setProgressData(progress);
      } catch (err) {
        console.error('Failed to load stats:', err);
      }
    };

    loadStats();
  }, []);

  useEffect(() => {
    if (!initialProfileRef.current) {
      return;
    }
    const current = JSON.stringify(profile);
    const initial = JSON.stringify(initialProfileRef.current);
    setIsDirty(current !== initial);
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: { name?: string; email?: string } = {};
    if (!profile.name.trim()) {
      nextErrors.name = 'Full name is required.';
    }
    if (!profile.email.trim()) {
      nextErrors.email = 'Email address is required.';
    }
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setError('Please fix the highlighted fields.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess(true);
      toast.success('Profile updated successfully.');
      initialProfileRef.current = profile;
      setIsDirty(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to update profile. Please try again.');
      toast.error('Failed to update profile.');
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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({ ...prev, profilePhoto: reader.result as string }));
        toast.success('Profile photo updated.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProtectedAction = (message: string) => {
    toast.info(message);
  };

  return (
    <div className="profile-settings-page">
      {/* Hero Banner */}
      <div className="profile-hero-banner">
        <h1>Profile Settings</h1>
        <p className="profile-subtitle">Manage your personal details, skin profile, and privacy preferences.</p>
      </div>

      <div className="profile-container">
        <div className="profile-container-inner">
          {isDirty && (
            <div className="profile-header">
              <span className="unsaved-pill">Unsaved changes</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="settings-form">
            <div className="profile-layout">
              <aside className="profile-sidebar">
                <div className="profile-card">
                <div className="photo-preview">
                  {profile.profilePhoto ? (
                    <img src={profile.profilePhoto} alt="Profile photo" loading="lazy" width={120} height={120} />
                  ) : (
                    <div className="photo-placeholder">No Photo</div>
                  )}
                </div>
                <div className="profile-identity">
                  <div className="profile-name">{profile.name || 'Your Name'}</div>
                  <div className="profile-email">{profile.email || 'email@example.com'}</div>
                </div>
                <button
                  type="button"
                  className="btn-upload"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Upload profile photo"
                >
                  <IconCamera size={18} strokeWidth={2} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                  Update Photo
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="visually-hidden"
                />
                <p className="help-text">Recommended: 200x200px square image.</p>
              </div>

              <div className="profile-quick-stats">
                <div className="quick-stat">
                  <span className="quick-stat-value">{stats.skinHealthScore}%</span>
                  <span className="quick-stat-label">Skin Score</span>
                </div>
                <div className="quick-stat">
                  <span className="quick-stat-value">{stats.totalScans}</span>
                  <span className="quick-stat-label">Total Scans</span>
                </div>
              </div>

              <nav className="profile-nav">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={activeTab === tab.id ? 'active' : ''}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
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
                    aria-invalid={Boolean(fieldErrors.name)}
                  />
                  {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
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
                      className="btn-secondary btn-inline"
                      onClick={() => handleProtectedAction('Email change requests are handled via support.')}
                    >
                      Request Email Change
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Phone Number (Optional)</label>
                  <input type="tel" id="phone" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+353 xxx xxx xxxx" />
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
            <div className="tab-content">
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
            <div className="tab-content">
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
                  <input type="checkbox" checked={profile.notificationPreferences.email} onChange={(e) => setProfile({ ...profile, notificationPreferences: { ...profile.notificationPreferences, email: e.target.checked } })} />
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
            <div className="tab-content">
              <div className="section-card">
                <div className="section-card-header">
                  <h2>Privacy & Account Settings</h2>
                  <p className="section-subtitle">Control visibility, data sharing, and account security.</p>
                </div>
              
              <div className="form-group">
                <label className="switch-label">
                  <input type="checkbox" checked={profile.privacy.profileVisible} onChange={(e) => setProfile({ ...profile, privacy: { ...profile.privacy, profileVisible: e.target.checked } })} />
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
                  onClick={() => {
                    const confirmed = window.confirm('Are you sure you want to delete your account?');
                    if (confirmed) {
                      navigate('/privacy#delete');
                    }
                  }}
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
            <div className="tab-content">
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
                    <ResponsiveContainer width="100%" height={240}>
                      <LineChart data={progressData}>
                        <XAxis dataKey="date" tickLine={false} axisLine={false} />
                        <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={3} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="progress-chart-placeholder">
                      <p>
                        <IconTrendingUp size={20} strokeWidth={2} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }} />
                        No progress data yet
                      </p>
                      <p className="help-text">Complete a scan to see your trend line.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="comparison-section">
                <h3>Before/After Comparison</h3>
                <div className="comparison-placeholder">
                  <p>
                    <IconScan size={20} strokeWidth={2} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }} />
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
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" className="btn-secondary" onClick={fetchUserProfile}>
              Reset
            </button>
            </div>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsPage;
