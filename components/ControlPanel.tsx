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
    <div className="w-full h-full bg-cyber-black/90 backdrop-blur-xl border-r border-white/10 flex flex-col relative z-20">
      
      {/* Header */}
      <div className="p-8 pb-4 border-b border-white/5">
        <h2 className="text-2xl font-display font-black italic tracking-widest text-white uppercase transform -skew-x-12 origin-left">
          Control_Unit
        </h2>
        <p className="text-[10px] font-mono text-cyber-plasma mt-1 tracking-[0.3em] uppercase opacity-80 pl-1">
          HH-Model Solver v4.2
        </p>
      </div>

      <div className="p-8 space-y-10 overflow-y-auto flex-1 custom-scrollbar">
        
        {/* System Override */}
        <div className="space-y-3">
           <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 bg-cyber-muted rounded-full"></div>
              <span className="text-[10px] text-cyber-muted font-bold tracking-[0.2em] uppercase">System Override</span>
           </div>
           <button 
              type="button"
              onClick={onReset}
              className="w-full py-4 border border-white/10 bg-white/[0.02] text-cyber-muted hover:border-cyber-danger hover:text-cyber-danger hover:bg-cyber-danger/5 transition-all duration-300 font-mono text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 group"
           >
              <span className="w-1 h-1 bg-current opacity-50 group-hover:animate-ping"></span>
              Initialize Reset
           </button>
        </div>

        {/* Stimulus Control */}
        <div className="space-y-2">
           <div className="flex justify-between items-end border-l-2 border-cyber-danger pl-3 py-1">
             <label className="text-[11px] text-white font-bold tracking-[0.15em] uppercase">Stimulus</label>
             <div className="w-2 h-2 bg-cyber-danger rounded-full animate-pulse"></div>
           </div>
           
           <div className="bg-cyber-danger/5 border border-cyber-danger/20 p-4 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-1">
                <svg width="10" height="10" viewBox="0 0 10 10" className="opacity-50">
                    <path d="M0 0 L10 0 L10 10" fill="none" stroke="currentColor" className="text-cyber-danger"/>
                </svg>
             </div>

             <button 
               type="button"
               onMouseDown={onInjectCurrent}
               className="w-full py-4 bg-cyber-danger text-black font-display font-black tracking-widest text-sm uppercase hover:bg-white transition-colors duration-100 mb-4 clip-path-button shadow-[0_0_20px_rgba(255,42,42,0.4)] hover:shadow-[0_0_30px_rgba(255,255,255,0.6)] active:scale-[0.98]"
               style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
             >
               Inject Pulse
             </button>

             <div className="flex items-center justify-between gap-4">
                <span className="text-[9px] font-mono text-cyber-danger/70 uppercase">Current (µA)</span>
                <div className="flex items-center gap-3 flex-1">
                    <input 
                        type="range" 
                        name="I_ext" 
                        min="-10" 
                        max="50" 
                        step="1" 
                        value={params.I_ext} 
                        onChange={handleChange}
                        className="flex-1 h-1 bg-cyber-danger/30 rounded-full appearance-none [&::-webkit-slider-thumb]:bg-cyber-danger [&::-webkit-slider-thumb]:shadow-[0_0_10px_#ff2a2a]"
                    />
                    <span className="font-mono text-cyber-danger text-xs w-8 text-right">{params.I_ext.toFixed(0)}</span>
                </div>
             </div>
           </div>
        </div>

        {/* Conductance Parameters */}
        <div className="space-y-6">
            <div className="border-b border-white/5 pb-2 mb-6">
                <label className="text-[10px] text-cyber-muted font-bold tracking-[0.2em] uppercase">
                    Conductance Parameters
                </label>
            </div>
            
            {/* Sodium */}
            <div className="group">
                <div className="flex justify-between mb-2 items-center">
                    <div className="flex items-baseline gap-2">
                        <span className="text-sm font-bold text-white">Na+</span>
                        <span className="text-[9px] text-cyber-neon tracking-widest uppercase opacity-70">Sodium</span>
                    </div>
                    <div className="bg-cyber-neon/10 border border-cyber-neon/20 px-2 py-1 min-w-[3.5rem] text-right">
                        <span className="font-mono text-cyber-neon text-xs">{params.g_Na.toFixed(1)}</span>
                    </div>
                </div>
                <input 
                    type="range" 
                    name="g_Na" 
                    min="0" 
                    max="500" 
                    value={params.g_Na} 
                    onChange={handleChange}
                    className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:bg-cyber-neon [&::-webkit-slider-thumb]:shadow-[0_0_10px_#00f0ff]"
                />
            </div>

            {/* Potassium */}
            <div className="group">
                <div className="flex justify-between mb-2 items-center">
                    <div className="flex items-baseline gap-2">
                        <span className="text-sm font-bold text-white">K+</span>
                        <span className="text-[9px] text-cyber-plasma tracking-widest uppercase opacity-70">Potassium</span>
                    </div>
                    <div className="bg-cyber-plasma/10 border border-cyber-plasma/20 px-2 py-1 min-w-[3.5rem] text-right">
                        <span className="font-mono text-cyber-plasma text-xs">{params.g_K.toFixed(1)}</span>
                    </div>
                </div>
                <input 
                    type="range" 
                    name="g_K" 
                    min="0" 
                    max="200" 
                    value={params.g_K} 
                    onChange={handleChange}
                    className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:bg-cyber-plasma [&::-webkit-slider-thumb]:shadow-[0_0_10px_#9d00ff]"
                />
            </div>
            
            {/* Leak */}
            <div className="group">
                <div className="flex justify-between mb-2 items-center">
                    <div className="flex items-baseline gap-2">
                        <span className="text-sm font-bold text-cyber-muted">L</span>
                        <span className="text-[9px] text-cyber-muted tracking-widest uppercase opacity-70">Leak</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 px-2 py-1 min-w-[3.5rem] text-right">
                        <span className="font-mono text-cyber-muted text-xs">{params.g_L.toFixed(2)}</span>
                    </div>
                </div>
                <input 
                    type="range" 
                    name="g_L" 
                    min="0" 
                    max="2" 
                    step="0.01"
                    value={params.g_L} 
                    onChange={handleChange}
                    className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:bg-cyber-muted"
                />
            </div>
        </div>
      </div>
      
      {/* Footer Details */}
      <div className="p-6 border-t border-white/5 bg-black/20 text-[9px] text-cyber-muted font-mono space-y-1">
         <div className="flex justify-between">
            <span>MEMBRANE_CAP</span>
            <span className="text-white/50">{params.Cm.toFixed(1)} µF/cm²</span>
         </div>
         <div className="flex justify-between">
            <span>TEMP_K</span>
            <span className="text-white/50">279.45 K</span>
         </div>
      </div>
    </div>
  );
});

export default ControlPanel;