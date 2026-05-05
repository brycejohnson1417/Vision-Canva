import React from 'react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  Radar as RechartsRadar, Tooltip
} from 'recharts';
import { DiagramData, DiagramType, BMCData, PyramidLevel, VennCircle, RadarPoint, FlowStep, SwotData } from '../types';
import { Move, GripHorizontal, Trash2 } from 'lucide-react';

interface DiagramProps {
  data: DiagramData;
  onDelete?: (id: string) => void;
}

// --- Wrapper Component ---
export const DiagramCard: React.FC<{ 
  children: React.ReactNode; 
  title: string; 
  description?: string; 
  type: string;
  onDelete?: () => void;
}> = ({ children, title, description, type, onDelete }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 w-[550px] h-[450px] flex flex-col overflow-hidden transition-shadow hover:shadow-2xl group">
      <div className="bg-slate-50 border-b border-slate-100 p-3 flex justify-between items-center cursor-move handle select-none">
        <div className="flex items-center gap-2">
          <GripHorizontal className="text-slate-400 w-5 h-5" />
          <div>
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">{type}</h3>
            <h2 className="text-lg font-semibold text-slate-900 leading-tight">{title}</h2>
          </div>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}
          className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors opacity-0 group-hover:opacity-100"
          title="Delete Diagram"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div className="flex-1 p-4 overflow-auto relative bg-white">
        {description && <p className="text-xs text-slate-500 mb-4 italic">{description}</p>}
        <div className="h-full w-full font-sans text-sm">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- 1. Business Model Canvas ---
const BMCSection: React.FC<{ title: string; items: string[]; icon?: string }> = ({ title, items }) => (
  <div className="border border-slate-200 p-2 rounded bg-slate-50/50 h-full overflow-y-auto">
    <h4 className="font-bold text-[10px] text-slate-500 uppercase mb-1">{title}</h4>
    <ul className="list-disc pl-3 space-y-1">
      {(items || []).slice(0, 5).map((item, i) => (
        <li key={i} className="text-[11px] leading-tight text-slate-700">{item}</li>
      ))}
    </ul>
  </div>
);

export const BusinessModelCanvasRenderer: React.FC<DiagramProps> = ({ data, onDelete }) => {
  const d = data.data as BMCData;
  return (
    <DiagramCard title={data.title} description={data.description} type="Business Model Canvas" onDelete={() => onDelete?.(data.id)}>
      <div className="grid grid-cols-5 grid-rows-3 gap-1 h-full">
        {/* Row 1: Key Partners (tall), Key Activities, Value Prop (tall), Customer Rel, Segments (tall) */}
        <div className="row-span-3"><BMCSection title="Key Partners" items={d.key_partners} /></div>
        <div className="col-span-1 row-span-1"><BMCSection title="Key Activities" items={d.key_activities} /></div>
        <div className="col-span-1 row-span-3"><BMCSection title="Value Propositions" items={d.value_propositions} /></div>
        <div className="col-span-1 row-span-1"><BMCSection title="Customer Relationships" items={d.customer_relationships} /></div>
        <div className="col-span-1 row-span-3"><BMCSection title="Customer Segments" items={d.customer_segments} /></div>

        {/* Row 2 (middle slots) */}
        <div className="col-span-1 row-span-2"><BMCSection title="Key Resources" items={d.key_resources} /></div>
        <div className="col-span-1 row-span-2"><BMCSection title="Channels" items={d.channels} /></div>

        {/* Row 3 (Bottom bar) - Actually, standard BMC puts cost/revenue at bottom spanning half each */}
      </div>
       <div className="grid grid-cols-2 gap-1 mt-1 h-1/4">
          <BMCSection title="Cost Structure" items={d.cost_structure} />
          <BMCSection title="Revenue Streams" items={d.revenue_streams} />
      </div>
    </DiagramCard>
  );
};


// --- 2. Pyramid ---
export const PyramidRenderer: React.FC<DiagramProps> = ({ data, onDelete }) => {
  const levels = (data.data.levels as PyramidLevel[]) || [];
  return (
    <DiagramCard title={data.title} description={data.description} type="Strategic Pyramid" onDelete={() => onDelete?.(data.id)}>
      <div className="flex flex-col-reverse justify-center items-center h-full gap-1">
        {levels.map((level, i) => {
          // Calculate width based on position (bottom is widest)
          const widthPercent = 100 - (i * (100 / levels.length) * 0.8); 
          return (
            <div 
              key={i} 
              className="bg-indigo-50 border border-indigo-200 text-center p-2 rounded-sm shadow-sm transition-all hover:bg-indigo-100"
              style={{ width: `${widthPercent}%` }}
            >
              <div className="font-bold text-indigo-900 text-sm">{level.label}</div>
              <div className="text-xs text-indigo-700">{level.description}</div>
            </div>
          );
        })}
      </div>
    </DiagramCard>
  );
};

