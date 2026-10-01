"""FastAPI application for Q-GREEN FLEET (L5 Orchestration & API Layer)."""

from typing import Any, Dict, List, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.app.schemas import (
    Provenance,
    Vessel,
    Port,
    Route,
    FuelPathway,
    Scenario,
    Plan,
    ObjectiveVector,
    ConstraintReport,
    EvaluationResult,
    ParetoSolution,
    RunTelemetry,
    FuelPredictionInput,
    Quantiles,
    ProblemDefinition,
)

app = FastAPI(
    title="Q-GREEN FLEET API",
    version="0.2.0",
    description="Adaptive Maritime Digital Twin & Classical Quantum-Inspired Multi-Objective Fleet Optimizer API",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request & Response wrappers
class OptimizeRequest(BaseModel):
    problem: ProblemDefinition
    algorithm: str = Field("Q-GREEN-Hybrid", description="Optimizer: Q-GREEN-Hybrid, NSGA-II, QPSO, QIGA, GA, PSO, Greedy")
    seed: int = 42
    eval_budget: int = 2000


class OptimizeResponse(BaseModel):
    run_id: str
    status: str
    algorithm: str
    seed: int
    eval_budget: int
    provenance: Provenance = Provenance.SIMULATED


class ReoptimizeRequest(BaseModel):
    prior_run_id: str
    disruption_scenario: Scenario
    warm_start_archive_size: int = 20
    eval_budget: int = 1000
    seed: int = 42


class ExplainabilityResponse(BaseModel):
    plan_id: str
    why_this_plan: List[str]
    why_not_counterfactuals: Dict[str, List[str]]
    tradeoff_summary: Dict[str, Any]
    provenance: Provenance = Provenance.SIMULATED


class VoyageReplayResponse(BaseModel):
    voyage_id: str
    vessel_id: str
    route_id: str
    actual_timeline: List[Dict[str, Any]]
    counterfactual_optimal_timeline: List[Dict[str, Any]]
    delta_metrics: Dict[str, float]
    provenance: Provenance = Provenance.ESTIMATED


# API Endpoints per §3.9
@app.get("/health", tags=["System"])
async def health_check():
    return {"status": "healthy", "service": "Q-GREEN FLEET", "version": "0.2.0"}


@app.get("/fuels", response_model=List[FuelPathway], tags=["Fleet Catalog"])
async def list_fuels():
    """Return all verified Well-to-Wake fuel pathways with LCA emission intensities."""
    from backend.app.data.loader import load_fuel_catalog
    return list(load_fuel_catalog().values())


@app.get("/vessels", response_model=List[Vessel], tags=["Fleet Catalog"])
async def list_vessels():
    """Return operational fleet vessel specifications."""
    from backend.app.data.loader import load_vessels
    return list(load_vessels().values())


@app.get("/ports", response_model=List[Port], tags=["Fleet Catalog"])
async def list_ports():
    """Return global ports with OPS availability and bunker inventory."""
    from backend.app.data.loader import load_ports
    return list(load_ports().values())


@app.get("/routes", response_model=List[Route], tags=["Fleet Catalog"])
async def list_routes():
    """Return strategic routes, waypoints, bathymetry, and ECA segments."""
    from backend.app.data.loader import load_routes
    return list(load_routes().values())


@app.post("/predict/fuel", response_model=List[Quantiles], tags=["Prediction"])
async def predict_fuel(inputs: List[FuelPredictionInput]):
    """Predict leg fuel consumption with calibrated p10/p50/p90 quantile uncertainty."""
    from backend.app.prediction.service import get_predictor
    predictor = get_predictor()
    return predictor.predict(inputs)


@app.post("/optimize", response_model=OptimizeResponse, tags=["Optimization"])
async def start_optimization(req: OptimizeRequest):
    """Launch asynchronous multi-objective fleet optimization run."""
    from backend.app.services.runner import run_registry
    run_id = run_registry.start_job(req.problem, req.algorithm, req.seed, req.eval_budget)
    return OptimizeResponse(
        run_id=run_id,
        status="running",
        algorithm=req.algorithm,
        seed=req.seed,
        eval_budget=req.eval_budget,
    )


@app.get("/optimize/{run_id}", tags=["Optimization"])
async def get_optimization_status(run_id: str):
    """Retrieve run status, telemetry, and non-dominated Pareto archive."""
    from backend.app.services.runner import run_registry
    res = run_registry.get_result(run_id)
    if not res:
        raise HTTPException(status_code=404, detail=f"Run {run_id} not found")
    return res


@app.websocket("/optimize/{run_id}/ws")
async def optimization_telemetry_ws(websocket: WebSocket, run_id: str):
    """Stream live optimization telemetry (generation, HV, feasibility, best scores)."""
    await websocket.accept()
    from backend.app.services.runner import run_registry
    queue = run_registry.subscribe(run_id)
    try:
        while True:
            telemetry = await queue.get()
            if telemetry is None:
                break
            await websocket.send_text(telemetry.model_dump_json())
    except WebSocketDisconnect:
        run_registry.unsubscribe(run_id, queue)


@app.post("/reoptimize", response_model=OptimizeResponse, tags=["Optimization"])
async def reoptimize_disruption(req: ReoptimizeRequest):
    """Warm-start re-optimization from prior Pareto archive under sudden disruption."""
    from backend.app.services.runner import run_registry
    run_id = run_registry.start_reoptimization(
        req.prior_run_id,
        req.disruption_scenario,
        req.warm_start_archive_size,
        req.eval_budget,
        req.seed,
    )
    return OptimizeResponse(
        run_id=run_id,
        status="running",
        algorithm="Q-GREEN-Reopt",
        seed=req.seed,
        eval_budget=req.eval_budget,
    )


@app.get("/explain/{plan_id}", response_model=ExplainabilityResponse, tags=["Explainability"])
async def explain_plan(plan_id: str):
    """Return templated, factual mathematical rationale for why this plan was chosen."""
    from backend.app.explainability.explainer import get_explanation
    return get_explanation(plan_id)


@app.get("/replay/{voyage_id}", response_model=VoyageReplayResponse, tags=["Digital Twin"])
async def replay_voyage(voyage_id: str):
    """Compare historical / baseline voyage against counterfactual model-optimized execution."""
    from backend.app.digital_twin.replay import get_voyage_replay
    return get_voyage_replay(voyage_id)
