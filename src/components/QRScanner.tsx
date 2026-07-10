/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { BusStop, CollectedStamp, TabType } from '../types';
import { BUS_STOPS } from '../data/busStops';
import confetti from 'canvas-confetti';
import { 
  Camera, 
  X, 
  AlertCircle, 
  CheckCircle, 
  Sparkles, 
  RefreshCw, 
  Smartphone,
  ExternalLink,
  Bus,
  MapPin,
  HelpCircle
} from 'lucide-react';

interface QRScannerProps {
  collectedStamps: CollectedStamp[];
  onCollectStamp: (stopId: string, method: 'camera' | 'simulation') => boolean;
  onNavigateToTab: (tab: TabType) => void;
}

export default function QRScanner({
  collectedStamps,
  onCollectStamp,
  onNavigateToTab,
}: QRScannerProps) {
  const scannerContainerId = 'qr-reader-viewport';
  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [successStop, setSuccessStop] = useState<BusStop | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [availableCameras, setAvailableCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');

  interface CameraDevice {
    id: string;
    label: string;
  }

  // Parse scanned QR code data
  const handleQrSuccess = (decodedText: string) => {
    console.log('QR Code Scanned successfully:', decodedText);
    
    // We support several QR formats:
    // 1. Plain text: "ryu-bus-stamp-1" (or other stop numbers)
    // 2. URL containing stamp: "http://some-url/?stamp=stop-1" or "?stamp=1"
    let stopId: string | null = null;

    // Check for explicit ID patterns
    const plainMatch = decodedText.match(/ryu-bus-stamp-(\d+)/);
    if (plainMatch) {
      const stopNumber = plainMatch[1];
      const stop = BUS_STOPS.find(s => s.id === `stop-${stopNumber}` || s.numberLabel === stopNumber);
      if (stop) stopId = stop.id;
    } else {
      // Try parsing as URL or generic numbers
      try {
        if (decodedText.startsWith('http') || decodedText.includes('?')) {
          const url = new URL(decodedText);
          const stampParam = url.searchParams.get('stamp');
          if (stampParam) {
            // Can be "stop-1" or "1"
            const stop = BUS_STOPS.find(s => s.id === stampParam || s.id === `stop-${stampParam}` || s.numberLabel === stampParam);
            if (stop) stopId = stop.id;
          }
        }
      } catch (e) {
        // Not a valid URL, check if it's just a number like "1" or "6"
      }
    }

    // Fallback: If scanned text matches a specific bus stop number or id directly
    if (!stopId) {
      const matchedStop = BUS_STOPS.find(
        s => s.id === decodedText || 
             s.numberLabel === decodedText || 
             s.name === decodedText ||
             decodedText.toLowerCase().includes(`stop-${s.numberLabel}`)
      );
      if (matchedStop) {
        stopId = matchedStop.id;
      }
    }

    if (stopId) {
      const stopObj = BUS_STOPS.find(s => s.id === stopId);
      if (stopObj) {
        const isNew = onCollectStamp(stopId, 'camera');
        
        // Trigger celebration!
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#3b82f6', '#f59e0b', '#ec4899']
        });

        setSuccessStop(stopObj);
        stopScanning();
      }
    } else {
      // Valid QR code but not matching our bus stops
      setScanError('龍ケ崎市コミュニティバスのスタンプQRコードではないようです。もう一度お確かめください。\n(読み取った内容: ' + decodedText + ')');
      // Clear error after 5 seconds
      setTimeout(() => setScanError(null), 5000);
    }
  };

  const startScanning = async () => {
    setScanError(null);
    setSuccessStop(null);
    setIsScanning(true);

    // Initialize Html5Qrcode
    setTimeout(async () => {
      try {
        const qrScanner = new Html5Qrcode(scannerContainerId);
        qrScannerRef.current = qrScanner;

        // Request cameras list
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setHasCameraPermission(true);
          setAvailableCameras(devices);
          
          // Use back camera if available, otherwise first camera
          const backCam = devices.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('rear') ||
            device.label.toLowerCase().includes('環境')
          );
          const camId = backCam ? backCam.id : devices[0].id;
          setSelectedCameraId(camId);

          await qrScanner.start(
            camId,
            {
              fps: 15,
              qrbox: (width, height) => {
                const size = Math.min(width, height) * 0.7;
                return { width: size, height: size };
              },
              aspectRatio: 1.0
            },
            handleQrSuccess,
            (errorMessage) => {
              // Verbose error logging bypassed for smoother experience
            }
          );
        } else {
          setHasCameraPermission(false);
          setScanError('カメラが見つかりませんでした。別のデバイスで試すか、下のテストスキャンをお試しください。');
          setIsScanning(false);
        }
      } catch (err: any) {
        console.error('Camera initialization error:', err);
        setHasCameraPermission(false);
        setScanError('カメラの起動に失敗しました。ブラウザのカメラ権限が許可されているかご確認ください。');
        setIsScanning(false);
      }
    }, 300);
  };

  const stopScanning = async () => {
    if (qrScannerRef.current && qrScannerRef.current.isScanning) {
      try {
        await qrScannerRef.current.stop();
      } catch (err) {
        console.error('Error stopping QR scanner:', err);
      }
    }
    qrScannerRef.current = null;
    setIsScanning(false);
  };

  // Stop scanning when component unmounts
  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        stopScanning();
      }
    };
  }, []);

  const changeCamera = async (cameraId: string) => {
    if (!qrScannerRef.current) return;
    setSelectedCameraId(cameraId);
    try {
      await stopScanning();
      setIsScanning(true);
      setTimeout(async () => {
        const qrScanner = new Html5Qrcode(scannerContainerId);
        qrScannerRef.current = qrScanner;
        await qrScanner.start(
          cameraId,
          {
            fps: 15,
            qrbox: (width, height) => {
              const size = Math.min(width, height) * 0.7;
              return { width: size, height: size };
            }
          },
          handleQrSuccess,
          () => {}
        );
      }, 300);
    } catch (err) {
      setScanError('カメラの切り替えに失敗しました。');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Introduction Card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-sm animate-pulse">
          <Camera className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-gray-800">
            QRコードリーダー (スタンプ収集)
          </h3>
          <p className="text-gray-500 text-xs max-w-md mx-auto">
            バス停に貼られているスタンプラリー用のQRコードをスマートフォンのカメラで読み取ることで、スタンプが自動的に台帳に記録されます。
          </p>
        </div>

        {/* Display camera access disclaimer for iframe */}
        <div className="bg-amber-50 border border-amber-200/60 p-4 rounded-xl text-left text-xs text-amber-900 space-y-1 max-w-lg mx-auto">
          <p className="font-bold flex items-center gap-1.5 text-amber-900">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            【重要】プレビュー環境での動作について
          </p>
          <p className="text-amber-800/90 leading-relaxed">
            現在、セキュリティで保護されたiframe内（開発プレビュー画面）で動作しています。お使いのブラウザや端末によってはカメラの起動が制限される場合があります。
          </p>
          <p className="text-amber-800/90 leading-relaxed">
            カメラが起動しない場合は、上部またはブラウザメニューの<strong>「別タブで開く」</strong>ボタンから直接本アプリを起動し、カメラへのアクセス許可をしてお試しください。
          </p>
        </div>
      </div>

      {/* Success Notification overlay or view */}
      {successStop && (
        <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-6 text-center space-y-5 shadow-lg animate-scaleUp">
          <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
            <CheckCircle className="w-10 h-10 stroke-[2.5]" />
          </div>
          <div className="space-y-2">
            <span className="text-xs font-bold text-emerald-800 tracking-wider uppercase bg-emerald-100 px-3 py-1 rounded-full">
              スタンプ獲得成功！
            </span>
            <h4 className="text-2xl font-extrabold text-gray-800">
              #{successStop.numberLabel} {successStop.name}
            </h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
              スタンプ台帳への自動記録が完了しました！{successStop.name}の限定デザインスタンプが追加されました。
            </p>
          </div>

          <div className="flex gap-3 max-w-sm mx-auto">
            <button
              onClick={() => {
                setSuccessStop(null);
                onNavigateToTab('stamps');
              }}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-95"
            >
              スタンプ帳を確認
            </button>
            <button
              onClick={() => {
                setSuccessStop(null);
                startScanning();
              }}
              className="flex-1 py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-bold text-sm rounded-xl transition-all shadow-xs active:scale-95"
            >
              続けてスキャン
            </button>
          </div>
        </div>
      )}

      {/* Scanner viewfinder */}
      {!successStop && (
        <div className="bg-black rounded-3xl overflow-hidden shadow-xl aspect-square max-w-md mx-auto border-4 border-gray-950 relative flex flex-col justify-between">
          {!isScanning ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-white/40 border border-white/20">
                <Camera className="w-10 h-10" />
              </div>
              <p className="text-white/60 text-xs">
                「スキャンを開始する」ボタンを押すとカメラが起動します
              </p>
              <button
                onClick={startScanning}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl transition-all shadow-lg active:scale-95 flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                スキャンを開始する
              </button>
            </div>
          ) : (
            <>
              {/* Active Scanner Viewport */}
              <div id={scannerContainerId} className="w-full h-full relative" />

              {/* Viewfinder overlay laser & brackets */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-[70%] h-[70%] border-2 border-white/30 rounded-2xl relative">
                  {/* Top-Left Bracket */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-lg" />
                  {/* Top-Right Bracket */}
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-lg" />
                  {/* Bottom-Left Bracket */}
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-lg" />
                  {/* Bottom-Right Bracket */}
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-lg" />

                  {/* Laser Scanning Line */}
                  <div className="absolute left-2 right-2 h-0.5 bg-emerald-500/80 shadow-[0_0_10px_#10b981] animate-laser" />
                </div>
              </div>

              {/* Camera selection and close panel at the bottom */}
              <div className="absolute bottom-4 inset-x-4 flex items-center justify-between z-10 bg-black/70 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10">
                <div className="flex items-center gap-2">
                  {availableCameras.length > 1 && (
                    <select
                      value={selectedCameraId}
                      onChange={(e) => changeCamera(e.target.value)}
                      className="text-white bg-transparent outline-none text-xs border border-white/20 rounded px-2 py-1 cursor-pointer"
                    >
                      {availableCameras.map(cam => (
                        <option key={cam.id} value={cam.id} className="text-black bg-white">
                          {cam.label.length > 20 ? cam.label.substring(0, 18) + '...' : cam.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <button
                  onClick={stopScanning}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition-all"
                >
                  閉じる
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Persistent error message */}
      {scanError && (
        <div className="bg-red-50 border border-red-200 text-red-900 p-4 rounded-xl text-xs flex gap-2.5 max-w-md mx-auto items-start">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p className="whitespace-pre-line leading-relaxed">{scanError}</p>
        </div>
      )}
    </div>
  );
}
