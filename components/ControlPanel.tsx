import React from 'react';
import { HHParameters } from '../types';

interface ControlPanelProps {
  params: HHParameters;
  onParamChange: (newParams: Partial<HHParameters>) => void;
  onInjectCurrent: () => void;
  onReset: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = React.memo(({ params, onParamChange, onInjectCurrent, onReset }) => {
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onParamChange({ [name]: parseFloat(value) });
  };

  return (
    <div className="bg-gradient-to-b from-cyber-panel/95 via-cyber-dark/95 to-cyber-black/95 border-r border-white/5 p-6 w-full md:w-80 flex flex-col gap-8 h-full overflow-y-auto backdrop-blur-xl relative shadow-2xl">
      {/* Decorative vertical line */}
      <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-transparent via-cyber-neon/20 to-transparent"></div>

      <div className="border-b border-white/5 pb-6 relative">
        <h2 className="text-2xl font-display font-bold text-white tracking-wider italic bg-clip-text text-transparent bg-gradient-to-r from-cyber-neon to-white">CONTROL_UNIT</h2>
        <p className="text-[10px] text-cyber-plasma font-mono mt-1 tracking-[0.2em] opacity-80 uppercase">Hodgkin-Huxley Solver v4.2</p>
        
        {/* Corner Decor */}
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyber-neon/50"></div>
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyber-neon/50"></div>
      </div>

      {/* System Control */}
      <div className="flex flex-col gap-3">
         <label className="text-[10px] text-gray-500 font-sans font-semibold tracking-widest uppercase flex items-center gap-2">
            <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
            System Control
         </label>
         <button 
            type="button"
            onClick={onReset}
            className="relative w-full py-3 px-4 border border-white/10 bg-white/5 text-gray-400 hover:border-cyber-danger hover:text-cyber-danger hover:bg-cyber-danger/5 transition-all flex items-center justify-center gap-2 group font-mono text-xs font-bold tracking-wide"
            title="HARD RESET"
         >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            RESET SIMULATION
         </button>
      </div>

      {/* Current Injection */}
      <div className="flex flex-col gap-4 p-5 border border-white/5 bg-gradient-to-b from-white/5 to-transparent relative group">
         <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyber-danger/50 to-transparent"></div>
         <div className="absolute bottom-0 right-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyber-danger/20 to-transparent"></div>
         
         <label className="text-[10px] text-cyber-danger font-sans font-bold tracking-widest uppercase flex justify-between items-center">
             <span>External Stimulus</span>
             <span className="w-1.5 h-1.5 bg-cyber-danger rounded-full animate-pulse"></span>
         </label>
         
         <button 
           type="button"
           onMouseDown={onInjectCurrent}
           className="relative group w-full py-5 font-bold text-white bg-black border border-cyber-danger/50 hover:border-cyber-danger hover:bg-cyber-danger/10 transition-all active:scale-[0.99] select-none clip-path-polygon overflow-hidden"
           style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
         >
           <div className="absolute inset-0 bg-cyber-danger/20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-500 ease-out"></div>
           <span className="relative z-10 flex items-center justify-center gap-3 font-display tracking-wider text-sm">
             INJECT PULSE
           </span>
         </button>
         
         <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-mono text-cyber-neon/80">
                <span className="opacity-70">I_ext_BASE</span>
                <span>{params.I_ext.toFixed(1)} µA/cm²</span>
            </div>
            <input 
                type="range" 
                name="I_ext" 
                min="-10" 
                max="50" 
                step="1" 
                value={params.I_ext} 
                onChange={handleChange}
                className="w-full"
            />
         </div>
      </div>

      {/* Sliders */}
      <div className="space-y-8">
        <label className="text-[10px] text-gray-500 font-sans font-semibold tracking-widest uppercase border-b border-white/5 block pb-2 mb-4">
            Channel Conductance
        </label>
        
        <div className="group relative">
            <div className="flex justify-between text-xs mb-3 items-center">
                <span className="text-gray-300 font-sans font-medium tracking-wide">g_Na <span className="text-[10px] text-cyber-neon opacity-70 ml-1">SODIUM</span></span>
                <span className="font-mono text-cyber-neon bg-cyber-neon/5 px-2 py-0.5 border border-cyber-neon/20 rounded text-[10px] shadow-[0_0_10px_rgba(0,243,255,0.1)]">{params.g_Na.toFixed(1)}</span>
            </div>
            <input 
                type="range" 
                name="g_Na" 
                min="0" 
                max="500" 
                value={params.g_Na} 
                onChange={handleChange}
                className="w-full"
            />
            <div className="h-[2px] w-full bg-white/5 mt-3 relative rounded-full overflow-hidden">
                <div className="absolute h-full bg-gradient-to-r from-transparent to-cyber-neon opacity-70 transition-all" style={{ width: `${(params.g_Na / 500) * 100}%` }}></div>
            </div>
        </div>

        <div className="group relative">
            <div className="flex justify-between text-xs mb-3 items-center">
                <span className="text-gray-300 font-sans font-medium tracking-wide">g_K <span className="text-[10px] text-cyber-plasma opacity-70 ml-1">POTASSIUM</span></span>
                <span className="font-mono text-cyber-plasma bg-cyber-plasma/5 px-2 py-0.5 border border-cyber-plasma/20 rounded text-[10px] shadow-[0_0_10px_rgba(188,19,254,0.1)]">{params.g_K.toFixed(1)}</span>
            </div>
            <input 
                type="range" 
                name="g_K" 
                min="0" 
                max="200" 
                value={params.g_K} 
                onChange={handleChange}
                className="w-full"
            />
            <div className="h-[2px] w-full bg-white/5 mt-3 relative rounded-full overflow-hidden">
                <div className="absolute h-full bg-gradient-to-r from-transparent to-cyber-plasma opacity-70 transition-all" style={{ width: `${(params.g_K / 200) * 100}%` }}></div>
            </div>
        </div>
        
        <div className="group relative">
            <div className="flex justify-between text-xs mb-3 items-center">
                <span className="text-gray-300 font-sans font-medium tracking-wide">g_L <span className="text-[10px] text-gray-500 ml-1">LEAK</span></span>
                <span className="font-mono text-gray-400 bg-white/5 px-2 py-0.5 border border-white/10 rounded text-[10px]">{params.g_L.toFixed(2)}</span>
            </div>
            <input 
                type="range" 
                name="g_L" 
                min="0" 
                max="2" 
                step="0.01"
                value={params.g_L} 
                onChange={handleChange}
                className="w-full"
            />
            <div className="h-[2px] w-full bg-white/5 mt-3 relative rounded-full overflow-hidden">
                <div className="absolute h-full bg-gradient-to-r from-transparent to-gray-400 opacity-50 transition-all" style={{ width: `${(params.g_L / 2) * 100}%` }}></div>
            </div>
        </div>
      </div>

      <div className="mt-auto pt-6 border-t border-white/5 text-[9px] text-gray-500 font-mono space-y-1.5 opacity-60">
        <p className="flex justify-between"><span>DT:</span> <span>0.05ms</span></p>
        <p className="flex justify-between"><span>INTEGRATOR:</span> <span>SEMI-IMPLICIT EULER</span></p>
        <p className="flex justify-between"><span>ENV:</span> <span>6.3°C (SQUID AXON)</span></p>
      </div>
    </div>
  );
});

export default ControlPanel;