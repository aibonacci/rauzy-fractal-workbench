import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

// 基础瓦片颜色 (统一色调，不同透明度)
const BASE_COLORS_ALPHA = {
    '1': 'rgba(209, 213, 219, 0.5)',
    '2': 'rgba(209, 213, 219, 0.35)',
    '3': 'rgba(209, 213, 219, 0.2)'
};
// 多路径高亮的颜色调色板
const HIGHLIGHT_PALETTE = [
    '#FBBF24', '#F87171', '#34D399', '#818CF8', '#F472B6', '#60A5FA'
];
const AXIS_COLOR = 'rgba(255, 255, 255, 0.2)';

// 将Tribonacci数列F的计算提升到全局
const F = { '-3': 0, '-2': -1, '-1': 1, '0': 0, '1': 0, '2': 1, '3': 1, '4': 2, '5': 4, '6': 7 };
for (let i = 7; i < 1000; i++) { F[i] = F[i-1] + F[i-2] + F[i-3]; }

/**
 * --- Rauzy分形核心算法 ---
 * 生成所有基础数据: 几何坐标, Tribonacci词, 和基础位置数列 (通过索引地图)
 */
const executeRauzyCoreAlgorithm = (targetPointCount) => {
    if (typeof math === 'undefined') return null;
    
    // 步骤 1-3: 矩阵与坐标变换 (使用您指定的动态计算方法)
    const M = math.matrix([[1, 1, 1], [1, 0, 0], [0, 1, 0]]);
    const eigenInfo = math.eigs(M);
    const eigenvalues = eigenInfo.values.toArray();
    const eigenvectors = eigenInfo.vectors;
    const expandingIndex = eigenvalues.findIndex(val => typeof val === 'number' && Math.abs(val) > 1);
    let expandingVec = math.column(eigenvectors, expandingIndex);
    const complexIndex = eigenvalues.findIndex(val => typeof val === 'object');
    let complexVec = math.column(eigenvectors, complexIndex);
    expandingVec = math.divide(expandingVec, expandingVec.get([0, 0]));
    complexVec = math.divide(complexVec, complexVec.get([0, 0]));
    const contractingVecReal = math.re(complexVec);
    const contractingVecImag = math.im(complexVec);
    const basisMatrix = math.transpose(math.matrix([
        expandingVec.toArray().flat(),
        contractingVecReal.toArray().flat(),
        contractingVecImag.toArray().flat()
    ]));
    const invBasisMatrix = math.inv(basisMatrix);

    // 步骤 4: 生成符号序列
    let word = "1";
    let currentWord = ['1'];
    while (currentWord.length < targetPointCount) {
        let nextWord = [];
        for (const char of currentWord) {
            if (char === '1') nextWord.push('1', '2');
            else if (char === '2') nextWord.push('1', '3');
            else nextWord.push('1');
        }
        currentWord = nextWord;
    }
    word = currentWord.join('').substring(0, targetPointCount);

    const indexMaps = { '1': [], '2': [], '3': [] };
    for (let i = 0; i < word.length; i++) {
        indexMaps[word[i]].push(i + 1);
    }

    // 步骤 5: 构建阶梯并投影
    const pointsWithBaseType = [];
    const abelian_vector = { '1': 0, '2': 0, '3': 0 };
    for (let N = 1; N < word.length; N++) {
        const prev_char = word[N - 1];
        abelian_vector[prev_char]++;
        const point3D = [abelian_vector['1'], abelian_vector['2'], abelian_vector['3']];
        const pointInEigenBasis = math.multiply(invBasisMatrix, point3D);
        pointsWithBaseType.push({ re: Number(pointInEigenBasis.get([1])), im: Number(pointInEigenBasis.get([2])), baseType: prev_char });
    }
    
    return { word, pointsWithBaseType, indexMaps };
};

