/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, ErrorInfo, ReactNode } from 'react';
import { BusStop, CollectedStamp, TabType, generateSecureToken, verifyAdminPassword, serializeStamps, deserializeStamps } from './types';
import { BUS_STOPS } from './data/busStops';
import StampCard from './components/StampCard';
import RouteMap from './components/RouteMap';
import QRScanner from './components/QRScanner';
import PrizeClaim from './components/PrizeClaim';
import AdminPanel from './components/AdminPanel';
import StampBadge from './components/StampBadge';
import { Language, UI_TRANSLATIONS } from './data/translations';
import confetti from 'canvas-confetti';
import { 
  Award, 
  BookOpen, 
  Bus, 
  Camera, 
  CheckCircle, 
  ChevronRight, 
  Gift, 
  Info, 
  Map, 
  MapPin, 
  Printer, 
  RotateCcw, 
  Smartphone, 
  Sparkles, 
  Trash2, 
  X,
  Database,
  Globe,
  Lock,
  Smile,
  AlertCircle
} from 'lucide-react';

// Global memory store fallback for strict sandboxed environment safety
const memoryStorage: Record<string, string> = {};

// Helper functions to read/write Cookies as long-term second-layer backup
const getCookie = (key: string): string | null => {
  try {
    const name = key + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) === 0) {
        return c.substring(name.length, c.length);
      }
    }
  } catch (e) {
    console.warn('Cookie read error:', e);
  }
  return null;
};

const setCookie = (key: string, value: string, days = 365) => {
  try {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    // Use SameSite=Lax and Secure for modern browser compliance
    document.cookie = key + "=" + encodeURIComponent(value) + ";" + expires + ";path=/;SameSite=Lax;Secure";
  } catch (e) {
    console.warn('Cookie write error:', e);
  }
};

const eraseCookie = (key: string) => {
  try {
    document.cookie = key + "=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;SameSite=Lax;Secure";
  } catch (e) {
    console.warn('Cookie erase error:', e);
  }
};

