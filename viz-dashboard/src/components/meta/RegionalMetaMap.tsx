'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";

// GeoJSON URL for the world map (Uses Numeric ISO codes in `id`)
const GEO_URL = "/data/world-110m.json";

interface RegionalData {
  [region: string]: {
    [archetype: string]: number;
  };
}

interface RegionalMetaMapProps {
  specificData: RegionalData;
  genericData: RegionalData;
  children?: React.ReactNode; 
}

const ARCHETYPE_COLORS: { [key: string]: string } = {
  "Beatdown": "#ef4444", // Red
  "Control": "#3b82f6",  // Blue
  "Cycle": "#22c55e",    // Green
  "Siege": "#eab308",    // Yellow
  "Bridge Spam": "#a855f7", // Purple
  "Air": "#06b6d4",      // Cyan
  "Spell Bait": "#ec4899", // Pink
  "Unknown": "#6b7280"   // Gray
};

const DEFAULT_COLOR = "#6b7280";

const TOP_SPECIFIC_DISPLAY_COUNT = 6;

// ISO-2 to Numeric ISO Mapping for Map Matching
// Source: https://github.com/lukes/ISO-3166-Countries-with-Regional-Codes/blob/master/all/all.json
const ISO2_TO_NUMERIC: { [key: string]: string } = {
  "US": "840", "CA": "124", "MX": "484", "BR": "076", "AR": "032", "CL": "152", "CO": "170", "PE": "604", "VE": "862",
  "DE": "276", "FR": "250", "GB": "826", "IT": "380", "ES": "724", "RU": "643", "NL": "528", "TR": "792", "PL": "616", "IR": "364", "SA": "682", "EG": "818", "MA": "504", "AZ": "031",
  "JP": "392", "KR": "410", "IN": "356", "ID": "360", "PH": "608", "TH": "764", "VN": "704", "MY": "458", "SG": "702", "TW": "158", "HK": "344", "AU": "036", "NZ": "554",
  "CN": "156", "IL": "376"
};

// Macro Region Mapping (ISO-2)
const REGION_MAPPING: { [key: string]: string } = {
  "US": "North America", "CA": "North America", "MX": "North America",
  "DE": "EMEA", "FR": "EMEA", "GB": "EMEA", "IT": "EMEA", "ES": "EMEA", "RU": "EMEA", "NL": "EMEA", "TR": "EMEA", "PL": "EMEA", "IR": "EMEA", "SA": "EMEA", "EG": "EMEA", "MA": "EMEA", "AZ": "EMEA", "IL": "EMEA",
  "BR": "LATAM", "AR": "LATAM", "CL": "LATAM", "CO": "LATAM", "PE": "LATAM", "VE": "LATAM",
  "JP": "Asia", "KR": "Asia", "IN": "Asia", "ID": "Asia", "PH": "Asia", "TH": "Asia", "VN": "Asia", "MY": "Asia", "SG": "Asia", "TW": "Asia", "HK": "Asia", "AU": "Asia", "NZ": "Asia",
  "CN": "China"
};

type ViewMode = 'global' | 'region' | 'country';

