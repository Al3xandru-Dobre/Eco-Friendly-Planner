/**
 * Decorative artwork for venues. The catalogue carries no photographs (the
 * venues are illustrative), so each venue gets a themed gradient plus a soft
 * landscape motif. Children are overlaid (badges, score).
 */
export function VenueArt({ theme = 'forest', kind = 'hotel', className = '', children }) {
  return (
    <div className={`venue-art art-${theme} ${className}`}>
      <svg viewBox="0 0 400 225" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id={`fade-${theme}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity=".35" />
          </linearGradient>
        </defs>
        <circle cx="320" cy="60" r="34" fill="#fff" fillOpacity=".55" />
        <path d="M0 170 C 60 130, 120 150, 180 135 S 300 110, 400 140 L 400 225 L 0 225 Z" fill="#fff" fillOpacity=".18" />
        <path d="M0 190 C 80 160, 160 185, 240 170 S 340 150, 400 175 L 400 225 L 0 225 Z" fill="#000" fillOpacity=".18" />
        {kind === 'hotel' ? (
          <g fill="#fff" fillOpacity=".9">
            <rect x="150" y="105" width="100" height="90" rx="4" />
            <path d="M140 110 L200 70 L260 110 Z" />
            {[0, 1, 2].map((i) => <rect key={i} x={165 + i * 28} y="125" width="14" height="18" rx="2" fill="#000" fillOpacity=".25" />)}
            <rect x="190" y="160" width="20" height="35" rx="2" fill="#000" fillOpacity=".3" />
          </g>
        ) : (
          <g fill="#fff" fillOpacity=".9">
            <ellipse cx="200" cy="165" rx="70" ry="14" />
            <rect x="196" y="110" width="8" height="55" rx="3" />
            <ellipse cx="200" cy="110" rx="60" ry="10" fill="#fff" fillOpacity=".75" />
            <circle cx="170" cy="118" r="5" fill="#000" fillOpacity=".2" />
            <circle cx="232" cy="118" r="5" fill="#000" fillOpacity=".2" />
          </g>
        )}
        <rect width="400" height="225" fill={`url(#fade-${theme})`} />
      </svg>
      {children}
    </div>
  );
}
