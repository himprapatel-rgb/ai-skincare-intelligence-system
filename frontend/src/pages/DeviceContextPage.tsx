/**
 * Device & context – view all info the web app collects (screen, locale, device, optional location/motion/light).
 * Same data we send with scan init; useful for transparency and debugging.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDeviceContext } from '../hooks/useDeviceContext';
import type { DeviceContext } from '../services/deviceContextService';
import { IconArrowLeft, IconCopy, IconDownload, IconInfo } from '../components/Icons';
import { useToast } from '../context/ToastContext';
import { usePageTitle } from '../hooks/usePageTitle';
import './DeviceContextPage.css';

function formatValue(v: unknown): string {
  if (v === undefined || v === null) return '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function Section({
  title,
  data,
  optional,
}: {
  title: string;
  data: Record<string, unknown>;
  optional?: boolean;
}) {
  const safeData = data ?? {};
  const entries = Object.entries(safeData).filter(([, val]) => val !== undefined && val !== null);
  if (entries.length === 0 && optional) return null;
  return (
    <section className="device-ctx-section">
      <h3 className="device-ctx-section-title">{title}</h3>
      <dl className="device-ctx-dl">
        {entries.map(([key, value]) => (
          <div key={key} className="device-ctx-row">
            <dt className="device-ctx-dt">{key}</dt>
            <dd className="device-ctx-dd">{formatValue(value)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default function DeviceContextPage() {
  usePageTitle('Device & context', 'Info this app collects from your device.');
  const toast = useToast();
  const { context, loading, error, refresh, syncOnly } = useDeviceContext();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const json = JSON.stringify(context, null, 2);
    navigator.clipboard.writeText(json).then(
      () => {
        setCopied(true);
        toast.success('Copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
      },
      () => toast.error('Copy failed')
    );
  };

  const handleRefresh = () => {
    refresh({
      requestLocation: true,
      requestMotion: true,
      requestAmbientLight: true,
    }).then(() => toast.success('Context updated'));
  };

  const handleDownload = () => {
    const json = JSON.stringify(context, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `device-context-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded');
  };

  return (
    <div className="device-ctx-page app-page">
      <header className="device-ctx-header">
        <Link to="/me" className="device-ctx-back" aria-label="Back to profile">
          <IconArrowLeft size={24} strokeWidth={2} />
        </Link>
        <h1 className="device-ctx-title">Device & context</h1>
      </header>

      <div className="device-ctx-intro">
        <IconInfo size={20} strokeWidth={2} className="device-ctx-intro-icon" />
        <p>
          This page shows the device and environment info the app can collect. We use it to improve scan quality
          and recommendations. Sync info is always available; location, motion, and light need your permission.
        </p>
      </div>

      <div className="device-ctx-actions">
        <button
          type="button"
          className="btn btn-secondary device-ctx-btn"
          onClick={syncOnly}
          disabled={loading}
        >
          Update sync info
        </button>
        <button
          type="button"
          className="btn btn-primary device-ctx-btn"
          onClick={handleRefresh}
          disabled={loading}
        >
          {loading ? 'Requesting…' : 'Refresh with permissions'}
        </button>
        <button
          type="button"
          className="btn btn-secondary device-ctx-btn"
          onClick={handleCopy}
          disabled={copied}
        >
          <IconCopy size={18} strokeWidth={2} />
          {copied ? 'Copied' : 'Copy JSON'}
        </button>
        <button
          type="button"
          className="btn btn-secondary device-ctx-btn"
          onClick={handleDownload}
        >
          <IconDownload size={18} strokeWidth={2} />
          Download JSON
        </button>
      </div>

      {error && (
        <div className="device-ctx-error" role="alert">
          {error}
        </div>
      )}

      <div className="device-ctx-content">
        <Section title="Screen" data={context.screen as Record<string, unknown>} />
        <Section title="Locale" data={context.locale as Record<string, unknown>} />
        <Section title="Device" data={context.device as Record<string, unknown>} />
        <Section
          title="Location"
          data={(context as DeviceContext).location as Record<string, unknown>}
          optional
        />
        <Section
          title="Motion"
          data={(context as DeviceContext).motion as Record<string, unknown>}
          optional
        />
        {(context as DeviceContext).ambientLight != null && (
          <Section
            title="Ambient light"
            data={{ ambientLight: (context as DeviceContext).ambientLight }}
          />
        )}
        <Section title="Collected at" data={{ collectedAt: context.collectedAt }} />
      </div>
    </div>
  );
}
