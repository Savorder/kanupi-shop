const PART_ICONS = [
  { keywords: ['brake pad', 'brake rotor', 'brake caliper', 'brake disc', 'brake shoe', 'brake drum', 'caliper', 'master cylinder', 'brake line', 'brake hose', 'abs'], image: '/images/parts/brakes.png' },
  { keywords: ['strut', 'shock', 'coil spring', 'sway bar', 'control arm', 'tie rod', 'ball joint', 'suspension', 'stabilizer', 'bushing'], image: '/images/parts/suspension.png' },
  { keywords: ['oil filter', 'oil change', 'motor oil', 'engine oil', 'oil pan'], image: '/images/parts/oil.png' },
  { keywords: ['air filter', 'cabin filter', 'intake'], image: '/images/parts/air-filter.png' },
  { keywords: ['spark plug', 'ignition coil', 'distributor'], image: '/images/parts/ignition.png' },
  { keywords: ['alternator', 'starter', 'battery', 'fuse'], image: '/images/parts/electrical.png' },
  { keywords: ['radiator', 'coolant', 'thermostat', 'water pump', 'heater core', 'cooling'], image: '/images/parts/cooling.png' },
  { keywords: ['a/c', 'compressor', 'condenser', 'evaporator', 'refrigerant', 'ac not', 'ac '], image: '/images/parts/ac.png' },
  { keywords: ['belt', 'serpentine', 'timing belt', 'timing chain', 'tensioner', 'pulley'], image: '/images/parts/belts.png' },
  { keywords: ['headlight', 'tail light', 'bulb', 'fog light', 'turn signal', 'lamp', 'led'], image: '/images/parts/lighting.png' },
  { keywords: ['wheel bearing', 'hub assembly', 'axle', 'cv joint', 'cv axle', 'drive shaft'], image: '/images/parts/wheel-bearing.png' },
  { keywords: ['exhaust', 'muffler', 'catalytic', 'o2 sensor', 'oxygen sensor', 'pipe'], image: '/images/parts/exhaust.png' },
  { keywords: ['fuel pump', 'fuel filter', 'fuel injector', 'fuel line'], image: '/images/parts/fuel.png' },
  { keywords: ['wiper', 'windshield'], image: '/images/parts/wipers.png' },
  { keywords: ['mirror', 'door handle', 'window', 'regulator', 'body', 'fender', 'bumper', 'hood'], image: '/images/parts/body.png' },
  { keywords: ['clutch', 'transmission', 'flywheel', 'torque converter'], image: '/images/parts/transmission.png' },
];

export function getPartIcon(query) {
  if (!query) return { image: '/images/parts/default.png' };
  const q = query.toLowerCase();
  for (const entry of PART_ICONS) {
    if (entry.keywords.some((kw) => q.includes(kw))) {
      return entry;
    }
  }
  return { image: '/images/parts/default.png' };
}