// --- 3. Venn Diagram ---
export const VennRenderer: React.FC<DiagramProps> = ({ data, onDelete }) => {
  const circles = (data.data.circles as VennCircle[]) || [];
  
  return (
    <DiagramCard title={data.title} description={data.description} type="Venn Diagram" onDelete={() => onDelete?.(data.id)}>
      <div className="relative w-full h-full flex items-center justify-center">
        {circles.map((circle, i) => {
           // Simple positioning for 2 or 3 circles
           let posClass = "";
           if (circles.length === 2) {
             posClass = i === 0 ? "-translate-x-1/4" : "translate-x-1/4";
           } else {
             if (i === 0) posClass = "-translate-y-1/4";
             if (i === 1) posClass = "translate-y-1/4 -translate-x-1/4";
             if (i === 2) posClass = "translate-y-1/4 translate-x-1/4";
           }

           const colors = ["bg-rose-400/30 border-rose-500", "bg-sky-400/30 border-sky-500", "bg-emerald-400/30 border-emerald-500"];

           return (
             <div 
              key={i}
              className={`absolute w-48 h-48 rounded-full border-2 flex flex-col items-center justify-center text-center p-4 backdrop-blur-[1px] ${colors[i % 3]} ${posClass}`}
             >
               <h4 className="font-bold text-slate-800 mb-1">{circle.label}</h4>
               <ul className="text-[10px] text-slate-700 leading-tight">
                 {(circle.items || []).slice(0, 3).map((item, idx) => <li key={idx}>• {item}</li>)}
               </ul>
             </div>
           )
        })}
      </div>
    </DiagramCard>
  );
};

// --- 4. Radar Chart ---
export const RadarRenderer: React.FC<DiagramProps> = ({ data, onDelete }) => {
  const points = (data.data.axes as RadarPoint[]) || [];
  
  return (
    <DiagramCard title={data.title} description={data.description} type="Analysis Radar" onDelete={() => onDelete?.(data.id)}>
      <div className="w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={points}>
            <PolarGrid />
            <PolarAngleAxis dataKey="axis" tick={{ fill: '#64748b', fontSize: 10 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
            <RechartsRadar
              name={data.title}
              dataKey="value"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.6}
            />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </DiagramCard>
  );
};

// --- 5. Flowchart ---
export const FlowRenderer: React.FC<DiagramProps> = ({ data, onDelete }) => {
  const steps = (data.data.steps as FlowStep[]) || [];

  return (
    <DiagramCard title={data.title} description={data.description} type="Flow Process" onDelete={() => onDelete?.(data.id)}>
      <div className="flex flex-col items-center justify-start h-full gap-4 pt-4 overflow-y-auto">
        {steps.map((step, i) => (
          <React.Fragment key={i}>
            <div className="bg-white border-2 border-slate-800 rounded-lg p-3 w-4/5 shadow-[4px_4px_0px_0px_rgba(30,41,59,1)] flex flex-col items-center text-center">
              <span className="font-bold text-slate-900">{step.label}</span>
              {step.subtext && <span className="text-xs text-slate-500 mt-1">{step.subtext}</span>}
            </div>
            {i < steps.length - 1 && (
               <div className="w-0.5 h-6 bg-slate-300"></div>
            )}
          </React.Fragment>
        ))}
      </div>
    </DiagramCard>
  );
};

// --- 6. SWOT ---
export const SwotRenderer: React.FC<DiagramProps> = ({ data, onDelete }) => {
  const d = data.data as SwotData;
  return (
    <DiagramCard title={data.title} description={data.description} type="SWOT Analysis" onDelete={() => onDelete?.(data.id)}>
      <div className="grid grid-cols-2 grid-rows-2 h-full gap-2">
        <div className="bg-emerald-50 p-2 rounded border border-emerald-100">
          <h4 className="font-bold text-emerald-800 mb-2 uppercase text-xs">Strengths</h4>
          <ul className="text-xs space-y-1 text-emerald-900">
             {d.strengths?.map((s, i) => <li key={i}>• {s}</li>)}
          </ul>
        </div>
        <div className="bg-orange-50 p-2 rounded border border-orange-100">
           <h4 className="font-bold text-orange-800 mb-2 uppercase text-xs">Weaknesses</h4>
           <ul className="text-xs space-y-1 text-orange-900">
             {d.weaknesses?.map((s, i) => <li key={i}>• {s}</li>)}
          </ul>
        </div>
        <div className="bg-sky-50 p-2 rounded border border-sky-100">
           <h4 className="font-bold text-sky-800 mb-2 uppercase text-xs">Opportunities</h4>
           <ul className="text-xs space-y-1 text-sky-900">
             {d.opportunities?.map((s, i) => <li key={i}>• {s}</li>)}
          </ul>
        </div>
        <div className="bg-rose-50 p-2 rounded border border-rose-100">
           <h4 className="font-bold text-rose-800 mb-2 uppercase text-xs">Threats</h4>
           <ul className="text-xs space-y-1 text-rose-900">
             {d.threats?.map((s, i) => <li key={i}>• {s}</li>)}
          </ul>
        </div>
      </div>
    </DiagramCard>
  )
}

export const DiagramRenderer: React.FC<{ diagram: DiagramData; onDelete?: (id: string) => void }> = ({ diagram, onDelete }) => {
  switch (diagram.type) {
    case DiagramType.BMC: return <BusinessModelCanvasRenderer data={diagram} onDelete={onDelete} />;
    case DiagramType.PYRAMID: return <PyramidRenderer data={diagram} onDelete={onDelete} />;
    case DiagramType.VENN: return <VennRenderer data={diagram} onDelete={onDelete} />;
    case DiagramType.RADAR: return <RadarRenderer data={diagram} onDelete={onDelete} />;
    case DiagramType.FLOW: return <FlowRenderer data={diagram} onDelete={onDelete} />;
    case DiagramType.SWOT: return <SwotRenderer data={diagram} onDelete={onDelete} />;
    default: return (
      <DiagramCard title={diagram.title} type="Unknown" onDelete={() => onDelete?.(diagram.id)}>
        <div className="p-4 text-slate-400">Model type not supported yet.</div>
      </DiagramCard>
    );
  }
};