/**
 * --- 刘氏定理数据计算引擎 ---
 * @param {Array<number>} path - 复合路径 L
 * @param {Object} indexMaps - 基础位置数列
 * @param {Array} pointsWithBaseType - 几何坐标数据
 * @returns {Object} 包含路径所有计算数据的对象
 */
const calculatePathData = (path, indexMaps, pointsWithBaseType) => {
    if (!path || path.length === 0) return null;

    const rp = path.reduce((a, b) => a + b, 0);
    const coeffs = { 1: 0, 2: 0, 3: 0 };
    coeffs[1] = F[rp - 2] || 0;
    coeffs[2] = (F[rp - 2] || 0) + (F[rp - 3] || 0);
    coeffs[3] = (F[rp - 2] || 0) + (F[rp - 3] || 0) + (F[rp - 4] || 0);
    
    let c_L = 0;
    let rs = 0;
    for (let s = 0; s < path.length; s++) {
        const ls = path[s];
        rs += ls;
        let step_contribution = 0;
        for (let j = 1; j <= (3 - ls); j++) {
            step_contribution += F[rs + j - 2] || 0;
        }
        c_L += step_contribution;
    }

    const sequence = [];
    const maxBaseLength = Math.min(indexMaps['1'].length, indexMaps['2'].length, indexMaps['3'].length);
    // 修正: 移除硬编码的100项上限，计算所有可能的项
    for (let k = 1; k <= maxBaseLength; k++) {
        const W1k = indexMaps['1'][k-1];
        const W2k = indexMaps['2'][k-1];
        const W3k = indexMaps['3'][k-1];
        const p_L_k = coeffs[1] * W1k + coeffs[2] * W2k + coeffs[3] * W3k;
        const w_L_k = Math.round(p_L_k - c_L);
        if (w_L_k > 0) {
            sequence.push(w_L_k);
        } else if (sequence.length > 0) {
            // 如果出现非正数，通常意味着后续项也将无效，可以提前中断
            break;
        }
    }

    let firstPointCoords = null;
    if (sequence.length > 0) {
        const firstPosIndex = sequence[0] - 1;
        if (firstPosIndex >= 0 && firstPosIndex < pointsWithBaseType.length) {
            firstPointCoords = pointsWithBaseType[firstPosIndex];
        }
    }

    return { path, rp, cl: c_L, sequence, firstPointCoords };
};

// Canvas组件
const FractalCanvas = ({ points }) => {
  const canvasRef = useRef(null);
  const drawFractal = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;
    if (!points || points.length === 0) { ctx.clearRect(0, 0, width, height); return; }
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    points.forEach(p => {
      minX = Math.min(minX, p.re); maxX = Math.max(maxX, p.re);
      minY = Math.min(minY, p.im); maxY = Math.max(maxY, p.im);
    });
    const scale = Math.min((width - 40) / (maxX - minX || 1), (height - 40) / (maxY - minY || 1)) * 0.95;
    const offsetX = (width - (maxX - minX) * scale) / 2 - minX * scale;
    const offsetY = (height - (maxY - minY) * scale) / 2 - minY * scale;
    ctx.clearRect(0, 0, width, height);
    
    ctx.strokeStyle = AXIS_COLOR;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, offsetY); ctx.lineTo(width, offsetY);
    ctx.moveTo(offsetX, 0); ctx.lineTo(offsetX, height);
    ctx.stroke();

    points.forEach(p => {
        const isHighlighted = p.highlightGroup !== -1;
        ctx.fillStyle = isHighlighted 
            ? HIGHLIGHT_PALETTE[p.highlightGroup % HIGHLIGHT_PALETTE.length] 
            : BASE_COLORS_ALPHA[p.baseType];
        const px = p.re * scale + offsetX;
        const py = p.im * scale + offsetY;
        const size = isHighlighted ? 3 : 2;
        ctx.fillRect(px, py, size, size);
    });

  }, [points]);
  useEffect(() => { drawFractal(); window.addEventListener('resize', drawFractal); return () => window.removeEventListener('resize', drawFractal); }, [drawFractal]);
  return <canvas ref={canvasRef} className="w-full h-full bg-gray-900 rounded-lg shadow-inner"></canvas>;
};

