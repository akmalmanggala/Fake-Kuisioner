/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Cat, ChevronRight, Gift, Calendar, Star, X } from 'lucide-react';
import confetti from 'canvas-confetti';

// --- Components ---

const isVideoSrc = (src: string) => /\.(mp4|webm|mov)$/i.test(src);

// Optional perf helper:
// If you provide smaller thumbnail files next to the originals using the naming
// pattern `name.thumb.jpg` (or .png/.jpeg), the timeline will prefer those.
// It automatically falls back to the original file if the thumb doesn't exist.
const toThumbSrc = (src: string) => {
  if (isVideoSrc(src)) return src;
  return src.replace(/(\.[a-z0-9]+)$/i, '.thumb$1');
};

const TimelineImageThumb: React.FC<{
  src: string;
  className: string;
  width?: number;
  height?: number;
  loading?: React.ImgHTMLAttributes<HTMLImageElement>['loading'];
  decoding?: React.ImgHTMLAttributes<HTMLImageElement>['decoding'];
  fetchPriority?: React.ImgHTMLAttributes<HTMLImageElement>['fetchPriority'];
}> = ({
  src,
  className,
  width = 128,
  height = 128,
  loading = 'lazy',
  decoding = 'async',
  fetchPriority = 'low',
}) => {
  const [resolvedSrc, setResolvedSrc] = useState(() => toThumbSrc(src));

  useEffect(() => {
    setResolvedSrc(toThumbSrc(src));
  }, [src]);

  return (
    <img
      src={resolvedSrc}
      alt=""
      width={width}
      height={height}
      loading={loading}
      decoding={decoding}
      fetchPriority={fetchPriority}
      className={className}
      onError={() => {
        // If the thumbnail doesn't exist, fall back to the original.
        if (resolvedSrc !== src) setResolvedSrc(src);
      }}
    />
  );
};

const ScratchCard: React.FC<{ onComplete: () => void; children: React.ReactNode }> = ({ onComplete, children }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDone, setIsDone] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;

        // Ensure we're drawing the opaque cover (not erasing).
        ctx.globalCompositeOperation = 'source-over';
        
        // Fill with Sage Green
        ctx.fillStyle = '#b2c2b2'; // sage-300
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add text
        ctx.font = '24px Inter';
        ctx.fillStyle = '#465146'; // sage-700
        ctx.textAlign = 'center';
        ctx.fillText('Gosok pelan-pelan layar ini sayangg', canvas.width / 2, canvas.height / 2);
      }
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const scratch = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 36, 0, Math.PI * 2);
    ctx.fill();

    // Check percentage
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparent = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] < 128) transparent++;
    }
    const percent = (transparent / (pixels.length / 4)) * 100;
    if (percent > 50 && !isDone) {
      setIsDone(true);
      onComplete();
    }
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const pos = getPos(e);
    scratch(pos.x, pos.y);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const pos = getPos(e);
    scratch(pos.x, pos.y);
  };

  const handleEnd = () => setIsDrawing(false);

  return (
    <div className="relative w-full max-w-md md:max-w-lg h-[68vh] md:h-[72vh] max-h-[640px] mx-auto rounded-3xl overflow-hidden shadow-xl bg-white border-4 border-sage-200">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-sage-50/60 to-white" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-10 -left-10 text-sage-200">
          <Heart size={140} className="opacity-50 rotate-12" fill="currentColor" />
        </div>
        <div className="absolute -top-8 -right-8 text-sage-200">
          <Star size={120} className="opacity-40 -rotate-12" fill="currentColor" />
        </div>
        <div className="absolute -bottom-12 -left-8 text-sage-200">
          <Star size={130} className="opacity-35 rotate-6" fill="currentColor" />
        </div>
        <div className="absolute -bottom-10 -right-10 text-sage-200">
          <Heart size={150} className="opacity-40 -rotate-6" fill="currentColor" />
        </div>
        <div className="absolute top-1/2 left-6 -translate-y-1/2 text-sage-200 hidden md:block">
          <Cat size={110} className="opacity-20 rotate-6" />
        </div>
        <div className="absolute top-1/2 right-6 -translate-y-1/2 text-sage-200 hidden md:block">
          <Cat size={110} className="opacity-20 -rotate-6" />
        </div>
        <div className="absolute inset-4 rounded-[1.5rem] border border-dashed border-sage-200/80" />
      </div>

      <div className="absolute inset-0 z-10 p-6 md:p-8 flex flex-col justify-center items-center text-center">
        {children}
      </div>
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 z-20 cursor-crosshair transition-opacity duration-1000 ${isDone ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      />
    </div>
  );
};

