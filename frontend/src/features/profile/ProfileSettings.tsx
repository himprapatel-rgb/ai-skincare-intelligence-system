import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  skinType: string;
  concerns: string[];
  goals: string[];
}

const ProfileSettings: React.FC = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get('/api/v1/profile/me');
        setProfile(response.data);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put('/api/v1/profile/me', profile);
      alert('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading profile...</div>;
  if (!profile) return <div>No profile data</div>;

  return (
    <form onSubmit={handleSave} className="profile-settings" aria-label="Profile Settings Form">
      <h1>Profile Settings</h1>
      <div className="form-group">
        <label htmlFor="firstName">First Name</label>
        <input id="firstName" type="text" value={profile.firstName} onChange={(e) => setProfile({...profile, firstName: e.target.value})} required />
      </div>
      <div className="form-group">
        <label htmlFor="lastName">Last Name</label>
        <input id="lastName" type="text" value={profile.lastName} onChange={(e) => setProfile({...profile, lastName: e.target.value})} required />
      </div>
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input id="email" type="email" value={profile.email} onChange={(e) => setProfile({...profile, email: e.target.value})} required disabled />
      </div>
      <div className="form-group">
        <label htmlFor="skinType">Skin Type</label>
        <select id="skinType" value={profile.skinType} onChange={(e) => setProfile({...profile, skinType: e.target.value})} required>
          <option value="oily">Oily</option>
          <option value="dry">Dry</option>
          <option value="combination">Combination</option>
          <option value="normal">Normal</option>
          <option value="sensitive">Sensitive</option>
        </select>
      </div>
      <button type="submit" disabled={saving} className="btn-primary">
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
};

export default ProfileSettings;
