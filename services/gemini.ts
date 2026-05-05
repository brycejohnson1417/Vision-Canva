import { GoogleGenAI, Type } from "@google/genai";
import { GraphData, EntityType, NodeData, EdgeData } from "../types";
import { v4 as uuidv4 } from 'uuid';
import * as d3 from 'd3-force';

// Initialize Gemini client
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

export const extractEntityGraph = async (promptText: string): Promise<GraphData> => {
  const ai = getClient();
  
  const systemInstruction = `
    You are an expert intelligence analyst and data architect.
    Your goal is to parse unstructured text provided by the user and extract a comprehensive Entity-Relationship graph.
    
    You must extract entities (nodes) such as PERSON, ORGANIZATION, LOCATION, EVENT, OBJECT, CONCEPT.
    You must extract relationships (edges) between these entities. Give each relationship a short, descriptive label (e.g. "CEO_OF", "LOCATED_IN", "FUNDING_SOURCE", "CONFLICT_WITH").
    
    Be extremely thorough. Ensure every node has a clear description, and make sure relationships connect existing node IDs.
    Generate a highly connected graph where possible.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview", // Note: using gemini-3.1-pro-preview
    contents: promptText,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          nodes: {
            type: Type.ARRAY,
            description: "The list of entities extracted from the text.",
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING, description: "A unique string ID for this node (no spaces)" },
                type: { type: Type.STRING, enum: Object.values(EntityType) },
                label: { type: Type.STRING, description: "Display name of the entity" },
                description: { type: Type.STRING, description: "A brief summary of the entity's role or context" }
              },
              required: ["id", "type", "label", "description"]
            }
          },
          edges: {
            type: Type.ARRAY,
            description: "The list of relationships connecting the extracted entities.",
            items: {
              type: Type.OBJECT,
              properties: {
                sourceId: { type: Type.STRING, description: "The ID of the source node" },
                targetId: { type: Type.STRING, description: "The ID of the target node" },
                label: { type: Type.STRING, description: "A short label describing the relationship (e.g. works_for, married_to, located_in)" }
              },
              required: ["sourceId", "targetId", "label"]
            }
          }
        },
        required: ["nodes", "edges"]
      }
    }
  });

  const rawGraph = JSON.parse(response.text || '{"nodes":[], "edges":[]}');

  const nodes: (NodeData & d3.SimulationNodeDatum)[] = (rawGraph.nodes || []).map((n: any) => ({
    id: String(n.id || uuidv4()),
    type: n.type as EntityType,
    label: n.label || 'Unknown',
    description: n.description || '',
    position: { x: 0, y: 0 }
  }));

  const edges = (rawGraph.edges || []).map((e: any) => ({
    id: uuidv4(),
    sourceId: String(e.sourceId),
    targetId: String(e.targetId),
    label: e.label || 'connected',
    source: String(e.sourceId),
    target: String(e.targetId)
  }));

  const simulation = d3.forceSimulation<NodeData & d3.SimulationNodeDatum>(nodes)
    .force("link", d3.forceLink<NodeData & d3.SimulationNodeDatum, any>(edges).id(d => d.id).distance(220))
    .force("charge", d3.forceManyBody().strength(-2000))
    .force("collide", d3.forceCollide().radius(160))
    .force("center", d3.forceCenter(window.innerWidth / 2, window.innerHeight / 2))
    .stop();

  for (let i = 0; i < 300; ++i) simulation.tick();

  nodes.forEach(n => {
    n.position = { 
      x: (n.x || 0) - 140,
      y: (n.y || 0) - 50 
    };
    delete n.x;
    delete n.y;
    delete n.vx;
    delete n.vy;
    delete n.index;
  });

  edges.forEach(e => {
    delete (e as any).source;
    delete (e as any).target;
    delete (e as any).index;
  });

  return { nodes, edges: edges as EdgeData[] };
};