// 主应用组件
export default function App() {
  const [numPoints, setNumPoints] = useState(100000);
  const [pathsData, setPathsData] = useState([]);
  const [pathInput, setPathInput] = useState("");
  const [inputError, setInputError] = useState("");
  
  const [baseData, setBaseData] = useState(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [mathJsLoaded, setMathJsLoaded] = useState(false);

  useEffect(() => {
    if (window.math) { setMathJsLoaded(true); return; }
    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/mathjs/11.8.0/math.min.js";
    script.async = true;
    script.onload = () => { setMathJsLoaded(true); };
    document.body.appendChild(script);
    return () => { if (script.parentNode) document.body.removeChild(script); }
  }, []);

  useEffect(() => {
    if (!mathJsLoaded) return;
    setIsLoading(true);
    // When numPoints changes, we need to recalculate everything.
    setTimeout(() => {
      const data = executeRauzyCoreAlgorithm(numPoints);
      if (data) {
        setBaseData(data);
        // Recalculate all paths data with the new base data
        setPathsData(prevPathsData => 
            prevPathsData.map(oldData => 
                calculatePathData(oldData.path, data.indexMaps, data.pointsWithBaseType)
            )
        );
      }
      setIsLoading(false);
    }, 20);
  }, [numPoints, mathJsLoaded]);

  const renderedPoints = useMemo(() => {
    if (!baseData) return [];
    
    const points = baseData.pointsWithBaseType.map(p => ({ ...p, highlightGroup: -1 }));

    pathsData.forEach((data, pathIndex) => {
        if (data && data.sequence) {
            const highlightIndices = new Set(data.sequence.map(pos => pos - 1));
            highlightIndices.forEach(index => {
                if (index >= 0 && index < points.length) {
                    points[index].highlightGroup = pathIndex;
                }
            });
        }
    });
    return points;
  }, [baseData, pathsData]);
  
  const handleAddPath = () => {
      const newPath = pathInput.split('').map(Number);
      if (newPath.length === 0) { setInputError("路径不能为空。"); return; }
      if (newPath.some(n => ![1,2,3].includes(n))) { setInputError("路径只能包含1, 2, 3。"); return; }
      const pathStr = newPath.join(',');
      if (pathsData.some(p => p.path.join(',') === pathStr)) { setInputError("该路径已存在。"); return; }
      if (pathsData.length >= 300) { setInputError(`最多只能添加 300 条路径。`); return; }

      setInputError("");
      const newData = calculatePathData(newPath, baseData.indexMaps, baseData.pointsWithBaseType);
      if (newData) {
          setPathsData([...pathsData, newData]);
      }
      setPathInput("");
  };

  const removePath = (indexToRemove) => {
    setPathsData(pathsData.filter((_, index) => index !== indexToRemove));
  };


  return (
    <div className="bg-gray-800 text-white font-sans h-screen flex flex-col">
        <div className="flex-grow flex overflow-hidden">
            {/* Left Column */}
            <div className="w-1/5 bg-gray-800 border-r border-gray-700 flex flex-col p-4 space-y-4 flex-shrink-0">
                <h1 className="text-xl font-bold text-yellow-400 flex-shrink-0">Rauzy分形分析工作台</h1>
                <div>
                    <label className="block text-sm font-bold mb-2">构建路径 (例如: 1213)</label>
                    <input type="text" value={pathInput} onChange={(e) => { setPathInput(e.target.value); setInputError(""); }}
                           className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 font-mono text-yellow-400 focus:ring-2 focus:ring-yellow-500 focus:outline-none"/>
                    {inputError && <p className="text-red-400 text-xs mt-1">{inputError}</p>}
                    <button onClick={handleAddPath} disabled={!baseData} className="w-full mt-2 bg-yellow-500 text-gray-900 font-bold py-2 rounded-lg hover:bg-yellow-400 disabled:bg-gray-500">
                        添加路径到列表
                    </button>
                </div>
                <div className="flex-grow flex flex-col overflow-hidden">
                    <label className="block text-sm font-bold mb-2 flex-shrink-0">路径列表</label>
                    <div className="bg-gray-900 p-2 rounded-lg space-y-2 flex-grow overflow-y-auto">
                        {pathsData.map((data, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-700 p-2 rounded">
                                <div className="flex items-center gap-2">
                                    <span style={{backgroundColor: HIGHLIGHT_PALETTE[index % HIGHLIGHT_PALETTE.length]}} className="w-4 h-4 rounded-full flex-shrink-0"></span>
                                    <span className="font-mono text-sm break-all">({data.path.join(',')})</span>
                                </div>
                                <button onClick={() => removePath(index)} className="text-xs bg-red-600 hover:bg-red-500 px-2 py-1 rounded flex-shrink-0">删除</button>
                            </div>
                        ))}
                         {pathsData.length === 0 && <p className="text-center text-gray-500 text-sm pt-4">请构建并添加路径。</p>}
                    </div>
                </div>
                 <div className="flex items-center gap-3 pt-4 border-t border-gray-700 flex-shrink-0">
                    <label htmlFor="points" className="font-medium text-sm">总点数:</label>
                    <input type="range" id="points" min="10000" max="1000000" step="10000" defaultValue={100000} 
                        onMouseUp={(e) => setNumPoints(Number(e.target.value))} onTouchEnd={(e) => setNumPoints(Number(e.target.value))}
                        className="w-full" disabled={isLoading}/>
                </div>
                <div className="text-center font-mono text-yellow-400 text-sm flex-shrink-0">{numPoints.toLocaleString('en-US')}</div>
            </div>

            {/* Center Column */}
            <div className="flex-grow bg-gray-900 flex items-center justify-center p-4">
                <div className="w-full h-full aspect-[4/3] max-w-full max-h-full relative">
                    <FractalCanvas points={renderedPoints} />
                    {isLoading && (
                        <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center rounded-lg">
                          <div className="text-2xl animate-pulse">执行核心算法...</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column */}
            <div className="w-1/4 bg-gray-800 border-l border-gray-700 flex flex-col p-4 flex-shrink-0 overflow-y-auto">
                <h3 className="text-lg font-bold text-yellow-400 mb-4 flex-shrink-0">路径数据面板</h3>
                <div className="space-y-4">
                    {pathsData.map((data, index) => (
                        <div key={index} className="bg-gray-700 p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <span style={{backgroundColor: HIGHLIGHT_PALETTE[index % HIGHLIGHT_PALETTE.length]}} className="w-4 h-4 rounded-full flex-shrink-0"></span>
                                <h4 className="font-bold font-mono break-all">路径 ({data.path.join(',')})</h4>
                            </div>
                            <div className="text-xs font-mono space-y-1 text-gray-300">
                                <p>r 值: <span className="text-white">{data.rp}</span></p>
                                <p>C 值: <span className="text-white">{data.cl}</span></p>
                                <p>首项坐标: <span className="text-white">{data.firstPointCoords ? `(${data.firstPointCoords.re.toFixed(2)}, ${data.firstPointCoords.im.toFixed(2)})` : 'N/A'}</span></p>
                                <p>位置数列 (前5项):</p>
                                <p className="text-white bg-gray-800 p-1 rounded break-all">{data.sequence.slice(0,5).join(', ') || 'N/A'}</p>
                            </div>
                        </div>
                    ))}
                    {pathsData.length === 0 && <p className="text-center text-gray-500 text-sm pt-4">暂无数据。</p>}
                </div>
            </div>
        </div>
    </div>
  );
}
