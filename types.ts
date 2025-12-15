export interface HHState {
  V: number; // Membrane Potential (mV)
  m: number; // Na+ activation
  h: number; // Na+ inactivation
  n: number; // K+ activation
  t: number; // Time (ms)
}

export interface HHParameters {
  Cm: number;      // Membrane Capacitance (uF/cm^2)
  E_Na: number;    // Na+ Equilibrium Potential (mV)
  E_K: number;     // K+ Equilibrium Potential (mV)
  E_L: number;     // Leak Equilibrium Potential (mV)
  g_Na: number;    // Max Na+ Conductance (mS/cm^2)
  g_K: number;     // Max K+ Conductance (mS/cm^2)
  g_L: number;     // Max Leak Conductance (mS/cm^2)
  I_ext: number;   // External Injected Current (uA/cm^2)
}

export enum SimulationMode {
  BIOLOGICAL = 'BIOLOGICAL',
  CYBERNETIC = 'CYBERNETIC',
}