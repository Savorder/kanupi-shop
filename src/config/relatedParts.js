/**
 * Related Parts Intelligence Map
 * 
 * Maps part types to:
 *   - Position options (front/rear/both) for position-sensitive parts
 *   - Related parts with reasons and pre-checked defaults
 *   - Position notes explaining layout differences by vehicle type
 * 
 * Used by RelatedPartsDrawer to suggest companion parts when a
 * service writer selects a part from the category browser or search.
 * 
 * Matching is fuzzy — handles variations like "Strut Assembly", "Struts",
 * "Complete Strut", "Brake Pad Set", "Disc Brake Pad", etc.
 */

const RELATED_PARTS = {
  // ── Brakes ────────────────────────────────────────────────────────
  'Brake Pads': {
    aliases: ['brake pad', 'disc brake pad', 'brake pad set', 'front brake pad', 'rear brake pad', 'ceramic brake pad'],
    positions: [
      { value: 'front', label: 'Front Brake Pads', default: true },
      { value: 'rear', label: 'Rear Brake Pads' },
      { value: 'both', label: 'Front + Rear (Full Set)' },
    ],
    related: [
      { label: 'Brake Rotors', reason: 'Recommended with every pad change to prevent uneven wear', checked: true },
      { label: 'Brake Hardware Kit', reason: 'Clips, pins, and shims — cheap insurance against squealing', checked: false },
      { label: 'Brake Caliper', reason: 'Inspect for seized pistons or leaking seals', checked: false },
    ],
    note: 'Most vehicles use disc brakes front and drum brakes rear. Some newer vehicles have 4-wheel disc.',
  },

  'Brake Rotors': {
    aliases: ['brake rotor', 'disc brake rotor', 'rotor', 'rotors', 'brake disc'],
    positions: [
      { value: 'front', label: 'Front Rotors', default: true },
      { value: 'rear', label: 'Rear Rotors' },
      { value: 'both', label: 'Front + Rear (Full Set)' },
    ],
    related: [
      { label: 'Brake Pads', reason: 'Always replace pads with new rotors for proper bedding', checked: true },
      { label: 'Brake Hardware Kit', reason: 'New clips and shims ensure quiet operation', checked: false },
      { label: 'Wheel Bearing', reason: 'Check bearing play while rotors are off', checked: false },
    ],
    note: 'Rotors should always be replaced in pairs (both fronts or both rears).',
  },

  'Brake Calipers': {
    aliases: ['brake caliper', 'caliper', 'calipers', 'disc brake caliper', 'caliper assembly'],
    positions: [
      { value: 'front-left', label: 'Front Left Caliper' },
      { value: 'front-right', label: 'Front Right Caliper' },
      { value: 'rear-left', label: 'Rear Left Caliper' },
      { value: 'rear-right', label: 'Rear Right Caliper' },
      { value: 'front-pair', label: 'Front Pair', default: true },
      { value: 'rear-pair', label: 'Rear Pair' },
    ],
    related: [
      { label: 'Brake Pads', reason: 'New caliper requires new pads for proper fit', checked: true },
      { label: 'Brake Rotors', reason: 'Inspect for scoring from seized caliper', checked: false },
      { label: 'Brake Lines', reason: 'Inspect flex lines for cracking while caliper is off', checked: false },
    ],
    note: 'Always replace calipers in pairs per axle to maintain balanced braking.',
  },

  'Brake Drums': {
    aliases: ['brake drum', 'drum', 'drums', 'rear drum'],
    positions: [
      { value: 'rear', label: 'Rear Brake Drums', default: true },
    ],
    related: [
      { label: 'Brake Shoes', reason: 'Always replace shoes with new drums', checked: true },
      { label: 'Wheel Cylinder', reason: 'Inspect for leaks — common failure point on drum brakes', checked: false },
    ],
    note: 'Drum brakes are typically rear-only on modern vehicles.',
  },

  'Brake Shoes': {
    aliases: ['brake shoe', 'shoe', 'shoes', 'rear brake shoe'],
    positions: [
      { value: 'rear', label: 'Rear Brake Shoes', default: true },
    ],
    related: [
      { label: 'Brake Drums', reason: 'Check drum surface — replace if scored or out of round', checked: true },
      { label: 'Wheel Cylinder', reason: 'Common to leak and contaminate new shoes', checked: false },
    ],
  },

  'Brake Master Cylinder': {
    aliases: ['master cylinder', 'brake master'],
    related: [
      { label: 'Brake Booster', reason: 'Booster and master cylinder work together — inspect both', checked: false },
      { label: 'Brake Lines', reason: 'Inspect brake lines while system is open', checked: false },
    ],
  },

  // ── Steering & Suspension ─────────────────────────────────────────
  'Struts': {
    aliases: ['strut', 'strut assembly', 'strut assemblies', 'complete strut', 'complete strut assembly', 'loaded strut', 'front strut', 'rear strut', 'shock strut', 'macpherson strut'],
    positions: [
      { value: 'front', label: 'Front Strut Assemblies', default: true },
      { value: 'rear-struts', label: 'Rear Strut Assemblies' },
      { value: 'rear-shocks', label: 'Rear Shocks (if shock-type rear)' },
      { value: 'all', label: 'Front Struts + Rear Struts/Shocks' },
    ],
    related: [
      { label: 'Strut Mount', reason: 'Strut mounts wear out with struts — replace together to avoid labor twice', checked: true },
      { label: 'Shocks', reason: 'Many vehicles use shocks in the rear — replace all corners together', checked: false },
      { label: 'Sway Bar Link', reason: 'Easy to replace while strut is out — common wear item', checked: false },
    ],
    note: 'Most sedans/hatchbacks use MacPherson struts front and either struts or shocks rear. Trucks and body-on-frame SUVs typically use shocks all around. Always replace in pairs per axle.',
  },

  'Shocks': {
    aliases: ['shock', 'shock absorber', 'shock absorbers', 'rear shock', 'front shock'],
    positions: [
      { value: 'rear', label: 'Rear Shocks', default: true },
      { value: 'front', label: 'Front Shocks' },
      { value: 'all', label: 'All Four Shocks' },
    ],
    related: [
      { label: 'Struts', reason: 'If vehicle has struts up front, consider replacing those too', checked: false },
      { label: 'Sway Bar Link', reason: 'Common wear item — easy to do while shocks are out', checked: false },
    ],
    note: 'Trucks and body-on-frame SUVs often use shocks on all four corners. Most cars use struts front and shocks rear. Always replace in pairs.',
  },

  'Control Arm': {
    aliases: ['control arm', 'control arm assembly', 'lower control arm', 'upper control arm', 'a-arm', 'wishbone'],
    positions: [
      { value: 'front-lower', label: 'Front Lower Control Arm', default: true },
      { value: 'front-upper', label: 'Front Upper Control Arm' },
      { value: 'rear-lower', label: 'Rear Lower Control Arm' },
      { value: 'rear-upper', label: 'Rear Upper Control Arm' },
    ],
    related: [
      { label: 'Ball Joint', reason: 'Ball joints are integral to control arms on many vehicles', checked: false },
      { label: 'Sway Bar Link', reason: 'Commonly worn — replace while suspension is apart', checked: false },
      { label: 'Tie Rod End', reason: 'Inspect tie rods whenever doing front suspension work', checked: false },
    ],
    note: 'Alignment required after control arm replacement.',
  },

  'Ball Joint': {
    aliases: ['ball joint', 'ball joints', 'lower ball joint', 'upper ball joint'],
    positions: [
      { value: 'front-lower', label: 'Front Lower Ball Joint', default: true },
      { value: 'front-upper', label: 'Front Upper Ball Joint' },
    ],
    related: [
      { label: 'Control Arm', reason: 'Some vehicles have non-serviceable ball joints pressed into control arm', checked: false },
      { label: 'Tie Rod End', reason: 'Inspect all front end components together', checked: false },
    ],
    note: 'Alignment required after ball joint replacement.',
  },

  'Tie Rod End': {
    aliases: ['tie rod', 'tie rod end', 'inner tie rod', 'outer tie rod', 'tie rod assembly'],
    positions: [
      { value: 'inner', label: 'Inner Tie Rod End', default: true },
      { value: 'outer', label: 'Outer Tie Rod End' },
      { value: 'both', label: 'Inner + Outer Set' },
    ],
    related: [
      { label: 'Steering Rack', reason: 'If inner tie rods are worn, inspect rack for play', checked: false },
      { label: 'Ball Joint', reason: 'Inspect while doing front end work', checked: false },
    ],
    note: 'Alignment required after tie rod replacement. Replace in pairs per side.',
  },

  'Wheel Bearing': {
    aliases: ['wheel bearing', 'bearing', 'hub bearing', 'wheel bearing assembly'],
    positions: [
      { value: 'front-left', label: 'Front Left' },
      { value: 'front-right', label: 'Front Right' },
      { value: 'rear-left', label: 'Rear Left' },
      { value: 'rear-right', label: 'Rear Right' },
    ],
    related: [
      { label: 'Wheel Hub', reason: 'Hub and bearing are often one assembly on modern vehicles', checked: false },
      { label: 'Brake Rotors', reason: 'Rotors come off for bearing replacement — inspect condition', checked: false },
    ],
    note: 'Most modern vehicles use a hub/bearing assembly. Older vehicles may use serviceable bearings.',
  },

  'Wheel Hub': {
    aliases: ['wheel hub', 'hub assembly', 'wheel hub assembly', 'hub bearing assembly'],
    positions: [
      { value: 'front-left', label: 'Front Left' },
      { value: 'front-right', label: 'Front Right' },
      { value: 'rear-left', label: 'Rear Left' },
      { value: 'rear-right', label: 'Rear Right' },
    ],
    related: [
      { label: 'Wheel Bearing', reason: 'Bearing is usually integrated with hub assembly', checked: true },
      { label: 'ABS Wheel Speed Sensor', reason: 'Sensor can be damaged during hub replacement', checked: false },
    ],
  },

  'Sway Bar Link': {
    aliases: ['sway bar link', 'stabilizer link', 'stabilizer bar link', 'sway bar end link', 'anti-roll bar link'],
    positions: [
      { value: 'front', label: 'Front Sway Bar Links', default: true },
      { value: 'rear', label: 'Rear Sway Bar Links' },
    ],
    related: [
      { label: 'Struts', reason: 'Common to replace together for a complete ride refresh', checked: false },
      { label: 'Control Arm', reason: 'Inspect control arm bushings while link is disconnected', checked: false },
    ],
    note: 'Always replace in pairs (both sides).',
  },

  'CV Axle': {
    aliases: ['cv axle', 'cv shaft', 'axle shaft', 'cv joint', 'half shaft', 'drive axle'],
    positions: [
      { value: 'front-left', label: 'Front Left CV Axle' },
      { value: 'front-right', label: 'Front Right CV Axle' },
      { value: 'rear-left', label: 'Rear Left (AWD only)' },
      { value: 'rear-right', label: 'Rear Right (AWD only)' },
    ],
    related: [
      { label: 'Wheel Bearing', reason: 'Bearing often needs replacement due to contamination from torn boot', checked: false },
      { label: 'Tie Rod End', reason: 'Inspect while axle is out', checked: false },
    ],
    note: 'CV axle failure often starts with a torn boot leaking grease. Clicking on turns is the telltale symptom.',
  },

  'Steering Rack': {
    aliases: ['steering rack', 'rack and pinion', 'steering gear', 'power steering rack'],
    related: [
      { label: 'Tie Rod End', reason: 'Inner tie rods connect to the rack — replace together', checked: true },
      { label: 'Power Steering Pump', reason: 'If pump contaminated the rack, replace both', checked: false },
    ],
    note: 'Alignment required after steering rack replacement.',
  },

  'Power Steering Pump': {
    aliases: ['power steering pump', 'ps pump', 'steering pump'],
    related: [
      { label: 'Serpentine Belt', reason: 'Belt drives the pump — inspect for wear', checked: false },
      { label: 'Steering Rack', reason: 'A failing pump can damage the rack over time', checked: false },
    ],
  },

  // ── Engine Cooling ────────────────────────────────────────────────
  'Radiator': {
    aliases: ['radiator', 'radiator assembly'],
    related: [
      { label: 'Thermostat', reason: 'Replace thermostat with new radiator — cheap part, prevents overheating', checked: true },
      { label: 'Radiator Hose', reason: 'Old hoses can fail on a new radiator', checked: true },
      { label: 'Coolant Reservoir', reason: 'Inspect for cracks while coolant is drained', checked: false },
      { label: 'Water Pump', reason: 'If high mileage, consider preventive replacement', checked: false },
    ],
    note: 'Full coolant flush recommended with radiator replacement.',
  },

  'Water Pump': {
    aliases: ['water pump', 'coolant pump', 'engine water pump'],
    related: [
      { label: 'Thermostat', reason: 'Replace together — coolant is already drained', checked: true },
      { label: 'Serpentine Belt', reason: 'Belt must come off for water pump — replace if worn', checked: false },
      { label: 'Timing Belt', reason: 'On timing belt-driven pumps, replace belt at the same time', checked: false },
      { label: 'Radiator Hose', reason: 'Inspect hoses while coolant system is open', checked: false },
    ],
    note: 'Some water pumps are driven by the timing belt — replacing both saves significant labor.',
  },

  'Thermostat': {
    aliases: ['thermostat', 'engine thermostat', 'coolant thermostat'],
    related: [
      { label: 'Coolant Temperature Sensor', reason: 'Test sensor while thermostat housing is open', checked: false },
      { label: 'Radiator Hose', reason: 'Inspect upper hose connection at thermostat housing', checked: false },
    ],
  },

  'Radiator Hose': {
    aliases: ['radiator hose', 'upper radiator hose', 'lower radiator hose', 'coolant hose'],
    related: [
      { label: 'Thermostat', reason: 'Replace thermostat when upper hose is disconnected', checked: false },
      { label: 'Radiator', reason: 'Inspect radiator condition while hoses are off', checked: false },
    ],
  },

  // ── Engine Parts ──────────────────────────────────────────────────
  'Serpentine Belt': {
    aliases: ['serpentine belt', 'drive belt', 'accessory belt', 'v-belt'],
    related: [
      { label: 'Belt Tensioner', reason: 'Worn tensioner will eat a new belt — common to replace together', checked: true },
      { label: 'Idler Pulley', reason: 'Pulleys wear with the belt — listen for bearing noise', checked: false },
      { label: 'Water Pump', reason: 'If belt-driven, inspect for weeping or play', checked: false },
    ],
  },

  'Timing Belt': {
    aliases: ['timing belt', 'timing belt kit', 'cam belt'],
    related: [
      { label: 'Water Pump', reason: 'Critical — water pump is behind the timing cover, replace now to avoid doing the job twice', checked: true },
      { label: 'Serpentine Belt', reason: 'Usually removed to access timing belt — replace if due', checked: false },
    ],
    note: 'Timing belt replacement is a major service. Always replace the water pump and tensioner together.',
  },

  'Timing Chain': {
    aliases: ['timing chain', 'timing chain kit', 'timing set'],
    related: [
      { label: 'Water Pump', reason: 'Access overlap — replace preventively', checked: false },
      { label: 'Valve Cover Gasket', reason: 'Valve cover comes off for chain access on many engines', checked: false },
    ],
    note: 'Timing chains last longer than belts but still wear. Listen for rattle on cold start.',
  },

  'Engine Mount': {
    aliases: ['engine mount', 'motor mount', 'engine mounting', 'transmission mount'],
    positions: [
      { value: 'front', label: 'Front Engine Mount' },
      { value: 'rear', label: 'Rear Engine Mount (Torque Mount)' },
      { value: 'left', label: 'Left (Driver Side) Mount' },
      { value: 'right', label: 'Right (Passenger Side) Mount' },
      { value: 'transmission', label: 'Transmission Mount' },
    ],
    related: [
      { label: 'Transmission Mount', reason: 'Engine and transmission mounts wear together', checked: false },
    ],
    note: 'Most vehicles have 3-4 mounts. If one is broken, others are likely worn too. Consider replacing all.',
  },

  // ── Ignition ──────────────────────────────────────────────────────
  'Spark Plugs': {
    aliases: ['spark plug', 'spark plugs', 'plug', 'plugs', 'ignition plug'],
    related: [
      { label: 'Ignition Coil', reason: 'Worn coils can foul new plugs — inspect or replace as a set', checked: false },
      { label: 'Spark Plug Wires', reason: 'If vehicle has plug wires, replace with new plugs', checked: false },
    ],
    note: 'Most modern vehicles use coil-on-plug (no wires). Replace plugs as a full set.',
  },

  'Ignition Coil': {
    aliases: ['ignition coil', 'coil pack', 'coil on plug', 'cop', 'ignition coil pack'],
    related: [
      { label: 'Spark Plugs', reason: 'Replace plugs with coils for best results', checked: true },
      { label: 'Spark Plug Wires', reason: 'If vehicle uses wires, replace the set', checked: false },
    ],
    note: 'Single coil failure is common but replacing the full set prevents repeat failures.',
  },

  // ── A/C & Heating ─────────────────────────────────────────────────
  'AC Compressor': {
    aliases: ['ac compressor', 'a/c compressor', 'air conditioning compressor', 'compressor'],
    related: [
      { label: 'AC Condenser', reason: 'Metal debris from failed compressor contaminates condenser', checked: false },
      { label: 'Serpentine Belt', reason: 'Belt drives the compressor — inspect for wear', checked: false },
      { label: 'Cabin Air Filter', reason: 'Replace for maximum A/C efficiency', checked: false },
    ],
    note: 'System must be evacuated and recharged. Inspect for metal contamination throughout the system.',
  },

  'AC Condenser': {
    aliases: ['ac condenser', 'a/c condenser', 'condenser'],
    related: [
      { label: 'AC Compressor', reason: 'If condenser leaked, compressor may be contaminated', checked: false },
    ],
  },

  'Blower Motor': {
    aliases: ['blower motor', 'hvac blower', 'heater blower', 'fan motor'],
    related: [
      { label: 'Cabin Air Filter', reason: 'Clogged filter overworks the blower motor', checked: false },
    ],
  },

  // ── Electrical & Starting ─────────────────────────────────────────
  'Alternator': {
    aliases: ['alternator', 'generator'],
    related: [
      { label: 'Serpentine Belt', reason: 'Belt must come off — replace if worn', checked: false },
      { label: 'Battery', reason: 'Bad alternator may have damaged battery — test it', checked: false },
    ],
  },

  'Starter Motor': {
    aliases: ['starter', 'starter motor', 'starting motor'],
    related: [
      { label: 'Battery', reason: 'Weak battery can burn out a starter — test battery', checked: false },
    ],
  },

  'Battery': {
    aliases: ['battery', 'car battery', 'auto battery'],
    related: [
      { label: 'Alternator', reason: 'Test alternator output — a bad alternator kills batteries', checked: false },
    ],
  },

  // ── Exhaust ───────────────────────────────────────────────────────
  'Catalytic Converter': {
    aliases: ['catalytic converter', 'cat', 'catalytic', 'cat converter'],
    positions: [
      { value: 'front', label: 'Front (Upstream) Catalytic Converter', default: true },
      { value: 'rear', label: 'Rear (Downstream) Catalytic Converter' },
    ],
    related: [
      { label: 'Oxygen Sensor', reason: 'O2 sensors monitor cat efficiency — replace for accurate readings', checked: true },
      { label: 'Exhaust Manifold', reason: 'Inspect for cracks — exhaust leak can trigger cat codes', checked: false },
    ],
    note: 'Catalytic converter replacement often requires upstream and downstream O2 sensors.',
  },

  'Oxygen Sensor': {
    aliases: ['oxygen sensor', 'o2 sensor', 'lambda sensor', 'exhaust sensor'],
    positions: [
      { value: 'upstream-bank1', label: 'Upstream (Bank 1 Sensor 1)', default: true },
      { value: 'downstream-bank1', label: 'Downstream (Bank 1 Sensor 2)' },
      { value: 'upstream-bank2', label: 'Upstream (Bank 2 Sensor 1)' },
      { value: 'downstream-bank2', label: 'Downstream (Bank 2 Sensor 2)' },
    ],
    related: [
      { label: 'Catalytic Converter', reason: 'Failing O2 readings may indicate cat deterioration', checked: false },
    ],
    note: 'Bank 1 is the side with cylinder 1. V6/V8 engines have sensors on both banks.',
  },

  'Muffler': {
    aliases: ['muffler', 'exhaust muffler', 'silencer'],
    related: [
      { label: 'Exhaust Pipe', reason: 'Inspect connecting pipes for rust while muffler is off', checked: false },
    ],
  },

  // ── Filters ───────────────────────────────────────────────────────
  'Oil Filter': {
    aliases: ['oil filter'],
    related: [
      { label: 'Air Filter', reason: 'Replace air filter at every other oil change', checked: false },
      { label: 'Cabin Air Filter', reason: 'Easy add-on service', checked: false },
    ],
  },

  'Air Filter': {
    aliases: ['air filter', 'engine air filter', 'intake filter'],
    related: [
      { label: 'Cabin Air Filter', reason: 'Replace both filters together for complete air quality service', checked: true },
      { label: 'Spark Plugs', reason: 'If high mileage, consider tune-up with filter change', checked: false },
    ],
  },

  'Cabin Air Filter': {
    aliases: ['cabin air filter', 'cabin filter', 'pollen filter', 'hvac filter'],
    related: [
      { label: 'Air Filter', reason: 'Replace both filters together', checked: false },
    ],
  },

  'Fuel Filter': {
    aliases: ['fuel filter'],
    related: [
      { label: 'Fuel Pump', reason: 'A clogged filter can damage the fuel pump over time', checked: false },
    ],
  },

  // ── Fuel System ───────────────────────────────────────────────────
  'Fuel Pump': {
    aliases: ['fuel pump', 'fuel pump assembly', 'electric fuel pump'],
    related: [
      { label: 'Fuel Filter', reason: 'Always replace filter with new pump', checked: true },
      { label: 'Fuel Injector', reason: 'Inspect injectors if pump failed from contamination', checked: false },
    ],
  },

  'Fuel Injector': {
    aliases: ['fuel injector', 'injector', 'fuel injectors'],
    related: [
      { label: 'Fuel Filter', reason: 'Clogged filter sends debris to injectors', checked: false },
      { label: 'Spark Plugs', reason: 'Leaking injectors foul spark plugs', checked: false },
    ],
  },

  // ── Lighting ──────────────────────────────────────────────────────
  'Headlight Assembly': {
    aliases: ['headlight', 'headlight assembly', 'headlamp', 'head light'],
    positions: [
      { value: 'left', label: 'Driver Side (Left)' },
      { value: 'right', label: 'Passenger Side (Right)' },
      { value: 'both', label: 'Both Sides', default: true },
    ],
    related: [
      { label: 'Headlight Bulb', reason: 'New assembly may need new bulbs', checked: false },
    ],
  },

  'Tail Light Assembly': {
    aliases: ['tail light', 'tail light assembly', 'taillight', 'rear light'],
    positions: [
      { value: 'left', label: 'Driver Side (Left)' },
      { value: 'right', label: 'Passenger Side (Right)' },
      { value: 'both', label: 'Both Sides' },
    ],
    related: [
      { label: 'Brake Light Bulb', reason: 'Replace bulbs in new assembly', checked: false },
    ],
  },

  // ── Sensors ───────────────────────────────────────────────────────
  'Mass Air Flow Sensor': {
    aliases: ['mass air flow', 'maf sensor', 'maf', 'airflow sensor'],
    related: [
      { label: 'Air Filter', reason: 'Dirty air filter contaminates MAF — always replace together', checked: true },
    ],
  },

  'Crankshaft Position Sensor': {
    aliases: ['crankshaft position sensor', 'crank sensor', 'ckp sensor'],
    related: [
      { label: 'Camshaft Position Sensor', reason: 'Cam and crank sensors often fail around the same mileage', checked: false },
    ],
  },

  'Camshaft Position Sensor': {
    aliases: ['camshaft position sensor', 'cam sensor', 'cmp sensor'],
    related: [
      { label: 'Crankshaft Position Sensor', reason: 'Cam and crank sensors often fail around the same mileage', checked: false },
    ],
  },

  'ABS Wheel Speed Sensor': {
    aliases: ['abs sensor', 'wheel speed sensor', 'abs wheel speed sensor', 'speed sensor'],
    positions: [
      { value: 'front-left', label: 'Front Left' },
      { value: 'front-right', label: 'Front Right' },
      { value: 'rear-left', label: 'Rear Left' },
      { value: 'rear-right', label: 'Rear Right' },
    ],
    related: [
      { label: 'Wheel Hub', reason: 'Some sensors are integrated into the hub assembly', checked: false },
    ],
  },
};

