import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './ProfileSettingsPage.css';

interface UserProfile {
  name: string;
  email: string;
  age: number;
  skinType: string;
  skinConcerns: string[];
  allergies: string[];
  notificationPreferences: {
    email: boolean;
    push: boolean;
    recommendations: boolean;
  };
  privacy: {
    profileVisible: boolean;
    shareData: boolean;
  };
}

const ProfileSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'privacy'>('profile');
  
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    age: 25,
    skinType: 'combination',
    skinConcerns: [],
    allergies: [],
    notificationPreferences: {
      email: true,
      push: true,
      recommendations: true
    },
    privacy: {
      profileVisible: true,
      shareData: false
    }
  });

  const skinTypes = ['Normal', 'Dry', 'Oily', 'Combination', 'Sensitive'];
  const commonConcerns = ['Acne', 'Wrinkles', 'Dark Spots', 'Redness', 'Dryness', 'Oiliness', 'Sensitivity'];
  const commonAllergies = ['Fragrances', 'Parabens', 'Sulfates', 'Alcohol', 'Essential Oils', 'Retinol'];

  useEffect(() => {
    // Load user profile from API
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/profile', {
      //   headers: { 'Authorization': `Bearer ${user.token}` }
      // });
      // const data = await response.json();
      // setProfile(data);
      
      // Mock data for now
      setProfile({
        ...profile,
        name: user?.name || 'User',
        email: user?.email || 'user@example.com'
      });
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // TODO: Replace with actual API call
      // await fetch('/api/profile', {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${user.token}`
      //   },
      //   body: JSON.stringify(profile)
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConcernToggle = (concern: string) => {
    setProfile(prev => ({
      ...prev,
      skinConcerns: prev.skinConcerns.includes(concern)
        ? prev.skinConcerns.filter(c => c !== concern)
        : [...prev.skinConcerns, concern]
    }));
  };

  const handleAllergyToggle = (allergy: string) => {
    setProfile(prev => ({
      ...prev,
      allergies: prev.allergies.includes(allergy)
        ? prev.allergies.filter(a => a !== allergy)
        : [...prev.allergies, allergy]
    }));
  };

  return (
    <div className="profile-settings-page">
      <div className="profile-container">
        <h1>Profile Settings</h1>
        
        <div className="tabs">
          <button 
            className={activeTab === 'profile' ? 'active' : ''}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button 
            className={activeTab === 'notifications' ? 'active' : ''}
            onClick={() => setActiveTab('notifications')}
          >
            Notifications
          </button>
          <button 
            className={activeTab === 'privacy' ? 'active' : ''}
            onClick={() => setActiveTab('privacy')}
          >
            Privacy
          </button>
        </div>

        <form onSubmit={handleSubmit} className="settings-form">
          {activeTab === 'profile' && (
            <div className="tab-content">
              <h2>Personal Information</h2>
              
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="age">Age</label>
                <input
                  type="number"
                  id="age"
                  value={profile.age}
                  onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) })}
                  min="13"
                  max="120"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="skinType">Skin Type</label>
                <select
                  id="skinType"
                  value={profile.skinType}
                  onChange={(e) => setProfile({ ...profile, skinType: e.target.value })}
                >
                  {skinTypes.map(type => (
                    <option key={type} value={type.toLowerCase()}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Skin Concerns</label>
                <div className="checkbox-group">
                  {commonConcerns.map(concern => (
                    <label key={concern} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={profile.skinConcerns.includes(concern)}
                        onChange={() => handleConcernToggle(concern)}
                      />
                      {concern}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Known Allergies/Sensitivities</label>
                <div className="checkbox-group">
                  {commonAllergies.map(allergy => (
                    <label key={allergy} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={profile.allergies.includes(allergy)}
                        onChange={() => handleAllergyToggle(allergy)}
                      />
                      {allergy}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="tab-content">
              <h2>Notification Preferences</h2>
              
              <div className="form-group">
                <label className="switch-label">
                  <input
                    type="checkbox"
                    checked={profile.notificationPreferences.email}
                    onChange={(e) => setProfile({
                      ...profile,
                      notificationPreferences: {
                        ...profile.notificationPreferences,
                        email: e.target.checked
                      }
                    })}
                  />
                  <span>Email Notifications</span>
                </label>
                <p className="help-text">Receive updates and recommendations via email</p>
              </div>

              <div className="form-group">
                <label className="switch-label">
                  <input
                    type="checkbox"
                    checked={profile.notificationPreferences.push}
                    onChange={(e) => setProfile({
                      ...profile,
                      notificationPreferences: {
                        ...profile.notificationPreferences,
                        push: e.target.checked
                      }
                    })}
                  />
                  <span>Push Notifications</span>
                </label>
                <p className="help-text">Get instant alerts for new recommendations</p>
              </div>

              <div className="form-group">
                <label className="switch-label">
                  <input
                    type="checkbox"
                    checked={profile.notificationPreferences.recommendations}
                    onChange={(e) => setProfile({
                      ...profile,
                      notificationPreferences: {
                        ...profile.notificationPreferences,
                        recommendations: e.target.checked
                      }
                    })}
                  />
                  <span>Product Recommendations</span>
                </label>
                <p className="help-text">Receive personalized product suggestions</p>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="tab-content">
              <h2>Privacy Settings</h2>
              
              <div className="form-group">
                <label className="switch-label">
                  <input
                    type="checkbox"
                    checked={profile.privacy.profileVisible}
                    onChange={(e) => setProfile({
                      ...profile,
                      privacy: {
                        ...profile.privacy,
                        profileVisible: e.target.checked
                      }
                    })}
                  />
                  <span>Public Profile</span>
                </label>
                <p className="help-text">Make your profile visible to other users</p>
              </div>

              <div className="form-group">
                <label className="switch-label">
                  <input
                    type="checkbox"
                    checked={profile.privacy.shareData}
                    onChange={(e) => setProfile({
                      ...profile,
                      privacy: {
                        ...profile.privacy,
                        shareData: e.target.checked
                      }
                    })}
                  />
                  <span>Share Data for Research</span>
                </label>
                <p className="help-text">Help improve our recommendations by sharing anonymized data</p>
              </div>

              <div className="privacy-info">
                <h3>Data Privacy</h3>
                <p>We take your privacy seriously. Your personal data is encrypted and never sold to third parties.</p>
                <a href="#" className="privacy-link">Read our Privacy Policy</a>
              </div>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">Profile updated successfully!</div>}

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" className="btn-secondary" onClick={fetchUserProfile}>
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettingsPage;