const BirthdayCake: React.FC<{ lit: boolean }> = ({ lit }) => {
  const candles = [110, 140, 170, 200];
  return (
    <div className="w-full max-w-lg mx-auto">
      <motion.svg
        viewBox="0 0 320 380"
        className="w-full h-auto"
        aria-label="Kue ulang tahun dengan lilin"
      >
        {/* Plate */}
        <ellipse cx="160" cy="338" rx="132" ry="20" className="fill-white/70" />
        <ellipse cx="160" cy="340" rx="122" ry="16" className="fill-white" />
        <ellipse cx="160" cy="340" rx="122" ry="16" className="stroke-sage-200" fill="none" strokeWidth="3" />

        {/* Bottom tier */}
        <g>
          <rect x="48" y="200" width="224" height="120" rx="40" className="fill-white" />
          <rect x="48" y="200" width="224" height="120" rx="40" className="fill-sage-100" opacity="0.65" />
          <rect x="48" y="200" width="224" height="120" rx="40" className="stroke-sage-300" fill="none" strokeWidth="4" />
          <ellipse cx="160" cy="200" rx="112" ry="26" className="fill-white" />
          <ellipse cx="160" cy="200" rx="112" ry="26" className="fill-sage-100" opacity="0.55" />
          <ellipse cx="160" cy="200" rx="112" ry="26" className="stroke-sage-300" fill="none" strokeWidth="4" />

          {/* Bottom icing drip */}
          <path
            d="M66 214 C 90 194, 114 230, 138 210 C 150 200, 164 214, 176 206 C 198 192, 216 230, 240 210 C 258 194, 268 206, 272 214 L 272 242 C 256 254, 244 238, 226 250 C 204 264, 188 238, 166 252 C 140 268, 124 244, 102 258 C 84 270, 74 260, 66 252 L 66 214 Z"
            className="fill-white"
            opacity="0.98"
          />
          <path
            d="M66 214 C 90 194, 114 230, 138 210 C 150 200, 164 214, 176 206 C 198 192, 216 230, 240 210 C 258 194, 268 206, 272 214"
            className="stroke-sage-300"
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Bottom tier sprinkles */}
          <circle cx="94" cy="266" r="6" className="fill-sage-200" />
          <circle cx="126" cy="286" r="5" className="fill-sage-200" />
          <circle cx="208" cy="274" r="6" className="fill-sage-200" />
          <circle cx="232" cy="296" r="5" className="fill-sage-200" />

          {/* Shine */}
          <path
            d="M92 284 C 112 262, 134 274, 148 260"
            className="stroke-white"
            strokeWidth="10"
            strokeLinecap="round"
            opacity="0.55"
          />
        </g>

        {/* Top tier */}
        <g>
          <rect x="86" y="120" width="148" height="86" rx="34" className="fill-white" />
          <rect x="86" y="120" width="148" height="86" rx="34" className="fill-sage-100" opacity="0.7" />
          <rect x="86" y="120" width="148" height="86" rx="34" className="stroke-sage-300" fill="none" strokeWidth="4" />
          <ellipse cx="160" cy="120" rx="74" ry="20" className="fill-white" />
          <ellipse cx="160" cy="120" rx="74" ry="20" className="fill-sage-100" opacity="0.6" />
          <ellipse cx="160" cy="120" rx="74" ry="20" className="stroke-sage-300" fill="none" strokeWidth="4" />

          {/* Top icing line */}
          <path
            d="M98 134 C 114 120, 132 150, 150 132 C 160 124, 172 138, 182 130 C 198 118, 210 148, 226 132"
            className="stroke-sage-300"
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>

        {/* Candles + flames on the top tier */}
        {candles.map((x, idx) => (
          <g key={idx}>
            <rect x={x} y={70} width={16} height={50} rx={8} className="fill-white" />
            <rect x={x} y={70} width={16} height={50} rx={8} className="stroke-sage-300" fill="none" strokeWidth={3} />
            <path d={`M ${x + 3} 84 L ${x + 13} 74`} className="stroke-sage-400" strokeWidth={3} strokeLinecap="round" />
            <path d={`M ${x + 3} 104 L ${x + 13} 94`} className="stroke-sage-400" strokeWidth={3} strokeLinecap="round" />
            <path d={`M ${x + 3} 118 L ${x + 13} 108`} className="stroke-sage-400" strokeWidth={3} strokeLinecap="round" />

            {/* wick */}
            <path
              d={`M ${x + 8} 66 L ${x + 8} 70`}
              className="stroke-sage-700"
              strokeWidth={3}
              strokeLinecap="round"
            />

            {/* flame outer */}
            <motion.path
              d={`M ${x + 8} 40 C ${x + 18} 54, ${x + 12} 66, ${x + 8} 68 C ${x + 4} 66, ${x - 2} 54, ${x + 8} 40 Z`}
              className="fill-red-400"
              style={{ transformOrigin: `${x + 8}px 68px` }}
              initial={false}
              animate={
                lit
                  ? {
                      opacity: [0.75, 1, 0.85],
                      scaleY: [0.92, 1.08, 0.96],
                      rotate: [-2, 2, -1],
                    }
                  : { opacity: 0, scaleY: 0.7, y: 10 }
              }
              transition={
                lit
                  ? { duration: 0.9 + idx * 0.08, repeat: Infinity, ease: 'easeInOut' }
                  : { duration: 0.35, ease: 'easeOut' }
              }
            />
            {/* flame inner */}
            <motion.path
              d={`M ${x + 8} 48 C ${x + 14} 56, ${x + 11} 64, ${x + 8} 66 C ${x + 5} 64, ${x + 2} 56, ${x + 8} 48 Z`}
              className="fill-white"
              opacity={0.65}
              style={{ transformOrigin: `${x + 8}px 66px` }}
              initial={false}
              animate={lit ? { opacity: [0.45, 0.7, 0.55], scaleY: [0.95, 1.05, 0.98] } : { opacity: 0, y: 10 }}
              transition={lit ? { duration: 0.8 + idx * 0.07, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.25 }}
            />

            {/* smoke (only when blown) */}
            {!lit ? (
              <g>
                <motion.circle
                  key={`smoke-a-${idx}`}
                  cx={x + 6}
                  cy={56}
                  r={6}
                  className="fill-sage-400"
                  initial={{ opacity: 0, y: 8, scale: 0.9 }}
                  animate={{ opacity: [0, 0.22, 0], y: -22, scale: [0.9, 1.15, 1.35] }}
                  transition={{ duration: 1.25, ease: 'easeOut', delay: 0.02 * idx }}
                />
                <motion.circle
                  key={`smoke-b-${idx}`}
                  cx={x + 11}
                  cy={60}
                  r={5}
                  className="fill-sage-400"
                  initial={{ opacity: 0, y: 10, scale: 0.85 }}
                  animate={{ opacity: [0, 0.18, 0], y: -18, scale: [0.85, 1.1, 1.28] }}
                  transition={{ duration: 1.1, ease: 'easeOut', delay: 0.04 * idx }}
                />
              </g>
            ) : null}
          </g>
        ))}
      </motion.svg>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [currentSlide, setCurrentSlide] = useState(0); // Start at 0 for the fake survey
  const [surveyStep, setSurveyStep] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isRevealActive, setIsRevealActive] = useState(false);
  const revealTimeoutRef = useRef<number | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [reasonCards, setReasonCards] = useState<string[]>([]);
  const [showMoreCard, setShowMoreCard] = useState(false);
  const [moreWiggleCount, setMoreWiggleCount] = useState(0);
  const reasonsEndRef = useRef<HTMLDivElement | null>(null);
  const reasonsNextButtonRef = useRef<HTMLButtonElement | null>(null);
  const prevReasonCountRef = useRef(0);
  const prevShowMoreRef = useRef(false);
  const [quizNotice, setQuizNotice] = useState<null | { message: string; tone: 'error' | 'success' }>(null);
  const quizNoticeTimeoutRef = useRef<number | null>(null);
  const quizAdvanceTimeoutRef = useRef<number | null>(null);
  const wawaStaticButtonRef = useRef<HTMLButtonElement | null>(null);
  const wawaFixedButtonRef = useRef<HTMLButtonElement | null>(null);
  const mamalButtonRef = useRef<HTMLButtonElement | null>(null);
  const [mamalButtonSize, setMamalButtonSize] = useState<{ width: number; height: number } | null>(null);
  const [wawaButtonSize, setWawaButtonSize] = useState<{ width: number; height: number } | null>(null);
  const [wawaPosition, setWawaPosition] = useState<{ x: number; y: number }>({ x: 16, y: 16 });
  const [wawaRunning, setWawaRunning] = useState(false);
  const lastWawaMoveRef = useRef(0);
  const [candlesLit, setCandlesLit] = useState(true);
  
  const reasons = [
    "Karena kamu cantik banget",
    "Karena kamu lucu", 
    "Karena kamu imut menggemaskan",
    "Karena semua tipe yang aku cari ada di kamu",
    "Karena kamu baik banget, selalu perhatian, dan selalu pengertian sama aku",
    "Karena kamu uda mewarnai hidupku",
    "Karena kamu selalu bisa bikin aku ketawa, bahkan di saat-saat susah sekalipun",
    "Karena kamu selalu support aku, dan selalu percaya sama aku"
    ];

  const nextSlide = () => setCurrentSlide(prev => prev + 1);

  const closeLightbox = useCallback(() => {
    setLightboxSrc(null);
  }, []);

  useEffect(() => {
    if (!lightboxSrc) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [closeLightbox, lightboxSrc]);

  const openSurprise = async () => {
    // Important: play() should be called from a user gesture handler
    // to satisfy browser autoplay policies.
    if (revealTimeoutRef.current) window.clearTimeout(revealTimeoutRef.current);
    setIsRevealActive(true);
    try {
      const audio = audioRef.current;
      if (audio) {
        // Autoplay-policy friendly: start playback from a user gesture.
        // Keep it silent during analysis, then restart from 0 when greeting appears.
        audio.currentTime = 0;
        audio.volume = 0;
        await audio.play();
      }
    } catch {
      // If a browser blocks it anyway, we silently ignore.
    }

    revealTimeoutRef.current = window.setTimeout(() => {
      setIsRevealActive(false);
      setCurrentSlide(1);
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.volume = 0.35;
      }
    }, 2600);
  };

  const timelineItems = useMemo(
    () => [
      {
        icon: 'heart' as const,
        date: '22 Agustus 2025',
        text: '"HARI PERTAMA KITA KETEMU! Di sini semua berawal, dan ini juga pengalaman pertama kali aku jalan sama cewe. Deg-degan banget tapi seruuu. Trus pulangnya kita mam nasi gorenggg"',
        photos: ['/photos/2025-08-22/image.png'],
      },
      {
        icon: 'star' as const,
        date: '16 September 2025',
        text: '"MIE AYAM PERTAMA KITAA!! Di sini aku ngeberaniin diri ngajak kamu mam mie ayam loh, takut banget ditolak sebenarnya, eh ternyata kamu mau yeayyy"',
        photos: ['/photos/2025-09-16/image.png'],
      },
      {
        icon: 'cat' as const,
        date: '3 Oktober 2025',
        text: '"FOTBAR PETAMA KITAA!! Di sini aku dah ngerasa makin deket sama kamu, makin nyaman, makin pengen sering-sering ketemu, dan udah mikirin kapan mau nembak kamu hehehe"',
        photos: ['/photos/2025-10-03/image.png', '/photos/2025-10-03/image copy.png'],
      },
      {
        icon: 'heart' as const,
        date: '25 Oktober 2025',
        text: '"DORRRR!! Di sini kita resmi jadi pasangan, dari yang awalnya cuma dari DM IG gajelas kita, pindah ke WA, terus 3 kali ketemu, dan sampai akhirnya kita jadian. Di sini juga aku ngerasain kebahagiaan yang baru, yang sebelumnya gak pernah aku rasain. Seneng banget rasanya akhirnya bisa punya kamu sebagai pacar, bisa lebih sering ketemu kamu, dan bisa lebih kenal kamu. Pokoknya ini salah satu hari terbaik di hidup aku💚💚💚!!"',
      },
      {
        icon: 'star' as const,
        date: '28 Oktober 2025',
        text: '"First date kita setelah jadian, kita ngerayain ulang tahun aku bareng di kafe. Akhirnya kita main sebagai pasangan beneran hahahahaha. Di sini adalah pelukan pertama kamu ke aku dan itu rasanya nyaman banget hehe, walau aku agak grogi ya hahahaha"',
        photos: [
          '/photos/2025-10-28/image.png',
          '/photos/2025-10-28/image copy.png',
          '/photos/2025-10-28/WhatsApp Image 2026-02-22 at 10.29.22 AM.jpeg',
        ],
      },
      {
        icon: 'cat' as const,
        date: '5 November 2025',
        text: '"MAM AMERR! Di sini kita mam makanan kesukaan kamu, terus kita lanjut ngobrol di wisdom sampai akhirnya lari"an karna kehujanan HAHAHAHA. Oh ya, di sini juga pertama kali kita post mam bareng di IG, dan temen"ku pada nanya itu siapa hahahaha"',
        photos: ['/photos/2025-11-05/WhatsApp Image 2026-02-22 at 12.49.54 PM.jpeg'],
      },
      {
        icon: 'heart' as const,
        date: '21 November 2025',
        text: '"Kita mam the rock burger, terus bingung cari masjid buat sholat magrib hahaha. Di sini kita kehujanan, terus bingung mau kemana lagi dan akhirnya ke kafe. Di kafe kita bikin video bareng pertama kali, terus pas dipost di IG, temen" pada nanya itu siapa lagi hahahaha, karena videonya mata doang hahahaha"',
        photos: [
          '/photos/2025-11-21/WhatsApp Image 2026-02-22 at 12.50.06 PM.jpeg',
          '/photos/2025-11-21/WhatsApp Image 2026-02-22 at 12.50.06 PM copy.jpeg',
          '/photos/2025-11-21/WhatsApp Video 2026-02-22 at 12.50.58 PM.mp4',
        ],
      },
      {
        icon: 'star' as const,
        date: '29 November 2025',
        text: '"KONSER PERTAMA KITAA!! Di sini kita nonton konser porsenigama bareng, dan ini juga pengalaman pertama aku nonton konser sama cewe. Di sini kita foto bareng lagi, terus pas dipost di IG, akhirnya temen" pada tau kamu, karena sekarang keliatan mukanya hahahahaha"',
        photos: [
          '/photos/2025-11-29/00A52F9C-6BFF-43E9-8B88-AB6BCDD4B558.jpeg',
          '/photos/2025-11-29/22EC85C5-6287-4670-9F40-AA433D29A033.jpeg',
          '/photos/2025-11-29/03281231-3974-41F7-B922-8700A9BDA61B.mov',
        ],
      },
      {
        icon: 'cat' as const,
        date: '3 Desember 2025',
        text: '"Kamu temenin aku nugas, terus kita lanjut mam, YEAYYYY!!"',
        photos: [
          '/photos/2025-12-03/IMG_0619.JPG',
          '/photos/2025-12-03/WhatsApp Video 2026-02-22 at 1.02.07 PM.mp4',
        ],
      },
      {
        icon: 'heart' as const,
        date: '9 Desember 2025',
        text: '"Kita mam ayam bakar nyam nyam, terus kamu ngerjain tugas di sana hahahaha"',
        photos: ['/photos/2025-12-09/IMG_0901.JPG'],
      },
      {
        icon: 'star' as const,
        date: '11 Desember 2025',
        text: '"Ini pertama kali kita main dari siang sampai malam. Di sini kamu ngerjain UTS di mie ayam hahahaha, terus kita lanjut main di kafe sampai malem, dan pulangnya kita mam pecel lele"',
        photos: [
          '/photos/2025-12-11/image.png',
          '/photos/2025-12-11/image copy.png',
          '/photos/2025-12-11/image copy 2.png',
          '/photos/2025-12-11/image copy 3.png',
          '/photos/2025-12-11/image copy 4.png',
          '/photos/2025-12-11/IMG_0944.JPG',
          '/photos/2025-12-11/IMG_0977.JPG',
          '/photos/2025-12-11/IMG_0965.mov',
        ],
      },
      {
        icon: 'cat' as const,
        date: '18 Desember 2025',
        text: '"Main terakhir kita di 2025, terahir di semester 3, dan sebelum kamu pulang lagi ke Serang. Di sini kita mam amer lagi terus lanjut main di kafe."',
        photos: [
          '/photos/2025-12-18/IMG_1229.JPG',
          '/photos/2025-12-18/IMG_1230.JPG',
          '/photos/2025-12-18/copy_71FE6CB1-6B3B-4756-9A70-1B04429DDECB.mov',
        ],
      },
      {
        icon: 'heart' as const,
        date: '4 Februari 2026',
        text: '"Main kita pertama di 2026. Akhirnya setelah nda ketemu hampir 2 bulan kita main lagiii. Di sini kita main di Ambarukmo Plaza, kita nonton bioskop bareng dan ini pengalaman pertama aku juga nonton bioskop bareng cewe"',
        photos: [
          '/photos/2026-02-04/IMG_3665.jpg',
          '/photos/2026-02-04/IMG_3666.jpg',
          '/photos/2026-02-04/IMG_3678.jpg',
        ],
      },
      {
        icon: 'star' as const,
        date: '11 Februari 2026',
        text: '"Pertama kali kita photobox bareng!! Di sini akhirnya kita ngepublish hubungan kita di first account, dan ini juga pertama kalinya kita foto berdua di photobox"',
        photos: [
          '/photos/2026-02-11/IMG_5557.JPG',
          '/photos/2026-02-11/IMG_5565.JPG',
          '/photos/2026-02-11/IMG_5571.JPG',
          '/photos/2026-02-11/IMG_5593.JPG',
          '/photos/2026-02-11/R312026151226_2.jpeg',
          '/photos/2026-02-11/R312026151226_picked1.jpeg',
        ],
      }
    ],
    [],
  );

  useEffect(() => {
    const audio = new Audio('/music.mp3');
    audio.loop = true;
    audio.volume = 0.35;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const handleReasonClick = () => {
    if (reasonCards.length < reasons.length) {
      const nextReason = reasons[reasonCards.length];
      setReasonCards(prev => [...prev, nextReason]);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#a7c9b2', '#f1f8f3', '#5f8b6d'],
      });
      return;
    }

    if (!showMoreCard) {
      setShowMoreCard(true);
      return;
    }

    // After the final card appears, the heart button should not trigger anything.
    // The wiggle is triggered only by clicking the final card.
    return;
  };

  useEffect(() => {
    if (currentSlide !== 3) return;
    setReasonCards([]);
    setShowMoreCard(false);
    setMoreWiggleCount(0);
  }, [currentSlide]);

  useEffect(() => {
    if (currentSlide !== 3) return;

    const reasonCountIncreased = reasonCards.length > prevReasonCountRef.current;
    const showMoreJustOpened = showMoreCard && !prevShowMoreRef.current;

    prevReasonCountRef.current = reasonCards.length;
    prevShowMoreRef.current = showMoreCard;

    if (!reasonCountIncreased && !showMoreJustOpened) return;

    // Wait a tick for the new card to render, then scroll.
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (showMoreJustOpened) {
          reasonsNextButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
        reasonsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      });
    });
  }, [currentSlide, reasonCards.length, showMoreCard]);

  const handleQuiz = (choice: string) => {
    if (quizNoticeTimeoutRef.current) window.clearTimeout(quizNoticeTimeoutRef.current);
    if (quizAdvanceTimeoutRef.current) window.clearTimeout(quizAdvanceTimeoutRef.current);

    setQuizNotice({
      tone: 'success',
      message: 'Bener banget sayangg, aku sayang banget sama kamuu💚💚',
    });
    quizAdvanceTimeoutRef.current = window.setTimeout(() => {
      setQuizNotice(null);
      nextSlide();
    }, 2600);
  };

  const moveWawaSomewhereElse = useCallback((pointer?: { x: number; y: number }) => {
    const now = Date.now();
    if (now - lastWawaMoveRef.current < 120) return;
    lastWawaMoveRef.current = now;

    const button = wawaFixedButtonRef.current ?? wawaStaticButtonRef.current;
    const mamal = mamalButtonRef.current;
    if (!button) return;

    const margin = 12;
    const viewportWidth = Math.max(0, window.innerWidth);
    const viewportHeight = Math.max(0, window.innerHeight);

    const buttonRect = button.getBoundingClientRect();
    const wawaWidth = buttonRect.width || mamalButtonSize?.width || wawaButtonSize?.width || 180;
    const wawaHeight = buttonRect.height || mamalButtonSize?.height || wawaButtonSize?.height || 72;

    const maxX = Math.max(margin, viewportWidth - wawaWidth - margin);
    const maxY = Math.max(margin, viewportHeight - wawaHeight - margin);

    const avoidRect = mamal ? mamal.getBoundingClientRect() : null;
    const paddedAvoidRect = avoidRect
      ? new DOMRect(
          avoidRect.x - 16,
          avoidRect.y - 16,
          avoidRect.width + 32,
          avoidRect.height + 32
        )
      : null;

    const randInt = (min: number, max: number) => {
      const lo = Math.ceil(min);
      const hi = Math.floor(max);
      return Math.floor(lo + Math.random() * Math.max(1, hi - lo + 1));
    };

    const intersects = (x: number, y: number, rect: DOMRect) => {
      return x < rect.right && x + wawaWidth > rect.left && y < rect.bottom && y + wawaHeight > rect.top;
    };

    const farFromPointer = (x: number, y: number) => {
      if (!pointer) return true;
      const cx = x + wawaWidth / 2;
      const cy = y + wawaHeight / 2;
      return Math.hypot(pointer.x - cx, pointer.y - cy) > 220;
    };

    for (let attempt = 0; attempt < 40; attempt += 1) {
      const x = randInt(margin, maxX);
      const y = randInt(margin, maxY);

      if (paddedAvoidRect && intersects(x, y, paddedAvoidRect)) continue;
      if (!farFromPointer(x, y)) continue;

      setWawaPosition({ x, y });
      return;
    }

    setWawaPosition({ x: randInt(margin, maxX), y: randInt(margin, maxY) });
  }, [mamalButtonSize, wawaButtonSize]);

  useEffect(() => {
    const updateMamalSize = () => {
      const mamal = mamalButtonRef.current;
      if (!mamal) return;
      const rect = mamal.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      setMamalButtonSize({ width: rect.width, height: rect.height });
    };

    updateMamalSize();
    window.addEventListener('resize', updateMamalSize);
    return () => window.removeEventListener('resize', updateMamalSize);
  }, []);

  useEffect(() => {
    if (currentSlide !== 4) {
      setWawaRunning(false);
      return;
    }
    setWawaRunning(false);
  }, [currentSlide]);

  useEffect(() => {
    if (currentSlide !== 5) return;
    setCandlesLit(true);
  }, [currentSlide]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (currentSlide !== 4) return;

      const target = (wawaRunning ? wawaFixedButtonRef.current : wawaStaticButtonRef.current);
      if (!target) return;

      const rect = target.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const distance = Math.hypot(e.clientX - cx, e.clientY - cy);

      if (distance >= 140) return;

      if (!wawaRunning) {
        setWawaButtonSize({ width: rect.width, height: rect.height });
        setWawaPosition({ x: rect.left, y: rect.top });
        setWawaRunning(true);
        window.requestAnimationFrame(() => {
          moveWawaSomewhereElse({ x: e.clientX, y: e.clientY });
        });
        return;
      }

      moveWawaSomewhereElse({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, [currentSlide, moveWawaSomewhereElse, wawaRunning]);

  useEffect(() => {
    return () => {
      if (quizNoticeTimeoutRef.current) window.clearTimeout(quizNoticeTimeoutRef.current);
      if (quizAdvanceTimeoutRef.current) window.clearTimeout(quizAdvanceTimeoutRef.current);
      if (revealTimeoutRef.current) window.clearTimeout(revealTimeoutRef.current);
    };
  }, []);

  const slideVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };

  const isSurvey = currentSlide === 0;

  return (
    <div
      className={
        isSurvey
          ? 'min-h-screen w-full bg-gradient-to-b from-white via-zinc-50 to-zinc-100 relative overflow-hidden'
          : 'min-h-screen w-full bg-gradient-to-b from-sage-100 via-sage-200 to-sage-300 relative overflow-hidden'
      }
    >
      {/* Decorative Elements (only after survey) */}
      {!isSurvey ? (
        <div className="pointer-events-none absolute inset-0 z-0">
          {/* Cats across the whole screen */}
          <div className="absolute -top-8 -left-2 text-sage-400"><Cat size={180} className="rotate-12 opacity-25" /></div>
          <div className="absolute top-10 left-28 text-sage-400"><Cat size={90} className="-rotate-6 opacity-15" /></div>
          <div className="absolute top-24 right-10 text-sage-400"><Cat size={120} className="rotate-6 opacity-20" /></div>
          <div className="absolute -top-6 right-28 text-sage-400"><Cat size={80} className="-rotate-12 opacity-15" /></div>

          <div className="absolute top-[35%] left-6 text-sage-400"><Cat size={130} className="rotate-6 opacity-18" /></div>
          <div className="absolute top-[30%] right-6 text-sage-400"><Cat size={140} className="-rotate-6 opacity-18" /></div>
          <div className="absolute top-[55%] left-[20%] text-sage-400"><Cat size={90} className="rotate-12 opacity-12" /></div>
          <div className="absolute top-[60%] right-[22%] text-sage-400"><Cat size={100} className="-rotate-12 opacity-12" /></div>

          <div className="absolute bottom-24 left-10 text-sage-400"><Cat size={160} className="-rotate-6 opacity-20" /></div>
          <div className="absolute bottom-10 right-10 text-sage-400"><Cat size={170} className="rotate-12 opacity-22" /></div>
          <div className="absolute bottom-16 left-[45%] text-sage-400"><Cat size={95} className="rotate-6 opacity-12" /></div>
          <div className="absolute bottom-6 right-[45%] text-sage-400"><Cat size={85} className="-rotate-6 opacity-12" /></div>

          {/* Extra small cats for texture */}
          <div className="absolute top-[15%] left-[55%] text-sage-400"><Cat size={70} className="rotate-12 opacity-10" /></div>
          <div className="absolute top-[75%] right-[8%] text-sage-400"><Cat size={72} className="-rotate-12 opacity-10" /></div>
          <div className="absolute top-[82%] left-[12%] text-sage-400"><Cat size={76} className="rotate-6 opacity-10" /></div>
          <div className="absolute top-[8%] right-[55%] text-sage-400"><Cat size={68} className="-rotate-6 opacity-10" /></div>

          {/* Subtle hearts/stars */}
          <div className="absolute top-1/2 left-5 text-sage-400"><Star size={46} className="opacity-18 animate-pulse" /></div>
          <div className="absolute bottom-10 right-28 text-sage-400"><Heart size={120} className="-rotate-12 opacity-14" /></div>
          <div className="absolute top-14 left-[8%] text-sage-400"><Heart size={54} className="rotate-6 opacity-12" /></div>
          <div className="absolute top-20 right-[14%] text-sage-400"><Star size={64} className="-rotate-12 opacity-14 animate-pulse" /></div>
          <div className="absolute top-[22%] left-[18%] text-sage-400"><Star size={40} className="rotate-12 opacity-12" /></div>
          <div className="absolute top-[26%] right-[28%] text-sage-400"><Heart size={66} className="-rotate-6 opacity-10" /></div>
          <div className="absolute top-[40%] left-[50%] text-sage-400"><Heart size={44} className="rotate-12 opacity-10 animate-pulse" /></div>
          <div className="absolute top-[44%] right-[6%] text-sage-400"><Star size={44} className="rotate-6 opacity-12" /></div>
          <div className="absolute top-[58%] left-[10%] text-sage-400"><Heart size={52} className="-rotate-12 opacity-10" /></div>
          <div className="absolute top-[62%] right-[18%] text-sage-400"><Star size={52} className="rotate-12 opacity-10 animate-pulse" /></div>
          <div className="absolute bottom-[22%] left-[28%] text-sage-400"><Star size={58} className="-rotate-6 opacity-12" /></div>
          <div className="absolute bottom-[18%] right-[42%] text-sage-400"><Heart size={76} className="rotate-6 opacity-10" /></div>
          <div className="absolute bottom-[6%] left-[14%] text-sage-400"><Heart size={56} className="-rotate-6 opacity-12 animate-pulse" /></div>
          <div className="absolute bottom-[8%] right-[8%] text-sage-400"><Star size={46} className="rotate-12 opacity-12" /></div>
        </div>
      ) : null}

      <AnimatePresence>
        {isRevealActive ? (
          <motion.div
            key="reveal"
            className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="flex flex-col items-center text-center px-8"
              initial={{ scale: 0.92, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.98, y: -6, opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <motion.div
                className="w-20 h-20 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-6"
                animate={{ scale: [1, 1.06, 1], rotate: [0, 2, -2, 0] }}
                transition={{ duration: 1.0, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Cat size={40} className="text-white" />
              </motion.div>
              <div className="text-white font-bold text-2xl md:text-3xl mb-2">Sedang menganalisis...</div>
              <div className="text-white/80 text-sm md:text-base">Sebentar ya...</div>
              <motion.div
                className="mt-6 flex gap-2"
                aria-hidden="true"
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2.5 h-2.5 rounded-full bg-white"
                    initial={{ opacity: 0.2, y: 0 }}
                    animate={{ opacity: [0.2, 1, 0.2], y: [0, -4, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.12, ease: 'easeInOut' }}
                  />
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {lightboxSrc ? (
          <motion.div
            key="lightbox"
            className="fixed inset-0 z-[60] bg-zinc-950/70 backdrop-blur-sm p-4 md:p-8 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeLightbox();
            }}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              className="relative w-full max-w-5xl bg-white rounded-3xl border border-sage-200 shadow-2xl overflow-hidden"
              initial={{ scale: 0.98, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.98, y: 10, opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <button
                type="button"
                onClick={closeLightbox}
                className="absolute right-3 top-3 z-10 inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/90 border border-sage-200 text-sage-800 shadow-sm hover:bg-white"
                aria-label="Tutup"
              >
                <X size={18} />
              </button>

              <div className="p-4 md:p-6 flex items-center justify-center bg-sage-100/40">
                {isVideoSrc(lightboxSrc) ? (
                  <video
                    src={lightboxSrc}
                    controls
                    autoPlay
                    playsInline
                    className="max-h-[75vh] w-full rounded-2xl border border-sage-200 bg-black"
                  />
                ) : (
                  <TimelineImageThumb
                    src={lightboxSrc}
                    width={1400}
                    height={900}
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                    className="max-h-[75vh] w-auto rounded-2xl border border-sage-200 bg-white"
                  />
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Center when it fits; scroll naturally when it overflows */}
      <div className="w-full min-h-screen flex items-center justify-center py-10 md:py-14 px-6 relative z-10">
        <AnimatePresence mode="wait">
          {currentSlide === 0 && (
            <motion.div
              key="slide0"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col items-center text-center max-w-md w-full"
            >
              <div className="bg-white p-6 rounded-3xl shadow-xl border-2 border-zinc-200 w-full">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Kuesioner Singkat</span>
                  <span className="text-xs font-bold text-zinc-700 bg-zinc-100 px-2 py-1 rounded">{surveyStep + 1}/5</span>
                </div>

                {surveyStep === 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <h2 className="text-2xl font-bold text-zinc-900 mb-3">Selamat datang</h2>
                    <p className="text-zinc-600 text-sm leading-relaxed mb-6">
                      Mohon isi kuesioner singkat berikut dengan jujur. Ini hanya butuh sekitar 30–60 detik.
                    </p>
                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-left text-sm text-zinc-700 mb-6">
                      <div className="font-semibold text-zinc-900 mb-1">Catatan</div>
                      <div>Jawaban kamu tidak disimpan dan tidak dibagikan.</div>
                    </div>
                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-left text-sm text-zinc-700 mb-6">
                      <div className="font-semibold text-zinc-900 mb-1">Sebelum mulai</div>
                      <div>Pastikan sinyal kamu stabil, dan nyalakan volume di laptop biar lebih seru</div>
                    </div>
                    <button
                      onClick={() => setSurveyStep(1)}
                      className="w-full bg-zinc-900 text-white p-4 rounded-xl font-bold shadow-lg hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
                    >
                      Mulai
                      <ChevronRight size={20} />
                    </button>
                  </motion.div>
                )}

                {surveyStep === 1 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <h2 className="text-xl font-bold text-zinc-900 mb-2">Pertanyaan 1</h2>
                    <div className="text-zinc-600 text-sm mb-6">Apa warna yang paling menggambarkan suasana hati kamu saat ini?</div>
                    <div className="grid grid-cols-2 gap-3">
                      {['Hijau', 'Biru', 'Kuning', 'Merah'].map(color => (
                        <button
                          key={color}
                          onClick={() => setSurveyStep(2)}
                          className="p-4 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-800 transition-colors text-sm font-medium"
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {surveyStep === 2 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <h2 className="text-xl font-bold text-zinc-900 mb-2">Pertanyaan 2</h2>
                    <div className="text-zinc-600 text-sm mb-6">Jika kamu bisa menjadi hewan peliharaan, kamu ingin menjadi...</div>
                    <div className="grid grid-cols-1 gap-3">
                      {['Kucing', 'Kelinci', 'Panda','Sapi'].map(animal => (
                        <button
                          key={animal}
                          onClick={() => setSurveyStep(3)}
                          className="p-4 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-800 transition-colors text-sm font-medium text-left"
                        >
                          {animal}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {surveyStep === 3 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <h2 className="text-xl font-bold text-zinc-900 mb-2">Pertanyaan 3</h2>
                    <div className="text-zinc-600 text-sm mb-6">Makanan kesukaan kamu yang paling bikin happy apa?</div>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        'Mie ayam',
                        'Nasi goreng',
                        'Ayam bakar',
                        'Bakso',
                      ].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setSurveyStep(4)}
                          className="p-4 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-800 transition-colors text-sm font-medium text-left"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {surveyStep === 4 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <h2 className="text-xl font-bold text-zinc-900 mb-2">Terakhir</h2>
                    <div className="text-zinc-600 text-sm mb-6">Apakah kamu siap melihat hasil analisis?</div>
                    <button
                      onClick={openSurprise}
                      className="w-full bg-zinc-900 text-white p-4 rounded-xl font-bold shadow-lg hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
                    >
                      Lihat Hasil Analisis
                      <ChevronRight size={20} />
                    </button>
                  </motion.div>
                )}
              </div>
              <p className="mt-6 text-zinc-500 text-xs italic">Kuesioner ini hanya untuk hiburan.</p>
            </motion.div>
          )}

          {currentSlide === 1 && (
            <motion.div
              key="slide1"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col items-center text-center max-w-2xl w-full px-2 md:px-0"
            >
              <h1 className="text-4xl md:text-6xl font-serif font-bold text-sage-800 leading-[1.12] tracking-tight mb-6">
                Selamat Ulang Tahun ke-20 wawa sayanggg!
              </h1>
              <p className="text-lg md:text-xl text-sage-600 leading-relaxed max-w-xl mb-10">
                Panjang umur dan sehat selalu, semoga semua impian dan harapan kamu dapat tercapai sayangg. Aku ada buat sedikit kejutan nih buat kamu, semoga kamu sukaaa... yu klik tombol di bawah ini sayangg!
              </p>
              <button
                onClick={nextSlide}
                className="group flex items-center gap-2 bg-sage-500 hover:bg-sage-600 text-white px-8 py-4 rounded-full text-xl font-semibold transition-all shadow-lg hover:scale-105"
              >
                Mulai yuuuu
                <ChevronRight className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}

          {currentSlide === 2 && (
            <motion.div
              key="slide2"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col items-center w-full max-w-4xl"
            >
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-sage-800 mb-8 flex items-center gap-3">
                Sebelum lanjut liat momen-momen kita dulu yuuuu...
              </h1>

              <div className="relative w-full space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-1 before:bg-gradient-to-b before:from-transparent before:via-sage-500 before:to-transparent">
                {timelineItems.map((item, idx) => {
                  const Icon = item.icon === 'heart' ? Heart : item.icon === 'star' ? Star : Cat;

                  return (
                    <div
                      key={idx}
                      className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group"
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-sage-200 text-sage-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                        <Icon size={16} fill="currentColor" />
                      </div>

                      <div
                        className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-3xl border border-sage-100 bg-white shadow-md"
                        style={{ contentVisibility: 'auto' } as React.CSSProperties}
                      >
                        <div className="flex items-center justify-between space-x-2 mb-2">
                          <div className="font-bold text-sage-800 text-base md:text-lg">{item.date}</div>
                        </div>

                        <div className="text-sage-600 text-base md:text-lg leading-relaxed">{item.text}</div>

                        {item.photos?.length ? (
                          <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                            {item.photos.map((src, pIdx) => (
                              <a
                                key={pIdx}
                                href={src}
                                className="shrink-0"
                                aria-label="Buka media"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setLightboxSrc(src);
                                }}
                              >
                                {isVideoSrc(src) ? (
                                  <video
                                    src={src}
                                    muted
                                    playsInline
                                    preload="metadata"
                                    className="h-28 w-28 md:h-32 md:w-32 object-cover rounded-2xl border border-sage-200 shadow-sm hover:shadow transition-shadow"
                                  />
                                ) : (
                                  <TimelineImageThumb
                                    src={src}
                                    className="h-28 w-28 md:h-32 md:w-32 object-cover rounded-2xl border border-sage-200 shadow-sm hover:shadow transition-shadow"
                                  />
                                )}
                              </a>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={nextSlide}
                className="mt-12 group flex items-center gap-2 bg-sage-100 hover:bg-sage-200 text-sage-800 px-6 py-3 rounded-full font-semibold transition-all shadow-sm"
              >
                Dah? Lanjut yuu
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}

          {currentSlide === 3 && (
            <motion.div
              key="slide3"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col items-center text-center max-w-2xl w-full"
            >
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-sage-800 mb-8">
                Sayang tau ga kenapa aku sayang banget sama kamuu?
              </h2>

              {reasonCards.length === 0 ? (
                <div className="text-sage-700 text-lg font-medium italic mb-6">
                  Klik tombol hati di bawah ya sayang, nanti keluar satu-satu...
                </div>
              ) : null}

              {reasonCards.length === 0 ? (
                <div className="relative mb-10">
                  <motion.button
                    onClick={handleReasonClick}
                    className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-white border-8 border-sage-200 shadow-xl flex items-center justify-center text-sage-600 hover:scale-110 transition-transform active:scale-95"
                    aria-label="Tambah alasan"
                    animate={{ rotate: [0, -4, 4, -4, 4, 0] }}
                    transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 0.6 }}
                  >
                    <Heart size={44} fill="currentColor" />
                  </motion.button>
                </div>
              ) : null}

              <div className="w-full max-w-xl space-y-4">
                <AnimatePresence>
                  {reasonCards.map((r, idx) => {
                    const isLast = idx === reasonCards.length - 1;
                    const showSideHeart = isLast && !showMoreCard;

                    return (
                      <motion.div
                        key={`${idx}-${r}`}
                        initial={{ opacity: 0, y: 10, rotate: -1 }}
                        animate={{ opacity: 1, y: 0, rotate: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="flex items-stretch gap-3"
                      >
                        <div className="flex-1 bg-white border-2 border-sage-200 rounded-3xl shadow-lg px-5 py-4 text-left">
                          <div className="flex items-start gap-3">
                            <div className="shrink-0 w-10 h-10 rounded-2xl bg-sage-100 border border-sage-200 flex items-center justify-center text-sage-700">
                              <Heart size={18} fill="currentColor" />
                            </div>
                            <div>
                              <div className="text-lg md:text-xl font-semibold text-sage-800">{r}</div>
                            </div>
                          </div>
                        </div>

                        {showSideHeart ? (
                          <motion.button
                            type="button"
                            onClick={handleReasonClick}
                            aria-label="Tambahkan alasan berikutnya"
                            className="shrink-0 w-16 rounded-3xl bg-white border-2 border-sage-200 shadow-lg text-sage-700 hover:text-sage-900 hover:border-sage-300 transition-colors flex items-center justify-center active:scale-95"
                            animate={{ rotate: [0, -6, 6, -6, 6, 0] }}
                            transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.4 }}
                          >
                            <Heart size={26} fill="currentColor" />
                          </motion.button>
                        ) : null}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                <AnimatePresence>
                  {showMoreCard ? (
                    <motion.div
                      key="more-card"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        rotate: moreWiggleCount > 0 ? [0, -2, 2, -2, 2, 0] : 0,
                      }}
                      transition={{ duration: moreWiggleCount > 0 ? 0.6 : 0.25 }}
                      className="flex items-stretch gap-3"
                    >
                      <div
                        className="flex-1 bg-sage-100 border-2 border-sage-300 rounded-3xl shadow-lg px-5 py-4 text-center cursor-pointer"
                        onClick={() => setMoreWiggleCount(c => c + 1)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') setMoreWiggleCount(c => c + 1);
                        }}
                      >
                        <div className="text-2xl md:text-3xl font-serif font-bold text-sage-800">Dan masih banyak lagi sayangg💚💚</div>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                <div ref={reasonsEndRef} />
              </div>

              {reasonCards.length >= reasons.length && showMoreCard ? (
                <button
                  ref={reasonsNextButtonRef}
                  onClick={nextSlide}
                  className="mt-12 group flex items-center gap-2 bg-sage-100 hover:bg-sage-200 text-sage-800 px-6 py-3 rounded-full font-semibold transition-all shadow-sm"
                >
                  Lanjut lagi yuu
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              ) : null}
            </motion.div>
          )}

          {currentSlide === 4 && (
          <motion.div
            key="slide4"
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex flex-col items-center text-center max-w-2xl w-full"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-sage-800 mb-4">
              Jawab ini dulu sayanggg
            </h2>
            <p className="text-xl text-sage-600 mb-12">
              Siapa yang paling sayang di antara kita?
            </p>

            <AnimatePresence>
              {quizNotice && (
                <motion.div
                  key={quizNotice.message}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className={`mb-6 w-full max-w-md rounded-2xl border px-4 py-3 shadow-sm bg-white ${
                    quizNotice.tone === 'success' ? 'border-sage-400' : 'border-sage-300'
                  }`}
                >
                  <div className="text-sage-800 font-semibold text-sm">{quizNotice.message}</div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md">
              <button
                ref={wawaStaticButtonRef}
                type="button"
                aria-disabled="true"
                tabIndex={-1}
                className={`h-24 md:h-28 w-full flex items-center justify-center bg-white border-2 border-sage-300 p-6 rounded-2xl text-xl font-bold text-sage-800 shadow-sm pointer-events-none ${
                  wawaRunning ? 'invisible' : ''
                }`}
              >
                wawa
              </button>
              <button
                ref={mamalButtonRef}
                onClick={() => handleQuiz('Mamal')}
                className="h-24 md:h-28 w-full flex items-center justify-center bg-white border-2 border-sage-300 hover:border-sage-500 p-6 rounded-2xl text-xl font-bold text-sage-800 transition-all hover:shadow-md active:scale-95"
              >
                mamal
              </button>
            </div>

            {wawaRunning ? (
              <button
                ref={wawaFixedButtonRef}
                type="button"
                aria-disabled="true"
                tabIndex={-1}
                className="fixed z-50 pointer-events-none select-none flex items-center justify-center bg-white border-2 border-sage-300 p-6 rounded-2xl text-xl font-bold text-sage-800 shadow-md"
                style={{
                  left: wawaPosition.x,
                  top: wawaPosition.y,
                  width: mamalButtonSize?.width ?? wawaButtonSize?.width,
                  height: mamalButtonSize?.height ?? wawaButtonSize?.height,
                }}
              >
                wawa
              </button>
            ) : null}
          </motion.div>
        )}

        {currentSlide === 5 && (
          <motion.div
            key="slide5"
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex flex-col items-center text-center max-w-2xl w-full"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-sage-800 mb-2 flex items-center gap-3">
              Kue ulang tahun buat sayangkuu
            </h2>
            <p className="text-lg md:text-xl text-sage-600">
              Sebelum tiup, tutup mata sebentar terus berdoa dulu ya sayangg
            </p>

            <div className="w-full">
              <BirthdayCake lit={candlesLit} />
            </div>

            <div className="flex flex-col items-center gap-4">
              {candlesLit ? (
                <button
                  type="button"
                  onClick={() => {
                    setCandlesLit(false);
                    confetti({
                      particleCount: 80,
                      spread: 70,
                      origin: { y: 0.6 },
                      colors: ['#a7c9b2', '#f1f8f3', '#5f8b6d'],
                    });
                  }}
                  className="group flex items-center gap-2 bg-sage-500 hover:bg-sage-600 text-white px-8 py-4 rounded-full text-xl font-semibold transition-all shadow-lg"
                >
                  Tiup
                  <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                </button>
              ) : null}

              <AnimatePresence>
                {!candlesLit ? (
                  <motion.div
                    key="cake-effect"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="flex items-center gap-3 text-sage-700 font-semibold"
                  >
                    <motion.span
                      initial={{ scale: 0.9, rotate: -8 }}
                      animate={{ scale: [0.9, 1.08, 1], rotate: [-8, 6, 0] }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="inline-flex"
                    >
                    </motion.span>
                    Yeayy, semoga doanya terkabul ya sayanggg💚
                    <motion.span
                      initial={{ scale: 0.9, rotate: 10 }}
                      animate={{ scale: [0.9, 1.08, 1], rotate: [10, -6, 0] }}
                      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.05 }}
                      className="inline-flex"
                    >
                    </motion.span>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              {!candlesLit ? (
                <button
                  onClick={nextSlide}
                  className="group flex items-center gap-2 bg-sage-100 hover:bg-sage-200 text-sage-800 px-6 py-3 rounded-full font-semibold transition-all shadow-sm"
                >
                  Lanjut yuuuuu
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              ) : null}
            </div>
          </motion.div>
        )}

        {currentSlide === 6 && (
          <motion.div
            key="slide6"
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex flex-col items-center text-center w-full"
          >
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-sage-800 mb-5 flex items-center gap-3">
              Buka ini juga sayanggg
            </h2>

            <ScratchCard onComplete={() => {
              confetti({
                particleCount: 150,
                spread: 100,
                origin: { y: 0.6 },
                colors: ['#b2c2b2', '#f4f7f4', '#708270', '#ff0000']
              });
            }}>
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-3 text-sage-400" aria-hidden="true">
                  <Star size={18} className="opacity-80" fill="currentColor" />
                  <Heart size={18} className="opacity-80" fill="currentColor" />
                  <Star size={18} className="opacity-80" fill="currentColor" />
                </div>
                <p className="text-base md:text-lg font-serif leading-relaxed text-sage-800">
                  "Selamat bertambah umur sayangku, selamat sudah memasuki kepala dua (20 tahun), semoga semua yang kamu harapkan dan inginkan dapat segera terkabul. Semoga kita juga bisa terus bersama-sama melewati hari-hari ke depan dengan penuh cinta, tawa, dan kebahagiaan. Sebelumnya aku mau minta maaf jika selama aku pacaran sama kamu ini banyak salahnya, karena ini pacaran pertama aku jadi mungkin aku banyak kurang peka, banyak nyakitin kamu, aku kadang juga bingung harus gimana, tapi aku minta bantuannya ya sayangg. Aku bersyukur banget bisa dipertemukan dengan kamu, terima kasih sudah jadi kamu yang luar biasa ini. Selamat ulang tahun sayangg, i love you so much, much, muachh💚💚💚"
                </p>
                <div className="text-sage-500 font-medium">
                  - Dari pacarmu yang paling sayang kamu💚
                </div>
                <div className="flex items-center justify-center gap-2 text-sage-300" aria-hidden="true">
                  <Heart size={16} className="opacity-70" fill="currentColor" />
                  <Heart size={12} className="opacity-60" fill="currentColor" />
                  <Heart size={16} className="opacity-70" fill="currentColor" />
                </div>
              </div>
            </ScratchCard>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
}
