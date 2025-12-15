import { HHState, HHParameters } from '../types';

// Rate functions (shifted to resting potential ~ -65mV for modern convention)
// Usually alpha/beta are defined relative to resting potential V_rest = 0 in original paper.
// Here we assume V is absolute membrane potential.
// Standard conversion: V_rest = -65mV.
// We use the form from commonly used computational neuroscience resources.

const alpha_n = (V: number): number => {
  const v = V + 65; // shift
  // 0.01 * (10 - v) / (exp((10 - v) / 10) - 1) which is equivalent to:
  if (Math.abs(v - 10) < 1e-6) return 0.1; // singularity handling
  return (0.01 * (10 - v)) / (Math.exp((10 - v) / 10) - 1);
};

const beta_n = (V: number): number => {
  const v = V + 65;
  return 0.125 * Math.exp(-v / 80);
};

const alpha_m = (V: number): number => {
  const v = V + 65;
  if (Math.abs(v - 25) < 1e-6) return 1;
  return (0.1 * (25 - v)) / (Math.exp((25 - v) / 10) - 1);
};

const beta_m = (V: number): number => {
  const v = V + 65;
  return 4 * Math.exp(-v / 18);
};

const alpha_h = (V: number): number => {
  const v = V + 65;
  return 0.07 * Math.exp(-v / 20);
};

const beta_h = (V: number): number => {
  const v = V + 65;
  return 1 / (Math.exp((30 - v) / 10) + 1);
};

export const solveHH = (state: HHState, params: HHParameters, dt: number): HHState => {
  const { V, m, h, n, t } = state;
  const { Cm, E_Na, E_K, E_L, g_Na, g_K, g_L, I_ext } = params;

  // Calculate Currents
  const I_Na = g_Na * Math.pow(m, 3) * h * (V - E_Na);
  const I_K = g_K * Math.pow(n, 4) * (V - E_K);
  const I_L = g_L * (V - E_L);

  // dV/dt
  const dV = (I_ext - (I_Na + I_K + I_L)) / Cm;

  // Gating variable derivatives
  const dm = alpha_m(V) * (1 - m) - beta_m(V) * m;
  const dh = alpha_h(V) * (1 - h) - beta_h(V) * h;
  const dn = alpha_n(V) * (1 - n) - beta_n(V) * n;

  // Euler Integration
  return {
    V: V + dV * dt,
    m: m + dm * dt,
    h: h + dh * dt,
    n: n + dn * dt,
    t: t + dt,
  };
};

export const getInitialState = (): HHState => {
  // Approximate steady state at -65mV
  const V_rest = -65;
  const a_m = alpha_m(V_rest), b_m = beta_m(V_rest);
  const a_h = alpha_h(V_rest), b_h = beta_h(V_rest);
  const a_n = alpha_n(V_rest), b_n = beta_n(V_rest);

  return {
    V: V_rest,
    m: a_m / (a_m + b_m),
    h: a_h / (a_h + b_h),
    n: a_n / (a_n + b_n),
    t: 0,
  };
};