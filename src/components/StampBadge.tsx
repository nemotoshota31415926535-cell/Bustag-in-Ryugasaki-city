/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { BusStop } from '../types';

interface StampBadgeProps {
  busStop: BusStop;
  collectedDate?: string;
  size?: number;
  interactive?: boolean;
}

export default function StampBadge({
  busStop,
  collectedDate,
  size = 120,
  interactive = true,
}: StampBadgeProps) {
  // Color presets based on themeColor
  const colorMap: Record<string, { primary: string; secondary: string; text: string; bg: string }> = {
    emerald: { primary: '#059669', secondary: '#10b981', text: '#064e3b', bg: '#ecfdf5' },
    blue: { primary: '#2563eb', secondary: '#3b82f6', text: '#1e3a8a', bg: '#eff6ff' },
    amber: { primary: '#d97706', secondary: '#f59e0b', text: '#78350f', bg: '#fffbeb' },
    indigo: { primary: '#4f46e5', secondary: '#6366f1', text: '#312e81', bg: '#eef2ff' },
    sky: { primary: '#0284c7', secondary: '#0ea5e9', text: '#0c4a6e', bg: '#f0f9ff' },
    rose: { primary: '#e11d48', secondary: '#f43f5e', text: '#4c0519', bg: '#fff1f2' },
    violet: { primary: '#7c3aed', secondary: '#8b5cf6', text: '#2e1065', bg: '#f5f3ff' },
    pink: { primary: '#db2777', secondary: '#ec4899', text: '#500724', bg: '#fdf2f8' },
    orange: { primary: '#ea580c', secondary: '#f97316', text: '#7c2d12', bg: '#fff7ed' },
    teal: { primary: '#0d9488', secondary: '#14b8a6', text: '#115e59', bg: '#f0fdfa' },
  };

  const colors = colorMap[busStop.themeColor] || colorMap.emerald;

  // Formatting date for stamp text
  const formatDateForStamp = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}.${mm}.${dd}`;
  };

  const dateText = formatDateForStamp(collectedDate);

  // SVG graphic representing the landmark
  const renderLandmarkIcon = () => {
    switch (busStop.id) {
      case 'stop-1': // Ryugasaki Station
        return (
          <g stroke={colors.primary} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Retro Train Engine / Track */}
            <path d="M 35 60 L 85 60" strokeDasharray="3,3" />
            <rect x="42" y="32" width="36" height="24" rx="4" fill={colors.bg} />
            <circle cx="50" cy="50" r="5" />
            <circle cx="70" cy="50" r="5" />
            <path d="M 46 32 L 46 25 L 50 25 Z" fill={colors.primary} />
            <path d="M 52 40 L 68 40" />
          </g>
        );
      case 'stop-6': // Ryugasaki Nigo Iriguchi (Schoolcap / Book)
        return (
          <g stroke={colors.primary} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Open Book & Blossom */}
            <path d="M 40 52 C 50 48, 50 56, 60 52 C 70 48, 70 56, 80 52" />
            <path d="M 40 38 C 50 34, 50 42, 60 38 C 70 34, 70 42, 80 38" />
            <line x1="40" y1="38" x2="40" y2="52" />
            <line x1="60" y1="38" x2="60" y2="52" />
            <line x1="80" y1="38" x2="80" y2="52" />
            {/* Little cherry blossom petals */}
            <path d="M 60 22 L 62 27 L 67 27 L 63 30 L 65 35 L 60 32 L 55 35 L 57 30 L 53 27 L 58 27 Z" fill={colors.secondary} stroke="none" />
          </g>
        );
      case 'stop-12': // Jonan Shopping Center
        return (
          <g stroke={colors.primary} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Shopping Cart/Storefront */}
            <rect x="38" y="35" width="44" height="20" rx="3" fill={colors.bg} />
            <path d="M 38 41 L 82 41" />
            <path d="M 46 35 L 46 55" />
            <path d="M 58 35 L 58 55" />
            <path d="M 70 35 L 70 55" />
            <circle cx="48" cy="58" r="3" fill={colors.primary} />
            <circle cx="72" cy="58" r="3" fill={colors.primary} />
            <path d="M 34 31 L 38 35" />
          </g>
        );
      case 'stop-16': // Ryugasaki Ichigo-shita (Weeping Cherry/Hannyain)
        return (
          <g stroke={colors.primary} strokeWidth="2" fill="none" strokeLinecap="round">
            {/* Tree branches and falling petals */}
            <path d="M 60 58 L 60 38" strokeWidth="4" />
            <path d="M 60 42 C 45 35, 45 48, 38 52" />
            <path d="M 60 38 C 75 30, 75 45, 82 48" />
            <path d="M 60 32 C 50 20, 42 28, 35 32" strokeDasharray="1,2" />
            <path d="M 60 32 C 70 20, 78 28, 85 32" strokeDasharray="1,2" />
            {/* Little cherry flowers */}
            <circle cx="38" cy="52" r="3" fill={colors.secondary} stroke="none" />
            <circle cx="82" cy="48" r="3" fill={colors.secondary} stroke="none" />
            <circle cx="45" cy="30" r="2.5" fill={colors.secondary} stroke="none" />
            <circle cx="75" cy="28" r="2.5" fill={colors.secondary} stroke="none" />
          </g>
        );
      case 'stop-22': // Tobu Branch Office (Tatsunoko Mountain)
        return (
          <g stroke={colors.primary} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Mountain shape with spiral staircase path representing Tatsunoko-yama */}
            <path d="M 35 55 C 50 35, 60 25, 60 25 C 60 25, 70 35, 85 55 Z" fill={colors.bg} />
            <path d="M 42 45 Q 60 42 66 38" />
            <path d="M 52 35 Q 64 34 60 25" />
            <path d="M 48 55 L 72 55" />
            {/* Little cloud */}
            <path d="M 75 25 C 80 25, 83 28, 80 31 C 82 33, 76 34, 75 32" strokeWidth="1.5" />
          </g>
        );
      case 'stop-26': // Saiseikai Hospital (Cross & Heart)
        return (
          <g stroke={colors.primary} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Heart and medical cross inside */}
            <path d="M 60 55 C 60 55, 38 42, 38 31 C 38 23, 47 21, 60 31 C 73 21, 82 23, 82 31 C 82 42, 60 55, 60 55 Z" fill={colors.bg} />
            <path d="M 60 28 L 60 42" strokeWidth="3" />
            <path d="M 53 35 L 67 35" strokeWidth="3" />
          </g>
        );
      case 'stop-35': // Nakanedai Junior High School (Row of trees)
        return (
          <g stroke={colors.primary} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Trees in a row */}
            {/* Left Tree */}
            <path d="M 44 52 L 44 42" strokeWidth="3" />
            <path d="M 44 42 C 38 42, 38 30, 44 28 C 50 30, 50 42, 44 42" fill={colors.bg} />
            {/* Right Tree */}
            <path d="M 76 52 L 76 42" strokeWidth="3" />
            <path d="M 76 42 C 70 42, 70 30, 76 28 C 82 30, 82 42, 76 42" fill={colors.bg} />
            {/* Center Main Tree */}
            <path d="M 60 55 L 60 38" strokeWidth="4" />
            <path d="M 60 38 C 52 38, 52 24, 60 20 C 68 24, 68 38, 60 38" fill={colors.bg} strokeWidth="2.5" />
          </g>
        );
      case 'stop-39': // Sapla (Cinema / Shop Bags)
        return (
          <g stroke={colors.primary} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Film ticket and shopping bag */}
            <path d="M 35 48 L 50 34" strokeWidth="4" />
            <rect x="52" y="32" width="28" height="24" rx="3" fill={colors.bg} />
            <path d="M 52 37 L 80 37" />
            {/* Handle */}
            <path d="M 60 32 C 60 26, 72 26, 72 32" />
            {/* Big Star on bag */}
            <path d="M 66 41 L 68 45 L 72 45 L 69 48 L 70 52 L 66 49 L 62 52 L 63 48 L 60 45 L 64 45 Z" fill={colors.secondary} stroke="none" />
          </g>
        );
      case 'stop-44': // Nagayama Community Center (Community Hands/Flower)
        return (
          <g stroke={colors.primary} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Community Flower with 5 petals for unity */}
            <circle cx="60" cy="38" r="7" fill={colors.secondary} />
            <circle cx="48" cy="38" r="6" fill={colors.bg} />
            <circle cx="72" cy="38" r="6" fill={colors.bg} />
            <circle cx="60" cy="26" r="6" fill={colors.bg} />
            <circle cx="60" cy="50" r="6" fill={colors.bg} />
            <path d="M 45 52 C 55 46, 65 46, 75 52" strokeWidth="2.5" />
          </g>
        );
      case 'stop-60': // Narematai Community Center (Castle Gate / Ruins)
        return (
          <g stroke={colors.primary} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Traditional Japanese Castle gate */}
            <path d="M 35 52 L 85 52" strokeWidth="3" />
            <rect x="42" y="32" width="36" height="20" fill={colors.bg} />
            <path d="M 38 32 L 82 32" strokeWidth="3" />
            <path d="M 35 28 L 85 28" />
            <path d="M 50 32 L 50 52" />
            <path d="M 70 32 L 70 52" />
            <path d="M 54 40 L 66 40 C 66 40, 64 52, 60 52 C 56 52, 54 40, 54 40 Z" fill={colors.primary} />
          </g>
        );
      case 'stop-66': // Ryugasaki Station - Goal (Glory Victory Bus)
        return (
          <g stroke={colors.primary} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Bus front driving forward */}
            <rect x="40" y="28" width="40" height="26" rx="6" fill={colors.bg} strokeWidth="3" />
            <rect x="45" y="32" width="30" height="10" rx="2" fill={colors.bg} />
            <circle cx="48" cy="48" r="3" fill={colors.primary} />
            <circle cx="72" cy="48" r="3" fill={colors.primary} />
            <path d="M 55 28 L 57 23 L 63 23 L 65 28" />
            <path d="M 35 50 Q 60 55 85 50" strokeWidth="1.5" />
          </g>
        );
      default:
        return (
          <g stroke={colors.primary} strokeWidth="2.5" fill="none">
            <circle cx="60" cy="38" r="10" />
            <line x1="60" y1="20" x2="60" y2="56" />
            <line x1="42" y1="38" x2="78" y2="38" />
          </g>
        );
    }
  };

  // Static/locked layout
  if (!collectedDate) {
    return (
      <div
        className="relative flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-full transition-all duration-300 hover:border-gray-400 select-none animate-fadeIn"
        style={{ width: size, height: size }}
      >
        <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center bg-white shadow-inner">
          <span className="text-lg select-none">🔒</span>
        </div>
        <span className="text-[10px] font-bold text-gray-400 mt-2 text-center px-1.5 truncate max-w-full">
          {busStop.name}
        </span>
      </div>
    );
  }

  // Active / collected layout with stamped animation
  const badgeContent = (
    <svg
      viewBox="0 0 120 120"
      width="100%"
      height="100%"
      className="drop-shadow-md select-none"
      style={{
        filter: 'contrast(1.05) saturate(1.15) drop-shadow(1px 2px 3px rgba(0,0,0,0.15))',
      }}
    >
      {/* Outer borders mimicking real stamp ink bleed */}
      <circle cx="60" cy="60" r="54" fill={colors.bg} stroke={colors.primary} strokeWidth="3" />
      <circle cx="60" cy="60" r="49" fill="none" stroke={colors.primary} strokeWidth="1" strokeDasharray="3, 2" />
      <circle cx="60" cy="60" r="46" fill="none" stroke={colors.primary} strokeWidth="1" />

      {/* Main vector graphic */}
      {renderLandmarkIcon()}

      {/* Bus Stop Name arched or curved or placed clearly */}
      <g>
        {/* Draw a helper path for the text to wrap around the bottom of the stamp */}
        <path id={`stamp-path-${busStop.id}`} d="M 22 84 A 42 42 0 0 0 98 84" fill="none" />
        <text fontSize="8" fontWeight="bold" fill={colors.text} letterSpacing="1">
          <textPath href={`#stamp-path-${busStop.id}`} startOffset="50%" textAnchor="middle">
            {busStop.name}
          </textPath>
        </text>
      </g>

      {/* Collection date at the bottom center of stamp */}
      {dateText && (
        <g>
          <rect x="35" y="93" width="50" height="12" rx="2" fill={colors.bg} stroke={colors.primary} strokeWidth="0.75" />
          <text x="60" y="102" fill={colors.text} fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
            {dateText}
          </text>
        </g>
      )}

      {/* Traditional Seal Text / Kanzo (竜ケ崎) centered or embedded */}
      <text x="60" y="75" fill={colors.primary} fontSize="6" opacity="0.6" fontWeight="bold" textAnchor="middle">
        龍ケ崎市
      </text>

      {/* Subtle ink texture overlay to look authentic */}
      <circle cx="60" cy="60" r="54" fill="none" stroke={colors.primary} strokeWidth="1" opacity="0.1" strokeDasharray="1, 8" />
    </svg>
  );

  if (interactive) {
    return (
      <motion.div
        initial={{ scale: 2.2, rotate: -25, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{
          type: 'spring',
          damping: 12,
          stiffness: 150,
          mass: 1.1,
        }}
        className="relative cursor-pointer select-none"
        style={{ width: size, height: size }}
      >
        {badgeContent}

        {/* Subtle ink splatter particle effect */}
        <motion.div
          initial={{ opacity: 0.8, scale: 0.8 }}
          animate={{ opacity: 0, scale: 1.4 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="absolute inset-0 rounded-full pointer-events-none border-4 border-solid"
          style={{ borderColor: colors.primary }}
        />
      </motion.div>
    );
  }

  return (
    <div className="relative select-none" style={{ width: size, height: size }}>
      {badgeContent}
    </div>
  );
}
