/**
 * Q-GREEN FLEET: Forbidden Jargon Checker
 * Verifies that no forbidden engineering or academic jargon appears in client-facing strings.
 *
 * Forbidden terms in Client Mode:
 * - digital twin
 * - heterogeneous
 * - telemetry
 * - pareto
 * - surrogate
 * - exponent
 * - qubo
 * - metaheuristic
 */

export const FORBIDDEN_CLIENT_JARGON = [
  'digital twin',
  'heterogeneous',
  'telemetry',
  'pareto',
  'surrogate',
  'exponent',
  'qubo',
  'metaheuristic'
] as const;

export interface JargonViolation {
  path: string;
  term: string;
  context: string;
}

/**
 * Recursively scans an object for forbidden jargon words.
 * Ignores properties explicitly marked with 'analyst' in their key path.
 */
export function scanForJargon(obj: unknown, currentPath = ''): JargonViolation[] {
  const violations: JargonViolation[] = [];

  if (typeof obj === 'string') {
    // If the path contains 'analyst', technical jargon is permitted in Analyst mode
    if (currentPath.toLowerCase().includes('analyst')) {
      return violations;
    }

    const lower = obj.toLowerCase();
    for (const term of FORBIDDEN_CLIENT_JARGON) {
      if (lower.includes(term)) {
        violations.push({
          path: currentPath,
          term,
          context: obj
        });
      }
    }
    return violations;
  }

  if (typeof obj === 'object' && obj !== null) {
    for (const [key, value] of Object.entries(obj)) {
      const newPath = currentPath ? `${currentPath}.${key}` : key;
      // Skip analyst-specific sections
      if (key.toLowerCase().includes('analyst')) {
        continue;
      }
      violations.push(...scanForJargon(value, newPath));
    }
  }

  return violations;
}
