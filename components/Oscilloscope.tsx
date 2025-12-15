import React from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { HHState } from '../types';

interface OscilloscopeProps {
  data: HHState[];
}

const Oscilloscope: React.FC<OscilloscopeProps> = React.memo(({ data }) => {
  return (
    <div className="w-full h-full relative group flex flex-col">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-tech-grid opacity-20 pointer-events-none"></div>

        <div className="flex justify-between items-center mb-2 shrink-0">
            <h3 className="text-cyber-neon/80 text-[10px] font-display font-bold uppercase tracking-widest flex items-center gap-2">
                <span className="w-1 h-3 bg-cyber-neon"></span>
                VOLTAGE_TRACE [V_m]
            </h3>
            <span className="text-[9px] font-mono text-cyber-danger animate-pulse border border-cyber-danger/50 px-1">LIVE FEED</span>
        </div>
        
      <div className="flex-1 min-h-0 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="#1a1a2e" strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="t" 
              hide={true} 
              type="number"
              domain={['dataMin', 'dataMax']}
            />
            <YAxis 
              domain={[-90, 60]} 
              hide={false} 
              axisLine={false}
              tickLine={false}
              stroke="#444" 
              tick={{fontSize: 9, fontFamily: 'Share Tech Mono', fill: '#555'}}
              width={30}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#050505', border: '1px solid #11111f', color: '#fff' }}
              itemStyle={{ color: '#00f3ff', fontFamily: 'Share Tech Mono' }}
              labelStyle={{ display: 'none' }}
            />
            <Line 
              type="monotone" 
              dataKey="V" 
              stroke="#00f3ff" 
              strokeWidth={2} 
              dot={false} 
              isAnimationActive={false} 
            />
            {/* Threshold Line */}
            <Line type="linear" dataKey={() => -55} stroke="#333" strokeDasharray="2 4" strokeWidth={1} dot={false} isAnimationActive={false}/>
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Corner Brackets */}
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-cyber-neon/30"></div>
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-cyber-neon/30"></div>
    </div>
  );
});

export default Oscilloscope;