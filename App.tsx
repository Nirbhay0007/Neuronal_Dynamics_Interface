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
  const [simHistory, setSimHistory] = useState<HHState[]>([]);
  const [uptime, setUptime] = useState(0);
  
  // Refs for simulation loop
  const stateRef = useRef<HHState>(getInitialState());
  const paramsRef = useRef<HHParameters>(BIOLOGICAL_PARAMS);
  const pulseRef = useRef<number>(0); 
  const startTimeRef = useRef<number>(Date.now());
  
  // --- Handlers ---
  const handleParamChange = useCallback((newParams: Partial<HHParameters>) => {
    setParams(prev => {
        const updated = { ...prev, ...newParams };
        paramsRef.current = updated;
        return updated;
    });
  }, []);

  const handleInject = useCallback(() => {
    pulseRef.current = 20; 
  }, []);

  const handleReset = useCallback(() => {
    stateRef.current = getInitialState();
    setParams(BIOLOGICAL_PARAMS);
    paramsRef.current = BIOLOGICAL_PARAMS;
    pulseRef.current = 0;
    setSimHistory([]);
    startTimeRef.current = Date.now();
  }, []);

  // --- Simulation Loop ---
  useEffect(() => {
    let animationFrameId: number;
    let historyBuffer: HHState[] = [];

    const loop = () => {
      // Simulation Physics
      for (let i = 0; i < STEPS_PER_FRAME; i++) {
        let currentI = paramsRef.current.I_ext;
        if (pulseRef.current > 0) {
          currentI += 20; 
          pulseRef.current -= DT;
        }

        const nextState = solveHH(
          stateRef.current, 
          { ...paramsRef.current, I_ext: currentI }, 
          DT
        );
        stateRef.current = nextState;
      }

      // History Update
      historyBuffer.push({ ...stateRef.current });
      if (historyBuffer.length > HISTORY_LENGTH) {
        historyBuffer = historyBuffer.slice(historyBuffer.length - HISTORY_LENGTH);
      }
      setSimHistory([...historyBuffer]);

      // Uptime Update (throttled visually by frame, but logic uses time)
      setUptime(Date.now() - startTimeRef.current);

      animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Vertical text helper
  const verticalText = "NEURALDX".split('');

  return (
    <div className="relative w-screen h-screen flex flex-col lg:flex-row overflow-hidden font-sans bg-cyber-black text-gray-200 selection:bg-cyber-neon selection:text-black">
      
      {/* Scanline Overlay */}
      <div className="scanlines"></div>
      
      {/* Background Noise */}
      <div className="absolute inset-0 z-[1] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay"></div>

      {/* --- COLUMN 1: LEFT CONTROL PANEL (320px) --- */}
      <div className="hidden lg:flex w-80 shrink-0 h-full relative z-30 shadow-[10px_0_30px_rgba(0,0,0,0.5)]">
        <ControlPanel 
            params={params} 
            onParamChange={handleParamChange} 
            onInjectCurrent={handleInject}
            onReset={handleReset}
        />
      </div>

      {/* --- COLUMN 2: CENTER VIEWPORT --- */}
      <div className="flex-1 relative h-full min-w-0 bg-black">
        
        {/* 3D Scene Background */}
        <div className="absolute inset-0 z-0">
             <NeuronScene state={stateRef.current} simulationParams={params} />
             {/* Vignette */}
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_120%)] opacity-80 pointer-events-none"></div>
        </div>

        {/* Floating HUD: Membrane Potential */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
             <div className="bg-cyber-panel/40 backdrop-blur-md border border-white/10 px-8 py-4 rounded-sm shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col items-center group">
                <div className="flex items-baseline gap-2">
                    <span className={`text-5xl font-mono font-bold tracking-tighter transition-colors duration-100 ${
                        stateRef.current.V > 0 ? 'text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]' : 'text-cyber-neon drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]'
                    }`}>
                        {stateRef.current.V.toFixed(1)}
                    </span>
                    <span className="text-sm font-bold text-cyber-muted">mV</span>
                </div>
                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent my-2"></div>
                <span className="text-[10px] tracking-[0.3em] text-cyber-muted uppercase">Membrane Potential</span>
                
                {/* HUD Corners */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyber-neon/50"></div>
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyber-neon/50"></div>
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyber-neon/50"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyber-neon/50"></div>
             </div>
        </div>

        {/* Vertical Watermark Title */}
        <div className="hidden xl:flex flex-col justify-center items-center absolute left-6 top-0 bottom-0 z-10 select-none pointer-events-none mix-blend-overlay opacity-60">
             <div className="flex flex-col gap-0">
                {verticalText.map((char, i) => (
                    <span key={i} className={`text-[5rem] 2xl:text-[7rem] font-display font-black leading-[0.85] ${i > 5 ? 'text-cyber-neon' : 'text-white'}`}>
                        {char}
                    </span>
                ))}
             </div>
        </div>

        {/* Mobile Control Access Overlay */}
        <div className="lg:hidden absolute bottom-8 left-4 right-4 z-40 flex gap-2">
                 <button 
                    type="button"
                    onMouseDown={handleInject}
                    className="flex-1 bg-cyber-danger/90 backdrop-blur text-black font-black py-4 font-display tracking-widest text-sm clip-path-polygon shadow-lg uppercase"
                    style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                 >
                    STIMULATE
                 </button>
                 <button 
                     className="px-6 bg-cyber-panel/90 backdrop-blur border border-white/10 text-white font-mono text-xs font-bold uppercase"
                     onClick={() => document.getElementById('mobile-controls')?.classList.toggle('hidden')}
                 >
                    Settings
                 </button>
        </div>
        
        {/* Mobile Control Panel Modal */}
        <div id="mobile-controls" className="hidden lg:hidden absolute inset-0 z-50 bg-cyber-black/95">
             <div className="p-4 flex justify-end">
                <button 
                    onClick={() => document.getElementById('mobile-controls')?.classList.add('hidden')}
                    className="text-white p-2"
                >✕</button>
             </div>
             <div className="h-full overflow-y-auto pb-20">
                <ControlPanel params={params} onParamChange={handleParamChange} onInjectCurrent={handleInject} onReset={handleReset} />
             </div>
        </div>

      </div>

      {/* --- COLUMN 3: RIGHT ANALYTICS (400px - 500px) --- */}
      <div className="hidden lg:flex w-[420px] xl:w-[500px] shrink-0 h-full z-30 flex-col border-l border-white/5 bg-cyber-black/40 backdrop-blur-xl">
          <div className="flex-1 min-h-0">
             <Oscilloscope data={simHistory} />
          </div>
          <div className="flex-1 min-h-0 border-t border-white/5">
             <GatingPlot data={simHistory} />
          </div>
          
          {/* Uptime Footer */}
          <div className="h-16 border-t border-white/10 bg-black/40 flex flex-col justify-center px-6">
              <div className="flex justify-between items-end mb-2">
                  <span className="text-[10px] font-mono text-cyber-muted tracking-widest">SYS_UPTIME</span>
                  <span className="text-xs font-mono text-cyber-neon">{uptime} MS</span>
              </div>
              <div className="w-full h-1 bg-cyber-dark rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyber-neon to-cyber-plasma animate-pulse w-full origin-left" style={{ transform: 'scaleX(0.8)' }}></div>
              </div>
          </div>
      </div>

    </div>
  );
};