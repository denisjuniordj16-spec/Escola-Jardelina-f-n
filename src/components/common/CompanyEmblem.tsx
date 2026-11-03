import React from 'react';
import { CompanySettings } from '../../types';
import {
  ShieldCheck,
  Factory,
  Cog,
  Hexagon,
  Globe2,
  Building2,
  Leaf,
  Award,
} from 'lucide-react';

interface CompanyEmblemProps {
  settings: CompanySettings;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const CompanyEmblem: React.FC<CompanyEmblemProps> = ({
  settings,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
  };

  const iconSizes = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
    xl: 'w-10 h-10',
  };

  // If user provided a custom image emblem (file upload or URL)
  if (settings.emblemType === 'custom' && settings.emblemUrl) {
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 rounded-xl overflow-hidden shadow-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 ${sizeClasses[size]} ${className}`}
      >
        <img
          src={settings.emblemUrl}
          alt={settings.name}
          className="w-full h-full object-contain p-0.5"
          onError={(e) => {
            // Fallback if URL fails
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  // Preset SVG Emblems
  const renderPresetIcon = () => {
    const s = iconSizes[size];
    switch (settings.emblemPresetId) {
      case 'factory':
        return <Factory className={s} />;
      case 'gear':
        return <Cog className={s} />;
      case 'hexagon':
        return <Hexagon className={s} />;
      case 'globe':
        return <Globe2 className={s} />;
      case 'building':
        return <Building2 className={s} />;
      case 'leaf':
        return <Leaf className={s} />;
      case 'award':
        return <Award className={s} />;
      case 'shield':
      default:
        return <ShieldCheck className={s} />;
    }
  };

  // Background styling based on preset
  const presetTheme = () => {
    switch (settings.emblemPresetId) {
      case 'factory':
        return 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-amber-500/20';
      case 'gear':
        return 'bg-gradient-to-br from-slate-700 to-slate-900 text-amber-300 dark:from-slate-800 dark:to-slate-950 shadow-slate-900/20';
      case 'hexagon':
        return 'bg-gradient-to-br from-indigo-500 to-blue-700 text-white shadow-indigo-500/20';
      case 'globe':
        return 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-cyan-500/20';
      case 'building':
        return 'bg-gradient-to-br from-sky-600 to-indigo-800 text-white shadow-sky-600/20';
      case 'leaf':
        return 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-emerald-500/20';
      case 'award':
        return 'bg-gradient-to-br from-violet-600 to-purple-800 text-white shadow-violet-600/20';
      case 'shield':
      default:
        return 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-emerald-600/20';
    }
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-xl shadow-xs transition-transform ${presetTheme()} ${sizeClasses[size]} ${className}`}
      title={`Emblema da Empresa: ${settings.name}`}
    >
      {renderPresetIcon()}
    </div>
  );
};
