/**
 * Q-GREEN FLEET: Plain-Language English Copy Store
 * Single source of truth for all client-facing UI strings.
 * India-focused maritime decarbonization system.
 */

export const copy = {
  brand: {
    name: 'Q-GREEN FLEET',
    tagline: 'India Maritime Fleet Decarbonization & Voyage Optimization',
    systemOnline: 'System online',
    systemDetails: 'AI optimizer and digital twin ready. Running on offline demo data.'
  },

  viewModes: {
    client: 'Client',
    analyst: 'Analyst',
    clientTooltip: 'Executive view with plain-language metrics and essential operational decisions.',
    analystTooltip: 'Technical view with model parameters, execution seeds, and convergence metrics.'
  },

  nav: {
    overview: 'Fleet Command Center',
    fleetMap: 'India Port Map',
    fuelOptions: 'Green Fuel Advisor',
    optimizationProgress: 'AI Optimizer',
    comparePlans: 'Plan Comparison',
    whatIfScenarios: 'Monsoon Resilience',
    voyageReview: 'Voyage Analysis',
    guidedDemo: '▶ Start Guided Tour',
    help: 'Help & guides'
  },

  navHints: {
    overview: 'See your full fleet, run the AI, get a recommended operating plan instantly.',
    fleetMap: 'Live map of Indian ports, sea lanes, emission zones, and shore-power berths.',
    fuelOptions: 'Compare HFO vs green alternatives — methanol, LNG, ammonia — with real prices and lifecycle carbon scores.',
    optimizationProgress: 'Watch the AI search through thousands of route + speed + fuel combinations to find the best plan.',
    comparePlans: 'Side-by-side plan comparison — pick your best balance of cost vs emissions.',
    whatIfScenarios: 'Simulate Bay of Bengal cyclones, monsoon port congestion, or fuel supply disruptions.',
    voyageReview: 'Review a past voyage — what the ship actually did vs what the AI would have recommended.'
  },

  dataBasis: {
    measured: {
      label: 'Measured',
      description: 'Recorded directly by vessel sensors, flowmeters, or GPS tracking.'
    },
    reported: {
      label: 'Reported',
      description: 'Submitted in statutory declarations such as annual EU emissions reports or port logs.'
    },
    estimated: {
      label: 'Estimated',
      description: 'Calculated using vessel hydrodynamic equations and machine learning models.'
    },
    simulated: {
      label: 'Simulated',
      description: 'Generated across multiple weather and operational scenarios to test resilience.'
    },
    sampleData: {
      label: 'Sample data',
      description: 'Realistic sample specifications used for offline demonstration and validation.'
    },
    stripPrefix: 'Figures on this page use',
    howToRead: 'How to read these labels'
  },

  fleetOverview: {
    pageTitle: 'Fleet Command Center',
    pageDescription: 'Your Indian fleet at a glance. Click "Run AI Optimizer" to get the best speed, fuel, and bunkering plan — saving money and cutting emissions simultaneously.',
    primaryAction: '🚀 Run AI Optimizer',
    secondaryAction: 'Simulate Monsoon Storm',

    kpis: {
      vessels: {
        label: 'Vessels in fleet',
        caption: 'Active vessels in registry',
        tooltip: 'Total active Indian commercial vessels in the operational fleet registry.'
      },
      emissions: {
        label: 'Emissions per tonne-mile',
        unit: 'gCO₂e / dwt-nm',
        captionBelow: 'below unoptimized baseline',
        captionAbove: 'above unoptimized baseline',
        limitNote: 'IMO 2030 target: 40% reduction vs 2008',
        tooltip: 'Lifecycle greenhouse gas intensity per unit of cargo transported. Lower is better. Run the optimizer to see your reduction potential.'
      },
      onTime: {
        label: 'On-time arrival rate',
        unit: '%',
        captionBaseline: 'vs unoptimized baseline',
        tooltip: 'Percentage of voyage legs arriving within port delivery windows. The AI optimizer keeps this high even when re-routing for emissions savings.'
      },
      shorePower: {
        label: 'Shore-power ready vessels',
        caption: 'Can shut engines & use port grid power at berth',
        tooltip: 'Vessels equipped for Cold Ironing (OPS) — plugging into port electricity to eliminate idle emissions at berth. A key Sagarmala Programme upgrade target.'
      }
    },

    recommendedPlan: {
      title: '🤖 AI-Recommended Operating Plan',
      emptyTitle: 'No plan generated yet',
      emptyDesc: "Click 'Run AI Optimizer' above. The AI will calculate the best speed, fuel type, and port stops for every vessel — balancing cost savings and IMO emissions targets.",
      emptyButton: '🚀 Run AI Optimizer',
      computedTitle: 'Optimized multi-fuel operating schedule',
      computedDesc: 'Balances bunker fuel costs, IMO Carbon Intensity Indicator (CII) targets, and on-time arrivals across all Indian trade corridors.',
      costHeading: 'Projected total cost',
      emissionsHeading: 'Lifecycle CO₂ (Well-to-Wake)',
      savingsHeading: '💰 Savings vs unoptimized',
      viewDetails: 'View full plan breakdown',
      recompute: 'Re-run optimizer'
    },

    tradeRoutes: {
      title: 'Indian Trade Corridors',
      subtitle: 'Active sea lanes connecting Indian ports — click any route to see waypoints, depth limits, and emission control zones',
      legsLabel: 'legs',
      deadlineLabel: 'max transit',
      distanceUnit: 'nm'
    },

    fleetTable: {
      title: 'Your Fleet',
      subtitle: 'All vessels in your Indian fleet. Click any vessel to inspect engine specs, fuel compatibility, and shore-power capability.',
      searchPlaceholder: 'Search by vessel name, type, or IMO…',
      filterAll: 'All vessels',
      filterContainer: 'Container',
      filterBulk: 'Bulk carrier',
      filterTanker: 'Tanker',
      colVessel: 'Vessel',
      colCapacity: 'Cargo capacity',
      colSpeedRange: 'Speed range',
      colFuels: 'Compatible fuels',
      colShorePower: 'Shore power (OPS)',
      analyst: {
        colHullExponent: 'Hull exponent (n)',
        colDraft: 'Design draft',
        colDataBasis: 'Data basis'
      },
      shorePowerReady: 'Ready ✓',
      shorePowerNotFitted: 'Not fitted',
      clickHint: 'Click any row to inspect full engine, draft, and fuel pathway specifications'
    }
  },

  fleetMap: {
    pageTitle: 'India Port & Route Map',
    pageDescription: 'Interactive map of Indian sea lanes, major ports (JNPT, Mundra, Visakhapatnam, Chennai), IMO emission control zones, and ports with Cold Ironing (shore-power) infrastructure under the Sagarmala Programme.',
    layerFairways: 'Sea routes',
    layerEca: 'Emission control zones',
    layerShorePower: 'Shore-power ports',
    layerVessels: 'Active vessels',
    portDetailsTitle: 'Port details',
    vesselDetailsTitle: 'Vessel details',
    routeDetailsTitle: 'Route details'
  },

  fuelOptions: {
    pageTitle: 'Green Fuel Advisor',
    pageDescription: 'Compare traditional bunker fuel (HFO/MGO) against green alternatives available at Indian ports — Bio-LNG, Green Methanol, Green Ammonia. See real prices AND full lifecycle carbon (Well-to-Wake) side-by-side so you know the true cost of going green.',
    priceComparisonTitle: 'Fuel price comparison (USD/tonne)',
    lifecycleEmissionsTitle: 'Lifecycle emissions — Well-to-Wake (gCO₂e/MJ)',
    explanationNote: '"Well-to-Wake" counts ALL carbon — fuel extraction, refining, shipping it to India, burning it in the engine, plus methane slip. This is what IMO\'s CII rating system measures.'
  },

  optimizationProgress: {
    pageTitle: 'AI Optimizer — Live Search',
    pageDescription: 'The Q-GREEN AI tests thousands of combinations of vessel speed, fuel type, and bunkering stops to find the plan that minimizes both voyage cost and carbon emissions simultaneously. This is why it beats manual planning every time.',
    statusSearching: 'AI is searching for the optimal fleet schedule…',
    statusComplete: 'Best plan found ✓',
    launchButton: '🚀 Start Optimization',
    evaluationsLabel: 'Plans evaluated',
    feasibleRateLabel: 'Plans passing all IMO rules',
    bestCostLabel: 'Best voyage cost found',
    bestEmissionsLabel: 'Best emissions level found',
    analystNotice: 'Algorithm: Quantum-Inspired Genetic Algorithm (QIGA) + Particle Swarm (QPSO) hybrid. Runs entirely on classical hardware — no quantum hardware required or claimed.'
  },

  comparePlans: {
    pageTitle: 'Plan Comparison — Cost vs Emissions',
    pageDescription: 'Every dot on this chart is a fully feasible fleet operating plan. Moving left = cheaper voyage. Moving down = lower emissions. You cannot optimize both simultaneously — this chart helps you pick your ideal trade-off.',
    whyThisPlanTitle: 'Why this plan was recommended',
    sideBySideTitle: 'Side-by-side comparison',
    costAxis: 'Total voyage cost (USD)',
    emissionsAxis: 'Lifecycle emissions (tonnes CO₂e)',
    selectPlanToInspect: 'Click any plan on the chart to see its full breakdown',
    compareButton: 'Compare with another plan'
  },

  whatIfScenarios: {
    pageTitle: 'Monsoon & Disruption Resilience Simulator',
    pageDescription: 'India\'s shipping faces unique disruptions — Bay of Bengal cyclones (May–Nov), monsoon port congestion, JNPT delays, and sudden fuel price shocks. Inject any disruption here and watch the AI recover the schedule in under 2 seconds.',
    controlsTitle: 'Disruption controls',
    resultsTitle: 'Before & after comparison',
    replanButton: '⚡ Trigger AI Re-Plan',
    replanNotice: 'The warm-start re-optimizer seeds itself from the previous best plan — making recovery 4× faster than a cold restart.'
  },

  voyageReview: {
    pageTitle: 'Voyage Analysis',
    pageDescription: 'Compare a completed Indian voyage against what the AI optimizer would have recommended. See the exact fuel, cost, and CO₂ saved — or what could have been saved if the AI was used.',
    actualVsOptimal: 'Actual voyage vs AI-recommended optimal',
    scrubberLabel: 'Drag the timeline to inspect speed and fuel burn at each waypoint',
    netSavingsTitle: 'Total voyage improvement potential',
    fuelSaved: 'Fuel saved (tonnes)',
    emissionsAvoided: 'CO₂ avoided (tonnes)',
    costSaved: 'Cost saved (USD)'
  },

  drawer: {
    close: 'Close',
    specifications: 'Technical Specifications',
    performance: 'Performance',
    fuelCompatibility: 'Compatible fuel pathways'
  },

  demo: {
    title: 'Guided Tour',
    stepPrefix: 'Step',
    of: 'of',
    exit: 'Exit tour',
    next: 'Next',
    previous: 'Previous'
  }
};
