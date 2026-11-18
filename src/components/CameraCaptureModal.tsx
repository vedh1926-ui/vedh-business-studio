'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera,
  Check,
  RefreshCw,
  RotateCcw,
  Upload,
  VideoOff,
  X,
} from 'lucide-react';

/**
 * Detects mobile/tablet browsers where `<input type="file" accept="image/*" capture="environment" />`
 * launches the native OS rear camera app directly (with autofocus, flash, and HDR).
 */
export function isMobileCameraDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(navigator.userAgent);
}

function buildTimestampedImageName(prefix: string): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(
    now.getHours()
  )}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const cleanPrefix = prefix
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'photo';
  return `${cleanPrefix}-${stamp}.jpg`;
}

/**
 * Normalizes camera-captured image files:
 * 1. Replaces generic camera filenames ("image.jpg", "blob", etc.) with a clear timestamped name.
 * 2. Gently optimizes oversized (> 2.5 MB) camera photos to max 2048px JPEG so mobile uploads stay fast.
 */
export async function normalizeCapturedImageFile(
  file: File,
  prefix = 'photo'
): Promise<File> {
  const genericNames = new Set([
    '',
    'image.jpg',
    'image.jpeg',
    'image.png',
    'photo.jpg',
    'photo.jpeg',
    'capture.jpg',
    'blob',
  ]);
  const lowerName = (file.name || '').trim().toLowerCase();
  const desiredName = genericNames.has(lowerName)
    ? buildTimestampedImageName(prefix)
    : file.name;

  // Skip resizing for non-images or reasonably sized photos
  if (!file.type.startsWith('image/') || file.size <= 2.5 * 1024 * 1024) {
    if (desiredName !== file.name) {
      return new File([file], desiredName, {
        type: file.type || 'image/jpeg',
        lastModified: file.lastModified || Date.now(),
      });
    }
    return file;
  }

  try {
    const objectUrl = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error('Image decode failed'));
        el.src = objectUrl;
      });

      const maxDim = 2048;
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;
      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return file;
      ctx.drawImage(img, 0, 0, width, height);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.88)
      );
      if (!blob) return file;

      const jpgName = desiredName.replace(/\.[a-z0-9]+$/i, '.jpg');
      return new File([blob], jpgName.endsWith('.jpg') ? jpgName : `${jpgName}.jpg`, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch {
    if (desiredName !== file.name) {
      return new File([file], desiredName, {
        type: file.type || 'image/jpeg',
        lastModified: file.lastModified || Date.now(),
      });
    }
    return file;
  }
}

export interface CameraCaptureModalProps {
  title?: string;
  subtitle?: string;
  filePrefix?: string;
  onCapture: (file: File) => void;
  onFallbackUpload?: () => void;
  onClose: () => void;
}

