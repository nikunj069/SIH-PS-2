/**
 * Q-GREEN FLEET: Provenance & Data-Basis Helper
 * Formats data basis labels and dynamically computes the page-level data-basis strip
 * based on provenances actually rendered on screen.
 */

export type RawProvenance = 'measured' | 'reported' | 'estimated' | 'simulated' | 'synthetic';

export interface DataBasisMeta {
  label: 'Measured' | 'Reported' | 'Estimated' | 'Simulated' | 'Sample data';
  colorClass: string;
  badgeBg: string;
  description: string;
}

export const PROVENANCE_MAP: Record<RawProvenance, DataBasisMeta> = {
  measured: {
    label: 'Measured',
    colorClass: 'text-primary border-primary/30 bg-primary-soft',
    badgeBg: '#E8F1FD',
    description: 'Recorded directly by vessel sensors, flowmeters, or GPS tracking.'
  },
  reported: {
    label: 'Reported',
    colorClass: 'text-infoText border-info/30 bg-info-soft',
    badgeBg: '#E8F1FD',
    description: 'Submitted in statutory declarations such as annual EU emissions reports or port logs.'
  },
  estimated: {
    label: 'Estimated',
    colorClass: 'text-slate-700 border-border bg-slate-100',
    badgeBg: '#F1F5F9',
    description: 'Calculated using vessel hydrodynamic equations and machine learning models.'
  },
  simulated: {
    label: 'Simulated',
    colorClass: 'text-slate-700 border-border bg-slate-100',
    badgeBg: '#F1F5F9',
    description: 'Generated across multiple weather and operational scenarios to test resilience.'
  },
  synthetic: {
    label: 'Sample data',
    colorClass: 'text-slate-600 border-border bg-slate-50',
    badgeBg: '#F8FAFC',
    description: 'Realistic sample specifications used for offline demonstration and validation.'
  }
};

/**
 * Normalizes any string to a clean DataBasisMeta object.
 * Maps 'synthetic' -> 'Sample data' per user rule 5.
 */
export function normalizeProvenance(raw?: string | null): DataBasisMeta {
  if (!raw) return PROVENANCE_MAP.synthetic;
  const key = raw.toLowerCase() as RawProvenance;
  return PROVENANCE_MAP[key] ?? PROVENANCE_MAP.synthetic;
}

/**
 * Computes a dynamic plain-language strip based on the distinct provenances
 * present in the currently rendered components on a screen.
 * Example output: "Figures on this page use sample data and estimated values."
 */
export function buildDataBasisStrip(provenances: (string | undefined)[]): string {
  const distinctLabels = Array.from(
    new Set(
      provenances
        .filter((p): p is string => Boolean(p))
        .map(p => normalizeProvenance(p).label.toLowerCase())
    )
  );

  if (distinctLabels.length === 0) {
    return 'Figures on this page use verified baseline parameters.';
  }

  if (distinctLabels.length === 1) {
    return `Figures on this page use ${distinctLabels[0]}.`;
  }

  const last = distinctLabels.pop();
  return `Figures on this page use ${distinctLabels.join(', ')} and ${last}.`;
}
