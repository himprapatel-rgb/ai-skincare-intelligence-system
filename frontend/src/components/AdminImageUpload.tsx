import React, { useRef, useState } from 'react';
import { API_BASE_URL, getUploadFullUrl } from '../config';
import { STORAGE_KEYS } from '../constants/storage';
import { IconUpload } from './Icons';

interface AdminImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label: string;
  recommendedSize: string;
  placeholder?: string;
  id?: string;
}

export const AdminImageUpload: React.FC<AdminImageUploadProps> = ({
  value,
  onChange,
  label,
  recommendedSize,
  placeholder = 'https://... or upload',
  id = 'image-upload',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE_URL}/admin/upload-image`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Upload failed (${res.status})`);
      }
      const data = await res.json();
      const fullUrl = data.url ? getUploadFullUrl(data.url) : data.url;
      onChange(fullUrl || data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="admin-image-upload form-group">
      <label htmlFor={id}>
        {label}
        <span className="admin-image-spec"> — {recommendedSize}</span>
      </label>
      <div className="admin-image-upload-row">
        <input
          id={id}
          type="url"
          value={value}
          onChange={(e) => { onChange(e.target.value); setError(null); }}
          placeholder={placeholder}
          className="admin-image-url-input"
        />
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          className="admin-image-file-input"
          aria-label="Upload image"
        />
        <button
          type="button"
          className="btn btn-secondary admin-upload-btn"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          <IconUpload size={16} />
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
      {value && (
        <div className="admin-image-preview">
          <img src={value} alt="Upload preview" onError={() => setError('Image failed to load')} />
        </div>
      )}
      {error && <p className="admin-image-error">{error}</p>}
    </div>
  );
};
