import React from 'react';

export const AVATAR_LIST = [
  { id: 'dog', name: 'Dog' },
  { id: 'cat', name: 'Cat' },
  { id: 'bear', name: 'Bear' },
  { id: 'rabbit', name: 'Rabbit' },
  { id: 'fox', name: 'Fox' },
  { id: 'panda', name: 'Panda' },
  { id: 'koala', name: 'Koala' },
  { id: 'penguin', name: 'Penguin' }
];

export function CartoonAvatar({ id, size = 44, style = {}, className = '' }) {
  const width = typeof size === 'number' ? `${size}px` : size;
  const height = width;

  const wrapperStyle = {
    width,
    height,
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
    ...style
  };

  switch (id) {
    case 'dog':
      return (
        <div style={wrapperStyle} className={className} title="Dog Avatar">
          <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="50" fill="#FDE68A" />
            {/* Floppy Ears */}
            <ellipse cx="20" cy="42" rx="10" ry="22" fill="#92400E" transform="rotate(-15 20 42)" />
            <ellipse cx="80" cy="42" rx="10" ry="22" fill="#92400E" transform="rotate(15 80 42)" />
            {/* Head */}
            <circle cx="50" cy="52" r="30" fill="#E5D5C5" />
            {/* Muzzle */}
            <ellipse cx="50" cy="62" rx="16" ry="12" fill="#FFFFFF" />
            {/* Eyes */}
            <circle cx="40" cy="48" r="4" fill="#1F2937" />
            <circle cx="41.5" cy="46.5" r="1.5" fill="#FFFFFF" />
            <circle cx="60" cy="48" r="4" fill="#1F2937" />
            <circle cx="61.5" cy="46.5" r="1.5" fill="#FFFFFF" />
            {/* Nose */}
            <ellipse cx="50" cy="57" rx="5" ry="4" fill="#1F2937" />
            {/* Mouth */}
            <path d="M45 63 C 48 66, 50 66, 50 63 C 50 66, 52 66, 55 63" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" />
            {/* Blush */}
            <circle cx="33" cy="56" r="4" fill="#FCA5A5" opacity="0.7" />
            <circle cx="67" cy="56" r="4" fill="#FCA5A5" opacity="0.7" />
          </svg>
        </div>
      );

    case 'cat':
      return (
        <div style={wrapperStyle} className={className} title="Cat Avatar">
          <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="50" fill="#FED7AA" />
            {/* Ears */}
            <path d="M 22 45 L 32 20 L 46 34 Z" fill="#FB923C" />
            <path d="M 26 42 L 32 25 L 42 34 Z" fill="#F472B6" />
            <path d="M 78 45 L 68 20 L 54 34 Z" fill="#FB923C" />
            <path d="M 74 42 L 68 25 L 58 34 Z" fill="#F472B6" />
            {/* Head */}
            <circle cx="50" cy="54" r="30" fill="#FB923C" />
            {/* Eyes */}
            <circle cx="38" cy="50" r="4" fill="#1F2937" />
            <circle cx="39.5" cy="48.5" r="1.5" fill="#FFFFFF" />
            <circle cx="62" cy="50" r="4" fill="#1F2937" />
            <circle cx="63.5" cy="48.5" r="1.5" fill="#FFFFFF" />
            {/* Nose */}
            <polygon points="47,58 53,58 50,62" fill="#F472B6" />
            {/* Whiskers */}
            <line x1="22" y1="54" x2="34" y2="55" stroke="#7C2D12" strokeWidth="2" strokeLinecap="round" />
            <line x1="23" y1="60" x2="33" y2="59" stroke="#7C2D12" strokeWidth="2" strokeLinecap="round" />
            <line x1="78" y1="54" x2="66" y2="55" stroke="#7C2D12" strokeWidth="2" strokeLinecap="round" />
            <line x1="77" y1="60" x2="67" y2="59" stroke="#7C2D12" strokeWidth="2" strokeLinecap="round" />
            {/* Blush */}
            <circle cx="32" cy="58" r="4.5" fill="#F472B6" opacity="0.6" />
            <circle cx="68" cy="58" r="4.5" fill="#F472B6" opacity="0.6" />
          </svg>
        </div>
      );

    case 'bear':
      return (
        <div style={wrapperStyle} className={className} title="Bear Avatar">
          <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="50" fill="#FEF08A" />
            {/* Round Ears */}
            <circle cx="28" cy="30" r="13" fill="#B45309" />
            <circle cx="28" cy="30" r="7" fill="#FDE68A" />
            <circle cx="72" cy="30" r="13" fill="#B45309" />
            <circle cx="72" cy="30" r="7" fill="#FDE68A" />
            {/* Head */}
            <circle cx="50" cy="54" r="30" fill="#B45309" />
            {/* Snout */}
            <ellipse cx="50" cy="62" rx="14" ry="10" fill="#FDE68A" />
            {/* Nose */}
            <ellipse cx="50" cy="58" rx="5" ry="4" fill="#451A03" />
            {/* Mouth */}
            <path d="M47 64 Q50 67 53 64" stroke="#451A03" strokeWidth="2" fill="none" strokeLinecap="round" />
            {/* Eyes */}
            <circle cx="38" cy="48" r="4" fill="#1F2937" />
            <circle cx="39.5" cy="46.5" r="1.5" fill="#FFFFFF" />
            <circle cx="62" cy="48" r="4" fill="#1F2937" />
            <circle cx="63.5" cy="46.5" r="1.5" fill="#FFFFFF" />
            {/* Blush */}
            <circle cx="30" cy="56" r="4" fill="#F87171" opacity="0.6" />
            <circle cx="70" cy="56" r="4" fill="#F87171" opacity="0.6" />
          </svg>
        </div>
      );

    case 'rabbit':
      return (
        <div style={wrapperStyle} className={className} title="Rabbit Avatar">
          <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="50" fill="#FBCFE8" />
            {/* Long Ears */}
            <ellipse cx="36" cy="24" rx="8" ry="22" fill="#FFFFFF" transform="rotate(-8 36 24)" />
            <ellipse cx="36" cy="24" rx="4.5" ry="15" fill="#F472B6" transform="rotate(-8 36 24)" />
            <ellipse cx="64" cy="24" rx="8" ry="22" fill="#FFFFFF" transform="rotate(8 64 24)" />
            <ellipse cx="64" cy="24" rx="4.5" ry="15" fill="#F472B6" transform="rotate(8 64 24)" />
            {/* Head */}
            <circle cx="50" cy="56" r="28" fill="#FFFFFF" />
            {/* Nose */}
            <polygon points="47,58 53,58 50,62" fill="#EC4899" />
            {/* Eyes */}
            <circle cx="38" cy="50" r="4" fill="#1F2937" />
            <circle cx="39.5" cy="48.5" r="1.5" fill="#FFFFFF" />
            <circle cx="62" cy="50" r="4" fill="#1F2937" />
            <circle cx="63.5" cy="48.5" r="1.5" fill="#FFFFFF" />
            {/* Mouth */}
            <path d="M46 64 C 48 66, 50 66, 50 63 C 50 66, 52 66, 54 64" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
            {/* Blush */}
            <circle cx="30" cy="57" r="4.5" fill="#F472B6" opacity="0.6" />
            <circle cx="70" cy="57" r="4.5" fill="#F472B6" opacity="0.6" />
          </svg>
        </div>
      );

    case 'fox':
      return (
        <div style={wrapperStyle} className={className} title="Fox Avatar">
          <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="50" fill="#FFEDD5" />
            {/* Ears */}
            <polygon points="20,44 32,18 46,36" fill="#EA580C" />
            <polygon points="24,40 32,23 42,34" fill="#1E293B" />
            <polygon points="80,44 68,18 54,36" fill="#EA580C" />
            <polygon points="76,40 68,23 58,34" fill="#1E293B" />
            {/* Head */}
            <circle cx="50" cy="54" r="28" fill="#EA580C" />
            {/* White Cheeks / Muzzle */}
            <path d="M24 54 C 28 72, 42 76, 50 76 C 58 76, 72 72, 76 54 C 68 54, 58 60, 50 60 C 42 60, 32 54, 24 54 Z" fill="#FFFFFF" />
            {/* Nose */}
            <ellipse cx="50" cy="68" rx="4" ry="3.5" fill="#1E293B" />
            {/* Eyes */}
            <circle cx="38" cy="48" r="4" fill="#1E293B" />
            <circle cx="39.5" cy="46.5" r="1.5" fill="#FFFFFF" />
            <circle cx="62" cy="48" r="4" fill="#1E293B" />
            <circle cx="63.5" cy="46.5" r="1.5" fill="#FFFFFF" />
            {/* Blush */}
            <circle cx="32" cy="57" r="4" fill="#FB923C" opacity="0.7" />
            <circle cx="68" cy="57" r="4" fill="#FB923C" opacity="0.7" />
          </svg>
        </div>
      );

    case 'panda':
      return (
        <div style={wrapperStyle} className={className} title="Panda Avatar">
          <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="50" fill="#E0E7FF" />
            {/* Ears */}
            <circle cx="26" cy="30" r="12" fill="#1E293B" />
            <circle cx="74" cy="30" r="12" fill="#1E293B" />
            {/* Head */}
            <circle cx="50" cy="54" r="30" fill="#FFFFFF" />
            {/* Eye Patches */}
            <ellipse cx="36" cy="50" rx="9" ry="11" fill="#1E293B" transform="rotate(-15 36 50)" />
            <ellipse cx="64" cy="50" rx="9" ry="11" fill="#1E293B" transform="rotate(15 64 50)" />
            {/* Eyes */}
            <circle cx="36" cy="50" r="3.5" fill="#FFFFFF" />
            <circle cx="37" cy="49" r="1.5" fill="#1E293B" />
            <circle cx="64" cy="50" r="3.5" fill="#FFFFFF" />
            <circle cx="65" cy="49" r="1.5" fill="#1E293B" />
            {/* Nose */}
            <ellipse cx="50" cy="60" rx="5" ry="4" fill="#1E293B" />
            {/* Mouth */}
            <path d="M46 65 Q50 68 54 65" stroke="#1E293B" strokeWidth="2" fill="none" strokeLinecap="round" />
            {/* Blush */}
            <circle cx="28" cy="58" r="4.5" fill="#F472B6" opacity="0.6" />
            <circle cx="72" cy="58" r="4.5" fill="#F472B6" opacity="0.6" />
          </svg>
        </div>
      );

    case 'koala':
      return (
        <div style={wrapperStyle} className={className} title="Koala Avatar">
          <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="50" fill="#E2E8F0" />
            {/* Big Fluffy Ears */}
            <circle cx="24" cy="34" r="16" fill="#94A3B8" />
            <circle cx="24" cy="34" r="10" fill="#F472B6" opacity="0.7" />
            <circle cx="76" cy="34" r="16" fill="#94A3B8" />
            <circle cx="76" cy="34" r="10" fill="#F472B6" opacity="0.7" />
            {/* Head */}
            <circle cx="50" cy="54" r="28" fill="#94A3B8" />
            {/* Big Oval Nose */}
            <ellipse cx="50" cy="58" rx="7" ry="11" fill="#334155" />
            {/* Eyes */}
            <circle cx="36" cy="48" r="3.5" fill="#0F172A" />
            <circle cx="37" cy="47" r="1.2" fill="#FFFFFF" />
            <circle cx="64" cy="48" r="3.5" fill="#0F172A" />
            <circle cx="65" cy="47" r="1.2" fill="#FFFFFF" />
            {/* Blush */}
            <circle cx="30" cy="58" r="4" fill="#F472B6" opacity="0.6" />
            <circle cx="70" cy="58" r="4" fill="#F472B6" opacity="0.6" />
          </svg>
        </div>
      );

    case 'penguin':
      return (
        <div style={wrapperStyle} className={className} title="Penguin Avatar">
          <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="50" fill="#BAE6FD" />
            {/* Outer Navy Hood */}
            <circle cx="50" cy="52" r="30" fill="#1E293B" />
            {/* White Face Belly Patch */}
            <path d="M 30 52 C 30 38, 42 34, 50 44 C 58 34, 70 38, 70 52 C 70 68, 62 76, 50 76 C 38 76, 30 68, 30 52 Z" fill="#FFFFFF" />
            {/* Eyes */}
            <circle cx="40" cy="48" r="3.5" fill="#0F172A" />
            <circle cx="41" cy="47" r="1.2" fill="#FFFFFF" />
            <circle cx="60" cy="48" r="3.5" fill="#0F172A" />
            <circle cx="61" cy="47" r="1.2" fill="#FFFFFF" />
            {/* Orange Beak */}
            <polygon points="46,55 54,55 50,62" fill="#F97316" />
            {/* Blush */}
            <circle cx="32" cy="56" r="4" fill="#F472B6" opacity="0.7" />
            <circle cx="68" cy="56" r="4" fill="#F472B6" opacity="0.7" />
          </svg>
        </div>
      );

    default:
      return null;
  }
}

export function UserAvatar({ avatarId, name, size = 44, style = {}, className = '' }) {
  const initial = name ? name.trim()[0].toUpperCase() : 'U';

  if (avatarId && AVATAR_LIST.some(a => a.id === avatarId)) {
    return <CartoonAvatar id={avatarId} size={size} style={style} className={className} />;
  }

  const width = typeof size === 'number' ? `${size}px` : size;
  const fontSize = typeof size === 'number' ? `${Math.round(size * 0.42)}px` : '1rem';

  return (
    <div
      style={{
        width,
        height: width,
        borderRadius: '50%',
        background: 'var(--accent-primary)',
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        ...style
      }}
      className={className}
      title={name || 'User'}
    >
      {initial}
    </div>
  );
}
