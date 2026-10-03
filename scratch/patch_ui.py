import re

with open('frontend/src/copy/en.ts', 'r') as f:
    content = f.read()

replacements = {
    "fuelOptions: 'Fuel options'": "fuelOptions: 'Fuel Intelligence'",
    "comparePlans: 'Compare plans'": "comparePlans: 'Pareto Decision Explorer'",
    "whatIfScenarios: 'What-if scenarios'": "whatIfScenarios: 'Storm / Disruption Simulator'",
    "voyageReview: 'Voyage review'": "voyageReview: 'Voyage Replay'",
    "pageTitle: 'Fuel options'": "pageTitle: 'Fuel Intelligence'",
    "pageTitle: 'Compare plans'": "pageTitle: 'Pareto Decision Explorer'",
    "pageTitle: 'What-if scenarios'": "pageTitle: 'Storm / Disruption Simulator'",
    "pageTitle: 'Voyage review'": "pageTitle: 'Voyage Replay'"
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open('frontend/src/copy/en.ts', 'w') as f:
    f.write(content)

print('Updated en.ts')
