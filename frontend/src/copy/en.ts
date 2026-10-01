/**
 * Q-GREEN FLEET: Plain-Language English Copy Store
 * Single source of truth for all client-facing UI strings.
 * Zero hardcoded numbers or metric placeholders.
 * All dynamic figures come strictly from API / Evaluator / Baseline comparisons.
 */

export const copy = {
  brand: {
    name: 'Q-GREEN FLEET',
    tagline: 'Maritime fleet decarbonization and voyage optimization',
    systemOnline: 'System online',
    systemDetails: 'Predictive models and optimizer ready. Connected to local simulation.'
  },

  viewModes: {
    client: 'Client',
    analyst: 'Analyst',
    clientTooltip: 'Executive view with plain-language metrics and essential operational decisions.',
    analystTooltip: 'Technical engineering view with model parameters, execution seeds, and convergence metrics.'
  },

  nav: {
    overview: 'Fleet overview',
    fleetMap: 'Fleet map', // Renamed from Live map (Rule 4)
    fuelOptions: 'Fuel options',
    optimizationProgress: 'Optimization progress',
    comparePlans: 'Compare plans',
    whatIfScenarios: 'What-if scenarios',
    voyageReview: 'Voyage review',
    guidedDemo: 'Guided demo',
    help: 'Help & guides'
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
    pageTitle: 'Fleet overview',
    pageDescription: 'See how your vessels are performing and get a recommended plan.',
    primaryAction: 'Find the best plan',
    secondaryAction: 'Test a storm',
    
    kpis: {
      vessels: {
        label: 'Vessels in fleet',
        caption: 'Commercial vessels in registry',
        tooltip: 'Total active vessels loaded in the operational fleet registry.'
      },
      emissions: {
        label: 'Emissions per tonne-mile',
        unit: 'gCO₂e / dwt-nm',
        captionBelow: 'below baseline scenario',
        captionAbove: 'above baseline scenario',
        limitNote: 'FuelEU 2025 limit: 5.60 gCO₂e / dwt-nm',
        tooltip: 'Lifecycle greenhouse gas emissions per cargo unit transported over distance.'
      },
      onTime: {
        label: 'On-time arrival rate',
        unit: '%',
        captionBaseline: 'compared to baseline scenario',
        tooltip: 'Percentage of scheduled voyage legs arriving within designated port delivery windows.'
      },
      shorePower: {
        label: 'Vessels ready for shore power',
        caption: 'Can connect to shore power at berth', // Rule 2
        tooltip: 'Vessels equipped with onboard electrical switchboards and shore power cables.'
      }
    },

    recommendedPlan: {
      title: 'Recommended operating plan',
      emptyTitle: 'No plan generated yet',
      emptyDesc: "Click 'Find the best plan' to compute optimal vessel speeds, alternative fuel choices, and port stops for your fleet.",
      emptyButton: 'Find the best plan',
      computedTitle: 'Optimized multi-fuel operating schedule',
      computedDesc: 'Balances bunker fuel purchase costs, carbon tax allowances, and on-time arrival deadlines.',
      costHeading: 'Projected total cost',
      emissionsHeading: 'Lifecycle emissions',
      savingsHeading: 'Savings vs baseline',
      viewDetails: 'View plan details',
      recompute: 'Re-run optimization'
    },

    tradeRoutes: {
      title: 'Trade routes',
      subtitle: 'Active commercial fairways with draft and environmental control rules',
      legsLabel: 'legs',
      deadlineLabel: 'max transit',
      distanceUnit: 'nm'
    },

    fleetTable: {
      title: 'Your fleet',
      subtitle: 'Commercial vessels assigned to global shipping corridors',
      searchPlaceholder: 'Search vessels by name, type, or IMO...',
      filterAll: 'All',
      filterContainer: 'Container',
      filterBulk: 'Bulk carrier',
      filterTanker: 'Tanker',
      colVessel: 'Vessel',
      colCapacity: 'Cargo capacity',
      colSpeedRange: 'Speed range',
      colFuels: 'Fuel options',
      colShorePower: 'Shore power',
      analyst: {
        colHullExponent: 'Hull exponent',
        colDraft: 'Design draft',
        colDataBasis: 'Data basis',
      },
      shorePowerReady: 'Ready',
      shorePowerNotFitted: 'Not fitted',
      clickHint: 'Click any vessel to inspect engine, draft, and fuel specifications'
    }
  },

  fleetMap: {
    pageTitle: 'Fleet map',
    pageDescription: 'View vessel positions, commercial trade corridors, and ports equipped with shore electricity.',
    layerFairways: 'Trade routes',
    layerEca: 'Emissions control areas',
    layerShorePower: 'Shore power ports',
    layerVessels: 'Active vessels',
    portDetailsTitle: 'Port details',
    vesselDetailsTitle: 'Vessel details',
    routeDetailsTitle: 'Route details'
  },

  fuelOptions: {
    pageTitle: 'Fuel options',
    pageDescription: 'Compare fuel prices, availability, and full lifecycle emissions under official maritime environmental rules.',
    priceComparisonTitle: 'Fuel price comparison',
    lifecycleEmissionsTitle: 'Total lifecycle emissions (Well-to-Wake)',
    explanationNote: 'Well-to-Wake accounts for fuel extraction, refining, transport, engine combustion, and unburnt methane slip.'
  },

  optimizationProgress: {
    pageTitle: 'Optimization progress',
    pageDescription: 'Watch the optimization engine search through thousands of speed, fuel, and routing combinations.',
    statusSearching: 'Searching for optimal fleet schedules...',
    statusComplete: 'Optimal plan found',
    launchButton: 'Start search',
    evaluationsLabel: 'Options evaluated',
    feasibleRateLabel: 'Plans passing all rules',
    bestCostLabel: 'Best voyage cost',
    bestEmissionsLabel: 'Best emissions level',
    analystNotice: 'Switch to Analyst mode to view convergence hypervolume, quantum gate angles, and evaluation budgets.'
  },

  comparePlans: {
    pageTitle: 'Compare plans',
    pageDescription: 'Review the trade-offs between operating cost, lifecycle emissions, and delay risk across generated plans.',
    whyThisPlanTitle: 'Why this plan was chosen',
    sideBySideTitle: 'Side-by-side comparison',
    costAxis: 'Voyage cost (USD)',
    emissionsAxis: 'Lifecycle emissions (tonnes CO₂e)',
    selectPlanToInspect: 'Click a plan in the chart to inspect its schedule',
    compareButton: 'Compare with another plan'
  },

  whatIfScenarios: {
    pageTitle: 'What-if scenarios',
    pageDescription: 'Test how your fleet responds to severe weather storms, fuel price spikes, or port congestion delays.',
    controlsTitle: 'Disruption controls',
    resultsTitle: 'Before and after comparison',
    replanButton: 'Re-plan now',
    replanNotice: 'Rapid re-planning adjusts speeds and reroutes vessels in under 2 seconds.'
  },

  voyageReview: {
    pageTitle: 'Voyage review',
    pageDescription: 'Compare the historical execution of a completed voyage against the recommended optimal speed and fuel profile.',
    actualVsOptimal: 'Actual voyage vs Recommended optimal',
    scrubberLabel: 'Drag timeline to inspect waypoint speeds and fuel burn rates',
    netSavingsTitle: 'Total voyage improvement',
    fuelSaved: 'Fuel saved',
    emissionsAvoided: 'Emissions avoided',
    costSaved: 'Cost saved'
  },

  drawer: {
    close: 'Close',
    specifications: 'Specifications',
    performance: 'Performance',
    fuelCompatibility: 'Compatible fuels'
  },

  demo: {
    title: 'Guided demonstration',
    stepPrefix: 'Step',
    of: 'of',
    exit: 'Exit demo',
    next: 'Next step',
    previous: 'Previous step'
  }
};
