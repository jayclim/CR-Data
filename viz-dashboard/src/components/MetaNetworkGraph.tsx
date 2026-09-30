'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';

// ==========================================
// GRAPH CONFIGURATION
// ==========================================
const CONFIG = {
  // Physics Simulation Settings
  PHYSICS: {
    LINK_DISTANCE: 100,      // Ideal distance between connected nodes
    LINK_STRENGTH: 0.5,      // How strictly to pull nodes together (0-1)
    CHARGE_STRENGTH: -200,   // Repulsion force (negative = push apart)
    COLLISION_RADIUS: 30,    // Minimum distance between node centers
    COLLISION_STRENGTH: 0.7, // Rigidity of collision (0-1)
  },
  // Visual Appearance
  VISUALS: {
    NODE_WIDTH: 45,          // Width of card image
    NODE_HEIGHT: 60,         // Height of card image
    LINK_WIDTH: 5,           // Normal connection thickness
    LINK_WIDTH_HOVER: 6,     // Hovered connection thickness
    LINK_OPACITY: 0.6,       // Transparency of lines
    TEXT_OFFSET_Y: 40,       // Label distance from center
    FONT_SIZE: "10px",       // Label font size
  },
  // Interaction
  ZOOM: {
    MIN: 0.1,
    MAX: 4,
  }
};

interface Card {
  name: string;
  icon: string;
}

interface Synergy {
  cards: Card[];
  count: number;
  synergy_rate: number;
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  icon: string;
  val: number; // Usage count
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  value: number; // Synergy strength
}

