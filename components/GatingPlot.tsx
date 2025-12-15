import React from 'react';
import { LineChart, Line, YAxis, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { HHState } from '../types';

interface GatingPlotProps {
  data: HHState[];
}

const GatingPlot: React.FC<GatingPlotProps> = React.memo(({ data }) => {
  return (
    <div className="w-full h-full relative flex flex-col p-6 bg-cyber-panel/20">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 shrink-0 border-l-2 border-cyber-plasma pl-3">
             <h3 className="text-cyber-plasma text-[10px] font-sans font-bold uppercase tracking-[0.2em]">
                Gating Variables
            </h3>
        </div>

      <div className="flex-1 min-h-0 w-full relative">
         {/* Decorative Brackets */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20"></div>
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/20"></div>
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/20"></div>
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20"></div>

        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="#1f2233" strokeDasharray="3 3" vertical={false} opacity={0.3} />
            <YAxis 
                domain={[0, 1]} 
                hide={false} 
                axisLine={false} 
                tickLine={false} 
                stroke="#565869" 
                tick={{fontSize: 9, fontFamily: 'Share Tech Mono', fill: '#565869'}} 
                width={25}
                interval="preserveStartEnd"
            />
            <Legend 
                wrapperStyle={{ fontSize: '10px', fontFamily: 'Share Tech Mono', opacity: 0.8, paddingTop: '15px' }} 
                iconType="rect" 
                iconSize={8}
            />
            
            <Line type="monotone" dataKey="m" stroke="#ff2a2a" strokeWidth={1.5} dot={false} isAnimationActive={false} name="m (Na act)" />
            <Line type="monotone" dataKey="h" stroke="#00ff9d" strokeWidth={1.5} dot={false} isAnimationActive={false} name="h (Na inact)" />
            <Line type="monotone" dataKey="n" stroke="#9d00ff" strokeWidth={1.5} dot={false} isAnimationActive={false} name="n (K act)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export default GatingPlot;