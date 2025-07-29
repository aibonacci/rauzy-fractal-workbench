import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Left Control Panel */}
      <div className="w-1/4 bg-white shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">控制面板</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              路径输入
            </label>
            <input
              type="text"
              data-testid="path-input"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入路径 (例: 1213)"
            />
            <button
              data-testid="add-path-button"
              className="mt-2 w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              添加路径
            </button>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              点数控制
            </label>
            <input
              type="range"
              data-testid="points-slider"
              min="10000"
              max="1000000"
              step="10000"
              defaultValue="100000"
              className="w-full"
            />
            <div className="text-sm text-gray-600 mt-1">100,000 点</div>
          </div>
          
          <div data-testid="path-list">
            <h3 className="text-lg font-medium mb-2">路径列表</h3>
            <div className="text-sm text-gray-500">暂无路径</div>
          </div>
        </div>
      </div>

      {/* Center Canvas */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-lg" style={{ aspectRatio: '4/3' }}>
          <canvas
            data-testid="fractal-canvas"
            width={800}
            height={600}
            className="border border-gray-300 rounded-lg"
          >
            您的浏览器不支持Canvas
          </canvas>
        </div>
      </div>

      {/* Right Data Panel */}
      <div className="w-1/4 bg-white shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">数据面板</h2>
        <div data-testid="data-panel">
          <div className="text-sm text-gray-500">
            添加路径后将显示分析数据
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;