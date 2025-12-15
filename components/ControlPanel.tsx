import React from 'react';
import { HHParameters, SimulationMode } from '../types';

interface ControlPanelProps {
  params: HHParameters;
  onParamChange: (newParams: Partial<HHParameters>) => void;
  onInjectCurrent: () => void;
  mode: SimulationMode;
  onModeToggle: () => void;
  onReset: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = React.memo(({ params, onParamChange, onInjectCurrent, mode, onModeToggle, onReset }) => {
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onParamChange({ [name]: parseFloat(value) });
  };

  return (
    <div className="bg-cyber-black/90 border-r border-cyber-panel p-6 w-full md:w-80 flex flex-col gap-8 h-full overflow-y-auto backdrop-blur-md relative">
      {/* Decorative vertical line */}
      <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-transparent via-cyber-neon to-transparent opacity-30"></div>

      <div className="border-b border-cyber-panel pb-6 relative">
        <h2 className="text-2xl font-display font-black text-cyber-neon tracking-wider italic">CONTROL_UNIT</h2>
        <p className="text-[10px] text-cyber-plasma font-mono mt-1 tracking-[0.2em] opacity-80">HODGKIN-HUXLEY SOLVER v4.2</p>
        
        {/* Corner Decor */}
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyber-neon"></div>
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyber-neon"></div>
      </div>

      {/* Mode Switcher & Reset */}
      <div className="flex flex-col gap-2">
         <label className="text-[10px] text-gray-500 font-display tracking-widest uppercase">System Control</label>
         <div className="flex gap-2">
             <button 
               type="button"
               onClick={onModeToggle}
               className={`relative flex-1 py-3 px-4 font-mono text-sm border transition-all duration-300 group overflow-hidden ${
                 mode === SimulationMode.CYBERNETIC 
                 ? 'border-cyber-plasma text-cyber-plasma shadow-[0_0_15px_rgba(188,19,254,0.2)]' 
                 : 'border-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-300'
               }`}
             >
               <div className={`absolute inset-0 opacity-10 ${mode === SimulationMode.CYBERNETIC ? 'bg-cyber-plasma' : 'bg-gray-700'}`}></div>
               <span className="relative z-10 flex items-center justify-center gap-2">
                  {mode === SimulationMode.CYBERNETIC ? '⚡ OVERDRIVE' : '🌱 STANDARD'}
               </span>
             </button>

             <button 
                type="button"
                onClick={onReset}
                className="relative w-14 border border-gray-800 bg-gray-900/50 text-gray-500 hover:border-cyber-danger hover:text-cyber-danger hover:shadow-[0_0_10px_rgba(255,0,60,0.2)] transition-all flex items-center justify-center group"
                title="HARD RESET"
             >
                 {/* Decorative background flash on hover */}
                <div className="absolute inset-0 bg-cyber-danger opacity-0 group-hover:opacity-10 transition-opacity"></div>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
             </button>
         </div>
      </div>

      {/* Current Injection */}
      <div className="flex flex-col gap-3 p-4 border border-cyber-panel bg-cyber-dark/50 relative">
         <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyber-danger to-transparent opacity-50"></div>
         
         <label className="text-[10px] text-cyber-danger font-display tracking-widest uppercase">External Stimulus</label>
         
         <button 
           type="button"
           onMouseDown={onInjectCurrent}
           className="relative group w-full py-4 font-bold text-white bg-black border border-cyber-danger hover:bg-cyber-danger/20 transition-all active:scale-[0.98] select-none clip-path-polygon"
           style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
         >
           <span className="relative z-10 flex items-center justify-center gap-3 font-display tracking-wider">
             <span className="w-2 h-2 bg-cyber-danger rounded-full animate-pulse shadow-[0_0_10px_#ff003c]"/>
             INJECT PULSE
           </span>
         </button>
         
         <div className="flex justify-between text-xs font-mono text-cyber-neon mt-2">
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
            className="w-full accent-cyber-neon"
         />
      </div>

      {/* Sliders */}
      <div className="space-y-6">
        <label className="text-[10px] text-gray-500 font-display tracking-widest uppercase border-b border-gray-800 block pb-2">
            Channel Conductance
        </label>
        
        <div className="group relative">
            <div className="flex justify-between text-xs mb-2 items-end">
                <span className="text-gray-400 font-sans tracking-wide">g_Na <span className="text-[10px] opacity-50 ml-1">(SODIUM)</span></span>
                <span className="font-mono text-cyber-neon bg-cyber-neon/10 px-2 py-0.5 border border-cyber-neon/30 text-[10px]">{params.g_Na.toFixed(1)}</span>
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
            <div className="h-[1px] w-full bg-cyber-panel mt-2 relative">
                <div className="absolute h-[1px] bg-cyber-neon transition-all" style={{ width: `${(params.g_Na / 500) * 100}%` }}></div>
            </div>
        </div>

        <div className="group relative">
            <div className="flex justify-between text-xs mb-2 items-end">
                <span className="text-gray-400 font-sans tracking-wide">g_K <span className="text-[10px] opacity-50 ml-1">(POTASSIUM)</span></span>
                <span className="font-mono text-cyber-plasma bg-cyber-plasma/10 px-2 py-0.5 border border-cyber-plasma/30 text-[10px]">{params.g_K.toFixed(1)}</span>
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
            <div className="h-[1px] w-full bg-cyber-panel mt-2 relative">
                <div className="absolute h-[1px] bg-cyber-plasma transition-all" style={{ width: `${(params.g_K / 200) * 100}%` }}></div>
            </div>
        </div>
        
        <div className="group relative">
            <div className="flex justify-between text-xs mb-2 items-end">
                <span className="text-gray-400 font-sans tracking-wide">g_L <span className="text-[10px] opacity-50 ml-1">(LEAK)</span></span>
                <span className="font-mono text-gray-300 bg-gray-800 px-2 py-0.5 border border-gray-700 text-[10px]">{params.g_L.toFixed(2)}</span>
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
            <div className="h-[1px] w-full bg-cyber-panel mt-2 relative">
                <div className="absolute h-[1px] bg-gray-500 transition-all" style={{ width: `${(params.g_L / 2) * 100}%` }}></div>
            </div>
        </div>
      </div>

      <div className="mt-auto pt-6 border-t border-cyber-panel text-[9px] text-gray-600 font-mono space-y-1">
        <p className="flex justify-between"><span>DT:</span> <span className="text-gray-500">0.05ms</span></p>
        <p className="flex justify-between"><span>INTEGRATOR:</span> <span className="text-gray-500">SEMI-IMPLICIT EULER</span></p>
        <p className="flex justify-between"><span>ENV:</span> <span className="text-gray-500">6.3°C (SQUID AXON)</span></p>
      </div>
    </div>
  );
});

export default ControlPanel;