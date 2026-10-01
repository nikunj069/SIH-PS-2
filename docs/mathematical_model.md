# Q-GREEN FLEET v2: Mathematical Model & Optimization Formulation

## 1. Problem Formulation Overview

The **Q-GREEN Fleet** problem is formulated as a high-dimensional, mixed-variable, multi-objective optimization problem under environmental and operational uncertainty:
$$\min_{\mathbf{x} \in \mathcal{X}} \mathbf{F}(\mathbf{x}) = \begin{bmatrix} f_{\text{cost}}(\mathbf{x}) \\ f_{\text{ghg}}(\mathbf{x}) \\ f_{\text{risk}}(\mathbf{x}) \end{bmatrix}$$
subject to operational, physical, environmental, and regulatory constraint vector:
$$\mathbf{g}(\mathbf{x}) \le \mathbf{0}, \quad \mathbf{h}(\mathbf{x}) = \mathbf{0}$$

---

## 2. Decision Genome Representation $\mathbf{x}$

For a heterogeneous fleet of $S$ vessels $\mathcal{S} = \{1, \dots, S\}$ and a set of trade routes $\mathcal{R} = \{1, \dots, R\}$ where each route $r$ consists of $L_r$ legs:

1. **Fleet Allocation $\mathbf{a} \in \{0, 1, \dots, R\}^S$**:
   $a_s = r \in \mathcal{R}$ assigns vessel $s$ to route $r$; $a_s = 0$ denotes vessel $s$ remains idle in lay-up.
2. **Speed Schedule $\mathbf{v} \in \mathbb{R}^{\sum_s L_{a_s}}$**:
   Continuous cruising speed $v_{s, l} \in [v_{\min, s}, v_{\max, s}]$ (knots) for each assigned leg $l \in \{1, \dots, L_{a_s}\}$.
3. **Alternative Fuel Selection $\mathbf{u} \in \mathcal{F}^{\sum_s L_{a_s}}$**:
   Categorical choice of primary propulsion fuel pathway $u_{s, l} \in \mathcal{F}_s \subseteq \mathcal{F}$ compatible with vessel $s$'s engine architecture.
4. **Bunkering Strategy $\mathbf{b} \in \mathbb{R}_{+}^{S \times P \times |\mathcal{F}|}$**:
   Bunkering mass $b_{s, p, f} \ge 0$ (metric tonnes) purchased at port $p \in \mathcal{P}$ for fuel pathway $f$.
5. **Cold-Ironing / Onshore Power Supply (OPS) $\mathbf{o} \in \{0, 1\}^{S \times P}$**:
   Binary decision $o_{s, p} \in \{0, 1\}$ indicating whether vessel $s$ connects to shore-side electricity at berth in port $p$ (eliminating auxiliary engine emissions during port stays).

---

## 3. Hydrodynamic & Physics-Informed Fuel Consumption Model

### 3.1 Propulsion Power Demand
Propulsion power $P_{\text{prop}}$ (kW) is modeled via modified Admiralty coefficient physics with vessel-specific hull calibration exponent $n_s$:
$$P_{\text{prop}}(v, \Delta) = k_s \cdot v^{n_s} \cdot \Delta^{2/3} + \Delta P_{\text{weather}}(v, H_s, \theta_{\text{wave}}, V_{\text{wind}}, \theta_{\text{wind}})$$
where:
- $\Delta$ is vessel displacement (metric tonnes).
- $k_s$ is the calibrated hull friction coefficient.
- $n_s \in [2.8, 3.4]$ is the empirically fitted power exponent (not hard-coded to 3.0).
- $\Delta P_{\text{weather}}$ captures added wave drift resistance ($R_{aw}$) and aerodynamic wind drag ($R_{aa}$):
$$\Delta P_{\text{wave}} = \frac{1}{2} \rho_w g H_s^2 B \cdot C_{aw}(\theta_{\text{wave}}) \cdot v$$
$$\Delta P_{\text{wind}} = \frac{1}{2} \rho_a C_x A_T V_{\text{rel}}^2 \cdot v$$

