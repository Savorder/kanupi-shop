/**
 * Margin Calculator for Kanupi Shop Dashboard
 * 
 * Calculates list price from shop cost using the shop's margin rules.
 * Rule hierarchy (highest priority wins):
 *   1. Brand-specific rule (e.g., Bosch: 30%)
 *   2. Category-specific rule (e.g., brake parts: 35%)
 *   3. Global default (e.g., 40%)
 * 
 * Supports three markup types:
 *   - percentage: cost × (1 + markup/100)
 *   - fixed: cost + fixed amount
 *   - matrix: tiered percentages based on cost ranges
 * 
 * @module marginCalculator
 */

/**
 * Find the best matching margin rule for a given part.
 * 
 * @param {Object} params
 * @param {string} params.brand - Part brand name (e.g., "Akebono")
 * @param {string} params.category - Part category (e.g., "brake_pads")
 * @param {Array} rules - Shop's margin rules from b2b_margin_rules table
 * @returns {Object} The matching rule, or a default 40% rule if none found
 */
export function findMatchingRule({ brand, category }, rules) {
  const safeRules = rules || [];
  const sorted = [...safeRules].sort((a, b) => (b.priority || 0) - (a.priority || 0));

  // Priority 1: Brand-specific match
  if (brand) {
    const brandRule = sorted.find(
      (r) => r.rule_type === 'brand' && r.brand?.toLowerCase() === brand.toLowerCase()
    );
    if (brandRule) return brandRule;
  }

  // Priority 2: Category-specific match
  if (category) {
    const categoryRule = sorted.find(
      (r) => r.rule_type === 'category' && r.category?.toLowerCase() === category.toLowerCase()
    );
    if (categoryRule) return categoryRule;
  }

  // Priority 3: Global default
  const globalRule = sorted.find((r) => r.rule_type === 'global');
  if (globalRule) return globalRule;

  // Fallback: 40% markup if no rules configured
  return {
    rule_type: 'global',
    markup_type: 'percentage',
    markup_value: 40,
    priority: 0,
  };
}

/**
 * Calculate the list price from shop cost using a margin rule.
 * 
 * @param {number} cost - Shop cost (what the shop pays)
 * @param {Object} rule - Margin rule from findMatchingRule()
 * @returns {number} List price (what the customer pays), rounded to 2 decimals
 */
export function calculateListPrice(cost, rule) {
  if (!cost || cost <= 0) return 0;
  const safeRule = rule || { markup_type: 'percentage', markup_value: 40 };

  switch (safeRule.markup_type) {
    case 'fixed':
      return Math.round((cost + (safeRule.markup_value || 0)) * 100) / 100;

    case 'matrix': {
      const tiers = safeRule.matrix_rules || [];
      const matchedTier = tiers.find((t) => {
        const min = t.min ?? 0;
        const max = t.max ?? Infinity;
        return cost >= min && cost < max;
      });
      const pct = matchedTier?.pct ?? safeRule.markup_value ?? 40;
      return Math.round(cost * (1 + pct / 100) * 100) / 100;
    }

    case 'percentage':
    default:
      return Math.round(cost * (1 + (safeRule.markup_value || 40) / 100) * 100) / 100;
  }
}

/**
 * Calculate margin amount (list price - cost).
 * 
 * @param {number} cost - Shop cost
 * @param {number} listPrice - Customer list price
 * @returns {number} Margin in dollars, rounded to 2 decimals
 */
export function calculateMarginAmount(cost, listPrice) {
  if (!cost || !listPrice) return 0;
  return Math.round((listPrice - cost) * 100) / 100;
}

/**
 * Calculate margin percentage ((listPrice - cost) / listPrice × 100).
 * 
 * @param {number} cost - Shop cost
 * @param {number} listPrice - Customer list price
 * @returns {number} Margin percentage, rounded to 1 decimal
 */
export function calculateMarginPercent(cost, listPrice) {
  if (!listPrice || listPrice <= 0) return 0;
  return Math.round(((listPrice - cost) / listPrice) * 1000) / 10;
}

/**
 * Enrich a part result with margin calculations.
 * Takes a raw part from the search API and adds listPrice, margin, marginPct.
 * 
 * @param {Object} part - Part object with at minimum { cost, brand }
 * @param {Array} rules - Shop's margin rules
 * @param {string} [category] - Optional part category for rule matching
 * @returns {Object} Part with added listPrice, margin, marginPct, appliedRule
 */
export function enrichPartWithMargin(part, rules, category) {
  const safePart = part || {};
  const cost = safePart.cost || safePart.price || 0;
  const rule = findMatchingRule(
    { brand: safePart.brand, category: category || safePart.partType },
    rules
  );
  const listPrice = calculateListPrice(cost, rule);
  const margin = calculateMarginAmount(cost, listPrice);
  const marginPct = calculateMarginPercent(cost, listPrice);

  return {
    ...safePart,
    cost,
    listPrice,
    margin,
    marginPct,
    appliedRule: {
      type: rule.rule_type,
      value: rule.markup_value,
      markupType: rule.markup_type,
    },
  };
}