export default function CameraCaptureModal({
  title = 'Take Photo with Camera',
  subtitle = 'Capture a crisp image directly from your device camera',
  filePrefix = 'photo',
  onCapture,
  onFallbackUpload,
  onClose,
}: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fallbackFileInputRef = useRef<HTMLInputElement | null>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [starting, setStarting] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [capturedPreviewUrl, setCapturedPreviewUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        try {
          track.stop();
        } catch {
          // ignore
        }
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(
    async (mode: 'environment' | 'user') => {
      stopStream();
      setStarting(true);
      setErrorMsg(null);

      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getUserMedia !== 'function'
      ) {
        setStarting(false);
        setErrorMsg(
          'Live browser camera is unavailable in this browser or context. You can still upload a photo directly from your device.'
        );
        return;
      }

      try {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: mode },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
            audio: false,
          });
        } catch {
          // Fallback to any available webcam without strict facingMode/resolution constraints
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setStarting(false);
      } catch (err) {
        setStarting(false);
        const name = (err as { name?: string })?.name || '';
        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
          setErrorMsg(
            'Camera permission was denied. Allow camera access in your browser address bar, or upload a photo from your device below.'
          );
        } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
          setErrorMsg(
            'No camera was detected on this device. Connect a camera or upload a photo from your device below.'
          );
        } else {
          setErrorMsg(
            'Could not access the camera right now. Ensure no other app is using it, or upload a photo from your device below.'
          );
        }
      }
    },
    [stopStream]
  );

  useEffect(() => {
    if (!capturedPreviewUrl) {
      startCamera(facingMode);
    }
    return () => {
      stopStream();
    };
  }, [facingMode, capturedPreviewUrl, startCamera, stopStream]);

  useEffect(() => {
    return () => {
      if (capturedPreviewUrl) {
        URL.revokeObjectURL(capturedPreviewUrl);
      }
    };
  }, [capturedPreviewUrl]);

  const handleSnap = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        stopStream();
        if (capturedPreviewUrl) URL.revokeObjectURL(capturedPreviewUrl);
        setCapturedBlob(blob);
        setCapturedPreviewUrl(URL.createObjectURL(blob));
      },
      'image/jpeg',
      0.9
    );
  };

  const handleRetake = () => {
    if (capturedPreviewUrl) URL.revokeObjectURL(capturedPreviewUrl);
    setCapturedPreviewUrl(null);
    setCapturedBlob(null);
  };

  const handleConfirmPhoto = async () => {
    if (!capturedBlob) return;
    setBusy(true);
    try {
      const rawFile = new File([capturedBlob], buildTimestampedImageName(filePrefix), {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });
      const finalFile = await normalizeCapturedImageFile(rawFile, filePrefix);
      stopStream();
      onCapture(finalFile);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const handleFallbackFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const normalized = await normalizeCapturedImageFile(f, filePrefix);
    stopStream();
    onCapture(normalized);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] border border-[#E8DDCF] shadow-2xl overflow-hidden flex flex-col">
        {/* Sticky Header */}
        <div className="bg-[#FAF5EE] border-b border-[#E8DDCF] px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#541523] text-white flex items-center justify-center shrink-0">
              <Camera size={16} />
            </div>
            <div className="min-w-0">
              <h3 className="font-serif text-base font-bold text-[#2C181B] truncate">
                {title}
              </h3>
              <p className="text-[11px] text-[#7A6E6E] truncate">{subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopStream();
              onClose();
            }}
            className="p-1.5 text-stone-400 hover:text-[#541523] hover:bg-[#F2EBE0] rounded-lg transition"
            aria-label="Close camera modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Viewport Body */}
        <div className="p-4 bg-[#1C1214] flex-1 min-h-0 flex items-center justify-center overflow-y-auto">
          {capturedPreviewUrl ? (
            <img
              src={capturedPreviewUrl}
              alt="Captured photo preview"
              className="max-h-[56vh] w-auto max-w-full rounded-xl object-contain border border-white/15 shadow-lg"
            />
          ) : errorMsg ? (
            <div className="bg-white rounded-xl p-6 text-center max-w-md space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto">
                <VideoOff size={22} />
              </div>
              <h4 className="text-sm font-bold text-[#2C181B]">Camera Not Available</h4>
              <p className="text-xs text-[#635B5B] leading-relaxed">{errorMsg}</p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#D9C9B4] bg-white text-[#541523] text-xs font-semibold hover:bg-[#FAF6F0]"
                >
                  <RefreshCw size={13} />
                  <span>Retry Camera</span>
                </button>
                <input
                  ref={fallbackFileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFallbackFilePicked}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (onFallbackUpload) {
                      stopStream();
                      onClose();
                      onFallbackUpload();
                    } else {
                      fallbackFileInputRef.current?.click();
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#541523] text-white text-xs font-semibold hover:bg-[#6E1C30]"
                >
                  <Upload size={13} />
                  <span>Choose Photo from Device</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="relative w-full flex items-center justify-center min-h-[260px]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="max-h-[56vh] w-full rounded-xl object-contain bg-black border border-white/10"
              />
              {starting && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-xl text-white text-xs gap-2">
                  <Camera size={24} className="animate-pulse text-[#F2D59B]" />
                  <span>Starting camera...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sticky Footer Controls */}
        <div className="px-5 py-3.5 bg-[#FAF5EE] border-t border-[#E8DDCF] flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
          {capturedPreviewUrl ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                disabled={busy}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#D9C9B4] bg-white text-[#541523] font-semibold hover:bg-[#F2EBE0]"
              >
                <RotateCcw size={14} />
                <span>Retake</span>
              </button>
              <button
                type="button"
                onClick={handleConfirmPhoto}
                disabled={busy}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#541523] text-white font-semibold hover:bg-[#6E1C30] shadow-sm disabled:opacity-60"
              >
                <Check size={15} />
                <span>{busy ? 'Processing...' : 'Use Photo'}</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() =>
                  setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
                }
                disabled={starting || Boolean(errorMsg)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#D9C9B4] bg-white text-[#541523] font-semibold hover:bg-[#F2EBE0] disabled:opacity-50"
                title="Switch between rear and front camera"
              >
                <RefreshCw size={13} />
                <span>Switch Camera</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    stopStream();
                    onClose();
                  }}
                  className="px-3.5 py-2 rounded-lg border border-[#D9C9B4] bg-white text-[#635B5B] font-medium hover:bg-[#F2EBE0]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSnap}
                  disabled={starting || Boolean(errorMsg)}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#541523] text-white font-semibold hover:bg-[#6E1C30] shadow-sm disabled:opacity-50"
                >
                  <Camera size={15} />
                  <span>Capture Photo</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export interface CameraTriggerButtonProps {
  onPhotoCaptured: (file: File) => void;
  onFallbackUpload?: () => void;
  title?: string;
  modalTitle?: string;
  modalSubtitle?: string;
  filePrefix?: string;
  label?: string;
  className?: string;
  iconSize?: number;
  disabled?: boolean;
  ariaLabel?: string;
}

/**
 * Drop-in Camera trigger button that works identically across mobile and desktop:
 * - On Android/iOS: opens the native device rear camera (`capture="environment"`).
 * - On Desktop/Laptop: opens the live browser CameraCaptureModal (with file fallback).
 */
export function CameraTriggerButton({
  onPhotoCaptured,
  onFallbackUpload,
  title = 'Take photo with camera',
  modalTitle = 'Take Photo with Camera',
  modalSubtitle = 'Capture an image directly using your camera',
  filePrefix = 'photo',
  label = 'Camera',
  className = 'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#541523] bg-white text-[#541523] text-[11px] font-semibold hover:bg-[#541523]/5 shrink-0',
  iconSize = 14,
  disabled = false,
  ariaLabel,
}: CameraTriggerButtonProps) {
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);
  const [openModal, setOpenModal] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    if (isMobileCameraDevice()) {
      nativeCameraInputRef.current?.click();
    } else {
      setOpenModal(true);
    }
  };

  const handleNativeCameraChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.files?.[0];
    e.target.value = '';
    if (!raw) return;
    const normalized = await normalizeCapturedImageFile(raw, filePrefix);
    onPhotoCaptured(normalized);
  };

  return (
    <>
      <input
        ref={nativeCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleNativeCameraChange}
        className="hidden"
        aria-label={ariaLabel || title}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={handleClick}
        title={title}
        aria-label={ariaLabel || title}
        className={className}
      >
        <Camera size={iconSize} />
        {label ? <span>{label}</span> : null}
      </button>

      {openModal && (
        <CameraCaptureModal
          title={modalTitle}
          subtitle={modalSubtitle}
          filePrefix={filePrefix}
          onCapture={onPhotoCaptured}
          onFallbackUpload={onFallbackUpload}
          onClose={() => setOpenModal(false)}
        />
      )}
    </>
  );
}
