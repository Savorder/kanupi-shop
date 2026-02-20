import {
  Disc3,
  ArrowDownUp,
  Droplets,
  Wind,
  Zap,
  BatteryCharging,
  Thermometer,
  Snowflake,
  Link,
  Lightbulb,
  CircleDot,
  Cloud,
  Fuel,
  Sparkles,
  Car,
  RefreshCw,
  Wrench,
} from 'lucide-react';

const PART_ICONS = [
  {
    keywords: ['brake pad', 'brake rotor', 'brake caliper', 'brake disc', 'brake shoe', 'brake drum', 'caliper', 'master cylinder', 'brake line', 'brake hose', 'abs'],
    color: '#dc2626',
    Icon: Disc3,
  },
  {
    keywords: ['strut', 'shock', 'coil spring', 'sway bar', 'control arm', 'tie rod', 'ball joint', 'suspension', 'stabilizer', 'bushing'],
    color: '#7c3aed',
    Icon: ArrowDownUp,
  },
  {
    keywords: ['oil filter', 'oil change', 'motor oil', 'engine oil', 'oil pan'],
    color: '#92400e',
    Icon: Droplets,
  },
  {
    keywords: ['air filter', 'cabin filter', 'intake'],
    color: '#0891b2',
    Icon: Wind,
  },
  {
    keywords: ['spark plug', 'ignition coil', 'distributor'],
    color: '#eab308',
    Icon: Zap,
  },
  {
    keywords: ['alternator', 'starter', 'battery', 'fuse'],
    color: '#16a34a',
    Icon: BatteryCharging,
  },
  {
    keywords: ['radiator', 'coolant', 'thermostat', 'water pump', 'heater core', 'cooling'],
    color: '#0284c7',
    Icon: Thermometer,
  },
  {
    keywords: ['a/c', 'compressor', 'condenser', 'evaporator', 'refrigerant', 'ac not', 'ac '],
    color: '#38bdf8',
    Icon: Snowflake,
  },
  {
    keywords: ['belt', 'serpentine', 'timing belt', 'timing chain', 'tensioner', 'pulley'],
    color: '#64748b',
    Icon: Link,
  },
  {
    keywords: ['headlight', 'tail light', 'bulb', 'fog light', 'turn signal', 'lamp', 'led'],
    color: '#f59e0b',
    Icon: Lightbulb,
  },
  {
    keywords: ['wheel bearing', 'hub assembly', 'axle', 'cv joint', 'cv axle', 'drive shaft'],
    color: '#6366f1',
    Icon: CircleDot,
  },
  {
    keywords: ['exhaust', 'muffler', 'catalytic', 'o2 sensor', 'oxygen sensor', 'pipe'],
    color: '#78716c',
    Icon: Cloud,
  },
  {
    keywords: ['fuel pump', 'fuel filter', 'fuel injector', 'fuel line'],
    color: '#ea580c',
    Icon: Fuel,
  },
  {
    keywords: ['wiper', 'windshield'],
    color: '#0d9488',
    Icon: Sparkles,
  },
  {
    keywords: ['mirror', 'door handle', 'window', 'regulator', 'body', 'fender', 'bumper', 'hood'],
    color: '#475569',
    Icon: Car,
  },
  {
    keywords: ['clutch', 'transmission', 'flywheel', 'torque converter'],
    color: '#a855f7',
    Icon: RefreshCw,
  },
];

const DEFAULT_ICON = {
  color: '#71717a',
  Icon: Wrench,
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
