// 基础数据类型定义
export interface Point2D {
  re: number;
  im: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface BasePoint extends Point2D {
  baseType: '1' | '2' | '3';
}

export interface RenderPoint extends BasePoint {
  highlightGroup: number; // -1表示未高亮
}

// 基础数据结构
export interface BaseData {
  word: string;
  pointsWithBaseType: BasePoint[];
  indexMaps: { [key: string]: number[] };
}

// 路径数据结构
export interface PathData {
  path: number[];
  rp: number;        // 总权重
  coeffs: { 1: number; 2: number; 3: number };
  cl: number;        // 常数项
  sequence: number[]; // 位置数列
  firstPointCoords: Point2D | null;
}

// 计算状态
export interface CalculationState {
  isLoading: boolean;
  mathJsLoaded: boolean;
  error: string | null;
}

// 应用状态
export interface AppState {
  numPoints: number;
  pathInput: string;
  inputError: string;
  baseData: BaseData | null;
  pathsData: PathData[];
  calculationState: CalculationState;
}

// 组件Props类型
export interface ControlPanelProps {
  numPoints: number;
  onNumPointsChange: (points: number) => void;
  pathInput: string;
  onPathInputChange: (input: string) => void;
  inputError: string;
  onAddPath: () => void;
  pathsData: PathData[];
  onRemovePath: (index: number) => void;
  disabled: boolean;
  formatPointCount: (count: number) => string;
}

export interface FractalCanvasProps {
  points: RenderPoint[];
  isLoading: boolean;
}

export interface DataPanelProps {
  pathsData: PathData[];
}