import React, { useState, useEffect, useRef, useCallback } from 'react';
import NeuronScene from './components/NeuronScene';
import ControlPanel from './components/ControlPanel';
import Oscilloscope from './components/Oscilloscope';
import GatingPlot from './components/GatingPlot';
import { solveHH, getInitialState } from './services/hhSolver';
import { HHState, HHParameters, SimulationMode } from './types';

// Constants
const HISTORY_LENGTH = 300; // Number of points in graph
const DT = 0.05; // ms
const STEPS_PER_FRAME = 5; // Run simulation faster than frame rate

// Default Parameters
const BIOLOGICAL_PARAMS: HHParameters = {
  Cm: 1.0,
  E_Na: 50.0,
  E_K: -77.0,
  E_L: -54.4,
  g_Na: 120.0,
  g_K: 36.0,
  g_L: 0.3,
  I_ext: 0.0,
};

const CYBERNETIC_PARAMS: HHParameters = {
  ...BIOLOGICAL_PARAMS,
  g_Na: 350.0, // Massive sodium influx
  g_K: 80.0,   // Faster repolarization
  I_ext: 5.0,  // Constant background hum
};

const App: React.FC = () => {
  // --- State ---
  const [params, setParams] = useState<HHParameters>(BIOLOGICAL_PARAMS);
  const [mode, setMode] = useState<SimulationMode>(SimulationMode.BIOLOGICAL);
  const [history, setHistory] = useState<HHState[]>([]);
  
  // Refs for simulation loop to avoid closure staleness
  const stateRef = useRef<HHState>(getInitialState());
  const paramsRef = useRef<HHParameters>(BIOLOGICAL_PARAMS);
  const pulseRef = useRef<number>(0); // Temporary current injection
  
  // --- Handlers ---
  const handleParamChange = useCallback((newParams: Partial<HHParameters>) => {
    setParams(prev => {
        const updated = { ...prev, ...newParams };
        paramsRef.current = updated;
        return updated;
    });
  }, []);

  const handleInject = useCallback(() => {
    // Trigger a 20ms pulse
    pulseRef.current = 20; // 20ms countdown
  }, []);

  const handleModeToggle = useCallback(() => {
    setMode(prev => {
        const newMode = prev === SimulationMode.BIOLOGICAL ? SimulationMode.CYBERNETIC : SimulationMode.BIOLOGICAL;
        const newParams = newMode === SimulationMode.CYBERNETIC ? CYBERNETIC_PARAMS : BIOLOGICAL_PARAMS;
        setParams(newParams);
        paramsRef.current = newParams;
        return newMode;
    });
  }, []);

  const handleReset = useCallback(() => {
    // Reset simulation state variables
    stateRef.current = getInitialState();
    
    // Reset parameters to current mode defaults
    const defaultParams = mode === SimulationMode.CYBERNETIC ? CYBERNETIC_PARAMS : BIOLOGICAL_PARAMS;
    setParams(defaultParams);
    paramsRef.current = defaultParams;
    
    // Reset pulse and history
    pulseRef.current = 0;
    setHistory([]);
  }, [mode]);

  // --- Simulation Loop ---
  useEffect(() => {
    let animationFrameId: number;
    // We maintain a local history buffer to reduce React state updates
    let historyBuffer: HHState[] = [];

    const loop = () => {
      // Run multiple physics steps per frame for stability and speed
      for (let i = 0; i < STEPS_PER_FRAME; i++) {
        // Handle Pulse Logic
        let currentI = paramsRef.current.I_ext;
        if (pulseRef.current > 0) {
          currentI += 20; // Add 20 uA/cm^2 during pulse
          pulseRef.current -= DT;
        }

        const nextState = solveHH(
          stateRef.current, 
          { ...paramsRef.current, I_ext: currentI }, 
          DT
        );
        stateRef.current = nextState;
      }

      // Update History Buffer
      historyBuffer.push({ ...stateRef.current });
      if (historyBuffer.length > HISTORY_LENGTH) {
        historyBuffer = historyBuffer.slice(historyBuffer.length - HISTORY_LENGTH);
      }

      // Sync to React State periodically (every frame)
      setHistory([...historyBuffer]);

      animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="relative w-screen h-screen flex flex-col md:flex-row overflow-hidden font-sans bg-cyber-black text-gray-200">
      
      {/* Scanline Overlay */}
      <div className="scanlines"></div>
      <div className="absolute inset-0 z-[1] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none mix-blend-overlay"></div>

      {/* BACKGROUND: 3D Visualization */}
      <div className="absolute inset-0 z-0 bg-cyber-black">
        <NeuronScene state={stateRef.current} simulationParams={params} />
      </div>

      {/* OVERLAY: UI Layer */}
      <div className="relative z-10 w-full h-full flex flex-col md:flex-row pointer-events-none">
        
        {/* LEFT: Controls (Pointer events enabled) */}
        <div className="pointer-events-auto h-full hidden md:block shadow-2xl z-20">
            <ControlPanel 
                params={params} 
                onParamChange={handleParamChange} 
                onInjectCurrent={handleInject}
                mode={mode}
                onModeToggle={handleModeToggle}
                onReset={handleReset}
            />
        </div>

        {/* CENTER: Main View Area */}
        <div className="flex-1 flex flex-col justify-between p-6 md:p-10 relative">
            {/* Header */}
            <header className="flex justify-between items-start pointer-events-auto select-none">
                <div>
                    <h1 className="text-5xl md:text-7xl font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-cyber-neon via-white to-transparent tracking-tighter drop-shadow-[0_0_15px_rgba(0,243,255,0.4)]">
                        NEURAL<br/>DYNAMICS
                    </h1>
                    <div className="flex items-center gap-3 mt-2">
                        <div className={`w-2 h-2 rounded-full ${mode === SimulationMode.CYBERNETIC ? 'bg-cyber-plasma shadow-[0_0_8px_#bc13fe]' : 'bg-green-500 shadow-[0_0_8px_#00ff00]'}`}></div>
                        <p className="text-cyber-neon/80 font-mono text-xs md:text-sm tracking-[0.3em] uppercase">
                            BIOELECTRIC COMPUTATION // {mode}
                        </p>
                    </div>
                </div>
                
                <div className="hidden md:block text-right bg-cyber-black/50 backdrop-blur-sm p-4 border-r-2 border-cyber-neon/50">
                   <div className="text-cyber-neon font-mono text-3xl font-bold tracking-tight">{stateRef.current.V.toFixed(1)} <span className="text-sm opacity-50">mV</span></div>
                   <div className="text-[10px] text-gray-400 font-display tracking-widest uppercase mt-1">Membrane Potential</div>
                </div>
            </header>

            {/* Mobile Control Access */}
            <div className="md:hidden pointer-events-auto mt-4 space-y-3 z-30">
               <button 
                  type="button"
                  onMouseDown={handleInject}
                  className="w-full bg-cyber-danger/10 text-cyber-danger font-bold py-6 font-display border border-cyber-danger shadow-[0_0_20px_rgba(255,0,60,0.2)] active:bg-cyber-danger/30 transition-all clip-path-polygon"
                  style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}
               >
                  INITIATE ACTION POTENTIAL
               </button>
               
               <div className="flex gap-2">
                 <button 
                    type="button"
                    onClick={handleModeToggle}
                    className={`flex-1 py-3 px-4 font-mono text-xs border transition-all duration-300 ${
                       mode === SimulationMode.CYBERNETIC 
                       ? 'bg-cyber-plasma/20 border-cyber-plasma text-white' 
                       : 'bg-cyber-panel/80 border-gray-700 text-gray-400'
                     }`}
                 >
                    {mode === SimulationMode.CYBERNETIC ? '⚡ OVERDRIVE' : '🌱 STANDARD'}
                 </button>
                 <button 
                    type="button"
                    onClick={handleReset}
                    className="w-12 bg-cyber-panel/80 border border-gray-700 text-gray-400 flex items-center justify-center"
                 >
                    ↺
                 </button>
               </div>
            </div>
        </div>

        {/* RIGHT: Oscilloscopes */}
        <div className="w-full md:w-[500px] lg:w-[800px] h-[50vh] md:h-full flex flex-col pointer-events-auto bg-cyber-black/80 md:bg-cyber-black/40 backdrop-blur-xl border-l border-cyber-panel transition-all duration-300">
            <div className="flex-[2] min-h-0 border-b border-cyber-panel p-4">
                <Oscilloscope data={history} />
            </div>
            <div className="flex-1 min-h-0 hidden md:block p-4">
                <GatingPlot data={history} />
            </div>
            <div className="p-4 border-t border-cyber-panel bg-cyber-dark/80">
                <div className="text-[10px] font-mono text-gray-500 mb-1 flex justify-between">
                    <span>SYS_UPTIME</span>
                    <span>{performance.now().toFixed(0)} MS</span>
                </div>
                <div className="h-1 w-full bg-gray-800 overflow-hidden">
                    <div className="h-full bg-cyber-neon animate-pulse w-2/3"></div>
                </div>
            </div>
        </div>
      </div>
      
    </div>
  );
};

export default App;