### 3.2 Fuel Mass Flow Rate & Physics-ML Residual
Auxiliary power $P_{\text{aux}}$ supplies hotel loads and reefer cargo. Total engine power $P_{\text{total}} = P_{\text{prop}} + P_{\text{aux}}$.
Specific Fuel Oil Consumption (SFOC) is modeled as a convex quadratic function of engine load fraction $\lambda = P_{\text{total}} / P_{\text{MCR}}$:
$$\text{SFOC}(\lambda) = \text{SFOC}_{\text{base}} \cdot \left(1.0 + \alpha_{\text{sfoc}}(\lambda - \lambda_{\text{opt}})^2\right)$$
Baseline physics fuel mass rate $\dot{m}_{\text{physics}}$ (kg/h):
$$\dot{m}_{\text{physics}} = \frac{P_{\text{total}} \cdot \text{SFOC}(\lambda)}{1000} \cdot \left(\frac{\text{LHV}_{\text{HFO}}}{\text{LHV}_f}\right)$$
The **Physics-Informed Residual Predictor** corrects hydrodynamic simplifications (squat, trim, shallow water effects, hull fouling):
$$\dot{m}_{\text{final}} = \dot{m}_{\text{physics}} \cdot \left(1.0 + f_{\text{ML}}(\mathbf{z})\right)$$
where $f_{\text{ML}}$ is a monotonic Gradient Boosted tree model calibrated with split-conformal prediction intervals $[p_{10}, p_{50}, p_{90}]$.

---

## 4. Well-to-Wake (WtW) Lifecycle GHG Accounting (IMO MEPC.391(81))

Total lifecycle greenhouse gas emissions are calculated on an energy basis:
$$\text{GHG}_{\text{WtW}} = \text{GHG}_{\text{WtT}} + \text{GHG}_{\text{TtW}}$$

### 4.1 Well-to-Tank (Upstream)
$$\text{GHG}_{\text{WtT}} = \sum_{s, l} m_{s, l} \cdot \text{LHV}_{u_{s, l}} \cdot \text{CI}_{\text{WtT}}(u_{s, l}) \cdot 10^{-6} \quad [\text{t CO}_2\text{e}]$$

### 4.2 Tank-to-Wake (Combustion & Fugitive Slip)
$$\text{GHG}_{\text{TtW}} = \sum_{s, l} m_{s, l} \cdot \left(C_{F, \text{CO}_2} + \text{GWP}_{\text{CH}_4} \cdot C_{F, \text{CH}_4} + \text{GWP}_{\text{N}_2\text{O}} \cdot C_{F, \text{N}_2\text{O}}\right) \quad [\text{t CO}_2\text{e}]$$
where $\text{GWP}_{\text{CH}_4} = 28$ and $\text{GWP}_{\text{N}_2\text{O}} = 265$ (100-year IMO standard horizon).

### 4.3 Onshore Power Supply (Cold-Ironing) Emission Credit
During berth stays $T_{\text{berth}}$ at port $p$:
$$E_{\text{port}} = P_{\text{aux}} \cdot T_{\text{berth}} \cdot \left[ (1 - o_{s, p}) \cdot \text{EF}_{\text{MGO}} + o_{s, p} \cdot \text{EF}_{\text{grid}}(p) \right]$$

---

## 5. Multi-Objective Function Vector

### 5.1 Objective 1: Expected Total Voyage Cost ($f_{\text{cost}}$)
$$f_{\text{cost}}(\mathbf{x}) = \mathbb{E}_{\omega \sim \Omega} \left[ C_{\text{fuel}}(\mathbf{x}, \omega) + C_{\text{bunker}}(\mathbf{x}, \omega) + C_{\text{port}}(\mathbf{x}, \omega) + C_{\text{ops}}(\mathbf{x}, \omega) + C_{\text{delay}}(\mathbf{x}, \omega) + C_{\text{ETS}}(\mathbf{x}, \omega) \right]$$
where $C_{\text{ETS}} = P_{\text{carbon}} \cdot \text{GHG}_{\text{EU-ETS}}(\mathbf{x})$ accounts for applicable regional maritime emission trading systems.

### 5.2 Objective 2: Total Well-to-Wake Emissions ($f_{\text{ghg}}$)
$$f_{\text{ghg}}(\mathbf{x}) = \mathbb{E}_{\omega \sim \Omega} \left[ \text{GHG}_{\text{propulsion}}(\mathbf{x}, \omega) + \text{GHG}_{\text{port}}(\mathbf{x}, \omega) \right] \quad [\text{t CO}_2\text{e}]$$

### 5.3 Objective 3: Conditional Value-at-Risk (CVaR$_{95}$) & Reliability ($f_{\text{risk}}$)
To hedge against severe disruptions (typhoons, canal blockages, bunkering stock-outs):
$$f_{\text{risk}}(\mathbf{x}) = \text{CVaR}_{0.95}(C_{\text{total}}(\mathbf{x}, \omega)) + \beta_{\text{pen}} \cdot \mathbb{P}\left(\text{ETA}(\mathbf{x}, \omega) > T_{\text{deadline}}\right)$$
where $\text{CVaR}_\alpha(Z) = \inf_{\zeta} \left\{ \zeta + \frac{1}{1 - \alpha} \mathbb{E}\left[(Z - \zeta)^+\right] \right\}$.

