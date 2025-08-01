/**
 * WebGL调试工具
 * 用于诊断WebGL渲染问题
 */

export class WebGLDebugger {
  static checkWebGLSupport(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch (e) {
      return false;
    }
  }

  static getWebGLInfo(): any {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl');
      if (!gl) return null;

      return {
        vendor: gl.getParameter(gl.VENDOR),
        renderer: gl.getParameter(gl.RENDERER),
        version: gl.getParameter(gl.VERSION),
        shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
        maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS),
        maxFragmentUniforms: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
        maxVertexUniforms: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS)
      };
    } catch (e) {
      return null;
    }
  }

  static logWebGLInfo(): void {
    console.log('🔍 WebGL调试信息:');
    console.log('WebGL支持:', this.checkWebGLSupport());
    
    const info = this.getWebGLInfo();
    if (info) {
      console.log('GPU信息:', info);
    } else {
      console.log('无法获取WebGL信息');
    }
  }

  static testBasicRendering(): void {
    console.log('🧪 测试基础WebGL渲染...');
    
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      
      const gl = canvas.getContext('webgl');
      if (!gl) {
        console.error('WebGL上下文创建失败');
        return;
      }

      // 简单的顶点着色器
      const vertexShaderSource = `
        attribute vec2 a_position;
        void main() {
          gl_Position = vec4(a_position, 0, 1);
          gl_PointSize = 10.0;
        }
      `;

      // 简单的片段着色器
      const fragmentShaderSource = `
        precision mediump float;
        void main() {
          gl_FragColor = vec4(1, 0, 0, 1);
        }
      `;

      // 创建着色器
      const vertexShader = gl.createShader(gl.VERTEX_SHADER);
      const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
      
      if (!vertexShader || !fragmentShader) {
        console.error('着色器创建失败');
        return;
      }

      gl.shaderSource(vertexShader, vertexShaderSource);
      gl.compileShader(vertexShader);
      
      if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error('顶点着色器编译失败:', gl.getShaderInfoLog(vertexShader));
        return;
      }

      gl.shaderSource(fragmentShader, fragmentShaderSource);
      gl.compileShader(fragmentShader);
      
      if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error('片段着色器编译失败:', gl.getShaderInfoLog(fragmentShader));
        return;
      }

      // 创建程序
      const program = gl.createProgram();
      if (!program) {
        console.error('程序创建失败');
        return;
      }

      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('程序链接失败:', gl.getProgramInfoLog(program));
        return;
      }

      // 测试渲染
      gl.useProgram(program);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // 创建顶点数据
      const positions = new Float32Array([0, 0]);
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

      const positionLocation = gl.getAttribLocation(program, 'a_position');
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.POINTS, 0, 1);

      console.log('✅ 基础WebGL渲染测试通过');
      
      // 检查像素数据
      const pixels = new Uint8Array(4);
      gl.readPixels(50, 50, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      console.log('中心像素颜色:', pixels);
      
    } catch (error) {
      console.error('WebGL测试失败:', error);
    }
  }
}

// 自动运行调试信息
WebGLDebugger.logWebGLInfo();

// 暴露到全局对象
(window as any).webglDebug = WebGLDebugger;