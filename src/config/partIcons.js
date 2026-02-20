const PART_ICONS = [
  {
    keywords: ['brake pad', 'brake rotor', 'brake caliper', 'brake disc', 'brake shoe', 'brake drum', 'caliper', 'master cylinder', 'brake line', 'brake hose', 'abs'],
    color: '#dc2626',
    icon: (c) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><line x1="12" y1="3" x2="12" y2="5" /><line x1="12" y1="19" x2="12" y2="21" /><line x1="3" y1="12" x2="5" y2="12" /><line x1="19" y1="12" x2="21" y2="12" />
      </svg>
    ),
  },
  {
    keywords: ['strut', 'shock', 'coil spring', 'sway bar', 'control arm', 'tie rod', 'ball joint', 'suspension', 'stabilizer', 'bushing'],
    color: '#7c3aed',
    icon: (c) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M12 3v2M12 19v2" /><path d="M8 7l4-4 4 4" /><path d="M9 8c0 0-1 2-1 4s1 4 1 4" /><path d="M15 8c0 0 1 2 1 4s-1 4-1 4" /><line x1="12" y1="9" x2="12" y2="15" />
      </svg>
    ),
  },
  {
    keywords: ['oil filter', 'oil change', 'motor oil', 'engine oil', 'oil pan'],
    color: '#92400e',
    icon: (c) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M12 3c-1 2-4 3-4 6a4 4 0 008 0c0-3-3-4-4-6z" /><rect x="6" y="16" width="12" height="5" rx="1" /><line x1="10" y1="16" x2="10" y2="21" /><line x1="14" y1="16" x2="14" y2="21" />
      </svg>
    ),
  },
  {
    keywords: ['air filter', 'cabin filter', 'intake'],
    color: '#0891b2',
    icon: (c) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="3" y="6" width="18" height="12" rx="2" /><line x1="7" y1="10" x2="17" y2="10" /><line x1="7" y1="14" x2="17" y2="14" /><path d="M7 6V4M17 6V4" />
      </svg>
    ),
  },
  {
    keywords: ['spark plug', 'ignition coil', 'distributor'],
    color: '#eab308',
    icon: (c) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    keywords: ['alternator', 'starter', 'battery', 'fuse'],
    color: '#16a34a',
    icon: (c) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="4" y="7" width="16" height="12" rx="2" /><line x1="7" y1="7" x2="7" y2="4" /><line x1="17" y1="7" x2="17" y2="4" /><line x1="10" y1="11" x2="10" y2="15" /><line x1="8" y1="13" x2="12" y2="13" /><line x1="14" y1="13" x2="16" y2="13" />
      </svg>
    ),
  },
  {
    keywords: ['radiator', 'coolant', 'thermostat', 'water pump', 'heater core', 'cooling'],
    color: '#0284c7',
    icon: (c) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="5" y="3" width="14" height="18" rx="2" /><line x1="9" y1="7" x2="9" y2="17" /><line x1="12" y1="7" x2="12" y2="17" /><line x1="15" y1="7" x2="15" y2="17" /><path d="M3 8h2M3 12h2M3 16h2M19 8h2M19 12h2M19 16h2" />
      </svg>
    ),
  },
  {
    keywords: ['a/c', 'compressor', 'condenser', 'evaporator', 'refrigerant', 'ac not', 'ac '],
    color: '#38bdf8',
    icon: (c) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M12 2v20M17 5l-5 5-5-5M7 19l5-5 5 5" /><line x1="2" y1="12" x2="22" y2="12" />
      </svg>
    ),
  },
  {
    keywords: ['belt', 'serpentine', 'timing belt', 'timing chain', 'tensioner', 'pulley'],
    color: '#64748b',
    icon: (c) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="7" cy="12" r="4" /><circle cx="17" cy="12" r="4" /><path d="M7 8c3-2 7-2 10 0M7 16c3 2 7 2 10 0" />
      </svg>
    ),
  },
  {
    keywords: ['headlight', 'tail light', 'bulb', 'fog light', 'turn signal', 'lamp', 'led'],
    color: '#f59e0b',
    icon: (c) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M9 18h6M10 21h4" /><path d="M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z" />
      </svg>
    ),
  },
  {
    keywords: ['wheel bearing', 'hub assembly', 'axle', 'cv joint', 'cv axle', 'drive shaft'],
    color: '#6366f1',
    icon: (c) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="8" /><line x1="12" y1="4" x2="12" y2="7" /><line x1="12" y1="17" x2="12" y2="20" /><line x1="4" y1="12" x2="7" y2="12" /><line x1="17" y1="12" x2="20" y2="12" />
      </svg>
    ),
  },
  {
    keywords: ['exhaust', 'muffler', 'catalytic', 'o2 sensor', 'oxygen sensor', 'pipe'],
    color: '#78716c',
    icon: (c) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M3 14h4l3-3h4l3 3h4" /><path d="M7 14v4a1 1 0 001 1h8a1 1 0 001-1v-4" /><path d="M10 7c0-1 1-2 2-2s2 1 2 2" /><path d="M8 10c0-1.5 1.5-3 4-3s4 1.5 4 3" />
      </svg>
    ),
  },
  {
    keywords: ['fuel pump', 'fuel filter', 'fuel injector', 'fuel line'],
    color: '#ea580c',
    icon: (c) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="4" y="4" width="12" height="16" rx="2" /><path d="M16 10h2a2 2 0 012 2v4a2 2 0 01-2 2h0" /><path d="M20 10V7l-2-2" /><line x1="8" y1="8" x2="12" y2="8" />
      </svg>
    ),
  },
  {
    keywords: ['wiper', 'windshield'],
    color: '#0d9488',
    icon: (c) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M2 20l10-16 10 16" /><line x1="12" y1="4" x2="12" y2="14" /><circle cx="12" cy="16" r="2" />
      </svg>
    ),
  },
  {
    keywords: ['mirror', 'door handle', 'window', 'regulator', 'body', 'fender', 'bumper', 'hood'],
    color: '#475569',
    icon: (c) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M5 17h14M3 10l3-5h12l3 5" /><path d="M3 10v7h18v-7" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" />
      </svg>
    ),
  },
  {
    keywords: ['clutch', 'transmission', 'flywheel', 'torque converter'],
    color: '#a855f7',
    icon: (c) => (
      <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /><line x1="12" y1="3" x2="12" y2="7" /><line x1="3" y1="12" x2="7" y2="12" /><line x1="17" y1="12" x2="21" y2="12" /><line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
];

const DEFAULT_ICON = {
  color: '#71717a',
  icon: (c) => (
    <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
    </svg>
  ),
};

export function getPartIcon(query) {
  if (!query) return DEFAULT_ICON;
  const q = query.toLowerCase();
  for (const entry of PART_ICONS) {
    if (entry.keywords.some((kw) => q.includes(kw))) {
      return entry;
    }
  }
  return DEFAULT_ICON;
}