---

## 6. Constraints Formulation ($\mathbf{g}(\mathbf{x}) \le \mathbf{0}$)

1. **Cargo Capacity Satisfaction**:
   $$\sum_{s: a_s = r} \text{DWT}_s \ge \text{Demand}_r, \quad \forall r \in \mathcal{R}$$
2. **Draft vs. Bathymetry Depth**:
   $$\text{Draft}_s \le D_l^{\min} - \text{UKC}_{\min}, \quad \forall l \in \text{Route}(a_s)$$
   where $\text{UKC}_{\min}$ is the mandatory Under-Keel Clearance.
3. **Fuel Compatibility**:
   $$u_{s, l} \in \mathcal{F}_s, \quad \forall s, l$$
4. **Tank Fuel Inventory Continuity & Non-Negative Reserve**:
   $$I_{s, t} = I_{s, t-1} - \text{FuelConsumed}_{s, t} + \text{Bunkered}_{s, t}$$
   $$I_{s, t} \ge I_{s, \text{reserve}} = 0.10 \cdot \text{TankCapacity}_s, \quad \forall t$$
   $$I_{s, t} \le \text{TankCapacity}_s, \quad \forall t$$
5. **Bunker Availability & Port Berth Limits**:
   $$\sum_s b_{s, p, f} \le \text{Stock}_{p, f}$$
   $$\sum_s o_{s, p} \le \text{OPS\_Slots}_p$$
6. **Schedule Window & Maximum Transit Time**:
   $$\text{ETA}_{s, \text{dest}}(\omega) \le T_{r, \text{deadline}}$$

---

## 7. Classical Quantum-Inspired Optimization Architecture (Q-GREEN Hybrid)

The Q-GREEN optimizer integrates two complementary physics/quantum-inspired mechanisms:

### 7.1 Discrete Subspace: Quantum-Inspired Genetic Algorithm (QIGA)
Discrete decisions (vessel assignment $\mathbf{a}$, fuel pathway $\mathbf{u}$, OPS flag $\mathbf{o}$) are encoded into Q-bit registers:
$$|\psi_j\rangle = \alpha_j |0\rangle + \beta_j |1\rangle, \quad |\alpha_j|^2 + |\beta_j|^2 = 1$$
Measurement samples a classical state $x_j \sim \text{Bernoulli}(|\beta_j|^2)$.
Update is guided by quantum rotation gates towards the non-dominated Pareto archive:
$$\begin{bmatrix} \alpha_j^{t+1} \\ \beta_j^{t+1} \end{bmatrix} = \begin{bmatrix} \cos(\Delta \theta_j) & -\sin(\Delta \theta_j) \\ \sin(\Delta \theta_j) & \cos(\Delta \theta_j) \end{bmatrix} \begin{bmatrix} \alpha_j^t \\ \beta_j^t \end{bmatrix}$$
Rotation step $\Delta \theta_j = \text{sign}(\alpha_j \beta_j) \cdot \theta_0 \cdot \nabla_j \mathcal{A}$.

### 7.2 Continuous Subspace: Quantum-Behaved Particle Swarm Optimization (QPSO)
Continuous cruising speeds $\mathbf{v}$ and bunkering quantities $\mathbf{b}$ are guided by delta-potential well attractors:
$$p_{i, d}^t = \phi_{i, d} \cdot pbest_{i, d}^t + (1 - \phi_{i, d}) \cdot gbest_d^t, \quad \phi_{i, d} \sim \mathcal{U}(0, 1)$$
Mean best position across the swarm:
$$C_d^t = \frac{1}{N} \sum_{i=1}^N pbest_{i, d}^t$$
Position update equation:
$$x_{i, d}^{t+1} = p_{i, d}^t \pm \alpha_{\text{qpso}} \cdot |C_d^t - x_{i, d}^t| \cdot \ln(1 / u), \quad u \sim \mathcal{U}(0, 1)$$
where contraction-expansion coefficient $\alpha_{\text{qpso}}$ decreases linearly from $1.0 \to 0.5$.

### 7.3 Multi-Objective Pareto Sorting & Archive
The joint archive is maintained using Deb's fast non-dominated sorting and crowding distance metric with $\epsilon$-dominance pruning, ensuring diverse coverage across the Pareto front without synthetic score weights.
