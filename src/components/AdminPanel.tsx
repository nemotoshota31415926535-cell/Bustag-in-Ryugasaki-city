/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BusStop, generateSecureToken, verifyAdminPassword } from '../types';
import { BUS_STOPS } from '../data/busStops';
import { Language, UI_TRANSLATIONS } from '../data/translations';
import { safeStorage } from '../App';
import { 
  Lock, 
  Unlock, 
  Printer, 
  Sparkles, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  Download,
  CheckCircle,
  FileText,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AdminPanelProps {
  collectedStamps: any[];
  onCollectAllDemo: () => void;
  onResetProgress: () => void;
  language: Language;
  isAdminVerified: boolean;
  setIsAdminVerified: (verified: boolean) => void;
}

export default function AdminPanel({
  collectedStamps,
  onCollectAllDemo,
  onResetProgress,
  language,
  isAdminVerified,
  setIsAdminVerified,
}: AdminPanelProps) {
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedStopId, setCopiedStopId] = useState<string | null>(null);
  const [stopTokens, setStopTokens] = useState<Record<string, string>>({});
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState<number>(0);
  
  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.ja;

  // Real-time administrator lockout countdown effect
  useEffect(() => {
    const checkLockout = () => {
      const lockoutStr = safeStorage.getItem('ryu_admin_lockout_until');
      if (lockoutStr) {
        const diff = new Date(lockoutStr).getTime() - Date.now();
        if (diff > 0) {
          setLockoutTimeLeft(Math.ceil(diff / 1000));
        } else {
          setLockoutTimeLeft(0);
          safeStorage.removeItem('ryu_admin_lockout_until');
        }
      }
    };

    checkLockout();
    const interval = setInterval(checkLockout, 1000);
    return () => clearInterval(interval);
  }, []);

  // Precompute secure tokens asynchronously for all bus stops
  useEffect(() => {
    async function computeTokens() {
      const cache: Record<string, string> = {};
      for (const stop of BUS_STOPS) {
        cache[stop.id] = await generateSecureToken(stop.id);
      }
      setStopTokens(cache);
    }
    computeTokens();
  }, []);

  const [customBaseUrl, setCustomBaseUrl] = useState<string>(() => {
    return safeStorage.getItem('ryu_custom_base_url') || '';
  });

  const getBaseUrl = () => {
    if (customBaseUrl.trim()) {
      return customBaseUrl.trim();
    }
    const origin = window.location.origin;
    // Automatically convert developer URL (ais-dev-) to public preview/shared URL (ais-pre-)
    // so that QR codes scanned by mobile devices open the public production/shared view
    // without requiring developer platform authentication or opening the editor workspace.
    const publicOrigin = origin.replace('ais-dev-', 'ais-pre-');
    return publicOrigin + window.location.pathname;
  };

  const getQRUrl = (stop: BusStop) => {
    const token = stopTokens[stop.id] || '';
    return `${getBaseUrl()}?stamp=${stop.id}${token ? `&token=${token}` : ''}`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (lockoutTimeLeft > 0) {
      setErrorMsg(
        language === 'en'
          ? `Portal locked. Please wait ${lockoutTimeLeft}s.`
          : `ポータルがロックされています。解除まで残り ${lockoutTimeLeft} 秒お待ちください。`
      );
      return;
    }
    
    const isValid = await verifyAdminPassword(passwordInput);
    if (isValid) {
      setIsAdminVerified(true);
      setPasswordInput('');
      safeStorage.removeItem('ryu_admin_failed_attempts');
      confetti({
        particleCount: 50,
        spread: 40,
        origin: { y: 0.6 }
      });
    } else {
      const failedAttemptsStr = safeStorage.getItem('ryu_admin_failed_attempts') || '0';
      const failedAttempts = parseInt(failedAttemptsStr, 10) + 1;
      
      if (failedAttempts >= 5) {
        const lockUntil = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes lockout
        safeStorage.setItem('ryu_admin_lockout_until', lockUntil);
        safeStorage.removeItem('ryu_admin_failed_attempts');
        setLockoutTimeLeft(600);
        setErrorMsg(
          language === 'en'
            ? 'Too many failed login attempts! Portal locked for 10 minutes.'
            : '誤ったパスワードが5回入力されました。セキュリティ保護のため、ログインが10分間ロックされます。'
        );
      } else {
        safeStorage.setItem('ryu_admin_failed_attempts', failedAttempts.toString());
        setErrorMsg(
          language === 'en'
            ? `Incorrect Password. Attempt ${failedAttempts}/5 before lockout.`
            : `パスワードが正しくありません。5回連続で間違えるとロックされます（現在 ${failedAttempts}/5 回目）。`
        );
      }
    }
  };

  const handleCopyLink = (stop: BusStop) => {
    const url = getQRUrl(stop);
    navigator.clipboard.writeText(url).then(() => {
      setCopiedStopId(stop.id);
      setTimeout(() => setCopiedStopId(null), 2000);
    });
  };

  const handlePrintAll = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert(
        language === 'en'
          ? 'Pop-up blocked. Please allow pop-ups to print posters.'
          : 'ポップアップがブロックされました。ブラウザの設定で許可してください。'
      );
      return;
    }

    const baseUrl = getBaseUrl();
    const postersHtml = BUS_STOPS.map((stop) => {
      const token = stopTokens[stop.id] || '';
      const qrUrl = `${baseUrl}?stamp=${stop.id}${token ? `&token=${token}` : ''}`;
      const qrImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(qrUrl)}`;
      
      return `
        <div class="poster-page">
          <div class="header">龍ケ崎市コミュニティバス スタンプラリー</div>
          <div class="subtitle">公式スタンプ設置場所</div>
          
          <div class="stop-box">
            <div class="stop-number">停留所番号 ${stop.numberLabel}</div>
            <div class="stop-name">${stop.name}</div>
          </div>

          <div class="instruction">スマートフォンでQRコードをスキャンしてスタンプを獲得！</div>
          
          <img class="qr-code" src="${qrImgSrc}" alt="QR Code" />
          
          <div class="scan-note">※GPS/現地認証用の暗号トークンが埋め込まれています。必ず現地でスキャンしてください。</div>
          <div class="footer">竜ヶ崎第一高等学校附属中学校 探究 交通インフラ 5101班</div>
        </div>
      `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>コミュニティバス スタンプQRポスター印刷</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@700;900&family=Noto+Sans+JP:wght@700;900&display=swap');
            body {
              margin: 0;
              font-family: 'Noto Sans JP', 'Inter', sans-serif;
              background-color: #ffffff;
            }
            .poster-page {
              width: 100%;
              max-width: 800px;
              margin: 0 auto;
              height: 100vh;
              box-sizing: border-box;
              border: 15px double #ea580c;
              padding: 40px;
              display: flex;
              flex-direction: col;
              flex-direction: column;
              align-items: center;
              justify-content: space-between;
              text-align: center;
              page-break-after: always;
            }
            .header {
              font-size: 28px;
              font-weight: 900;
              color: #ea580c;
              margin-top: 10px;
              border-bottom: 3px solid #ea580c;
              padding-bottom: 10px;
              width: 100%;
            }
            .subtitle {
              font-size: 20px;
              font-weight: 700;
              color: #374151;
              margin-top: -10px;
            }
            .stop-box {
              background-color: #fff7ed;
              border: 4px solid #f97316;
              border-radius: 20px;
              padding: 30px;
              width: 90%;
            }
            .stop-number {
              font-size: 22px;
              color: #c2410c;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .stop-name {
              font-size: 42px;
              font-weight: 900;
              color: #111827;
            }
            .instruction {
              font-size: 18px;
              font-weight: bold;
              color: #1e40af;
            }
            .qr-code {
              width: 320px;
              height: 320px;
              border: 8px solid #f3f4f6;
              border-radius: 16px;
            }
            .scan-note {
              font-size: 13px;
              color: #dc2626;
              font-weight: bold;
              max-width: 80%;
            }
            .footer {
              font-size: 16px;
              font-weight: bold;
              color: #4b5563;
              margin-bottom: 10px;
            }
            @media print {
              body { background: none; }
              .poster-page { 
                height: 96vh;
                page-break-after: always;
                border: 12px double #ea580c;
              }
            }
          </style>
        </head>
        <body>
          ${postersHtml}
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Secure locked login screen
  if (!isAdminVerified) {
    return (
      <div className="max-w-md mx-auto my-8">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-orange-500 to-amber-600 px-6 py-8 text-white text-center relative">
            <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>SECURITY LOG</span>
            </div>
            <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-white/20">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-black">管理者認証ポータル</h2>
            <p className="text-orange-100 text-xs mt-1">
              QR印刷・デバッグ操作は、関係者パスワードが必要です
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="p-6 space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 block">
                管理者アクセスパスワード
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder={lockoutTimeLeft > 0 ? "ロックアウト中..." : "パスワードを入力してください"}
                  disabled={lockoutTimeLeft > 0}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-sm text-center disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={lockoutTimeLeft > 0}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 flex items-center gap-2">
                ⚠️ {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={lockoutTimeLeft > 0}
              className="w-full py-3 bg-orange-600 hover:bg-orange-700 active:scale-98 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {lockoutTimeLeft > 0 ? `ロック解除まで残り ${lockoutTimeLeft}秒` : '管理者モードを解除'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Authorized Admin Screen
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      
      {/* Alert Header */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shrink-0">
            <Unlock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-emerald-950 text-sm sm:text-base">
              管理者モード認証中（開発検証 & QRポスター発行）
            </h3>
            <p className="text-emerald-800 text-xs">
              暗号トークン検証を有効にした安全なQRポスターをいつでも発行・ダウンロードできます。
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsAdminVerified(false)}
          className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-lg transition-all shrink-0 cursor-pointer"
        >
          ログアウト
        </button>
      </div>

      {/* Main Admin Controls Box */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-6">
        <div className="border-b border-gray-100 pb-4">
          <h4 className="font-black text-gray-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-500 animate-pulse" />
            開発検証・動作テスト機能 (スタンプ台帳操作)
          </h4>
          <p className="text-gray-500 text-xs mt-1">
            一般利用者はアクセスできない保護領域です。認定証やプレゼント引換券の動作確認にご使用ください。
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Action 1: Collect All Stamps */}
          <div className="border border-orange-100 bg-orange-50/20 rounded-2xl p-4 flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                デモ機能
              </span>
              <h5 className="font-bold text-gray-800 text-sm">【テスト用】全スタンプ獲得</h5>
              <p className="text-gray-500 text-xs leading-relaxed">
                全10か所のスタンプを一括して台帳に記録します。完全制覇時の特典画面や、バッジの解放テストがすぐに実行できます。
              </p>
            </div>
            <button
              onClick={onCollectAllDemo}
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              全スタンプを一括獲得する
            </button>
          </div>

          {/* Action 2: Reset Progress */}
          <div className="border border-red-100 bg-red-50/10 rounded-2xl p-4 flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-red-600 bg-red-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                危険操作
              </span>
              <h5 className="font-bold text-gray-800 text-sm">スタンプ台帳の完全初期化</h5>
              <p className="text-gray-500 text-xs leading-relaxed">
                獲得したすべてのスタンプデータをローカルストレージを含め、完全に初期状態（0枚獲得）にリセットします。
              </p>
            </div>
            <button
              onClick={onResetProgress}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              台帳データを完全に初期化する
            </button>
          </div>
        </div>
      </div>

      {/* QR Poster Generation Box */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <h4 className="font-black text-gray-800 flex items-center gap-2">
              <Printer className="w-5 h-5 text-indigo-600" />
              公式スタンプQRコード・ポスター印刷発行
            </h4>
            <p className="text-gray-500 text-xs mt-1">
              各バス停に設置する公式ポスター用のQRコードです。不正に複製・推測されないよう、それぞれ暗号検証キーが含まれています。
            </p>
          </div>
          <button
            onClick={handlePrintAll}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            全10箇所の一括印刷用PDFを開く
          </button>
        </div>

        {/* Dynamic Base URL Configuration Field */}
        <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-100/80 space-y-3">
          <div className="flex items-start gap-2.5">
            <span className="p-1 bg-amber-100 rounded-lg text-amber-800 text-[10px] font-bold">INFO</span>
            <div className="space-y-1">
              <h5 className="font-bold text-gray-800 text-xs">QRコードのリンク先自動最適化機能</h5>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                開発用URL（<code>ais-dev-...</code>）で管理画面を開いている場合でも、生成されるQRコードおよびリンクは自動的に<strong>一般利用者向けの公開URL（<code>ais-pre-...</code>）</strong>に自動変換されるようになりました！<br />
                これにより、AI Studioのログイン画面や開発用ワークスペースを介さず、スマートフォンから直接スタンプを取得してアプリに転送できます。
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={customBaseUrl}
              onChange={(e) => {
                const val = e.target.value;
                setCustomBaseUrl(val);
                safeStorage.setItem('ryu_custom_base_url', val);
              }}
              placeholder={`現在の自動検出: ${window.location.origin + window.location.pathname}`}
              className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-800 font-mono shadow-inner focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
            />
            {customBaseUrl && (
              <button
                onClick={() => {
                  setCustomBaseUrl('');
                  safeStorage.removeItem('ryu_custom_base_url');
                }}
                className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs rounded-xl transition-all"
              >
                初期化
              </button>
            )}
            <button
              onClick={() => {
                const currentUrl = window.location.origin + window.location.pathname;
                setCustomBaseUrl(currentUrl);
                safeStorage.setItem('ryu_custom_base_url', currentUrl);
              }}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs rounded-xl transition-all shadow-xs"
            >
              現在のブラウザURLを使用
            </button>
          </div>
          <p className="text-[10px] text-gray-400 font-mono">
            現在の生成ターゲットURL: <span className="text-amber-700 font-bold">{getBaseUrl()}?stamp=...</span>
          </p>
        </div>

        {/* Bus Stop QR List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {BUS_STOPS.map((stop) => {
            const token = stopTokens[stop.id] || '';
            const qrUrl = getQRUrl(stop);
            const qrImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`;
            
            return (
              <div 
                key={stop.id}
                className="border border-gray-100 hover:border-gray-200 rounded-2xl p-4 flex gap-4 bg-gray-50/50 hover:bg-gray-50 transition-colors"
              >
                {/* Visual Representation of QR */}
                <div className="bg-white p-2 rounded-xl border border-gray-100 shrink-0 flex flex-col items-center justify-center space-y-1.5 shadow-xs">
                  <img src={qrImgSrc} alt={`QR ${stop.name}`} className="w-24 h-24" />
                  <span className="text-[9px] font-mono font-bold text-gray-400">TOKEN ENCRYPTED</span>
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] bg-orange-100 text-orange-800 font-black px-1.5 py-0.2 rounded">
                        #{stop.numberLabel}
                      </span>
                      <span className="text-[10px] bg-blue-100 text-blue-800 font-mono font-black px-1.5 py-0.2 rounded">
                        OFFICIAL POSTER
                      </span>
                    </div>
                    <h5 className="font-extrabold text-gray-900 text-base">{stop.name}</h5>
                    <p className="text-[10px] text-gray-400 leading-relaxed font-mono truncate max-w-xs" title={qrUrl}>
                      {qrUrl}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopyLink(stop)}
                      className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-[10px] transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        copiedStopId === stop.id
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                      }`}
                    >
                      {copiedStopId === stop.id ? (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          コピー完了
                        </>
                      ) : (
                        <>
                          <Download className="w-3 h-3" />
                          リンクをコピー
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        const printWindow = window.open('', '_blank');
                        if (printWindow) {
                          printWindow.document.write(`
                            <html>
                              <head>
                                <title>龍ケ崎市コミュニティバス スタンプポスター - ${stop.name}</title>
                                <style>
                                  body { display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: sans-serif; text-align: center; }
                                  .poster { border: 15px double #ea580c; padding: 40px; border-radius: 20px; max-width: 600px; }
                                  h1 { color: #ea580c; font-size: 36px; margin-bottom: 5px; }
                                  h2 { font-size: 24px; color: #4b5563; }
                                  .stop { background: #fff7ed; border: 4px solid #f97316; padding: 20px; border-radius: 12px; margin: 30px 0; }
                                  .stop-name { font-size: 32px; font-weight: bold; }
                                  img { width: 300px; height: 300px; }
                                </style>
                              </head>
                              <body>
                                <div class="poster">
                                  <h1>コミュニティバス スタンプラリー</h1>
                                  <h2>公式ポスター</h2>
                                  <div class="stop">
                                    <div>停留所番号 ${stop.numberLabel}</div>
                                    <div class="stop-name">${stop.name}</div>
                                  </div>
                                  <img src="${qrImgSrc}" />
                                  <p style="color: red; font-weight: bold; font-size: 14px; margin-top: 20px;">
                                    ※不正防止用の暗号トークンが入っています。必ず現地でスキャンしてください。
                                  </p>
                                </div>
                                <script>window.onload = function() { window.print(); }</script>
                              </body>
                            </html>
                          `);
                          printWindow.document.close();
                        }
                      }}
                      className="py-1.5 px-3 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg font-bold text-[10px] transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3 h-3" />
                      印刷
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
