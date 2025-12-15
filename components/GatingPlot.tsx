import React from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { HHState } from '../types';

interface GatingPlotProps {
  data: HHState[];
}

const GatingPlot: React.FC<GatingPlotProps> = React.memo(({ data }) => {
  return (
    <div className="w-full h-full relative group flex flex-col">
        <div className="absolute inset-0 bg-tech-grid opacity-20 pointer-events-none"></div>

        <h3 className="text-cyber-plasma/80 text-[10px] font-display font-bold uppercase tracking-widest flex items-center gap-2 mb-2 shrink-0">
            <span className="w-1 h-3 bg-cyber-plasma"></span>
            CHANNEL_DYNAMICS
        </h3>

      <div className="flex-1 min-h-0 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="#1a1a2e" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="t" hide={true} type="number" domain={['dataMin', 'dataMax']} />
            <YAxis domain={[0, 1]} hide={false} axisLine={false} tickLine={false} stroke="#444" tick={{fontSize: 9, fontFamily: 'Share Tech Mono', fill: '#555'}} width={30}/>
            <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'Share Tech Mono', opacity: 0.8 }} iconType="rect" />
            
            <Line type="monotone" dataKey="m" stroke="#ff003c" strokeWidth={1.5} dot={false} isAnimationActive={false} name="m (Na act)" />
            <Line type="monotone" dataKey="h" stroke="#00ff00" strokeWidth={1.5} dot={false} isAnimationActive={false} name="h (Na inact)" />
            <Line type="monotone" dataKey="n" stroke="#bc13fe" strokeWidth={1.5} dot={false} isAnimationActive={false} name="n (K act)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Corner Brackets */}
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-cyber-plasma/30"></div>
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-cyber-plasma/30"></div>
    </div>
  );
});

export default GatingPlot;