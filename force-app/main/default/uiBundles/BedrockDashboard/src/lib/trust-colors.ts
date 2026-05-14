import type { TrustPosture } from './bedrock-config';

/**
 * Tailwind class tokens for each trust posture. Single source of truth so
 * the rail rows, detail modals, and the trust matrix card all reinforce
 * the same visual signal: green = autonomous, amber = recommend, rose =
 * human-required.
 *
 * Tailwind requires literal class names in source (no string interpolation
 * at runtime) so the JIT picks them up. Each posture exports a complete set
 * of classes for the surfaces we need: solid (badges), tinted background +
 * border (banners), accent border (row stripes), text color (labels).
 */
export const TRUST_COLOR_TOKENS: Record<
  TrustPosture,
  {
    label: string;
    solid: string;
    tintedBg: string;
    accentBorder: string;
    text: string;
    ring: string;
  }
> = {
  Autonomous: {
    label: 'Autonomous',
    solid: 'bg-emerald-600 text-white',
    tintedBg: 'bg-emerald-50 border-emerald-200',
    accentBorder: 'border-l-emerald-500',
    text: 'text-emerald-700',
    ring: 'ring-emerald-300',
  },
  Recommend: {
    label: 'Recommend',
    solid: 'bg-amber-500 text-white',
    tintedBg: 'bg-amber-50 border-amber-200',
    accentBorder: 'border-l-amber-500',
    text: 'text-amber-700',
    ring: 'ring-amber-300',
  },
  Human_Required: {
    label: 'Human-required',
    solid: 'bg-rose-600 text-white',
    tintedBg: 'bg-rose-50 border-rose-200',
    accentBorder: 'border-l-rose-500',
    text: 'text-rose-700',
    ring: 'ring-rose-300',
  },
};

/**
 * Maps a record back to the agent action that produced it, so the row /
 * dialog can declare its provenance. Service cases are always opened by
 * `open_service_case`. Warranty claims start staged by
 * `stage_warranty_claim` (Autonomous); a submitted claim means a human
 * pressed the submit button afterwards — the record's posture shifts to
 * the higher-trust posture the submission step requires.
 */
export interface RecordProvenance {
  action: string;
  posture: TrustPosture;
  detail?: string;
}

export function caseProvenance(): RecordProvenance {
  return {
    action: 'open_service_case',
    posture: 'Autonomous',
    detail: 'Agent opened this case without human approval per the Section 5 trust matrix.',
  };
}

export function claimProvenance(submittedTimestamp?: string | null): RecordProvenance {
  if (submittedTimestamp) {
    return {
      action: 'submit_warranty_claim',
      posture: 'Recommend',
      detail:
        'Claim was autonomously staged by the agent, then submitted by a service manager. Submission is a Recommend posture per the trust matrix.',
    };
  }
  return {
    action: 'stage_warranty_claim',
    posture: 'Autonomous',
    detail:
      'Staged autonomously within the KB Section 5 72-hour entitlement window. Submission remains pending human approval.',
  };
}
