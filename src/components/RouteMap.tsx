/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { BusStop, CollectedStamp, TabType } from '../types';
import { BUS_STOPS } from '../data/busStops';
import StampBadge from './StampBadge';
import { motion } from 'motion/react';
import { 
  Language, 
  UI_TRANSLATIONS, 
  STOP_TRANSLATIONS 
} from '../data/translations';
import { 
  INNER_LOOP_SEQUENCE, 
  OUTER_LOOP_SEQUENCE, 
  SequenceStop 
} from '../data/routeSequences';
import { 
  MapPin, 
  Bus, 
  Info, 
  CheckCircle, 
  Award,
  ChevronRight,
  Sparkles,
  Navigation,
  Globe,
  Compass,
  ArrowRightLeft,
  ArrowRight,
  Star,
  Users
} from 'lucide-react';

interface RouteMapProps {
  collectedStamps: CollectedStamp[];
  selectedStopFromOutside: BusStop | null;
  onClearSelectedStop: () => void;
  onNavigateToTab: (tab: TabType) => void;
  language: Language;
}

export default function RouteMap({
  collectedStamps,
  selectedStopFromOutside,
  onClearSelectedStop,
  onNavigateToTab,
  language,
}: RouteMapProps) {
  const [selectedStopId, setSelectedStopId] = useState<string>('stop-1');
  const [showOuterLoop, setShowOuterLoop] = useState<boolean>(false);

  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.ja;

  // Sync with selected stop from outside (e.g., from StampBook clicks)
  useEffect(() => {
    if (selectedStopFromOutside) {
      setSelectedStopId(selectedStopFromOutside.id);
      onClearSelectedStop();
    }
  }, [selectedStopFromOutside, onClearSelectedStop]);

  const selectedStop = BUS_STOPS.find((s) => s.id === selectedStopId) || BUS_STOPS[0];
  const isCollected = collectedStamps.some((stamp) => stamp.stopId === selectedStop.id);
  const collectedInfo = collectedStamps.find((stamp) => stamp.stopId === selectedStop.id);

  // SVG dimensions
  const viewWidth = 800;
  const viewHeight = 480;

  // Render SVG path representing the loop (ordered physically in a clean circle to prevent self-crossing lines)
  const buildSvgPath = () => {
    const orderedIds = [
      'stop-1',
      'stop-61',
      'stop-55',
      'stop-51',
      'stop-45',
      'stop-41',
      'stop-32',
      'stop-12',
      'stop-17',
      'stop-7'
    ];
    
    const orderedStops = orderedIds
      .map(id => BUS_STOPS.find(s => s.id === id))
      .filter((s): s is BusStop => !!s);
      
    const points = orderedStops.map(stop => `${stop.latOffset},${stop.lngOffset}`);
    return `M ${points.join(' L ')} Z`;
  };

  // Helper to render Name with Furigana/Ruby or custom
  const renderStopName = (stopId: string, defaultName: string) => {
    const trans = STOP_TRANSLATIONS[stopId];
    if (!trans) return defaultName;

    if (language === 'ja-furigana' && trans.nameRuby) {
      return <ruby dangerouslySetInnerHTML={{ __html: trans.nameRuby }} />;
    }
    if (language === 'ja-easy') {
      return trans.nameEasy;
    }
    if (language === 'en') {
      // Simple english fallback or default english name
      return stopId === 'stop-1' ? 'Ryugasaki Station' : trans.name;
    }
    return trans.name;
  };

  // Helper to render general stop description
  const getStopDesc = (stop: BusStop) => {
    const trans = STOP_TRANSLATIONS[stop.id];
    if (!trans) return stop.description;

    if (language === 'ja-easy') return trans.descEasy;
    if (language === 'en') return trans.descEn;
    return trans.desc;
  };

  // Helper to render stop trivia
  const getStopTrivia = (stop: BusStop) => {
    const trans = STOP_TRANSLATIONS[stop.id];
    if (!trans) return stop.trivia;

    if (language === 'ja-easy') return trans.triviaEasy;
    if (language === 'en') return trans.triviaEn;
    return trans.trivia;
  };

  const getDynamicStopLabel = (stopId: string) => {
    if (showOuterLoop) {
      switch (stopId) {
        case 'stop-1': return '1/66';
        case 'stop-7': return '7';
        case 'stop-12': return '12/28';
        case 'stop-17': return '17/23';
        case 'stop-32': return '32';
        case 'stop-41': return '41';
        case 'stop-45': return '45';
        case 'stop-51': return '51';
        case 'stop-55': return '55';
        case 'stop-61': return '61';
        default: return '';
      }
    } else {
      switch (stopId) {
        case 'stop-1': return '1/66';
        case 'stop-7': return '60';
        case 'stop-12': return '39/55';
        case 'stop-17': return '44/50';
        case 'stop-32': return '35';
        case 'stop-41': return '26';
        case 'stop-45': return '22';
        case 'stop-51': return '16';
        case 'stop-55': return '12';
        case 'stop-61': return '6';
        default: return '';
      }
    }
  };

  // Switch sequence based on loop selection
  const activeSequence = showOuterLoop ? OUTER_LOOP_SEQUENCE : INNER_LOOP_SEQUENCE;

  return (
    <div className="space-y-6">
      
      {/* Kids friendly mascot announcement card */}
      <div className="bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 rounded-2xl p-4 text-white shadow-md relative overflow-hidden flex flex-col md:flex-row items-center gap-4 border border-orange-300">
        <div className="absolute top-0 right-0 opacity-10 translate-x-4 -translate-y-4 scale-150 pointer-events-none">
          <Sparkles size={120} />
        </div>
        
        {/* Playful mini mascot and bus illustration */}
        <div className="bg-white/25 rounded-full p-3 shrink-0 flex items-center justify-center border border-white/20">
          <span className="text-3xl">🦁</span>
        </div>
        
        <div className="text-center md:text-left space-y-1">
          <h4 className="text-lg font-black tracking-tight flex items-center justify-center md:justify-start gap-1">
            <span>{language === 'en' ? 'Friendly Route Navigator!' : 'りゅうちゃんバス ルートマップ！'}</span>
            <Star className="w-4 h-4 fill-yellow-300 text-yellow-300 animate-spin" />
          </h4>
          <p className="text-xs text-orange-950 font-bold">
            {language === 'en' 
              ? 'Below, you can view all stops in order. QR stops are RED, other stops are BLACK!' 
              : 'したのリストに、すべてのバスていが じゅんばんにならんでいるよ！はんこ(QR)があるバスていは「あか色」、それ以外は「くろ色」になっているよ！'}
          </p>
        </div>

        {/* Outer Loop Toggle Switch - Bright Orange & Playful */}
        <div className="md:ml-auto shrink-0 flex items-center gap-2 bg-orange-950/20 p-1.5 rounded-xl border border-white/10">
          <button
            onClick={() => setShowOuterLoop(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-black tracking-wider transition-all flex items-center gap-1 ${
              !showOuterLoop 
                ? 'bg-white text-orange-600 shadow-sm' 
                : 'text-white hover:bg-white/10'
            }`}
          >
            🔄 <span dangerouslySetInnerHTML={{ __html: t.innerLoop }} />
          </button>
          <button
            onClick={() => setShowOuterLoop(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-black tracking-wider transition-all flex items-center gap-1 ${
              showOuterLoop 
                ? 'bg-white text-orange-600 shadow-sm' 
                : 'text-white hover:bg-white/10'
            }`}
          >
            🔄 <span dangerouslySetInnerHTML={{ __html: t.outerLoop }} />
          </button>
        </div>
      </div>

      {/* Interactive Map Visual Section */}
      <div className="bg-gradient-to-b from-[#fdfbf7] to-[#f8f4eb] border border-[#e2dcd0] rounded-3xl p-4 md:p-6 shadow-md relative overflow-hidden">
        {/* Sky gradient background overlay */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-orange-100/30 to-transparent pointer-events-none" />

        {/* Outer label for Ryugasaki city representation */}
        <div className="absolute top-4 left-6 flex items-center gap-2">
          <Compass className="w-4 h-4 text-orange-500 animate-pulse" />
          <span className="text-[10px] font-mono text-[#8a816c] font-black tracking-wider">
            RYUGASAKI SYSTEM ROADMAP & DIAGRAM
          </span>
        </div>

        {/* Interactive SVG Canvas */}
        <div className="w-full overflow-x-auto select-none touch-pan-x">
          <div className="min-w-[760px] max-w-full mx-auto relative">
            <svg
              viewBox={`0 0 ${viewWidth} ${viewHeight}`}
              className="w-full h-auto drop-shadow-sm"
              style={{ maxHeight: '420px' }}
            >
              {/* Outer Grid lines for fun blueprint feel */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(217, 119, 6, 0.04)" strokeWidth="1" />
                </pattern>
                <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.15" />
                </filter>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" rx="24" opacity="0.9" />

              {/* Decorative City Center label */}
              <g transform="translate(400, 240)" opacity="0.12">
                <circle r="70" fill="none" stroke="#ea580c" strokeWidth="1" strokeDasharray="5,5" />
                <text textAnchor="middle" y="5" className="font-sans font-black text-sm" fill="#ea580c" letterSpacing="4">
                  龍ケ崎市中心エリア
                </text>
              </g>

              {/* Connecting Bus Route Path */}
              <g>
                {/* Underlay glow path - Warm Orange glow */}
                <path
                  d={buildSvgPath()}
                  fill="none"
                  stroke="#ea580c"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.12"
                />
                {/* Main solid path */}
                <path
                  d={buildSvgPath()}
                  fill="none"
                  stroke="#ea580c"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="12, 6"
                  className={showOuterLoop ? 'animate-dash-reverse' : 'animate-dash'}
                />
              </g>

              {/* Interactive Bus Icon on Selected Route Stop */}
              {selectedStop && (
                <g transform={`translate(${selectedStop.latOffset}, ${selectedStop.lngOffset - 24})`}>
                  <motion.g
                    initial={{ scale: 0.5, y: -20, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 220 }}
                  >
                    {/* Speech bubble pointer */}
                    <path d="M -8 -8 L 0 0 L 8 -8 Z" fill="#ea580c" />
                    {/* Cute Bus Icon Carrier with bright orange theme */}
                    <rect x="-18" y="-32" width="36" height="24" rx="5" fill="#ea580c" filter="url(#shadow)" />
                    <rect x="-14" y="-28" width="28" height="11" rx="1.5" fill="#fff" />
                    {/* Tiny bus wheels */}
                    <circle cx="-9" cy="-8" r="3.5" fill="#1e293b" />
                    <circle cx="9" cy="-8" r="3.5" fill="#1e293b" />
                    {/* Cute headlights */}
                    <circle cx="-13" cy="-14" r="2" fill="#fbbf24" />
                    <circle cx="13" cy="-14" r="2" fill="#fbbf24" />
                    {/* Smiling bus mouth */}
                    <path d="M -3 -15 Q 0 -12 3 -15" stroke="#1e293b" strokeWidth="1.5" fill="none" />
                  </motion.g>
                </g>
              )}

              {/* Bus Stops Points */}
              {BUS_STOPS.map((stop) => {
                const isStopCollected = collectedStamps.some((stamp) => stamp.stopId === stop.id);
                const isStopActive = stop.id === selectedStopId;

                return (
                  <g
                    key={stop.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedStopId(stop.id)}
                  >
                    {/* Ring indicator for active selection - Red Pulsing Circle */}
                    {isStopActive && (
                      <circle
                        cx={stop.latOffset}
                        cy={stop.lngOffset}
                        r="24"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="3"
                        strokeDasharray="4,3"
                        className="animate-spin"
                        style={{ transformOrigin: `${stop.latOffset}px ${stop.lngOffset}px`, animationDuration: '6s' }}
                      />
                    )}

                    {/* Glow behind collected stop - Orange/Emerald glow */}
                    {isStopCollected && (
                      <circle
                        cx={stop.latOffset}
                        cy={stop.lngOffset}
                        r="18"
                        fill="#ea580c"
                        opacity="0.18"
                      />
                    )}

                    {/* Main Circle Pin - highlighted red if active or QR stop */}
                    <circle
                      cx={stop.latOffset}
                      cy={stop.lngOffset}
                      r="13"
                      className="transition-all duration-300"
                      fill={isStopActive ? '#ef4444' : isStopCollected ? '#ea580c' : '#ffffff'}
                      stroke={isStopActive ? '#b91c1c' : isStopCollected ? '#ea580c' : '#8a816c'}
                      strokeWidth="2.5"
                    />

                    {/* Checkmark icon for collected stop */}
                    {isStopCollected && !isStopActive ? (
                      <g transform={`translate(${stop.latOffset - 6}, ${stop.lngOffset - 6})`}>
                        <path
                          d="M2 6 L4.5 8.5 L9.5 3"
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </g>
                    ) : (
                      /* Stop Number Text inside circle */
                      <text
                        x={stop.latOffset}
                        y={stop.lngOffset + 4}
                        textAnchor="middle"
                        fontSize="9.5"
                        fontWeight="black"
                        fontFamily="monospace"
                        className="transition-colors duration-300"
                        fill={isStopActive ? '#ffffff' : isStopCollected ? '#ffffff' : '#5c4033'}
                      >
                        {getDynamicStopLabel(stop.id).includes('/') ? getDynamicStopLabel(stop.id).split('/')[0] : getDynamicStopLabel(stop.id)}
                      </text>
                    )}

                    {/* Hover text label below the bus stop point */}
                    <text
                      x={stop.latOffset}
                      y={stop.lngOffset + 26}
                      textAnchor="middle"
                      fontSize="9.5"
                      fontWeight={isStopActive ? 'black' : 'bold'}
                      className="pointer-events-none font-sans"
                      fill={isStopActive ? '#ef4444' : '#5c4033'}
                    >
                      {stop.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Selected Bus Stop Detail Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 relative overflow-hidden">
        {/* Vertical strip with warm orange color */}
        <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-orange-500" />

        {/* Visual Stamp Badge display */}
        <div className="flex flex-col items-center justify-center shrink-0 bg-orange-50/50 border border-orange-100 p-4 rounded-xl min-w-[130px]">
          {isCollected ? (
            <StampBadge busStop={selectedStop} collectedDate={collectedInfo?.collectedAt} size={90} interactive={false} />
          ) : (
            <div className="w-[90px] h-[90px] rounded-full border-2 border-dashed border-orange-300 flex flex-col items-center justify-center text-orange-400 select-none bg-white">
              <span className="text-xl font-mono font-black">#{getDynamicStopLabel(selectedStop.id)}</span>
              <span className="text-[9px] mt-1 font-bold">{language === 'en' ? 'Locked' : 'まだあいてないよ'}</span>
            </div>
          )}
          <span className="text-[10px] font-black mt-2.5 px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
            {language === 'en' ? `Stop #${getDynamicStopLabel(selectedStop.id)}` : `バス停 #${getDynamicStopLabel(selectedStop.id)}`}
          </span>
        </div>

        {/* Detailed Info */}
        <div className="flex-1 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xl font-black text-gray-800">
                  {renderStopName(selectedStop.id, selectedStop.name)}
                </h4>
                {isCollected && (
                  <span className="inline-flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100 font-bold">
                    <CheckCircle className="w-3 h-3 fill-orange-500 text-white" />
                    {language === 'en' ? 'Collected' : 'あつめたよ！'}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5 font-bold">
                {language === 'en' ? 'Ryugasaki Community Bus Route' : '龍ケ崎市コミュニティバス 循環ルート'}
              </p>
            </div>
            
            {!isCollected && (
              <button
                onClick={() => onNavigateToTab('scan')}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black rounded-xl transition-all shadow-md shrink-0 active:scale-95"
              >
                {t.scanQrBtn}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Description */}
            <div className="space-y-1.5">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest block flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-orange-500" />
                {t.descriptionTitle}
              </span>
              <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100 min-h-[70px]">
                {getStopDesc(selectedStop)}
              </p>
            </div>

            {/* Local Trivia */}
            <div className="space-y-1.5">
              <span className="text-xs font-black text-orange-600 uppercase tracking-widest block flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                {t.triviaTitle}
              </span>
              <p className="text-sm text-orange-950 leading-relaxed bg-orange-50/40 p-3 rounded-xl border border-orange-100/30 min-h-[70px]">
                {getStopTrivia(selectedStop)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --- ALL STOPS SEQUENTIAL TIMELINE LIST --- */}
      {/* "QRコードを設置するバス停の色だけ赤にして それ以外は黒にして(このページはわかりやすく 見やすくしてほしいです)" */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="space-y-1">
            <h4 className="font-black text-base text-gray-800 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-orange-500" />
              <span className="flex items-center gap-1">
                <span dangerouslySetInnerHTML={{ __html: showOuterLoop ? t.outerLoop : t.innerLoop }} />
                <span> {language === 'en' ? 'Full Sequence' : '全バス停じゅんばんリスト'}</span>
              </span>
            </h4>
            <p className="text-xs text-gray-400 font-bold">
              {language === 'en' 
                ? '🔴 RED indicates a Stamp QR Code spot, other stops are BLACK.'
                : '🔴 あか色マークのバス停には QRコード があります。黒マークには ありません。'}
            </p>
          </div>
          
          <div className="flex gap-2 text-xs">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 text-red-600 border border-red-100 font-black">
              🔴 {t.qrIncluded} ({BUS_STOPS.length}箇所)
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-50 text-gray-600 border border-gray-100 font-black">
              ⚫ {t.noQr}
            </span>
          </div>
        </div>

        {/* Scrollable Horizontal or Vertical Timeline layout - beautifully clean & clear */}
        <div className="relative pt-2 pb-4">
          {/* Timeline background vertical pipe */}
          <div className="absolute left-6 top-6 bottom-6 w-1 bg-gray-200 rounded-full" />

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
            {activeSequence.map((seqStop, index) => {
              const matchedStop = seqStop.qrStopId ? BUS_STOPS.find(s => s.id === seqStop.qrStopId) : null;
              const isSeqCollected = seqStop.qrStopId ? collectedStamps.some(s => s.stopId === seqStop.qrStopId) : false;
              
              return (
                <div 
                  key={`${seqStop.name}-${index}`} 
                  onClick={() => {
                    if (seqStop.qrStopId) {
                      setSelectedStopId(seqStop.qrStopId);
                    }
                  }}
                  className={`flex items-start gap-4 p-3 rounded-2xl transition-all relative group ${
                    seqStop.hasQR ? 'cursor-pointer hover:bg-red-50/50' : 'cursor-default'
                  }`}
                >
                  {/* Outer line decorator overlay */}
                  <div className="relative z-10 shrink-0 mt-0.5">
                    {seqStop.hasQR ? (
                      /* RED dot for QR code spots */
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border-4 ${
                        isSeqCollected 
                          ? 'bg-orange-500 border-orange-100 animate-pulse' 
                          : 'bg-red-600 border-red-100'
                      } shadow-sm`}>
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      </div>
                    ) : (
                      /* BLACK dot for regular spots */
                      <div className="w-5 h-5 rounded-full flex items-center justify-center border-4 bg-gray-800 border-gray-100 shadow-sm">
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      </div>
                    )}
                  </div>

                  {/* Content details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {/* Name - RED color if QR, BLACK if standard */}
                      <span className={`text-sm font-black tracking-tight flex items-center ${
                        seqStop.hasQR ? 'text-red-600 font-extrabold' : 'text-gray-900'
                      }`}>
                        {seqStop.hasQR && seqStop.label && (
                          <span className="mr-2 inline-flex items-center justify-center min-w-[1.8rem] h-6 px-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-mono font-black shrink-0">
                            {seqStop.label}
                          </span>
                        )}
                        <span>
                          {seqStop.qrStopId 
                            ? renderStopName(seqStop.qrStopId, seqStop.name)
                            : seqStop.name
                          }
                        </span>
                      </span>

                      {/* Display stamp ID or standard indicator */}
                      {seqStop.hasQR && (
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-mono font-black bg-red-50 text-red-600 border border-red-100 uppercase tracking-widest shrink-0">
                          QR
                        </span>
                      )}

                      {/* Green check if collected */}
                      {isSeqCollected && (
                        <span className="inline-flex items-center text-[10px] text-orange-600 font-black gap-0.5 bg-orange-50 px-1.5 py-0.2 rounded-md">
                          ✓ {language === 'en' ? 'OK' : 'ゲット'}
                        </span>
                      )}
                    </div>

                    {/* Short hint message for QR stops */}
                    {seqStop.hasQR && matchedStop && (
                      <p className="text-[10px] text-gray-400 font-bold truncate mt-0.5">
                        {language === 'en' ? matchedStop.description : matchedStop.description}
                      </p>
                    )}
                  </div>

                  {/* Arrow for loop connections */}
                  {index < activeSequence.length - 1 && (
                    <div className="absolute left-6 bottom-0 translate-y-2 pointer-events-none text-gray-300">
                      <ArrowRight className="w-3 h-3 rotate-90" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Start-End Terminal notification */}
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-center text-xs text-gray-500 font-bold flex items-center justify-center gap-1.5">
          <Bus className="w-4 h-4 text-orange-500 animate-bounce" />
          <span>
            {language === 'en' 
              ? 'Enjoy touring the historical town of Ryugasaki via community bus!' 
              : 'コミュニティバスにのって、龍ケ崎のまちを たのしくめぐりましょう！'}
          </span>
        </div>
      </div>

    </div>
  );
}
