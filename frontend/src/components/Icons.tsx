/**
 * Icon Component Library
 * Centralized icon exports using Lucide React
 * 
 * Usage:
 * import { IconTrendingUp, IconCamera, IconSparkles } from './components/Icons';
 * 
 * <IconTrendingUp className="stat-icon" size={24} />
 */

import React from 'react';

// Dashboard & Stats Icons
export { TrendingUp as IconTrendingUp } from 'lucide-react';
export { TrendingDown as IconTrendingDown } from 'lucide-react';
export { Camera as IconCamera } from 'lucide-react';
export { Sparkles as IconSparkles } from 'lucide-react';
export { Package as IconPackage } from 'lucide-react';
export { BarChart3 as IconBarChart } from 'lucide-react';
export { Activity as IconActivity } from 'lucide-react';

// Action Icons
export { Scan as IconScan } from 'lucide-react';
export { ShoppingCart as IconShoppingCart } from 'lucide-react';
export { Calendar as IconCalendar } from 'lucide-react';
export { Star as IconStar } from 'lucide-react';
export { Heart as IconHeart } from 'lucide-react';
export { Plus as IconPlus } from 'lucide-react';
export { Search as IconSearch } from 'lucide-react';
export { Filter as IconFilter } from 'lucide-react';

// Navigation Icons
export { Home as IconHome } from 'lucide-react';
export { User as IconUser } from 'lucide-react';
export { Settings as IconSettings } from 'lucide-react';
export { History as IconHistory } from 'lucide-react';
export { ChevronRight as IconChevronRight } from 'lucide-react';
export { ChevronDown as IconChevronDown } from 'lucide-react';
export { ArrowLeft as IconArrowLeft } from 'lucide-react';
export { AlertTriangle as IconAlertTriangle } from 'lucide-react';
export { RefreshCw as IconRefresh } from 'lucide-react';
export { Menu as IconMenu } from 'lucide-react';
export { MoreVertical as IconMoreVertical } from 'lucide-react';
export { LogOut as IconLogOut } from 'lucide-react';
export { Flashlight as IconFlash } from 'lucide-react';
export { SwitchCamera as IconSwitchCamera } from 'lucide-react';
export { Keyboard as IconKeyboard } from 'lucide-react';
export { Volume2 as IconVolume } from 'lucide-react';
export { Vibrate as IconVibrate } from 'lucide-react';

// Feature Icons
export { Zap as IconZap } from 'lucide-react';
export { Target as IconTarget } from 'lucide-react';
export { CheckCircle as IconCheckCircle } from 'lucide-react';
export { AlertCircle as IconAlertCircle } from 'lucide-react';
export { Info as IconInfo } from 'lucide-react';
export { HelpCircle as IconHelpCircle } from 'lucide-react';
export { Brain as IconBrain } from 'lucide-react';
export { FileText as IconFileText } from 'lucide-react';
export { Video as IconVideo } from 'lucide-react';
export { Newspaper as IconNewspaper } from 'lucide-react';
export { BookOpen as IconBookOpen } from 'lucide-react';
export { Trash2 as IconTrash2 } from 'lucide-react';
export { Pencil as IconEdit2 } from 'lucide-react';
export { Lock as IconLock } from 'lucide-react';
export { Eye as IconEye } from 'lucide-react';
export { EyeOff as IconEyeOff } from 'lucide-react';

// Product & Skincare Icons
export { Droplet as IconDroplet } from 'lucide-react';
export { Sun as IconSun } from 'lucide-react';
export { Moon as IconMoon } from 'lucide-react';
export { Shield as IconShield } from 'lucide-react';
export { Leaf as IconLeaf } from 'lucide-react';

// Status Icons
export { Check as IconCheck } from 'lucide-react';
export { X as IconX } from 'lucide-react';
export { Loader2 as IconLoader } from 'lucide-react';
export { Download as IconDownload } from 'lucide-react';
export { Upload as IconUpload } from 'lucide-react';
export { Clock as IconClock } from 'lucide-react';
export { Circle as IconCircle } from 'lucide-react';
export { Bell as IconBell } from 'lucide-react';
export { ArrowUp as IconArrowUp } from 'lucide-react';
export { ArrowDown as IconArrowDown } from 'lucide-react';
export { ArrowRight as IconArrowRight } from 'lucide-react';
export { GripVertical as IconGripVertical } from 'lucide-react';

// Social & Communication
export { Mail as IconMail } from 'lucide-react';
export { Phone as IconPhone } from 'lucide-react';
export { MessageCircle as IconMessageCircle } from 'lucide-react';
export { MapPin as IconMapPin } from 'lucide-react';
export { Share2 as IconShare2 } from 'lucide-react';
export { Copy as IconCopy } from 'lucide-react';
export { Instagram as IconInstagram } from 'lucide-react';
export { Twitter as IconTwitter } from 'lucide-react';
export { Linkedin as IconLinkedin } from 'lucide-react';
export { Music2 as IconTiktok } from 'lucide-react';

// X (formerly Twitter) brand icon
export const IconBrandX: React.FC<{ size?: number; className?: string }> = ({ 
  size = 24, 
  className = '' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor"
    className={className}
    style={{ display: 'inline-block' }}
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

// Brand Icons (custom SVG components for brands not in Lucide)
export const IconBrandGoogle: React.FC<{ size?: number; className?: string }> = ({ 
  size = 24, 
  className = '' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    className={className}
    style={{ display: 'inline-block' }}
  >
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

// Skin Concern Icons - Import from lucide-react
import { 
  Flame, 
  Droplets, 
  Fingerprint, 
  CircleDot, 
  Thermometer, 
  Waves, 
  CircleOff, 
  Sparkle, 
  ShieldCheck,
  Circle as LucideCircle
} from 'lucide-react';

// Re-export with semantic names
export const IconAcne = Flame;
export const IconHydration = Droplets;
export const IconTexture = Fingerprint;
export const IconDarkSpots = CircleDot;
export const IconRedness = Thermometer;
export const IconWrinkles = Waves;
export const IconPores = CircleOff;
export const IconRadiance = Sparkle;
export const IconBarrier = ShieldCheck;

// Helper function to get skin concern icon by name
// eslint-disable-next-line react-refresh/only-export-components -- shared helper
export const getSkinConcernIcon = (concernName: string) => {
  const name = concernName.toLowerCase();
  if (name.includes('acne') || name.includes('breakout') || name.includes('pimple')) {
    return IconAcne;
  }
  if (name.includes('hydration') || name.includes('moisture') || name.includes('dry')) {
    return IconHydration;
  }
  if (name.includes('texture') || name.includes('rough') || name.includes('smooth')) {
    return IconTexture;
  }
  if (name.includes('dark') || name.includes('spot') || name.includes('pigment') || name.includes('hyperpigmentation')) {
    return IconDarkSpots;
  }
  if (name.includes('red') || name.includes('irritat') || name.includes('sensitiv')) {
    return IconRedness;
  }
  if (name.includes('wrinkle') || name.includes('line') || name.includes('aging') || name.includes('fine')) {
    return IconWrinkles;
  }
  if (name.includes('pore')) {
    return IconPores;
  }
  if (name.includes('radian') || name.includes('glow') || name.includes('dull')) {
    return IconRadiance;
  }
  if (name.includes('barrier') || name.includes('protect')) {
    return IconBarrier;
  }
  // Default fallback
  return LucideCircle;
};

// Also export the raw lucide icons
export { Flame, Droplets, Fingerprint, CircleDot, Thermometer, Waves, CircleOff, Sparkle, ShieldCheck };
