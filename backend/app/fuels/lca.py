"""Fuel Reality Engine: Full lifecycle Well-to-Wake (WtW) emissions and energy equivalence."""

from typing import Dict, Optional
from backend.app.schemas import FuelPathway, Port, Provenance


class FuelLCAEngine:
    """Calculates lifecycle emissions, energetic conversions, and bunker costs.

    Adheres strictly to IMO MEPC.391(81) Guidelines on life cycle GHG intensity of marine fuels.
    """

    def __init__(self, catalog: Dict[str, FuelPathway]):
        self.catalog = catalog

    def get_pathway(self, pathway_id: str) -> FuelPathway:
        if pathway_id not in self.catalog:
            raise KeyError(f"Fuel pathway '{pathway_id}' not found in catalog")
        return self.catalog[pathway_id]

    def energy_to_mass_tonnes(self, energy_mj: float, pathway_id: str) -> float:
        """Calculate required fuel mass in metric tonnes to deliver the given mechanical energy."""
        pathway = self.get_pathway(pathway_id)
        # mass_kg = energy_mj / LHV_mj_kg
        mass_kg = energy_mj / pathway.energy_density_mj_kg
        return mass_kg / 1000.0

    def mass_tonnes_to_energy_mj(self, mass_tonnes: float, pathway_id: str) -> float:
        """Convert fuel mass in tonnes to gross thermal/chemical energy in MJ."""
        pathway = self.get_pathway(pathway_id)
        return mass_tonnes * 1000.0 * pathway.energy_density_mj_kg

    def compute_wtw_ghg_tonnes(self, mass_tonnes: float, pathway_id: str) -> float:
        """Compute Well-to-Wake lifecycle greenhouse gas emissions in metric tonnes CO2e.

        Formula:
          Total_Energy_MJ = mass_tonnes * 1000 * LHV_mj_kg
          GHG_gCO2e = Total_Energy_MJ * wtw_gco2e_mj
          GHG_tonnes = GHG_gCO2e * 1e-6
        """
        pathway = self.get_pathway(pathway_id)
        energy_mj = self.mass_tonnes_to_energy_mj(mass_tonnes, pathway_id)
        ghg_g = energy_mj * pathway.wtw_gco2e_mj
        return ghg_g * 1e-6

    def compute_bunker_cost_usd(
        self,
        mass_tonnes: float,
        pathway_id: str,
        port: Optional[Port] = None,
        price_multiplier: float = 1.0,
    ) -> float:
        """Compute procurement cost in USD, applying port-specific spreads and scenario shocks."""
        pathway = self.get_pathway(pathway_id)
        base_price = pathway.price_per_tonne_usd
        port_spread = 1.0
        if port and pathway_id in port.bunker_price_spread:
            port_spread = port.bunker_price_spread[pathway_id]
        final_price_per_tonne = base_price * port_spread * price_multiplier
        return mass_tonnes * final_price_per_tonne

    def hfo_mass_to_pathway_mass(self, hfo_tonnes: float, target_pathway_id: str) -> float:
        """Convert an equivalent baseline HFO energy requirement to the target fuel pathway mass."""
        if target_pathway_id == "hfo":
            return hfo_tonnes
        hfo_pathway = self.get_pathway("hfo")
        energy_mj = hfo_tonnes * 1000.0 * hfo_pathway.energy_density_mj_kg
        return self.energy_to_mass_tonnes(energy_mj, target_pathway_id)
