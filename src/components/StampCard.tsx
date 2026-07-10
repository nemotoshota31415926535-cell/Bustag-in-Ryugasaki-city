/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { BusStop, CollectedStamp, TabType } from '../types';
import { BUS_STOPS } from '../data/busStops';
import StampBadge from './StampBadge';
import { 
  Language, 
  UI_TRANSLATIONS, 
  STOP_TRANSLATIONS 
} from '../data/translations';
import { 
  CheckCircle, 
  MapPin, 
  Calendar, 
  Smartphone, 
  Sparkles, 
  X, 
  ChevronRight, 
  Award,
  Bus,
  Clock,
  ExternalLink,
  Star
} from 'lucide-react';

interface StampCardProps {
  collectedStamps: CollectedStamp[];
  onSelectStop: (stop: BusStop) => void;
  onNavigateToTab: (tab: TabType) => void;
  language: Language;
}

export default function StampCard({
  collectedStamps,
  onSelectStop,
  onNavigateToTab,
  language,
}: StampCardProps) {
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);

  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.ja;

  const getCollectedStamp = (stopId: string) => {
    return collectedStamps.find((s) => s.stopId === stopId);
  };

  const selectedStop = BUS_STOPS.find((s) => s.id === selectedStopId);
  const selectedStamp = selectedStop ? getCollectedStamp(selectedStop.id) : undefined;

  const totalCollected = collectedStamps.length;
  const isComplete = totalCollected === BUS_STOPS.length;

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

  return (
    <div className="space-y-6">
      {/* Playful Orange Dashboard Header Card */}
      <div className="bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
        {/* Background Decorative Bus Vector Grid */}
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-10 translate-y-10 scale-150 pointer-events-none">
          <Bus size={200} />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-orange-50 uppercase tracking-wider backdrop-blur-sm">
              <Bus className="w-3.5 h-3.5 animate-bounce" />
              {t.title}
            </span>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
              {t.subtitle}
            </h2>
            <p className="text-orange-950/80 text-xs md:text-sm font-bold max-w-xl">
              {language === 'en' 
                ? `Scan QR codes at ${BUS_STOPS.length} community bus stops to collect stamps! Get certificates and exclusive keychains upon full completion!` 
                : `${BUS_STOPS.length}かしょの コミュニティバスていにある QRコードをスキャンして、スタンプを あつめよう！ぜんぶ あつまると 認定証や キーホルダーが もらえるよ！`}
            </p>
          </div>

          <div className="flex flex-col items-center bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 min-w-[160px] self-start md:self-center shadow-inner">
            <span className="text-xs font-black text-orange-950 tracking-widest uppercase">
              {t.collected}
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-4xl font-extrabold text-white font-mono">
                {totalCollected}
              </span>
              <span className="text-orange-200 text-sm font-black">
                / {BUS_STOPS.length}
              </span>
            </div>
            <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden mt-3 p-0.5">
              <div 
                className="bg-white h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${(totalCollected / BUS_STOPS.length) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-orange-100 font-bold mt-2">
              {isComplete 
                ? '🎉 完全制覇！特典へGO！' 
                : language === 'en'
                  ? `Need ${BUS_STOPS.length - totalCollected} more`
                  : `あと ${BUS_STOPS.length - totalCollected} つであつまるよ！`
              }
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Stamps Layout (Nostalgic Paper feel) */}
      <div className="bg-[#fcfbf7] border border-orange-200/50 rounded-3xl p-6 shadow-md relative overflow-hidden">
        {/* Kids cartoon elements */}
        <div className="absolute top-4 left-4 flex items-center gap-2 text-xs font-mono text-[#a19985] font-semibold border-b border-[#e8e4d8] pb-1">
          <Star className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
          <span>RYUGASAKI BUS STAMP CARD</span>
        </div>

        <div className="absolute top-4 right-4 text-xs font-mono text-[#a19985] font-semibold flex items-center gap-1">
          <span>VOL. 01</span>
          <span className="text-sm">🐰</span>
        </div>

        {/* The Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 pt-10 pb-4 justify-items-center">
          {BUS_STOPS.map((stop) => {
            const stamp = getCollectedStamp(stop.id);
            return (
              <div
                key={stop.id}
                onClick={() => setSelectedStopId(stop.id)}
                className="flex flex-col items-center space-y-2 group cursor-pointer transition-transform duration-200 hover:scale-105"
              >
                <div className="relative">
                  {stamp ? (
                    <StampBadge busStop={stop} collectedDate={stamp.collectedAt} size={110} />
                  ) : (
                    <StampBadge busStop={stop} size={110} />
                  )}
                  {stamp && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white shadow-md border-2 border-white animate-pulse">
                      <CheckCircle className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-xs md:text-sm font-bold text-gray-800 line-clamp-1 group-hover:text-orange-600 transition-colors mt-1">
                    {renderStopName(stop.id, stop.name)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick action helper bar */}
        <div className="mt-6 pt-6 border-t border-[#e8e4d8] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-xs text-[#8a816c] font-medium leading-relaxed">
            <Clock className="w-4 h-4 text-orange-500 shrink-0 animate-spin" style={{ animationDuration: '8s' }} />
            <span>{t.howToCollect}</span>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => onNavigateToTab('scan')}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              {t.scanQrBtn}
            </button>
            <button
              onClick={() => onNavigateToTab('map')}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-[#fcfbf7] text-[#8a816c] border border-[#e8e4d8] font-bold text-xs rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-orange-500" />
              {t.viewMapBtn}
            </button>
          </div>
        </div>
      </div>

      {/* Stop Detail Drawer / Modal (Overlay) */}
      {selectedStopId && selectedStop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 flex flex-col relative animate-scaleUp">
            {/* Header Banner colored based on themeColor */}
            <div className="p-6 text-white bg-gradient-to-r from-orange-500 to-amber-500 relative">
              <button
                onClick={() => setSelectedStopId(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 text-xs font-mono bg-white/25 text-white font-bold tracking-widest px-2.5 py-1 rounded-full w-fit mb-3">
                <span>{language === 'en' ? 'Bus Stop' : 'コミュニティバス停留所'}</span>
              </div>

              <h3 className="text-2xl font-black tracking-tight">
                {renderStopName(selectedStop.id, selectedStop.name)}
              </h3>
              <p className="text-white/80 text-xs mt-1 flex items-center gap-1.5 font-bold">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                {language === 'en' ? 'Ryugasaki, Ibaraki' : '茨城県龍ケ崎市'}
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
              {/* Stamp Status Header */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 shrink-0 bg-white rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden shadow-inner">
                    {selectedStamp ? (
                      <StampBadge busStop={selectedStop} collectedDate={selectedStamp.collectedAt} size={60} interactive={false} />
                    ) : (
                      <div className="w-12 h-12 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-sm">
                        🔒
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-gray-800 text-sm">スタンプ獲得状況</h4>
                    {selectedStamp ? (
                      <span className="inline-flex items-center gap-1 text-xs text-orange-600 font-bold mt-0.5">
                        <CheckCircle className="w-3.5 h-3.5 shrink-0 fill-orange-500 text-white" />
                        {language === 'en' ? 'Collected!' : 'あつめたよ！'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500 font-bold mt-0.5">
                        {language === 'en' ? 'Locked (Scan QR)' : 'まだあいてないよ'}
                      </span>
                    )}
                  </div>
                </div>

                {!selectedStamp && (
                  <button
                    onClick={() => {
                      setSelectedStopId(null);
                      onNavigateToTab('scan');
                    }}
                    className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                  >
                    {language === 'en' ? 'Scan' : 'スキャン'}
                  </button>
                )}
              </div>

              {/* Stop description */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-orange-500" />
                  {t.descriptionTitle}
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                  {getStopDesc(selectedStop)}
                </p>
              </div>

              {/* Local Trivia / Sightseeing (The "Craft" part!) */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-orange-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                  {t.triviaTitle}
                </h4>
                <div className="bg-orange-50/30 p-4 rounded-2xl border border-orange-100/30 relative overflow-hidden">
                  <div className="absolute right-2 bottom-2 text-orange-600/10 scale-125 select-none font-bold text-4xl">
                    💡
                  </div>
                  <p className="text-sm text-orange-950 leading-relaxed relative z-10 font-medium">
                    {getStopTrivia(selectedStop)}
                  </p>
                </div>
              </div>

              {/* Collection details if available */}
              {selectedStamp && (
                <div className="text-xs text-gray-400 font-mono flex flex-col gap-1 border-t pt-4">
                  <div className="flex justify-between">
                    <span>獲得日時:</span>
                    <span className="text-gray-600 font-medium">{new Date(selectedStamp.collectedAt).toLocaleString('ja-JP')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>収集方法:</span>
                    <span className="text-gray-600 font-medium">
                      {selectedStamp.method === 'camera' ? '📷 実地QRスキャン' : '💻 テストシミュレーション'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 p-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => {
                  onSelectStop(selectedStop);
                  setSelectedStopId(null);
                  onNavigateToTab('map');
                }}
                className="flex-1 py-2.5 px-4 bg-white hover:bg-gray-100 text-gray-700 font-bold text-xs rounded-xl border border-gray-200 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-orange-500" />
                {t.viewOnMap}
              </button>
              <button
                onClick={() => setSelectedStopId(null)}
                className="flex-1 py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-98 cursor-pointer"
              >
                {t.backToStamps}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
