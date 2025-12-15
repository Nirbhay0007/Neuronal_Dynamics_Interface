import React from 'react';
import { LineChart, Line, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { HHState } from '../types';

interface OscilloscopeProps {
  data: HHState[];
}

const Oscilloscope: React.FC<OscilloscopeProps> = React.memo(({ data }) => {
  return (
    <div className="w-full h-full relative flex flex-col p-6 border-b border-white/5 bg-cyber-panel/20">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 shrink-0 border-l-2 border-cyber-neon pl-3">
             <h3 className="text-cyber-neon text-[10px] font-sans font-bold uppercase tracking-[0.2em]">
                Membrane Potential (Vm)
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
              domain={[-90, 60]} 
              hide={false} 
              axisLine={false}
              tickLine={false}
              stroke="#565869" 
              tick={{fontSize: 9, fontFamily: 'Share Tech Mono', fill: '#565869'}}
              width={25}
              interval="preserveStartEnd"
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#05060a', border: '1px solid #1f2233', color: '#fff', fontSize: '10px' }}
              itemStyle={{ color: '#00f0ff', fontFamily: 'Share Tech Mono' }}
              labelStyle={{ display: 'none' }}
              cursor={{ stroke: '#565869', strokeDasharray: '4 4' }}
              isAnimationActive={false}
            />
            <Line 
              type="monotone" 
              dataKey="V" 
              stroke="#00f0ff" 
              strokeWidth={2} 
              dot={false} 
              isAnimationActive={false} 
            />
            {/* Threshold Line */}
            <Line type="linear" dataKey={() => -55} stroke="#565869" strokeDasharray="2 2" strokeWidth={1} dot={false} isAnimationActive={false}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export default Oscilloscope;