export default function MetaNetworkGraph({ synergies }: { synergies: Synergy[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Handle Resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };

    window.addEventListener('resize', updateDimensions);
    updateDimensions();
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Transform Data
  const data = useMemo(() => {
    const nodesMap = new Map<string, GraphNode>();
    const links: GraphLink[] = [];

    synergies.forEach(syn => {
      const [c1, c2] = syn.cards || [];
      
      if (!c1 || !c2) return;
      
      if (!nodesMap.has(c1.name)) {
        nodesMap.set(c1.name, { id: c1.name, name: c1.name, icon: c1.icon, val: 1 });
      } else {
        nodesMap.get(c1.name)!.val += 1;
      }

      if (!nodesMap.has(c2.name)) {
        nodesMap.set(c2.name, { id: c2.name, name: c2.name, icon: c2.icon, val: 1 });
      } else {
        nodesMap.get(c2.name)!.val += 1;
      }

      links.push({
        source: c1.name,
        target: c2.name,
        value: syn.count
      });
    });

    return {
      nodes: Array.from(nodesMap.values()),
      links
    };
  }, [synergies]);

  // D3 Simulation
  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const width = dimensions.width;
    const height = dimensions.height;

    // Color Scale for Links
    const maxVal = d3.max(data.links, d => d.value) || 1;
    const colorScale = d3.scaleSequential(d3.interpolateBlues)
      .domain([0, maxVal]);

    // Zoom Group
    const g = svg.append("g");
    
    // Zoom Behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([CONFIG.ZOOM.MIN, CONFIG.ZOOM.MAX])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Simulation Setup
    const simulation = d3.forceSimulation<GraphNode>(data.nodes)
      .force("link", d3.forceLink<GraphNode, GraphLink>(data.links)
        .id(d => d.id)
        .distance(CONFIG.PHYSICS.LINK_DISTANCE)
        .strength(CONFIG.PHYSICS.LINK_STRENGTH)
      )
      .force("charge", d3.forceManyBody().strength(CONFIG.PHYSICS.CHARGE_STRENGTH))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(CONFIG.PHYSICS.COLLISION_RADIUS).strength(CONFIG.PHYSICS.COLLISION_STRENGTH));

    // Scales for Link Styling
    const widthScale = d3.scaleLinear()
      .domain([0, maxVal])
      .range([1, 8]); // Thinner weak links, thicker strong links

    const opacityScale = d3.scaleLinear()
      .domain([0, maxVal])
      .range([0.2, 0.8]); // Fainter weak links, bolder strong links

    // Sort links so stronger ones are drawn last (on top)
    data.links.sort((a, b) => a.value - b.value);

    // Render Links
    const link = g.append("g")
      .selectAll("line")
      .data(data.links)
      .join("line")
      .attr("stroke", d => colorScale(d.value))
      .attr("stroke-opacity", d => opacityScale(d.value))
      .attr("stroke-width", d => widthScale(d.value));

    // Render Nodes (Groups containing Image)
    const node = g.append("g")
      .selectAll<SVGGElement, GraphNode>("g")
      .data(data.nodes)
      .join("g")
      .attr("tabindex", 0)
      .attr("role", "img")
      .attr("aria-label", d => `${d.name}: focus to highlight connected cards`)
      .call(d3.drag<SVGGElement, GraphNode>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
      );

    // Node Image (Full Rectangle)
    node.append("image")
      .attr("xlink:href", d => d.icon)
      .attr("x", -CONFIG.VISUALS.NODE_WIDTH / 2)
      .attr("y", -CONFIG.VISUALS.NODE_HEIGHT / 2)
      .attr("width", CONFIG.VISUALS.NODE_WIDTH)
      .attr("height", CONFIG.VISUALS.NODE_HEIGHT);

    // Node Labels (on hover or always visible if zoomed in)
    node.append("text")
      .text(d => d.name)
      .attr("x", 0)
      .attr("y", CONFIG.VISUALS.TEXT_OFFSET_Y)
      .attr("text-anchor", "middle")
      .attr("fill", "#142a40")
      .attr("font-size", CONFIG.VISUALS.FONT_SIZE)
      .attr("font-family", "sans-serif")
      .attr("pointer-events", "none")
      ;

    // Simulation Tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as GraphNode).x!)
        .attr("y1", d => (d.source as GraphNode).y!)
        .attr("x2", d => (d.target as GraphNode).x!)
        .attr("y2", d => (d.target as GraphNode).y!);

      node
        .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // Drag Functions
    function dragstarted(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Hover Effects (Brushing)
    node
      .on("mouseover focus", (event, d) => {
        setHoveredNode(d.id);
        
        // Dim all nodes and links
        node.style("opacity", 0.1);
        link.style("opacity", 0.05);

        // Highlight connected nodes and links
        const connectedNodeIds = new Set<string>();
        connectedNodeIds.add(d.id);

        link
          .filter(l => {
            const sourceId = (l.source as GraphNode).id;
            const targetId = (l.target as GraphNode).id;
            if (sourceId === d.id || targetId === d.id) {
              connectedNodeIds.add(sourceId);
              connectedNodeIds.add(targetId);
              return true;
            }
            return false;
          })
          .style("opacity", 1)
          .attr("stroke", d => colorScale(d.value)) // Keep color
          .attr("stroke-width", CONFIG.VISUALS.LINK_WIDTH_HOVER); // Thicker highlight

        node
          .filter(n => connectedNodeIds.has(n.id))
          .style("opacity", 1);
      })
      .on("mouseout blur", () => {
        setHoveredNode(null);
        node.style("opacity", 1);
        link
          .style("opacity", 1)
          .attr("stroke", d => colorScale(d.value))
          .attr("stroke-width", d => widthScale(d.value))
          .attr("stroke-opacity", d => opacityScale(d.value));
      });

    return () => {
      simulation.stop();
    };
  }, [data, dimensions]);

  return (
    <div className="bg-[#ffffff] border border-[#e2e8f0] rounded-lg overflow-hidden h-full min-h-[400px] flex flex-col">
      <div className="px-3 py-2 border-b border-[#e2e8f0] bg-[#f8fafc] flex justify-between items-center">
        <h2 className="text-xs font-bold text-slate-700 normal-case tracking-normal flex items-center gap-2">
          <span className="text-blue-500"></span> Card relationships
        </h2>
        <span className="text-[10px] text-slate-500 tabular-nums">
          {hoveredNode ? `Highlighting: ${hoveredNode}` : 'Drag nodes to explore clusters'}
        </span>
      </div>
      
      <div ref={containerRef} className="flex-1 relative bg-[#f4f7fa] overflow-hidden">
        <svg 
          ref={svgRef}
          aria-label="Card co-occurrence network"
          width={dimensions.width}
          height={dimensions.height}
          className="cursor-move"
        />
        
        {/* Legend */}
        <div className="absolute bottom-3 right-3 bg-white/95 p-2 rounded border border-[#cbd5e1] text-[10px] text-slate-600 max-w-[200px]">
          <p className="font-bold text-slate-800 mb-2">Played together</p>
          <div className="h-2 w-full rounded bg-gradient-to-r from-blue-100 to-blue-700 mb-1"></div>
          <div className="flex justify-between text-[9px] text-slate-500 tabular-nums">
            <span>Weak</span>
            <span>Strong</span>
          </div>
          <div className="mt-2 pt-2 border-t border-[#cbd5e1]">
            <p className="font-bold text-slate-800 mb-1">How to read:</p>
            <ul className="list-disc pl-3 space-y-1">
              <li>Nodes = Cards</li>
              <li>Links = Shared decks</li>
              <li>Color/Width = Strength</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
