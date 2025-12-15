import React, { useState, useEffect, useRef, useCallback } from 'react';
import NeuronScene from './components/NeuronScene';
import ControlPanel from './components/ControlPanel';
import Oscilloscope from './components/Oscilloscope';
import GatingPlot from './components/GatingPlot';
import { solveHH, getInitialState } from './services/hhSolver';
import { HHState, HHParameters } from './types';

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

export const App: React.FC = () => {
  // --- State ---
  const [params, setParams] = useState<HHParameters>(BIOLOGICAL_PARAMS);
  // Renamed to simHistory to avoid shadowing global history object
  const [simHistory, setSimHistory] = useState<HHState[]>([]);
  
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

  const handleReset = useCallback(() => {
    // Reset simulation state variables
    stateRef.current = getInitialState();
    
    // Reset parameters
    setParams(BIOLOGICAL_PARAMS);
    paramsRef.current = BIOLOGICAL_PARAMS;
    
    // Reset pulse and history
    pulseRef.current = 0;
    setSimHistory([]);
  }, []);

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
      setSimHistory([...historyBuffer]);

      animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="relative w-screen h-screen flex flex-col md:flex-row overflow-hidden font-sans bg-cyber-black text-gray-200">
      
      {/* Scanline Overlay */}
      <div className="scanlines"></div>
      
      {/* Vignette */}
      <div className="absolute inset-0 z-[1] bg-vignette opacity-60 pointer-events-none"></div>
      
      {/* Noise */}
      <div className="absolute inset-0 z-[1] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none mix-blend-overlay"></div>

      {/* BACKGROUND: 3D Visualization */}
      <div className="absolute inset-0 z-0 bg-cyber-black">
        <NeuronScene state={stateRef.current} simulationParams={params} />
      </div>

      {/* OVERLAY: UI Layer */}
      <div className="relative z-10 w-full h-full flex flex-col md:flex-row pointer-events-none">
        
        {/* LEFT: Controls (Pointer events enabled) */}
        <div className="pointer-events-auto h-full hidden md:block z-20">
            <ControlPanel 
                params={params} 
                onParamChange={handleParamChange} 
                onInjectCurrent={handleInject}
                onReset={handleReset}
            />
        </div>

        {/* CENTER: Main View Area */}
        <div className="flex-1 flex flex-col justify-between p-6 md:p-10 relative">
            {/* Header */}
            <header className="flex justify-between items-start pointer-events-auto select-none">
                <div>
                    <h1 className="text-5xl md:text-7xl font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-cyber-neon via-white to-white tracking-tighter drop-shadow-[0_0_20px_rgba(0,243,255,0.3)]">
                        NEURAL<br/>DYNAMICS
                    </h1>
                    <div className="flex items-center gap-3 mt-3">
                        <div className="text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                           {/* Neuron Icon (Soma, Dendrites, Axon) */}
                           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-pulse">
                             {/* Cell Body */}
                             <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.2"/>
                             <circle cx="12" cy="10" r="1" fill="currentColor"/>
                             
                             {/* Dendrites */}
                             <path d="M12 7V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                             <path d="M12 3L10 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                             <path d="M12 3L14 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>

                             <path d="M14.5 8.5L18 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                             <path d="M18 6L20 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                             <path d="M18 6L19 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>

                             <path d="M9.5 8.5L6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                             <path d="M6 6L4 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                             <path d="M6 6L5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>

                             {/* Axon */}
                             <path d="M12 13C12 16 12 18 9 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                             <circle cx="9" cy="21" r="1" fill="currentColor"/>
                           </svg>
                        </div>
                        <p className="text-cyber-neon/80 font-sans font-bold text-xs md:text-sm tracking-[0.3em] uppercase">
                            Bioelectric Computation // Biological
                        </p>
                    </div>
                </div>
                
                <div className="hidden md:block text-right bg-black/40 backdrop-blur-md p-5 border-r-2 border-cyber-neon/30 rounded-l-sm">
                   <div className="text-cyber-neon font-mono text-4xl font-bold tracking-tight shadow-[0_0_15px_rgba(0,243,255,0.2)]">{stateRef.current.V.toFixed(1)} <span className="text-lg opacity-60">mV</span></div>
                   <div className="text-[10px] text-gray-400 font-sans font-semibold tracking-widest uppercase mt-1">Membrane Potential</div>
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
               
               <button 
                  type="button"
                  onClick={handleReset}
                  className="w-full py-3 bg-cyber-panel/80 border border-gray-700 text-gray-400 flex items-center justify-center font-mono text-xs uppercase"
               >
                  System Reset
               </button>
            </div>
        </div>

        {/* RIGHT: Oscilloscopes */}
        <div className="w-full md:w-[500px] lg:w-[800px] h-[50vh] md:h-full flex flex-col pointer-events-auto bg-black/60 md:bg-black/30 backdrop-blur-xl border-l border-white/5 transition-all duration-300">
            <div className="flex-[2] min-h-0 border-b border-white/5 p-5">
                <Oscilloscope data={simHistory} />
            </div>
            <div className="flex-1 min-h-0 hidden md:block p-5">
                <GatingPlot data={simHistory} />
            </div>
            <div className="p-4 border-t border-white/5 bg-black/80">
                <div className="text-[10px] font-mono text-gray-500 mb-1 flex justify-between">
                    <span>SYS_UPTIME</span>
                    <span>{performance.now().toFixed(0)} MS</span>
                </div>
                <div className="h-0.5 w-full bg-gray-800 overflow-hidden rounded-full">
                    <div className="h-full bg-cyber-neon animate-pulse w-2/3 shadow-[0_0_5px_#00f3ff]"></div>
                </div>
            </div>
        </div>
      </div>
      
    </div>
  );
};