/**
 * Normalize a string for fuzzy matching.
 */
function normalize(str) {
  return str
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if two part labels refer to the same thing.
 * Handles singular/plural, "assembly" suffix, and substring matching.
 */
function isMatch(query, target) {
  const q = normalize(query);
  const t = normalize(target);

  if (q === t) return true;
  if (q.includes(t) || t.includes(q)) return true;

  const qNoS = q.replace(/s$/, '');
  const tNoS = t.replace(/s$/, '');
  if (qNoS === tNoS) return true;
  if (qNoS.includes(tNoS) || tNoS.includes(qNoS)) return true;

  const stripSuffixes = (s) => s.replace(/\b(assembly|assemblies|complete|kit|kits|set|sets)\b/g, '').replace(/\s+/g, ' ').trim();
  const qStripped = stripSuffixes(qNoS);
  const tStripped = stripSuffixes(tNoS);
  if (qStripped && tStripped) {
    if (qStripped === tStripped) return true;
    if (qStripped.includes(tStripped) || tStripped.includes(qStripped)) return true;
  }

  return false;
}

/**
 * Look up related parts for a given part label.
 * Checks: exact match → alias match → fuzzy word match.
 * 
 * @param {string} partLabel - The part name (e.g. "Brake Pads", "Strut Assembly")
 * @returns {object|null} { positions, related, note, aliases } or null if no match
 */
export function getRelatedParts(partLabel) {
  if (!partLabel) return null;

  const query = normalize(partLabel);

  for (const [key, value] of Object.entries(RELATED_PARTS)) {
    if (normalize(key) === query) return value;
  }

  for (const [, value] of Object.entries(RELATED_PARTS)) {
    if (value.aliases) {
      for (const alias of value.aliases) {
        if (isMatch(query, alias)) return value;
      }
    }
  }

  for (const [key, value] of Object.entries(RELATED_PARTS)) {
    if (isMatch(query, key)) return value;
  }

  return null;
}

/**
 * Build search queries from selected parts + positions.
 * Returns an array of { query, label } for the results page.
 */
export function buildSearchQueries(primaryPart, selectedPosition, selectedRelated) {
  const queries = [];

  let primaryQuery = primaryPart;
  let primaryLabel = primaryPart;
  if (selectedPosition) {
    const posPrefix = selectedPosition
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    primaryQuery = `${posPrefix} ${primaryPart}`;
    primaryLabel = `${posPrefix} ${primaryPart}`;
  }
  queries.push({ query: primaryQuery, label: primaryLabel });

  for (const related of selectedRelated) {
    let relQuery = related;
    if (selectedPosition) {
      const simplePos = selectedPosition.split('-')[0];
      if (['front', 'rear'].includes(simplePos)) {
        relQuery = `${simplePos} ${related}`;
      }
    }
    queries.push({ query: relQuery, label: related });
  }

  return queries;
}

export default RELATED_PARTS;