export default function RegionalMetaMap({ specificData, genericData, children }: RegionalMetaMapProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('global');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null); // ISO-2
  const [searchTerm, setSearchTerm] = useState('');
  const [dataType, setDataType] = useState<'generic' | 'specific'>('generic'); // Default to generic

  // 1. Aggregate Data based on View Mode
  const chartData = useMemo(() => {
    // Select correct dataset based on toggle
    const currentData = dataType === 'generic' ? genericData : specificData;
    if (!currentData) return [];

    let aggregated: { [key: string]: number } = {};

    if (viewMode === 'global') {
      Object.values(currentData).forEach(regionCounts => {
        Object.entries(regionCounts).forEach(([arch, count]) => {
          aggregated[arch] = (aggregated[arch] || 0) + count;
        });
      });
    } else if (viewMode === 'region') {
      if (selectedRegion) {
        Object.entries(currentData).forEach(([countryCode, counts]) => {
          const macro = REGION_MAPPING[countryCode] || "Rest of World";
          if (macro === selectedRegion) {
            Object.entries(counts).forEach(([arch, count]) => {
              aggregated[arch] = (aggregated[arch] || 0) + count;
            });
          }
        });
      }
    } else if (viewMode === 'country') {
      if (selectedCountry && currentData[selectedCountry]) {
        aggregated = currentData[selectedCountry];
      }
    }

    let sorted = Object.entries(aggregated)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
      
    // Specific Mode Logic: Top N + Others
    if (dataType === 'specific' && sorted.length > TOP_SPECIFIC_DISPLAY_COUNT + 1) {
        const topN = sorted.slice(0, TOP_SPECIFIC_DISPLAY_COUNT);
        const others = sorted.slice(TOP_SPECIFIC_DISPLAY_COUNT).reduce((acc, curr) => acc + curr.count, 0);
        sorted = [...topN, { name: 'Others', count: others }];
    }

    return sorted;
  }, [genericData, specificData, viewMode, selectedRegion, selectedCountry, dataType]);

  const totalGames = chartData.reduce((acc, curr) => acc + curr.count, 0);

  // Get list of available countries for dropdown
  const availableCountries = useMemo(() => {
    return Object.keys(specificData).sort();
  }, [specificData]);

  const filteredCountries = availableCountries.filter(c => 
    c.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getBarColor = (name: string) => {
    // 1. Direct match (Generic)
    if (ARCHETYPE_COLORS[name]) return ARCHETYPE_COLORS[name];

    // 2. Keyword match (Specific contains Generic)
    for (const key of Object.keys(ARCHETYPE_COLORS)) {
        if (name.includes(key)) return ARCHETYPE_COLORS[key];
    }

    // 3. Specific Overrides (Common Meta Decks)
    if (name.includes("Golem") || name.includes("Giant") || name.includes("Lava") || name.includes("Electro")) return ARCHETYPE_COLORS["Beatdown"];
    if (name.includes("Hog") || name.includes("Miner") || name.includes("Drill") || name.includes("Barrel")) return ARCHETYPE_COLORS["Cycle"]; // Often Cycle
    if (name.includes("Pekka") || name.includes("Mega Knight") || name.includes("Ram")) return ARCHETYPE_COLORS["Bridge Spam"]; 
    if (name.includes("X-Bow") || name.includes("Mortar")) return ARCHETYPE_COLORS["Siege"];
    if (name.includes("Log Bait") || name.includes("Fireball Bait")) return ARCHETYPE_COLORS["Spell Bait"];
    if (name.includes("SplashYard")) return ARCHETYPE_COLORS["Control"];

    return DEFAULT_COLOR;
  };

  return (
    <div className="w-full bg-[#0a0a0a] rounded-xl border border-[#262626] p-6 flex flex-col gap-8">
      
      {/* Top Row: Description (Left) + Map (Right) */}
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left: Description & Header */}
        <div className="w-full lg:w-1/3 flex flex-col justify-center">
          {children}
        </div>

        {/* Right: Map */}
        <div className="w-full lg:w-2/3 bg-[#171717] rounded-lg border border-[#333] overflow-hidden relative h-[300px]">
             <ComposableMap projectionConfig={{ scale: 200, center: [0, 0] }} className="w-full h-full">
               <ZoomableGroup zoom={1}>
                 <Geographies geography={GEO_URL}>
                   {({ geographies }) =>
                     geographies.map((geo) => {
                       // Map uses Numeric ISO (id), Data uses ISO-2
                       const isoNumeric = String(geo.id); 
                       // Find matching ISO-2 from our data (Use Specific Data for map coverage)
                       const iso2 = Object.keys(specificData).find(key => ISO2_TO_NUMERIC[key] === isoNumeric);
                       
                       const hasData = !!iso2;
                       const isSelected = selectedCountry === iso2;
                       
                       // Determine if country is in selected region
                       let isInRegion = false;
                       if (viewMode === 'region' && iso2) {
                         if (selectedRegion === "Rest of World") {
                           // If Rest of World is selected, highlight countries NOT in mapping
                           isInRegion = !REGION_MAPPING[iso2];
                         } else {
                           isInRegion = REGION_MAPPING[iso2] === selectedRegion;
                         }
                       }

                       let fill = "#262626";
                       if (viewMode === 'global') {
                          if (hasData) fill = "#3b82f6"; // Highlight all with data in global mode
                          else fill = "#262626";
                       } else if (viewMode === 'country') {
                         if (isSelected) fill = "#3b82f6";
                         else if (hasData) fill = "#404040";
                       } else if (viewMode === 'region') {
                         if (isInRegion) fill = "#3b82f6";
                         else if (hasData) fill = "#404040";
                       }

                       return (
                         <Geography
                           key={geo.rsmKey}
                           geography={geo}
                           fill={fill}
                           stroke="#171717"
                           strokeWidth={0.5}
                           style={{
                             default: { outline: "none" },
                             hover: { fill: hasData ? "#60a5fa" : "#333", outline: "none", cursor: hasData ? "pointer" : "default" },
                             pressed: { outline: "none" },
                           }}
                           onClick={() => {
                             if (viewMode === 'country' && hasData && iso2) {
                               setSelectedCountry(iso2);
                             }
                           }}
                         />
                       );
                     })
                   }
                 </Geographies>
               </ZoomableGroup>
             </ComposableMap>
           
           <div className="absolute bottom-4 left-4 bg-black/80 p-2 rounded text-xs text-gray-400 pointer-events-none">
              {viewMode === 'country' && "Click a highlighted country to select"}
              {viewMode === 'region' && "Countries in selected region highlighted"}
              {viewMode === 'global' && "All countries with data highlighted"}
           </div>
        </div>
      </div>

      {/* Middle Row: Controls */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-[#171717] p-2 rounded-lg border border-[#333]">
         {/* Data Type Toggle */}
         <div className="flex bg-[#262626] rounded-lg p-1">
            <button
               onClick={() => setDataType('generic')}
               className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${
                 dataType === 'generic' 
                   ? 'bg-blue-600 text-white shadow-lg' 
                   : 'text-gray-400 hover:text-white'
               }`}
             >
               Generic
             </button>
             <button
               onClick={() => setDataType('specific')}
               className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${
                 dataType === 'specific' 
                   ? 'bg-blue-600 text-white shadow-lg' 
                   : 'text-gray-400 hover:text-white'
               }`}
             >
               Specific
             </button>
         </div>
         
         <div className="h-6 w-px bg-[#333]" />

        {/* View Mode Selector */}
        <div className="flex bg-[#262626] rounded-lg p-1">
          {(['global', 'region', 'country'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => {
                setViewMode(mode);
                if (mode === 'region' && !selectedRegion) setSelectedRegion('North America');
                if (mode === 'country' && !selectedCountry) {
                  // Default to US if available, otherwise first available
                  setSelectedCountry(availableCountries.includes('US') ? 'US' : availableCountries[0]);
                }
              }}
              className={`px-4 py-1.5 rounded-md text-sm font-bold capitalize transition-all ${
                viewMode === mode 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Sub-Controls */}
        <div className="flex-1 w-full md:w-auto flex items-center gap-4">
          {viewMode === 'region' && (
            <div className="flex gap-2 overflow-x-auto pb-2 w-full no-scrollbar">
              {["North America", "EMEA", "LATAM", "Asia", "China", "Rest of World"].map(r => (
                <button
                  key={r}
                  onClick={() => setSelectedRegion(r)}
                  className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap border transition-colors ${
                    selectedRegion === r
                      ? 'bg-white text-black border-white'
                      : 'bg-transparent text-gray-400 border-[#333] hover:border-gray-500'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}

          {viewMode === 'country' && (
            <div className="relative w-full max-w-xs z-20">
              <input 
                  type="text" 
                  placeholder="Search country..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#262626] border border-[#333] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
              {searchTerm && (
                <div className="absolute top-full left-0 w-full bg-[#171717] border border-[#333] rounded-lg mt-1 max-h-48 overflow-y-auto shadow-xl z-50">
                  {filteredCountries.map(c => (
                    <button
                      key={c}
                      onClick={() => {
                        setSelectedCountry(c);
                        setSearchTerm('');
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#262626] hover:text-white"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Current Selection Label */}
          <div className="ml-auto text-sm text-gray-400 font-medium px-4 border-l border-[#333]">
             Viewing: <span className="text-white">
               {viewMode === 'global' ? 'Global' : viewMode === 'region' ? selectedRegion : selectedCountry}
             </span>
          </div>
        </div>
      </div>

      {/* Bottom Row: Chart & Insights */}
      <div className="flex flex-col lg:flex-row gap-8 h-[300px]">
         {/* Left: Bar Chart */}
         <div className="w-full lg:w-2/3 flex flex-col">
           <div className="flex-1">
             {chartData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                   <XAxis 
                      dataKey="name" 
                      stroke="#fff" 
                      tick={({ x, y, payload }) => {
                        const words = payload.value.split(' ');
                        const lineHeight = 12;
                        return (
                          <g transform={`translate(${x},${y})`}>
                            {words.map((word: string, i: number) => (
                              <text 
                                key={i}
                                x={0}
                                y={0}
                                dy={16 + i * lineHeight}
                                textAnchor="middle"
                                fill="#9ca3af"
                                fontSize={10}
                                fontWeight="bold"
                              >
                                {word}
                              </text>
                            ))}
                          </g>
                        );
                      }}
                      interval={0}
                      height={60}
                   />
                   <YAxis hide />
                   <Tooltip 
                     contentStyle={{ backgroundColor: '#171717', border: '1px solid #333' }}
                     cursor={{ fill: '#333', opacity: 0.4 }}
                   />
                   <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                     {chartData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={getBarColor(entry?.name || 'Unknown')} />
                     ))}
                   </Bar>
                 </BarChart>
               </ResponsiveContainer>
             ) : (
               <div className="h-full flex items-center justify-center text-gray-500">
                 No data for selection
               </div>
             )}
           </div>
         </div>
         
         {/* Right: Insights Panel */}
         <div className="w-full lg:w-1/3 bg-[#171717] rounded-lg border border-[#333] p-6 flex flex-col justify-center gap-4">
            <div>
              <h4 className="text-gray-400 text-xs uppercase font-bold mb-1">Top Archetype</h4>
              <div className="text-2xl font-bold text-white mb-2">{chartData[0]?.name || 'N/A'}</div>
              <div className="w-full bg-[#262626] rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full" 
                  style={{ 
                    width: `${chartData.length > 0 ? (chartData[0].count / totalGames) * 100 : 0}%`,
                    backgroundColor: chartData.length > 0 && chartData[0] ? getBarColor(chartData[0].name) : DEFAULT_COLOR
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {chartData.length > 0 ? Math.round((chartData[0].count / totalGames) * 100) : 0}% Dominance
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#333]">
              <div>
                <h4 className="text-gray-400 text-xs uppercase font-bold mb-1">Total Decks</h4>
                <div className="text-xl font-bold text-white">{totalGames}</div>
              </div>
              <div>
                <h4 className="text-gray-400 text-xs uppercase font-bold mb-1">Variety</h4>
                <div className="text-xl font-bold text-white">{chartData.length} <span className="text-xs font-normal text-gray-500">types</span></div>
              </div>
            </div>
         </div>
      </div>
    </div>
  );
}
