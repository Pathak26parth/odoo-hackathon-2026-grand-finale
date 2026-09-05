// components/faceRecognition/FaceDetectionFrame.jsx
import React from 'react';
import { Scan, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export const FaceDetectionFrame = ({ state = 'Looking for Face' }) => {
  // states: 'Camera Ready', 'Looking for Face', 'Face Detected', 'Verifying Identity', 'Identity Verified', 'Verification Failed'

  const isVerified = state === 'Identity Verified';
  const isFailed = state === 'Verification Failed';
  const isVerifying = state === 'Verifying Identity';
  const isDetected = state === 'Face Detected';

  const borderColor = isVerified
    ? 'border-emerald-500'
    : isFailed
    ? 'border-rose-500'
    : isDetected || isVerifying
    ? 'border-blue-400'
    : 'border-slate-400/60';

  const badgeColor = isVerified
    ? 'bg-emerald-500/90 text-white'
    : isFailed
    ? 'bg-rose-500/90 text-white'
    : isDetected || isVerifying
    ? 'bg-blue-600/90 text-white'
    : 'bg-slate-800/80 text-slate-200';

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
      {/* Target Face Box */}
      <div
        className={`relative w-56 h-72 sm:w-64 sm:h-80 border-2 rounded-3xl transition-all duration-300 ${borderColor} ${
          isVerifying ? 'scale-102 ring-4 ring-blue-500/20' : ''
        } ${isVerified ? 'scale-105 ring-4 ring-emerald-500/30' : ''}`}
      >
        {/* Corner Targets */}
        <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-inherit rounded-tl-xl" />
        <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-inherit rounded-tr-xl" />
        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-inherit rounded-bl-xl" />
        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-inherit rounded-br-xl" />

        {/* Laser scan line animation while verifying */}
        {isVerifying && (
          <div className="absolute inset-x-2 h-0.5 bg-blue-400/80 shadow-[0_0_12px_#60a5fa] animate-bounce top-1/2" />
        )}

        {/* Center alignment crosshair */}
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
          <div className="w-12 h-0.5 bg-white rounded-full" />
          <div className="h-12 w-0.5 bg-white rounded-full absolute" />
        </div>
      </div>

      {/* State Badge */}
      <div className="mt-4 pointer-events-auto">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md shadow-md transition-all ${badgeColor}`}
        >
          {isVerifying && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {isVerified && <CheckCircle2 className="w-3.5 h-3.5" />}
          {isFailed && <AlertCircle className="w-3.5 h-3.5" />}
          {!isVerifying && !isVerified && !isFailed && <Scan className="w-3.5 h-3.5" />}
          {state}
        </span>
      </div>
    </div>
  );
};
