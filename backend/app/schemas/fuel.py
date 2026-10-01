"""Fuel reality engine: full lifecycle Well-to-Wake (WtW) emissions and pathways."""

from typing import List
from pydantic import BaseModel, Field, model_validator
from .provenance import Provenance


class FuelPathway(BaseModel):
    """Specification of a fuel pathway with full Well-to-Wake (WtW) lifecycle GHG intensity."""

    pathway_id: str = Field(..., description="Unique pathway ID, e.g. methanol_e, ammonia_green, hfo, mgo")
    name: str = Field(..., description="Descriptive fuel name and feedstock pathway")
    category: str = Field(..., description="Pathway category: fossil, bio, e-fuel, blue, zero_carbon")
    energy_density_mj_kg: float = Field(..., gt=0, description="Lower Heating Value (LHV) in MJ per kg fuel")
    price_per_tonne_usd: float = Field(..., gt=0, description="Spot/contract bunker price in USD per metric tonne")
    
    # Life cycle emissions breakdown (IMO MEPC.391(81) LCA guidelines)
    wtt_gco2e_mj: float = Field(..., description="Well-to-Tank (upstream extraction, production, transport) GHG intensity in gCO2e/MJ")
    ttw_co2_g_mj: float = Field(..., ge=0, description="Tank-to-Wake direct combustion CO2 emissions in gCO2/MJ")
    ttw_ch4_slip_g_mj: float = Field(0.0, ge=0, description="Tank-to-Wake methane (CH4) unburned slip in gCH4/MJ")
    ttw_n2o_g_mj: float = Field(0.0, ge=0, description="Tank-to-Wake nitrous oxide (N2O) emissions in gN2O/MJ")
    
    # Global Warming Potential (GWP100 IMO default: CH4=28, N2O=265)
    gwp_ch4: float = Field(28.0, description="Global Warming Potential of methane over 100-year horizon")
    gwp_n2o: float = Field(265.0, description="Global Warming Potential of nitrous oxide over 100-year horizon")
    
    wtw_gco2e_mj: float = Field(
        ...,
        description="Total aggregated Well-to-Wake GHG intensity: WtT + TtW_CO2 + (GWP_CH4 * CH4) + (GWP_N2O * N2O)"
    )
    
    tank_volume_penalty: float = Field(1.0, ge=0.5, description="Storage volume multiplier relative to standard HFO (e.g. 2.1 for methanol, 2.4 for ammonia)")
    bunker_availability_score: float = Field(..., ge=0.0, le=1.0, description="Global port bunkering readiness score [0.0 - 1.0]")
    compat_engine_types: List[str] = Field(..., min_length=1, description="Compatible marine internal combustion engine / fuel cell types")
    source_ref: str = Field(..., description="Official reference citation, e.g. IMO MEPC.391(81) Table 2 or GREET 2023")
    provenance: Provenance = Field(..., description="Data provenance (e.g. REPORTED if from IMO LCA, ESTIMATED if derived)")

    @model_validator(mode="after")
    def compute_or_verify_wtw(self) -> "FuelPathway":
        """Verify that wtw_gco2e_mj matches WtT + direct TtW + GWP-weighted slippage."""
        computed_ttw = self.ttw_co2_g_mj + (self.gwp_ch4 * self.ttw_ch4_slip_g_mj) + (self.gwp_n2o * self.ttw_n2o_g_mj)
        expected_wtw = round(self.wtt_gco2e_mj + computed_ttw, 2)
        # Allow small floating point tolerances or if explicitly set
        if abs(self.wtw_gco2e_mj - expected_wtw) > 0.5:
            # Enforce mathematical integrity:
            self.wtw_gco2e_mj = expected_wtw
        return self