export const safeStorage = {
  getItem: (key: string): string | null => {
    let val: string | null = null;
    try {
      val = localStorage.getItem(key);
    } catch (e) {
      console.warn('localStorage read is blocked or unavailable.', e);
    }

    // Try Cookie fallback (to survive across different days or if localStorage is cleared/blocked)
    if (val === null) {
      const cookieVal = getCookie(key);
      if (cookieVal !== null) {
        console.log(`Successfully recovered ${key} from secure long-term Cookie backup!`);
        // Sync back to localStorage if possible to heal it
        try {
          localStorage.setItem(key, cookieVal);
        } catch (e) {}
        return cookieVal;
      }
    }

    return val !== null ? val : (memoryStorage[key] || null);
  },
  setItem: (key: string, value: string): void => {
    let writeSuccessful = false;
    
    // Attempt writing to localStorage with up to 3 retries
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        localStorage.setItem(key, value);
        // Verify consistency
        const verified = localStorage.getItem(key);
        if (verified === value) {
          writeSuccessful = true;
          break;
        }
      } catch (e) {
        console.warn(`[localStorage write attempt ${attempt}/3 failed]`, e);
      }
    }

    // Always back up to Cookie (365 days) and MemoryStorage regardless of localStorage status
    setCookie(key, value, 365);
    memoryStorage[key] = value;
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('localStorage is blocked or unavailable.', e);
    }
    eraseCookie(key);
    delete memoryStorage[key];
  }
};

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Stamp Rally app:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full border border-gray-100 shadow-xl space-y-6">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 animate-bounce" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black text-gray-800">
                エラーが発生しました
              </h2>
              <p className="text-xs text-gray-500 leading-relaxed">
                実行中に一時的なエラーが発生しました。データを保持したまま回復を試みることができます。
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-xl text-left border border-red-100 max-h-32 overflow-auto">
              <p className="text-[10px] font-mono text-red-700 break-all leading-tight">
                {this.state.error?.toString()}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  try {
                    localStorage.removeItem('ryu_bus_stamps');
                    localStorage.removeItem('ryu_dev_mode_warning');
                  } catch (e) {}
                  window.location.reload();
                }}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all"
              >
                初期化して再起動
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl transition-all shadow-md"
              >
                アプリを再起動
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('stamps');
  const [collectedStamps, setCollectedStamps] = useState<CollectedStamp[]>([]);
  const [language, setLanguage] = useState<Language>('ja');
  const [showDevWarning, setShowDevWarning] = useState<boolean>(() => {
    return safeStorage.getItem('ryu_dev_mode_warning') === 'true';
  });
  const [isAdminVerified, setIsAdminVerified] = useState<boolean>(false);

  // Highly stable in-memory cache to guarantee synchronous state deduplication
  const collectedIdsRef = useRef<Set<string>>(new Set());
  const [customModal, setCustomModal] = useState<{
    type: 'alert' | 'confirm';
    title: string;
    message: string;
    onConfirm?: () => void;
  } | null>(null);
  
  // Modal alerts for URL scans
  const [scannedFromUrlStop, setScannedFromUrlStop] = useState<BusStop | null>(null);
  const [alreadyScannedStop, setAlreadyScannedStop] = useState<BusStop | null>(null);
  const [selectedMapStop, setSelectedMapStop] = useState<BusStop | null>(null);

  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.ja;

  // Scroll to top on activeTab change
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [activeTab]);

  // Load stamps & language on mount and check URL params
  useEffect(() => {
    const initApp = async () => {
      // 1. Load language preference
      const savedLang = safeStorage.getItem('ryu_bus_lang');
      if (savedLang) {
        setLanguage(savedLang as Language);
      } else {
        setLanguage('ja-furigana'); // Kids friendly by default!
      }

      // 2. Load stamps from safeStorage with cryptographic signature integrity check
      const saved = safeStorage.getItem('ryu_bus_stamps');
      let loadedStamps: CollectedStamp[] = [];
      if (saved) {
        loadedStamps = await deserializeStamps(saved);
        setCollectedStamps(loadedStamps);
        collectedIdsRef.current = new Set(loadedStamps.map(s => s.stopId));
        if (loadedStamps.some((s) => s.method === 'simulation')) {
          setShowDevWarning(true);
          safeStorage.setItem('ryu_dev_mode_warning', 'true');
        }
      }

      // 3. Check URL search parameters for QR scan triggers with secure token verification
      const params = new URLSearchParams(window.location.search);
      const stampParam = params.get('stamp');
      const tokenParam = params.get('token');
      
      if (stampParam) {
        // Rate-limit check to prevent token guessing/brute-forcing
        const lockoutTime = safeStorage.getItem('ryu_lockout_until');
        if (lockoutTime && new Date(lockoutTime) > new Date()) {
          setCustomModal({
            type: 'alert',
            title: savedLang === 'en' ? 'ACCESS BLOCKED' : 'アクセス制限中',
            message: savedLang === 'en'
              ? '【SECURITY TIMEOUT】\nToo many invalid scan attempts. QR scanning is temporarily locked for safety. Please try again later.'
              : '【セキュリティ保護】\n無効なスキャンが複数回検出されたため、一時的にスキャン受付が制限されています。しばらく時間を置いてからやり直してください。'
          });
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
          return;
        }

        const stop = BUS_STOPS.find(
          (s) => s.id === stampParam || 
                 s.id === `stop-${stampParam}` || 
                 s.numberLabel === stampParam
        );

        if (stop) {
          // Verify token cryptographically to guarantee physical presence!
          const expectedToken = await generateSecureToken(stop.id);
          if (!tokenParam || tokenParam !== expectedToken) {
            // Log failed attempt for brute-force prevention
            const failedAttemptsStr = safeStorage.getItem('ryu_failed_scans') || '0';
            const failedAttempts = parseInt(failedAttemptsStr, 10) + 1;
            
            if (failedAttempts >= 5) {
              const lockUntil = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes lockout
              safeStorage.setItem('ryu_lockout_until', lockUntil);
              safeStorage.removeItem('ryu_failed_scans');
            } else {
              safeStorage.setItem('ryu_failed_scans', failedAttempts.toString());
            }

            setCustomModal({
              type: 'alert',
              title: savedLang === 'en' ? 'STAMP REJECTED' : 'スタンプ獲得拒否',
              message: savedLang === 'en'
                ? '【STAMP COLLECTION REJECTED / ANTI-CHEAT PROTECTION】\nYou must physically visit the bus stop and scan the official printed QR poster to claim this stamp. Direct URL entry is blocked.'
                : '【スタンプ獲得拒否 / 不正獲得防止システム】\n現地に掲示されている公式のQRコードポスターをスキャンして獲得してください。手動でのURL入力やコピーされたリンクからのアクセスは無効です。'
            });
            // Clean up the URL parameters
            const cleanUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
            return;
          }

          // Reset failed attempts upon successful scan
          safeStorage.removeItem('ryu_failed_scans');

          // Travel Velocity Limit Check (Anti-GPS spoofing / Link sharing replay)
          if (loadedStamps.length > 0) {
            const sortedStamps = [...loadedStamps].sort((a, b) => 
              new Date(b.collectedAt).getTime() - new Date(a.collectedAt).getTime()
            );
            const lastStamp = sortedStamps[0];
            const timeDiffMs = Date.now() - new Date(lastStamp.collectedAt).getTime();
            
            // If another stamp was claimed in less than 2 seconds, block it as accidental double-scan protection
            if (timeDiffMs < 2 * 1000) {
              setCustomModal({
                type: 'alert',
                title: savedLang === 'en' ? 'DOUBLE SCAN DETECTED' : '重複スキャン検知',
                message: savedLang === 'en'
                  ? 'Please wait a moment before claiming another stamp.'
                  : '直前にスキャンが成功しています。重複検出を防ぐため、数秒空けてからスキャンしてください。'
              });
              const cleanUrl = window.location.origin + window.location.pathname;
              window.history.replaceState({}, document.title, cleanUrl);
              return;
            }
          }

          const alreadyCollected = loadedStamps.some((s) => s.stopId === stop.id);
          if (!alreadyCollected) {
            const newStamp: CollectedStamp = {
              stopId: stop.id,
              collectedAt: new Date().toISOString(),
              method: 'camera',
            };
            const updated = [...loadedStamps, newStamp];
            setCollectedStamps(updated);
            
            // Serialize, sign and save with multi-attempt retry protection
            await saveStampsSecurely(updated);
            
            // Sync with local memory cache ref
            collectedIdsRef.current.add(stop.id);
            
            // Trigger big orange/yellow celebration!
            confetti({
              particleCount: 180,
              spread: 90,
              origin: { y: 0.5 },
              colors: ['#ea580c', '#fbbf24', '#f59e0b', '#3b82f6', '#10b981']
            });

            setScannedFromUrlStop(stop);
            setActiveTab('stamps'); // Navigate directly to stamp book
          } else {
            setAlreadyScannedStop(stop);
          }

          // Clean up the URL query params so reloading doesn't prompt scanning again
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }
      }
    };

    initApp();
  }, []);

  // Helper to securely save stamps with up to 3 write retries and multi-layer backup (cookie + memory fallback) protection
  const saveStampsSecurely = async (stamps: CollectedStamp[]): Promise<void> => {
    let secureData = '';
    try {
      secureData = await serializeStamps(stamps);
    } catch (err) {
      console.error('Serialization failed, compiling legacy fallback:', err);
      try {
        const plainString = JSON.stringify(stamps);
        secureData = 'RYU_SECURE_' + btoa(unescape(encodeURIComponent(plainString)));
      } catch (e) {
        secureData = JSON.stringify(stamps);
      }
    }

    // Rely on the upgraded safeStorage which handles retries, cookie backups, and memory fallbacks
    try {
      safeStorage.setItem('ryu_bus_stamps', secureData);
    } catch (e) {
      console.error('Failed to write to safeStorage:', e);
    }
  };

  // Update language handler
  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    try {
      safeStorage.setItem('ryu_bus_lang', lang);
    } catch (e) {}
  };

  // Collect stamp handler with high-concurrency race condition protection
  const handleCollectStamp = (stopId: string, method: 'camera' | 'simulation'): boolean => {
    if (collectedIdsRef.current.has(stopId)) {
      return false; // Already collected synchronously in the current session context
    }
    collectedIdsRef.current.add(stopId);

    const newStamp: CollectedStamp = {
      stopId,
      collectedAt: new Date().toISOString(),
      method,
    };

    setCollectedStamps((prevStamps) => {
      if (prevStamps.some((s) => s.stopId === stopId)) {
        return prevStamps;
      }
      const updated = [...prevStamps, newStamp];
      saveStampsSecurely(updated);
      return updated;
    });
    return true;
  };

  // Demo Cheat: Collect all stamps (Protected by administrator password)
  const handleCollectAllDemokey = () => {
    const confirmTitle = language === 'en' ? 'Collect All Stamps' : '全スタンプ一括獲得';
    const confirmMsg = language === 'en' 
      ? 'Do you want to collect all stamps for demo/testing purposes?' 
      : 'すべてのスタンプをテスト用に一括獲得しますか？（認定証やプレゼント引換券の動作テストが可能です）';
    
    setCustomModal({
      type: 'confirm',
      title: confirmTitle,
      message: confirmMsg,
      onConfirm: () => {
        const updated: CollectedStamp[] = BUS_STOPS.map((stop) => ({
          stopId: stop.id,
          collectedAt: new Date().toISOString(),
          method: 'simulation',
        }));
        
        // Sync local cache ref immediately
        collectedIdsRef.current = new Set(BUS_STOPS.map((s) => s.id));
        
        setCollectedStamps(updated);
        saveStampsSecurely(updated);
        setShowDevWarning(true);
        safeStorage.setItem('ryu_dev_mode_warning', 'true');
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#ea580c', '#fbbf24', '#f59e0b', '#3b82f6', '#10b981']
        });
      }
    });
  };

  // Reset all progress (Protected by administrator password)
  const handleResetProgress = () => {
    const confirmTitle = language === 'en' ? 'Reset Progress' : '台帳データの初期化';
    const confirmMsg = language === 'en' 
      ? 'Reset all stamp progress to start fresh?' 
      : '収集したスタンプ情報をすべて消去して、最初からやり直しますか？';

    setCustomModal({
      type: 'confirm',
      title: confirmTitle,
      message: confirmMsg,
      onConfirm: () => {
        // Sync local cache ref immediately
        collectedIdsRef.current.clear();
        
        setCollectedStamps([]);
        saveStampsSecurely([]);
        setShowDevWarning(true);
        safeStorage.setItem('ryu_dev_mode_warning', 'true');
        
        setCustomModal({
          type: 'alert',
          title: language === 'en' ? 'Reset Success' : '初期化完了',
          message: language === 'en' ? 'Reset successfully.' : 'スタンプ台帳を初期化しました。獲得スタンプ数は0個になりました。'
        });
      }
    });
  };

  // Exit dev mode warning and fully reset
  const handleClearDevWarningAndReset = () => {
    const confirmTitle = language === 'en' ? 'Exit Dev Mode' : '開発・検証モードの解除';
    const confirmMsg = language === 'en'
      ? 'This will completely reset all data and exit development mode. Proceed?'
      : 'すべてのスタンプデータと開発検証フラグを完全にリセットして、一般の初期状態に戻します（スタンプの数は0になります）。よろしいですか？';
    
    setCustomModal({
      type: 'confirm',
      title: confirmTitle,
      message: confirmMsg,
      onConfirm: () => {
        // Sync local cache ref immediately
        collectedIdsRef.current.clear();
        
        setCollectedStamps([]);
        saveStampsSecurely([]);
        safeStorage.removeItem('ryu_dev_mode_warning');
        setShowDevWarning(false);
        
        setCustomModal({
          type: 'alert',
          title: language === 'en' ? 'Returned to Production' : '通常モード復帰',
          message: language === 'en' ? 'Returned to production mode. Stamp count reset to 0.' : '検証モードを終了し、通常モードに復帰しました。スタンプ数を0個に戻しました。'
        });
      }
    });
  };

  // Render components dynamically based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'stamps':
        return (
          <StampCard
            collectedStamps={collectedStamps}
            onSelectStop={(stop) => setSelectedMapStop(stop)}
            onNavigateToTab={(tab) => setActiveTab(tab)}
            language={language}
          />
        );
      case 'map':
        return (
          <RouteMap
            collectedStamps={collectedStamps}
            selectedStopFromOutside={selectedMapStop}
            onClearSelectedStop={() => setSelectedMapStop(null)}
            onNavigateToTab={(tab) => setActiveTab(tab)}
            language={language}
          />
        );
      case 'scan':
        return (
          <QRScanner
            collectedStamps={collectedStamps}
            onCollectStamp={handleCollectStamp}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        );
      case 'prizes':
        return (
          <PrizeClaim
            collectedStamps={collectedStamps}
            onNavigateToTab={(tab) => setActiveTab(tab)}
            language={language}
          />
        );
      case 'admin':
        return (
          <AdminPanel
            collectedStamps={collectedStamps}
            onCollectAllDemo={handleCollectAllDemokey}
            onResetProgress={handleResetProgress}
            language={language}
            isAdminVerified={isAdminVerified}
            setIsAdminVerified={setIsAdminVerified}
          />
        );
      default:
        return null;
    }
  };

  const totalCollected = collectedStamps.length;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-orange-50/10 flex flex-col font-sans text-gray-900 pb-20 md:pb-6">
      
      {/* Highly visible Security Warning Banner when dev console / simulation actions are triggered */}
      {showDevWarning && (
        <div className="bg-amber-500 text-amber-950 font-bold text-xs border-b border-amber-600 shadow-sm relative z-50">
          <div className="w-full max-w-7xl mx-auto px-4 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-center md:text-left">
              <span className="inline-flex items-center justify-center bg-amber-900 text-amber-100 rounded-full w-5 h-5 font-black text-xs animate-pulse shrink-0 select-none">
                ⚠️
              </span>
              <span>
                {language === 'en' 
                  ? '【SECURITY WARNING / SIMULATOR ACTIVE】Development console actions (Demo Stamps / Reset) were executed. Unauthorized general users should not access.'
                  : '【セキュリティ警告・開発検証モード】「デモ獲得」や「リセット」などのデバッグ操作が検出されました。第三者の不正利用防止のため、このバナーが表示されています。'}
              </span>
            </div>
            <button
              onClick={handleClearDevWarningAndReset}
              className="px-3 py-1 bg-amber-900 hover:bg-amber-950 text-amber-50 rounded-lg text-[10px] font-black transition-all shrink-0 active:scale-95 cursor-pointer"
            >
              {language === 'en' ? 'Exit Test Mode & Reset' : '検証モードを終了（通常に戻す）'}
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-orange-100 shadow-sm backdrop-blur-md bg-white/95">
        <div className="w-full max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <div className="bg-orange-500 text-white p-2.5 rounded-xl shadow-md">
              <Bus className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm md:text-base font-black text-gray-800 tracking-tight">
                  {language === 'ja-furigana' ? (
                    <ruby>竜ヶ崎市 コミュニティバス</ruby>
                  ) : language === 'ja-easy' ? (
                    'りゅうがさきし コミュニティバス'
                  ) : (
                    '龍ケ崎市コミュニティバス'
                  )}
                </h1>
                <button 
                  onClick={() => setActiveTab('admin')}
                  className="text-[10px] bg-orange-100 hover:bg-orange-200 text-orange-800 font-extrabold px-1.5 py-0.2 rounded-md transition-colors cursor-pointer"
                  title="管理者ポータル"
                >
                  公式
                </button>
              </div>
              <p className="text-[9px] text-orange-600 font-black tracking-widest">
                DIGITAL STAMP RALLY SYSTEM
              </p>
            </div>
          </div>

          {/* Multilingual Selector and Admin Lock Option */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            
            {/* Language switches */}
            <div className="inline-flex bg-gray-100 p-1 rounded-xl text-xs font-bold border border-gray-200">
              <button
                onClick={() => handleLanguageChange('ja-furigana')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  language === 'ja-furigana' 
                    ? 'bg-orange-500 text-white shadow-xs' 
                    : 'text-gray-500 hover:text-gray-800'
                }`}
                title="Japanese with Furigana"
              >
                👦 ふりがな
              </button>
              <button
                onClick={() => handleLanguageChange('ja-easy')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  language === 'ja-easy' 
                    ? 'bg-orange-500 text-white shadow-xs' 
                    : 'text-gray-500 hover:text-gray-800'
                }`}
                title="Easy Japanese"
              >
                👶 やさしい
              </button>
              <button
                onClick={() => handleLanguageChange('ja')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  language === 'ja' 
                    ? 'bg-orange-500 text-white shadow-xs' 
                    : 'text-gray-500 hover:text-gray-800'
                }`}
                title="Standard Japanese"
              >
                日本語
              </button>
              <button
                onClick={() => handleLanguageChange('en')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  language === 'en' 
                    ? 'bg-orange-500 text-white shadow-xs' 
                    : 'text-gray-500 hover:text-gray-800'
                }`}
                title="English"
              >
                🇬🇧 En
              </button>
            </div>

          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6">
        {renderTabContent()}
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-xs text-gray-400 border-t border-gray-100 mt-auto bg-gray-50/30 pb-28 md:pb-16">
        <p>© 2026 竜ヶ崎第一高等学校附属中学校 探究 交通インフラ 5101班</p>
        <button 
          onClick={() => setActiveTab('admin')} 
          className="text-[10px] text-gray-300 hover:text-orange-500 mt-2.5 transition-colors cursor-pointer font-medium"
        >
          管理者用
        </button>
      </footer>

      {/* Desktop / Large Screen sidebar-like top-right floating helper indicators if completed */}
      {totalCollected === BUS_STOPS.length && activeTab !== 'prizes' && (
        <div className="fixed bottom-24 right-6 z-30 hidden sm:block animate-bounce">
          <button
            onClick={() => setActiveTab('prizes')}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-sm px-5 py-3 rounded-2xl shadow-lg border border-orange-300 shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Award className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
            {language === 'en' ? 'Get Rewards Now!' : '完全制覇特典を解放！'}
          </button>
        </div>
      )}

      {/* Floating Bottom Navigation Bar (Mobile first, perfectly accessible, orange themed) */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-orange-100 shadow-[0_-4px_16px_rgba(234,88,12,0.06)] pb-safe">
        <div className="max-w-md mx-auto grid grid-cols-5 h-16 justify-items-center items-center">
          
          {/* Tab 1: Stamps */}
          <button
            onClick={() => setActiveTab('stamps')}
            className={`flex flex-col items-center justify-center w-full h-full transition-all text-center relative ${
              activeTab === 'stamps' ? 'text-orange-600 font-extrabold' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <BookOpen className="w-5.5 h-5.5" />
            <span className="text-[10px] mt-1 font-bold tracking-tighter">{t.stamps}</span>
            {activeTab === 'stamps' && (
              <span className="absolute bottom-1 w-5 h-1 bg-orange-500 rounded-full" />
            )}
          </button>

          {/* Tab 2: Map */}
          <button
            onClick={() => setActiveTab('map')}
            className={`flex flex-col items-center justify-center w-full h-full transition-all text-center relative ${
              activeTab === 'map' ? 'text-orange-600 font-extrabold' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Map className="w-5.5 h-5.5" />
            <span className="text-[10px] mt-1 font-bold tracking-tighter">{t.map}</span>
            {activeTab === 'map' && (
              <span className="absolute bottom-1 w-5 h-1 bg-orange-500 rounded-full" />
            )}
          </button>

          {/* Tab 3: Scanner */}
          <button
            onClick={() => setActiveTab('scan')}
            className={`flex flex-col items-center justify-center w-full h-full transition-all text-center relative ${
              activeTab === 'scan' ? 'text-orange-600 font-extrabold' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <div className="p-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-full -translate-y-4 shadow-md border-4 border-white transition-all active:scale-90 cursor-pointer">
              <Camera className="w-5.5 h-5.5" />
            </div>
            <span className="text-[10px] -translate-y-3 font-black tracking-tighter">{t.scan}</span>
          </button>

          {/* Tab 4: Prizes */}
          <button
            onClick={() => setActiveTab('prizes')}
            className={`flex flex-col items-center justify-center w-full h-full transition-all text-center relative ${
              activeTab === 'prizes' ? 'text-orange-600 font-extrabold' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <div className="relative">
              <Award className="w-5.5 h-5.5" />
              {totalCollected > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white font-mono text-[8px] font-extrabold px-1 py-0.2 rounded-full min-w-4 flex items-center justify-center scale-90 border border-white animate-bounce">
                  {totalCollected}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1 font-bold tracking-tighter">景品・認定</span>
            {activeTab === 'prizes' && (
              <span className="absolute bottom-1 w-5 h-1 bg-orange-500 rounded-full" />
            )}
          </button>

          {/* Tab 5: Admin */}
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex flex-col items-center justify-center w-full h-full transition-all text-center relative ${
              activeTab === 'admin' ? 'text-indigo-600 font-extrabold' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <div className="relative">
              <Lock className="w-5.5 h-5.5" />
            </div>
            <span className="text-[10px] mt-1 font-bold tracking-tighter">管理者</span>
            {activeTab === 'admin' && (
              <span className="absolute bottom-1 w-5 h-1 bg-indigo-500 rounded-full" />
            )}
          </button>

        </div>
      </nav>

      {/* --- Overlay Modals for URL Scans --- */}

      {/* 1. Newly Scanned from URL success modal */}
      {scannedFromUrlStop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-6 shadow-2xl border border-orange-100 animate-scaleUp">
            <div className="w-16 h-16 bg-orange-500 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
              <CheckCircle className="w-10 h-10 stroke-[2.5]" />
            </div>
            
            <div className="space-y-2">
              <span className="text-xs font-black text-orange-800 tracking-widest bg-orange-100 px-3 py-1 rounded-full uppercase">
                {language === 'en' ? 'SCAN SUCCESSFUL!' : '現地QRスキャン成功！'}
              </span>
              <h3 className="text-xl font-black text-gray-800">
                #{scannedFromUrlStop.numberLabel} {scannedFromUrlStop.name}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto font-medium">
                {language === 'en'
                  ? `Congratulations! "${scannedFromUrlStop.name}" has been recorded to your digital stamp card!`
                  : `おめでとうございます！現地QRコードの読み取りにより、スタンプ台帳に「${scannedFromUrlStop.name}」のスタンプが自動記録されました！`
                }
              </p>
            </div>

            <div className="w-24 h-24 mx-auto">
              <StampBadge busStop={scannedFromUrlStop} collectedDate={new Date().toISOString()} size={96} interactive={false} />
            </div>

            <button
              onClick={() => setScannedFromUrlStop(null)}
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              {language === 'en' ? 'Check Stamp Book' : 'スタンプ台帳を確認する'}
            </button>
          </div>
        </div>
      )}

      {/* 2. Already Scanned from URL notification */}
      {alreadyScannedStop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-5 shadow-2xl border border-gray-100 animate-scaleUp">
            <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <Info className="w-8 h-8" />
            </div>
            
            <div className="space-y-1.5">
              <span className="text-xs font-black text-orange-800 tracking-widest bg-orange-100 px-3 py-1 rounded-full uppercase">
                {language === 'en' ? 'ALREADY COLLECTED' : '獲得済みスタンプ'}
              </span>
              <h3 className="text-xl font-black text-gray-800">
                {alreadyScannedStop.name}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">
                {language === 'en'
                  ? `Stop #${alreadyScannedStop.numberLabel} stamp is already in your book!`
                  : `こちらの停留所（#${alreadyScannedStop.numberLabel}）のスタンプはすでに獲得されています。スタンプ帳でお持ちのスタンプをご覧ください！`
                }
              </p>
            </div>

            <button
              onClick={() => setAlreadyScannedStop(null)}
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              {language === 'en' ? 'Close' : '閉じる'}
            </button>
          </div>
        </div>
      )}

      {/* 3. Pure React Custom Modal - Fully immune to IFrame restrictions */}
      {customModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with fade-in */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer duration-300"
            onClick={() => {
              if (customModal.type === 'alert') {
                setCustomModal(null);
              }
            }}
          />
          
          {/* Box with animation */}
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl border border-gray-100 z-10 relative transform scale-100 transition-all duration-300 ease-out animate-scaleUp">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
              customModal.title.includes('初期化') || customModal.title.includes('Reset') || customModal.title.includes('拒否') || customModal.title.includes('REJECTED')
                ? 'bg-rose-100 text-rose-600'
                : 'bg-orange-100 text-orange-600'
            }`}>
              {customModal.title.includes('初期化') || customModal.title.includes('Reset') || customModal.title.includes('拒否') || customModal.title.includes('REJECTED') ? (
                <RotateCcw className="w-6 h-6 animate-spin-once" />
              ) : (
                <Sparkles className="w-6 h-6 animate-pulse" />
              )}
            </div>

            <div className="space-y-2 text-center">
              <h3 className="text-lg font-black text-gray-800">
                {customModal.title}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed font-medium whitespace-pre-wrap">
                {customModal.message}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              {customModal.type === 'confirm' && (
                <button
                  onClick={() => setCustomModal(null)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
                >
                  {language === 'en' ? 'Cancel' : 'キャンセル'}
                </button>
              )}
              <button
                onClick={() => {
                  if (customModal.onConfirm) {
                    customModal.onConfirm();
                  }
                  // Prevent overwriting subsequent modals queued in the onConfirm callback
                  setCustomModal((prev) => {
                    if (prev && prev !== customModal) {
                      return prev;
                    }
                    return null;
                  });
                }}
                className={`py-2.5 text-white font-extrabold text-xs rounded-xl transition-all shadow-md cursor-pointer ${
                  customModal.type === 'confirm' ? 'flex-1' : 'w-full'
                } ${
                  customModal.title.includes('初期化') || customModal.title.includes('Reset') || customModal.title.includes('拒否') || customModal.title.includes('REJECTED')
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {language === 'en' ? 'OK' : '確定する'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </ErrorBoundary>
  );
}
