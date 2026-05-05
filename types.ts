export enum EntityType {
  PERSON = 'PERSON',
  ORGANIZATION = 'ORGANIZATION',
  LOCATION = 'LOCATION',
  EVENT = 'EVENT',
  OBJECT = 'OBJECT',
  CONCEPT = 'CONCEPT',
}

export interface NodeData {
  id: string;
  type: EntityType;
  label: string;
  description: string;
  position: { x: number; y: number };
}

export interface EdgeData {
  id: string;
  sourceId: string;
  targetId: string;
  label: string;
}

export interface GraphData {
  nodes: NodeData[];
  edges: EdgeData[];
}

export interface CanvasState {
  scale: number;
  offsetX: number;
  offsetY: number;
}
