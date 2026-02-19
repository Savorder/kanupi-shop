/**
 * Part Categories Taxonomy for Kanupi Shop Dashboard
 * 
 * Three-level hierarchy: Category → Subcategory → Part Type
 * Keys map directly to part-types.js in kanupi-backend.
 * 
 * This is the B2B drill-down equivalent of RockAuto's category tree.
 * Each leaf part has a `key` that matches the backend's PCdb part type IDs
 * for fitment verification and eBay category mapping.
 */

const PART_CATEGORIES = [
  {
    key: 'brakes',
    label: 'Brakes & Brake Parts',
    icon: '🛑',
    subcategories: [
      {
        key: 'pads',
        label: 'Brake Pads',
        parts: [
          { key: 'disc_brake_pad_front', label: 'Front Brake Pads' },
          { key: 'disc_brake_pad_rear', label: 'Rear Brake Pads' },
        ],
      },
      {
        key: 'rotors',
        label: 'Brake Rotors',
        parts: [
          { key: 'disc_brake_rotor_front', label: 'Front Rotors' },
          { key: 'disc_brake_rotor_rear', label: 'Rear Rotors' },
        ],
      },
      {
        key: 'calipers',
        label: 'Calipers',
        parts: [
          { key: 'brake_caliper_front', label: 'Front Caliper' },
          { key: 'brake_caliper_rear', label: 'Rear Caliper' },
        ],
      },
      {
        key: 'hardware',
        label: 'Hardware & Accessories',
        parts: [
          { key: 'brake_hardware_kit', label: 'Brake Hardware Kit' },
          { key: 'brake_line', label: 'Brake Lines / Hoses' },
        ],
      },
      {
        key: 'drums',
        label: 'Drums & Shoes',
        parts: [
          { key: 'brake_drum', label: 'Brake Drums' },
          { key: 'brake_shoe', label: 'Brake Shoes' },
        ],
      },
      {
        key: 'hydraulics',
        label: 'Hydraulics',
        parts: [
          { key: 'brake_master_cylinder', label: 'Master Cylinder' },
          { key: 'wheel_cylinder', label: 'Wheel Cylinder' },
          { key: 'brake_booster', label: 'Brake Booster' },
        ],
      },
    ],
  },
  {
    key: 'engine',
    label: 'Engine',
    icon: '⚙️',
    subcategories: [
      {
        key: 'belts',
        label: 'Belts & Timing',
        parts: [
          { key: 'serpentine_belt', label: 'Serpentine Belt' },
          { key: 'timing_belt', label: 'Timing Belt' },
          { key: 'timing_chain', label: 'Timing Chain' },
          { key: 'belt_tensioner', label: 'Belt Tensioner' },
        ],
      },
      {
        key: 'gaskets',
        label: 'Gaskets & Seals',
        parts: [
          { key: 'head_gasket', label: 'Head Gasket' },
          { key: 'valve_cover_gasket', label: 'Valve Cover Gasket' },
          { key: 'oil_pan_gasket', label: 'Oil Pan Gasket' },
          { key: 'intake_manifold_gasket', label: 'Intake Manifold Gasket' },
        ],
      },
      {
        key: 'mounts',
        label: 'Mounts',
        parts: [
          { key: 'engine_mount', label: 'Engine Mount' },
          { key: 'transmission_mount', label: 'Transmission Mount' },
        ],
      },
    ],
  },
  {
    key: 'filters',
    label: 'Filters',
    icon: '🔲',
    subcategories: [
      {
        key: 'engine_filters',
        label: 'Engine Filters',
        parts: [
          { key: 'oil_filter', label: 'Oil Filter' },
          { key: 'air_filter', label: 'Air Filter' },
          { key: 'fuel_filter', label: 'Fuel Filter' },
        ],
      },
      {
        key: 'cabin_filters',
        label: 'Cabin & Transmission',
        parts: [
          { key: 'cabin_air_filter', label: 'Cabin Air Filter' },
          { key: 'transmission_filter', label: 'Transmission Filter' },
        ],
      },
    ],
  },
  {
    key: 'ignition',
    label: 'Ignition',
    icon: '⚡',
    subcategories: [
      {
        key: 'plugs_coils',
        label: 'Plugs & Coils',
        parts: [
          { key: 'spark_plug', label: 'Spark Plugs' },
          { key: 'ignition_coil', label: 'Ignition Coils' },
          { key: 'spark_plug_wire', label: 'Spark Plug Wires' },
        ],
      },
    ],
  },
  {
    key: 'electrical',
    label: 'Electrical & Starting',
    icon: '🔋',
    subcategories: [
      {
        key: 'starting',
        label: 'Starting & Charging',
        parts: [
          { key: 'battery', label: 'Battery' },
          { key: 'alternator', label: 'Alternator' },
          { key: 'starter_motor', label: 'Starter Motor' },
        ],
      },
    ],
  },
  {
    key: 'suspension',
    label: 'Suspension & Steering',
    icon: '🔩',
    subcategories: [
      {
        key: 'front_end',
        label: 'Front End',
        parts: [
          { key: 'control_arm', label: 'Control Arms' },
          { key: 'ball_joint', label: 'Ball Joints' },
          { key: 'tie_rod', label: 'Tie Rod Ends' },
          { key: 'sway_bar_link', label: 'Sway Bar Links' },
        ],
      },
      {
        key: 'shocks',
        label: 'Shocks & Struts',
        parts: [
          { key: 'shock_absorber', label: 'Shock Absorbers' },
          { key: 'strut_assembly', label: 'Strut Assemblies' },
        ],
      },
      {
        key: 'bearings',
        label: 'Wheel Bearings & Hubs',
        parts: [
          { key: 'wheel_bearing', label: 'Wheel Bearings' },
          { key: 'hub_assembly', label: 'Hub Assemblies' },
        ],
      },
    ],
  },
  {
    key: 'cooling',
    label: 'Engine Cooling',
    icon: '❄️',
    subcategories: [
      {
        key: 'cooling_system',
        label: 'Cooling System',
        parts: [
          { key: 'radiator', label: 'Radiator' },
          { key: 'water_pump', label: 'Water Pump' },
          { key: 'thermostat', label: 'Thermostat' },
        ],
      },
    ],
  },
  {
    key: 'exhaust',
    label: 'Exhaust & Emissions',
    icon: '💨',
    subcategories: [
      {
        key: 'exhaust_parts',
        label: 'Exhaust',
        parts: [
          { key: 'catalytic_converter', label: 'Catalytic Converter' },
          { key: 'muffler', label: 'Muffler' },
          { key: 'oxygen_sensor', label: 'O2 Sensor' },
          { key: 'egr_valve', label: 'EGR Valve' },
        ],
      },
    ],
  },
  {
    key: 'climate',
    label: 'Heating & A/C',
    icon: '🌡️',
    subcategories: [
      {
        key: 'ac_parts',
        label: 'A/C System',
        parts: [
          { key: 'ac_compressor', label: 'A/C Compressor' },
          { key: 'ac_condenser', label: 'A/C Condenser' },
          { key: 'blower_motor', label: 'Blower Motor' },
        ],
      },
    ],
  },
  {
    key: 'fuel',
    label: 'Fuel System',
    icon: '⛽',
    subcategories: [
      {
        key: 'fuel_delivery',
        label: 'Fuel Delivery',
        parts: [
          { key: 'fuel_pump', label: 'Fuel Pump' },
          { key: 'fuel_injector', label: 'Fuel Injectors' },
          { key: 'throttle_body', label: 'Throttle Body' },
        ],
      },
    ],
  },
  {
    key: 'lighting',
    label: 'Lighting',
    icon: '💡',
    subcategories: [
      {
        key: 'exterior',
        label: 'Exterior Lights',
        parts: [
          { key: 'headlight_assembly', label: 'Headlight Assembly' },
          { key: 'headlight_bulb', label: 'Headlight Bulbs' },
          { key: 'tail_light', label: 'Tail Light Assembly' },
          { key: 'fog_light', label: 'Fog Lights' },
          { key: 'turn_signal', label: 'Turn Signal' },
        ],
      },
    ],
  },
  {
    key: 'drivetrain',
    label: 'Drivetrain',
    icon: '🔗',
    subcategories: [
      {
        key: 'axles_cv',
        label: 'Axles & CV',
        parts: [
          { key: 'cv_axle', label: 'CV Axle / Half Shaft' },
          { key: 'cv_boot', label: 'CV Boot Kit' },
          { key: 'clutch_kit', label: 'Clutch Kit' },
        ],
      },
    ],
  },
  {
    key: 'wipers',
    label: 'Wiper & Washer',
    icon: '🧹',
    subcategories: [
      {
        key: 'wiper_parts',
        label: 'Wipers',
        parts: [
          { key: 'wiper_blade', label: 'Wiper Blades' },
          { key: 'wiper_motor', label: 'Wiper Motor' },
        ],
      },
    ],
  },
  {
    key: 'body',
    label: 'Body & Glass',
    icon: '🚗',
    subcategories: [
      {
        key: 'regulators',
        label: 'Window & Mirrors',
        parts: [
          { key: 'window_regulator', label: 'Window Regulator' },
          { key: 'side_mirror', label: 'Side Mirror' },
        ],
      },
    ],
  },
];

/**
 * Get total part count across all categories.
 * @returns {number}
 */
export function getTotalPartCount() {
  return PART_CATEGORIES.reduce(
    (total, cat) => total + cat.subcategories.reduce(
      (subTotal, sub) => subTotal + sub.parts.length, 0
    ), 0
  );
}

/**
 * Find a part by its key across all categories.
 * @param {string} partKey - The part key (e.g., 'disc_brake_pad_front')
 * @returns {Object|null} { category, subcategory, part } or null
 */
export function findPartByKey(partKey) {
  for (const cat of PART_CATEGORIES) {
    for (const sub of cat.subcategories) {
      const part = sub.parts.find((p) => p.key === partKey);
      if (part) {
        return { category: cat, subcategory: sub, part };
      }
    }
  }
  return null;
}

export default PART_CATEGORIES;
