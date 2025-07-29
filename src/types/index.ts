// Type definitions for the Rauzy fractal workbench

export interface Point2D {
  re: number;
  im: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface BaseData {
  word: string;
  pointsWithBaseType: Point3D[];
  indexMaps: { [key: string]: number[] };
}

export interface PathData {
  path: number[];
  rp: number;        // 总权重
  cl: number;        // 常数项
  sequence: number[]; // 位置数列
  firstPointCoords: Point2D | null;
}

export interface RenderPoint {
  re: number;
  im: number;
  baseType: '1' | '2' | '3';
  highlightGroup: number; // -1表示未高亮
}

// AI Agent友好的接口
export interface AgentInterface {
  pathInput: HTMLInputElement;     // data-testid="path-input"
  addButton: HTMLButtonElement;    // data-testid="add-path-button"
  pathList: HTMLElement;          // data-testid="path-list"
  pointsSlider: HTMLInputElement;  // data-testid="points-slider"
  canvas: HTMLCanvasElement;       // data-testid="fractal-canvas"
  dataPanel: HTMLElement;         // data-testid="data-panel"
}