"""Data provenance enumeration.

Every data record, physical parameter, prediction result, and API output in
Q-GREEN FLEET must carry a verified Provenance tag. No fabricated or unmarked
values are permitted.
"""

from enum import Enum


class Provenance(str, Enum):
    """Provenance tracking for transparency and auditability."""

    MEASURED = "measured"    # Direct physical measurement (e.g. onboard Coriolis meter, GPS)
    REPORTED = "reported"    # Official reported data (e.g. IMO DCS, EU THETIS-MRV, port BDN)
    ESTIMATED = "estimated"  # Physics resistance model, ML surrogate, calibrated engineering formulas
    SIMULATED = "simulated"  # Digital twin scenario outcomes, synthetic weather stress-tests
    SYNTHETIC = "synthetic"  # Generated benchmark instances, testing distributions
