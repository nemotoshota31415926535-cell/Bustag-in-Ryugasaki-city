/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { CollectedStamp } from '../types';
import { BUS_STOPS } from '../data/busStops';
import { 
  Language, 
  UI_TRANSLATIONS 
} from '../data/translations';
import { 
  Award, 
  CheckCircle, 
  Gift, 
  MapPin, 
  Share2, 
  Sparkles, 
  User, 
  Calendar,
  Lock,
  ChevronRight,
  Bookmark,
  Printer,
  Compass,
  Star
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PrizeClaimProps {
  collectedStamps: CollectedStamp[];
  onNavigateToTab: (tab: 'stamps' | 'map' | 'scan' | 'prizes') => void;
  language: Language;
}

export default function PrizeClaim({
  collectedStamps,
  onNavigateToTab,
  language,
}: PrizeClaimProps) {
  const [participantName, setParticipantName] = useState('龍ケ崎 太郎');
  const [isRedeemed, setIsRedeemed] = useState(false);
  const [certId, setCertId] = useState('');

  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.ja;

  const totalStamps = BUS_STOPS.length;
  const collectedCount = collectedStamps.length;
  
  const isHalfComplete = collectedCount >= 5;
  const isFullyComplete = collectedCount === totalStamps;

  // Generate a persistent random Certificate ID
  useEffect(() => {
    const randomHex = Math.floor(Math.random() * 16777215).toString(16).toUpperCase().padStart(6, '0');
    const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    setCertId(`RYU-STAMP-${dateCode}-${randomHex}`);
  }, []);

  // Trigger continuous confetti explosion on full completion entrance
  useEffect(() => {
    if (isFullyComplete) {
      const duration = 2.5 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#ea580c', '#fbbf24', '#f59e0b', '#3b82f6', '#10b981']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#ea580c', '#fbbf24', '#f59e0b', '#3b82f6', '#10b981']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      
      frame();
    }
  }, [isFullyComplete]);

  const handlePrintCertificate = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const formattedDate = new Date().toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const certTitleText = t.certTitle || '完 走 認 定 証';

    printWindow.document.write(`
      <html>
        <head>
          <title>完走認定証 - ${participantName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@700&family=Noto+Sans+JP:wght@400;700&display=swap');
            body {
              margin: 0;
              padding: 40px;
              font-family: 'Noto Sans JP', sans-serif;
              background-color: #ffffff;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              box-sizing: border-box;
            }
            .cert-border {
              width: 100%;
              max-width: 800px;
              height: 550px;
              border: 20px double #ea580c;
              background-color: #fffaf0;
              border-radius: 12px;
              box-sizing: border-box;
              padding: 40px;
              text-align: center;
              position: relative;
              box-shadow: 0 4px 25px rgba(234, 88, 12, 0.12);
            }
            .cert-title {
              font-family: 'Noto Serif JP', serif;
              font-size: 38px;
              color: #7c2d12;
              margin: 0 0 10px 0;
              letter-spacing: 4px;
            }
            .cert-subtitle {
              font-size: 16px;
              color: #ea580c;
              letter-spacing: 8px;
              text-transform: uppercase;
              margin-bottom: 30px;
            }
            .recipient {
              font-size: 24px;
              font-weight: bold;
              border-bottom: 2px solid #7c2d12;
              display: inline-block;
              padding: 0 30px 5px 30px;
              margin-bottom: 25px;
              color: #1e293b;
            }
            .body-text {
              font-size: 16px;
              line-height: 2;
              color: #334155;
              max-width: 600px;
              margin: 0 auto 30px auto;
              text-align: justify;
            }
            .date-text {
              font-size: 14px;
              color: #64748b;
              margin-top: 10px;
            }
            .issuer {
              font-size: 16px;
              font-weight: bold;
              color: #475569;
              margin-top: 15px;
            }
            .cert-id {
              position: absolute;
              bottom: 20px;
              left: 30px;
              font-family: monospace;
              font-size: 10px;
              color: #cbd5e1;
            }
            .seal {
              position: absolute;
              bottom: 40px;
              right: 60px;
              width: 90px;
              height: 90px;
              border: 3px double #dc2626;
              border-radius: 50px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #dc2626;
              font-weight: 900;
              font-size: 15px;
              transform: rotate(-10deg);
              background: rgba(220, 38, 38, 0.02);
            }
          </style>
        </head>
        <body>
          <div class="cert-border">
            <h1 class="cert-title">${certTitleText}</h1>
            <div class="cert-subtitle">Ryugasaki Stamp Rally Master</div>
            
            <div class="recipient">${participantName} 殿</div>
            
            <p class="body-text">
              あなたは、龍ケ崎市のコミュニティバス停留所を巡るデジタルスタンプラリーにおいて、
              厳しく困難な全\${totalStamps}箇所の停留所スタンプを無事にすべて収集されました。
              ここにその並外れた地域探究心と完走の偉業を讃え、
              「龍ケ崎スタンプラリーマスター」として認定します。
            </p>
            
            <div class="issuer">龍ケ崎市コミュニティバススタンプラリー運営委員会</div>
            <div class="date-text">授与日: ${formattedDate}</div>
            
            <div class="cert-id">${certId}</div>
            <div class="seal">
              <div style="border: 1px solid #dc2626; border-radius: 50px; padding: 10px; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; text-align: center; line-height: 1.2;">
                龍ケ崎<br>事務局
              </div>
            </div>
          </div>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      {/* Overview Statistics Progress Card */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        {/* Kids friendly sunny background decoration */}
        <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-orange-100/40 rounded-full blur-2xl pointer-events-none" />

        <div className="space-y-2 text-center md:text-left">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
            <Gift className="w-3.5 h-3.5 text-orange-600 animate-bounce" />
            {language === 'en' ? 'Stamp Rally Rewards Corner' : 'スタンプラリー景品こうかんじょ'}
          </span>
          <h3 className="text-xl font-black text-gray-800">
            {language === 'en' ? 'Your Stamp Progress' : 'あつめた スタンプの かず'}
          </h3>
          <p className="text-xs text-gray-500 max-w-sm">
            {language === 'en' 
              ? 'Collect stamps to unlock intermediate and final grand rewards!' 
              : 'スタンプをたくさんあつめると、すてきなプレゼントがもらえるよ！'}
          </p>
        </div>

        <div className="flex flex-col items-center gap-2 relative z-10">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-orange-600 font-mono">{collectedCount}</span>
            <span className="text-gray-400 text-xs font-bold">/ {totalStamps} {language === 'en' ? 'Stamps' : '個'}</span>
          </div>
          <div className="w-48 bg-gray-100 h-3 rounded-full overflow-hidden border border-gray-200/60 p-0.5">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${
                isFullyComplete ? 'bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 animate-pulse' : 'bg-orange-500'
              }`}
              style={{ width: `${(collectedCount / totalStamps) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grid of milestones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Milestone 1: Sapla Award (6 stamps) */}
        <div className={`bg-white border rounded-3xl p-6 shadow-sm relative overflow-hidden transition-all duration-300 ${
          isHalfComplete ? 'border-orange-300 bg-orange-50/10' : 'border-gray-200 opacity-80'
        }`}>
          {isHalfComplete && (
            <div className="absolute right-0 top-0 bg-orange-500 text-white font-extrabold text-[10px] uppercase tracking-wider py-1 px-4 rounded-bl-xl shadow-sm">
              {t.unlocked}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className={`p-2.5 rounded-xl inline-block ${
                isHalfComplete ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-400'
              }`}>
                <Bookmark className="w-5 h-5" />
              </span>
              <div>
                <h4 className="font-extrabold text-sm text-gray-800">
                  {language === 'en' ? 'Sapla Special Ribbon Award' : 'サプラ特別ラリー賞'}
                </h4>
                <p className="text-[10px] text-gray-400">
                  {language === 'en' ? 'Collect 5 stamps to unlock' : 'スタンプ 5個 獲得で達成'}
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed min-h-[50px]">
              {language === 'en'
                ? 'Get a special community bus badge/sticker claimable at the Ryugasaki City Hall planning desk.'
                : '龍ケ崎市最大の商業施設「サプラ」などで利用できる、コミュニティバスを応援する特別ノベルティ（オリジナルシール等）の引き換え権利が獲得できます。'}
            </p>

            {isHalfComplete ? (
              <div className="bg-orange-50 border border-orange-100 p-3.5 rounded-xl space-y-2 text-xs">
                <span className="font-bold text-orange-950 block flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-orange-500" />
                  {language === 'en' ? 'Reward Unlock Available!' : '特典引き換え可能'}
                </span>
                <p className="text-orange-800 font-medium">
                  {language === 'en' ? 'Claim spot: City Hall 3F Desk' : '引き換え場所: 龍ケ崎市役所 都市計画課 窓口'}
                </p>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-100 p-3.5 rounded-xl text-xs text-gray-500 flex items-center gap-1.5 font-medium">
                <Lock className="w-4 h-4 text-gray-400" />
                <span>{t.remainingToUnlock(5 - collectedCount)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Milestone 2: Complete Grand Prix (10 stamps) */}
        <div className={`bg-white border rounded-3xl p-6 shadow-sm relative overflow-hidden transition-all duration-300 ${
          isFullyComplete ? 'border-orange-300 bg-orange-50/10' : 'border-gray-200 opacity-80'
        }`}>
          {isFullyComplete && (
            <div className="absolute right-0 top-0 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold text-[10px] uppercase tracking-wider py-1 px-4 rounded-bl-xl shadow-sm">
              🏆 {language === 'en' ? 'Fully Completed!' : '完全制覇！'}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className={`p-2.5 rounded-xl inline-block ${
                isFullyComplete ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-400'
              }`}>
                <Award className="w-5 h-5" />
              </span>
              <div>
                <h4 className="font-extrabold text-sm text-gray-800">
                  {language === 'en' ? 'Ryugasaki Master Award' : '全線完全走破グランド賞'}
                </h4>
                <p className="text-[10px] text-gray-400">
                  {language === 'en' ? `Collect all ${totalStamps} stamps to unlock` : `スタンプ ${totalStamps}個 全て獲得で達成`}
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed min-h-[50px]">
              {language === 'en'
                ? 'Get a beautiful custom community bus acrylic keychain and a grand printable master completion certificate!'
                : `コミュニティバス停留所の計\${totalStamps}箇所すべてを完全走破した記念品として、「オリジナルコミュニティバスキーホルダー」と「豪華完走認定証」が贈呈されます！`}
            </p>

            {isFullyComplete ? (
              <div className="bg-orange-50 border border-orange-100 p-3.5 rounded-xl space-y-2 text-xs">
                <span className="font-bold text-orange-950 block flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-orange-600 animate-spin" />
                  {language === 'en' ? 'All Rewards Unlocked!' : '完全制覇特典 解放！'}
                </span>
                <p className="text-orange-800 font-medium">
                  {language === 'en' ? 'Claim spot: Ryugasaki Station Ticket window' : '引き換え場所: 関東鉄道 竜ヶ崎駅 切符窓口'}
                </p>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-100 p-3.5 rounded-xl text-xs text-gray-500 flex items-center gap-1.5 font-medium">
                <Lock className="w-4 h-4 text-gray-400" />
                <span>{t.remainingToUnlock(totalStamps - collectedCount)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Completion Certificate Generating Section */}
      {isFullyComplete ? (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-3xl p-6 md:p-8 space-y-8 shadow-sm relative overflow-hidden">
          {/* Decorative floating cute star */}
          <div className="absolute top-4 right-4 text-orange-400/30 text-3xl animate-bounce">
            🚌
          </div>

          <div className="text-center space-y-2 max-w-lg mx-auto">
            <div className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
              <Award className="w-6 h-6 stroke-[2]" />
            </div>
            <h4 className="text-2xl font-black text-gray-800 font-sans tracking-tight">
              {t.congratsTitle}
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              {t.congratsDesc}
            </p>
          </div>

          {/* Certificate Editor and Preview */}
          <div className="bg-[#fdfbf6] border-4 border-double border-orange-400 rounded-2xl p-6 md:p-10 relative text-center max-w-2xl mx-auto space-y-6 shadow-lg">
            {/* Stamp logo on Certificate top */}
            <div className="w-16 h-16 rounded-full border border-orange-400 mx-auto flex items-center justify-center text-orange-500 bg-orange-50/50">
              <Compass className="w-8 h-8 animate-spin" style={{ animationDuration: '20s' }} />
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-bold text-orange-950 tracking-widest font-serif">
                {t.certTitle}
              </h1>
              <p className="text-[10px] text-orange-600 font-bold tracking-widest uppercase">
                Ryugasaki Stamp Rally Master
              </p>
            </div>

            {/* Live editor input */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 max-w-sm mx-auto relative z-20">
              <div className="flex items-center bg-white border border-orange-200 px-3 py-1.5 rounded-xl w-full">
                <User className="w-4 h-4 text-orange-500 shrink-0 mr-2" />
                <input
                  type="text"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  placeholder={language === 'en' ? 'Enter name' : 'お名前を入力してね'}
                  className="bg-transparent text-sm font-bold text-gray-800 w-full outline-none"
                  maxLength={16}
                />
              </div>
              <button
                onClick={handlePrintCertificate}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md transition-all shrink-0 active:scale-95 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                {t.printBtn}
              </button>
            </div>

            <p className="text-xs text-orange-950 leading-relaxed max-w-md mx-auto text-justify pt-4 font-semibold">
              {language === 'en' 
                ? `Certified as Ryugasaki Community Bus Master for completing all ${totalStamps} stamp rally locations successfully!`
                : `殿 あなたは、龍ケ崎市のコミュニティバス停留所を巡るデジタルスタンプラリーにおいて、全${totalStamps}箇所の停留所スタンプをすべて収集されました。ここに完走の偉業を讃え、「龍ケ崎スタンプラリーマスター」として認定します。`
              }
            </p>

            <div className="text-[10px] text-gray-400 font-medium">
              龍ケ崎市コミュニティバススタンプラリー運営委員会
            </div>

            <div className="absolute bottom-4 left-6 text-[8px] font-mono text-gray-300">
              {certId}
            </div>

            {/* Seal mockup */}
            <div className="absolute right-6 bottom-4 w-16 h-16 rounded-full border-2 border-double border-red-500 flex items-center justify-center text-red-500 font-bold text-[8px] rotate-[-12deg] select-none opacity-80 pointer-events-none">
              <div className="text-center font-bold">
                龍ケ崎<br />事務局
              </div>
            </div>
          </div>

          {/* Simulated Physical claim ticket */}
          <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-6 max-w-md mx-auto space-y-5 shadow-sm relative overflow-hidden">
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gradient-to-r from-orange-50 to-amber-50 border-r border-gray-200" />
            <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gradient-to-l from-orange-50 to-amber-50 border-l border-gray-200" />

            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h5 className="font-extrabold text-sm text-gray-800">
                  {language === 'en' ? 'Grand Prize Claim Ticket' : `${totalStamps}箇所完全走破 景品引換券`}
                </h5>
                <p className="text-[10px] text-gray-400">
                  {language === 'en' ? 'Show this at Kanto Railway Ryugasaki Station window.' : '関東鉄道 竜ヶ崎駅 窓口で提示してください'}
                </p>
              </div>
              <div className="w-10 h-10 bg-orange-100 text-orange-800 rounded-full flex items-center justify-center shrink-0">
                <Gift className="w-5 h-5 text-orange-600 animate-pulse" />
              </div>
            </div>

            <div className="space-y-1 text-center bg-gray-50 p-4 rounded-xl border border-gray-100 relative">
              {isRedeemed ? (
                <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center z-10 text-rose-600 font-extrabold text-lg select-none">
                  <div className="border-4 border-double border-rose-500 rounded-full px-6 py-2 rotate-[-8deg] uppercase tracking-widest font-black">
                    {t.redeemed}
                  </div>
                </div>
              ) : null}

              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">引換パスコード</span>
              <h6 className="text-xl font-mono font-bold tracking-widest text-orange-950">
                {certId.split('-')[2]}
              </h6>
              <p className="text-[9px] text-gray-400">※駅員さんが引換後に「使用する」をタップします。</p>
            </div>

            {!isRedeemed ? (
              <button
                onClick={() => {
                  if (window.confirm('本当にこの引換券を使用しますか？駅員さんの目の前でのみタップしてください。')) {
                    setIsRedeemed(true);
                  }
                }}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                {t.redeemBtn}
              </button>
            ) : (
              <button
                disabled
                className="w-full py-2.5 bg-gray-100 text-gray-400 font-bold text-xs rounded-xl cursor-not-allowed border"
              >
                引き換え完了
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white border rounded-3xl p-8 text-center space-y-6 shadow-sm max-w-md mx-auto relative overflow-hidden">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400 shadow-inner">
            <Lock className="w-7 h-7" />
          </div>
          
          <div className="space-y-2">
            <h4 className="font-extrabold text-lg text-gray-800">
              {language === 'en' ? 'Almost There!' : 'ゴールまで あともうすこし！'}
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
              {language === 'en' 
                ? `You have collected ${collectedCount} of ${totalStamps} stamps. Keep scanning!`
                : `景品の引き換えと完走認定証の解放には、全\${totalStamps}箇所のスタンプが必要です。現在、\${collectedCount} / \${totalStamps} 個獲得しています。`
              }
            </p>
          </div>

          <div className="flex flex-col gap-2.5 max-w-xs mx-auto">
            <button
              onClick={() => onNavigateToTab('map')}
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              {language === 'en' ? 'Find Next Stop on Map' : 'つぎのバスていを さがす'}
            </button>
            <button
              onClick={() => onNavigateToTab('stamps')}
              className="w-full py-2.5 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl border transition-all active:scale-95 cursor-pointer"
            >
              {language === 'en' ? 'Back to Stamp Book' : 'スタンプちょうに もどる'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
