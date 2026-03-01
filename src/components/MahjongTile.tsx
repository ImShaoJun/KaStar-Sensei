import React from 'react';
import { Tile } from '@/models/mahjong';

interface MahjongTileProps {
  tile: Tile;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

// DOT patterns — positions in a 100x140 viewBox, spread to fill the tile
const DOT_PATTERNS: Record<number, { cx: number; cy: number }[]> = {
  1: [{ cx: 50, cy: 70 }],
  2: [{ cx: 50, cy: 40 }, { cx: 50, cy: 100 }],
  3: [{ cx: 50, cy: 28 }, { cx: 50, cy: 70 }, { cx: 50, cy: 112 }],
  4: [{ cx: 28, cy: 40 }, { cx: 72, cy: 40 }, { cx: 28, cy: 100 }, { cx: 72, cy: 100 }],
  5: [{ cx: 28, cy: 32 }, { cx: 72, cy: 32 }, { cx: 50, cy: 70 }, { cx: 28, cy: 108 }, { cx: 72, cy: 108 }],
  6: [{ cx: 28, cy: 28 }, { cx: 72, cy: 28 }, { cx: 28, cy: 70 }, { cx: 72, cy: 70 }, { cx: 28, cy: 112 }, { cx: 72, cy: 112 }],
  7: [{ cx: 28, cy: 22 }, { cx: 72, cy: 22 }, { cx: 28, cy: 52 }, { cx: 72, cy: 52 }, { cx: 28, cy: 82 }, { cx: 72, cy: 82 }, { cx: 50, cy: 115 }],
  8: [{ cx: 28, cy: 22 }, { cx: 72, cy: 22 }, { cx: 28, cy: 48 }, { cx: 72, cy: 48 }, { cx: 28, cy: 74 }, { cx: 72, cy: 74 }, { cx: 28, cy: 100 }, { cx: 72, cy: 100 }],
  9: [{ cx: 22, cy: 22 }, { cx: 50, cy: 22 }, { cx: 78, cy: 22 }, { cx: 22, cy: 62 }, { cx: 50, cy: 62 }, { cx: 78, cy: 62 }, { cx: 22, cy: 102 }, { cx: 50, cy: 102 }, { cx: 78, cy: 102 }],
};

function renderDotPattern(value: number) {
  const positions = DOT_PATTERNS[value] || [];
  const r = value <= 2 ? 18 : value <= 4 ? 16 : value <= 6 ? 14 : value <= 8 ? 13 : 12;

  return (
    <g>
      {positions.map((pos, i) => (
        <g key={i}>
          <circle cx={pos.cx} cy={pos.cy} r={r} fill="none" stroke="#1a5fb4" strokeWidth="3" />
          <circle cx={pos.cx} cy={pos.cy} r={r * 0.45} fill="#c0392b" />
        </g>
      ))}
    </g>
  );
}

const BAM_PATTERNS: Record<number, { cx: number; cy: number; color: string; scale?: number; rotate?: number }[]> = {
  2: [
    { cx: 50, cy: 35, color: '#16a34a', scale: 1.2 },
    { cx: 50, cy: 95, color: '#2563eb', scale: 1.2 }
  ],
  3: [
    { cx: 50, cy: 25, color: '#2563eb', scale: 1 },
    { cx: 50, cy: 65, color: '#dc2626', scale: 1 },
    { cx: 50, cy: 105, color: '#16a34a', scale: 1 }
  ],
  4: [
    { cx: 32, cy: 35, color: '#16a34a', scale: 1.1 }, { cx: 68, cy: 35, color: '#16a34a', scale: 1.1 },
    { cx: 32, cy: 95, color: '#2563eb', scale: 1.1 }, { cx: 68, cy: 95, color: '#2563eb', scale: 1.1 }
  ],
  5: [
    { cx: 28, cy: 28, color: '#16a34a', scale: 0.9 }, { cx: 72, cy: 28, color: '#16a34a', scale: 0.9 },
    { cx: 50, cy: 65, color: '#dc2626', scale: 1 },
    { cx: 28, cy: 102, color: '#2563eb', scale: 0.9 }, { cx: 72, cy: 102, color: '#2563eb', scale: 0.9 }
  ],
  6: [
    { cx: 25, cy: 35, color: '#16a34a', scale: 0.9 }, { cx: 50, cy: 35, color: '#16a34a', scale: 0.9 }, { cx: 75, cy: 35, color: '#16a34a', scale: 0.9 },
    { cx: 25, cy: 95, color: '#2563eb', scale: 0.9 }, { cx: 50, cy: 95, color: '#2563eb', scale: 0.9 }, { cx: 75, cy: 95, color: '#2563eb', scale: 0.9 }
  ],
  7: [
    { cx: 50, cy: 26, color: '#dc2626', scale: 0.9, rotate: 30 },
    { cx: 25, cy: 66, color: '#16a34a', scale: 0.8 }, { cx: 50, cy: 66, color: '#16a34a', scale: 0.8 }, { cx: 75, cy: 66, color: '#16a34a', scale: 0.8 },
    { cx: 25, cy: 106, color: '#2563eb', scale: 0.8 }, { cx: 50, cy: 106, color: '#2563eb', scale: 0.8 }, { cx: 75, cy: 106, color: '#2563eb', scale: 0.8 }
  ],
  8: [
    { cx: 22, cy: 36, color: '#16a34a', scale: 0.8, rotate: 20 },
    { cx: 40, cy: 36, color: '#16a34a', scale: 0.8, rotate: -20 },
    { cx: 60, cy: 36, color: '#16a34a', scale: 0.8, rotate: 20 },
    { cx: 78, cy: 36, color: '#16a34a', scale: 0.8, rotate: -20 },
    { cx: 22, cy: 94, color: '#2563eb', scale: 0.8, rotate: 20 },
    { cx: 40, cy: 94, color: '#2563eb', scale: 0.8, rotate: -20 },
    { cx: 60, cy: 94, color: '#2563eb', scale: 0.8, rotate: 20 },
    { cx: 78, cy: 94, color: '#2563eb', scale: 0.8, rotate: -20 }
  ],
  9: [
    { cx: 25, cy: 25, color: '#dc2626', scale: 0.8 }, { cx: 50, cy: 25, color: '#dc2626', scale: 0.8 }, { cx: 75, cy: 25, color: '#dc2626', scale: 0.8 },
    { cx: 25, cy: 65, color: '#2563eb', scale: 0.8 }, { cx: 50, cy: 65, color: '#2563eb', scale: 0.8 }, { cx: 75, cy: 65, color: '#2563eb', scale: 0.8 },
    { cx: 25, cy: 105, color: '#16a34a', scale: 0.8 }, { cx: 50, cy: 105, color: '#16a34a', scale: 0.8 }, { cx: 75, cy: 105, color: '#16a34a', scale: 0.8 }
  ]
};

function renderBamPattern(value: number) {
  if (value === 1) {
    return (
      <text x="50" y="85" textAnchor="middle" fontSize="60" fill="#2d7d46">
        🦚
      </text>
    );
  }

  const positions = BAM_PATTERNS[value] || [];
  return (
    <g>
      {positions.map((item, i) => {
        const sc = item.scale || 1;
        const w = 12 * sc;
        const h = 36 * sc;
        const x = item.cx - w / 2;
        const y = item.cy - h / 2;
        const rotateStr = item.rotate ? `rotate(${item.rotate}, ${item.cx}, ${item.cy})` : '';

        return (
          <g key={i} transform={rotateStr}>
            {/* 柱体背景 */}
            <rect x={x} y={y} width={w} height={h} rx={w / 3} fill={item.color} />
            {/* 顶下节纹 */}
            <line x1={x + w * 0.2} y1={y + h * 0.3} x2={x + w * 0.8} y2={y + h * 0.3} stroke="rgba(255,255,255,0.4)" strokeWidth={1.5 * sc} />
            <line x1={x + w * 0.2} y1={y + h * 0.7} x2={x + w * 0.8} y2={y + h * 0.7} stroke="rgba(255,255,255,0.4)" strokeWidth={1.5 * sc} />
            {/* 中间高光线条 */}
            <line x1={x + w * 0.5} y1={y + h * 0.15} x2={x + w * 0.5} y2={y + h * 0.85} stroke="rgba(0,0,0,0.3)" strokeWidth={1 * sc} />
          </g>
        );
      })}
    </g>
  );
}

function renderDragonPattern(value: number) {
  if (value === 1) {
    return (
      <text x="50" y="92" textAnchor="middle" dominantBaseline="central" fontSize="68" fontWeight="900" fill="#dc2626"
        style={{ fontFamily: 'serif' }}>
        中
      </text>
    );
  }
  if (value === 2) {
    return (
      <text x="50" y="92" textAnchor="middle" dominantBaseline="central" fontSize="68" fontWeight="900" fill="#16a34a"
        style={{ fontFamily: 'serif' }}>
        發
      </text>
    );
  }
  // 白板
  return (
    <g>
      <rect x="15" y="25" width="70" height="90" rx="6" fill="none" stroke="#60a5fa" strokeWidth="4" />
      <rect x="25" y="35" width="50" height="70" rx="3" fill="none" stroke="#93c5fd" strokeWidth="2" />
    </g>
  );
}

const SIZE_MAP = {
  sm: { css: 'w-10 h-14' },
  md: { css: 'w-16 h-[88px]' },
  lg: { css: 'w-20 h-[110px]' },
};

export default function MahjongTile({ tile, size = 'lg', onClick, disabled = false, className = '' }: MahjongTileProps) {
  const sizeInfo = SIZE_MAP[size];

  const renderContent = () => {
    if (tile.type === 'DOT') return renderDotPattern(tile.value);
    if (tile.type === 'BAM') return renderBamPattern(tile.value);
    return renderDragonPattern(tile.value);
  };

  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      onClick={onClick}
      disabled={disabled}
      className={`
        relative inline-flex items-center justify-center flex-shrink-0
        ${sizeInfo.css} rounded-lg
        transform transition-all duration-200 ease-out
        ${className}
      `}
      style={{ perspective: '200px' }}
    >
      {/* Tile shadow/depth base */}
      <div
        className="absolute inset-0 rounded-lg"
        style={{
          background: 'linear-gradient(180deg, #b8a88a 0%, #8a7a62 100%)',
          transform: 'translateY(4px)',
          zIndex: 0,
        }}
      />
      {/* Main tile face */}
      <div
        className="absolute inset-0 rounded-lg overflow-hidden"
        style={{
          background: 'linear-gradient(170deg, #fffff5 0%, #f5f0e0 30%, #ede5d0 100%)',
          border: '1.5px solid #c8b89a',
          boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.8), inset 0 -1px 2px rgba(0,0,0,0.1)',
          zIndex: 1,
        }}
      >
        {/* SVG content — viewBox 100x140 matches tile aspect ratio */}
        <svg viewBox="0 0 100 140" className="w-full h-full" style={{ zIndex: 2, display: 'block' }}>
          {renderContent()}
        </svg>
      </div>
    </Tag>
  );
}

// Card back component for opponent hands
export function MahjongTileBack({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const s = size === 'sm' ? 'w-5 h-7' : 'w-8 h-11';
  return (
    <div
      className={`${s} rounded-sm flex-shrink-0`}
      style={{
        background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 50%, #1d4ed8 100%)',
        border: '1px solid #3b82f6',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.15)',
      }}
    >
      <div
        className="w-full h-full rounded-sm"
        style={{
          background: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 2px,
            rgba(255,255,255,0.06) 2px,
            rgba(255,255,255,0.06) 4px
          )`,
          border: '1px solid rgba(255,255,255,0.1)',
          margin: '1px',
          width: 'calc(100% - 2px)',
          height: 'calc(100% - 2px)',
        }}
      />
    </div>
  );
}
