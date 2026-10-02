const base = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
const make = (paths) => function Icon(props) {
  return <svg {...base} {...props}>{paths}</svg>;
};

export const Leaf = make(<><path d="M20 4c-9 0-15 5-15 13 0 1 .1 2 .3 3" /><path d="M5.3 20C9 14 13 10 20 4c0 8-3 14-11 15-1.3.2-2.6.3-3.7 1z" /></>);
export const Bed = make(<><path d="M3 18v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7" /><path d="M3 18h18" /><path d="M7 9V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" /></>);
export const Fork = make(<><path d="M7 3v8a3 3 0 0 0 3 3v7" /><path d="M7 3v5M13 3v5" /><path d="M17 3c-2 2-2 6-2 8h2v10" /></>);
export const Train = make(<><rect x="5" y="3" width="14" height="14" rx="3" /><path d="M5 10h14M9 21l1.5-3M15 21l-1.5-3M9 14h.01M15 14h.01" /></>);
export const Calendar = make(<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>);
export const Users = make(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-5-6.3" /></>);
export const MapPin = make(<><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" /></>);
export const Star = make(<path d="m12 3 2.8 5.8 6.2.9-4.5 4.4 1.1 6.3L12 17.4l-5.6 3 1.1-6.3L3 9.7l6.2-.9z" />);
export const Check = make(<path d="m5 12 4.5 4.5L19 7" />);
export const X = make(<path d="M6 6l12 12M18 6 6 18" />);
export const Menu = make(<path d="M4 7h16M4 12h16M4 17h16" />);
export const Arrow = make(<path d="M5 12h14m-6-6 6 6-6 6" />);
export const Trash = make(<><path d="M4 7h16M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13M9 7V4h6v3" /></>);
export const Plus = make(<path d="M12 5v14M5 12h14" />);
export const Sun = make(<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>);
export const Moon = make(<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" />);
export const Clock = make(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>);
export const Route = make(<><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="6" r="2.5" /><path d="M8 17h6a4 4 0 0 0 0-8h-4a3 3 0 0 1 0-6" /></>);
export const Sparkle = make(<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />);
