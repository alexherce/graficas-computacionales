var projectionMatrix, modelViewMatrix;
var vertexShaderSource =
" attribute vec3 vertexPos;\n" +
" uniform mat4 modelViewMatrix;\n" +
" uniform mat4 projectionMatrix;\n" +
" void main(void){\n" +
"   gl_Position = projectionMatrix * modelViewMatrix * vec4(vertexPos,1.0);\n" +
" }\n";
var fragmentShaderSource =
" void main(void){\n" +
"   gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);\n" +
" }\n";
var shaderProgram, shaderVertexPositionAttribute,
  shaderProjectionMatrixUniform, shaderModelViewMatrixUniform;
// Obtener el contexto para WebGl
function  initWebGL(canvas)
{
  var gl = null;
  var msg = "El explorador no soporta WebGL.";

  try {
    gl = canvas.getContext("experimental-webgl");
  } catch (e) {
    msg = "Error al obtener el contexto: " + e.toString();
  }

  if(!gl)
  {
    alert(msg);
  }

  return gl;

}

function initViewport(gl, canvas)
{
  gl.viewport(0,0,canvas.width, canvas.height);
}

function createSquare(gl)
{
  var vertexBuffer;
  vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

  var verts = [
    0.5, 0.5, 0.0,
    -0.5, 0.5, 0.0,
    0.5, -0.5, 0.0,
    -0.5, -0.5, 0.0,
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

  var square = {buffer:vertexBuffer, vertSize:3, numVertex:4, primType:gl.TRIANGLE_STRIP};
  return square;
}

function initMatrices(canvas)
{
  modelViewMatrix = mat4.create();
  projectionMatrix = mat4.create();

  mat4.translate(modelViewMatrix, modelViewMatrix, [0, 0, -3.33]);
  mat4.perspective(projectionMatrix, Math.PI/4, canvas.width/canvas.height, 1, 10000);
}

function loadShader(gl, str, type)
{
  var shader;
  if(type=="fragment")
  {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  }else if (type=="vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  }else {
    return null;
  }
  gl.shaderSource(shader, str);
  gl.compileShader(shader);

  if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
  {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}

function initShader(gl)
{
  var fragmentShader = loadShader(gl, fragmentShaderSource, "fragment");
  var vertexShader = loadShader(gl, vertexShaderSource, "vertex");

  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader)
  gl.linkProgram(shaderProgram);

  shaderVertexPositionAttribute = gl.getAttribLocation(shaderProgram, "vertexPos");
  gl.enableVertexAttribArray(shaderVertexPositionAttribute);
  shaderProjectionMatrixUniform = gl.getUniformLocation(shaderProgram, "projectionMatrix");
  shaderModelViewMatrixUniform = gl.getUniformLocation(shaderProgram, "modelViewMatrix");

  if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
  {
    alert("Could not link shaders");
  }
}

function draw(gl, obj)
{
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(shaderProgram);
  gl.bindBuffer(gl.ARRAY_BUFFER, obj.buffer);
  gl.vertexAttribPointer(shaderVertexPositionAttribute, obj.vertSize, gl.FLOAT, false, 0,0);
  gl.uniformMatrix4fv(shaderProjectionMatrixUniform, false, projectionMatrix);
  gl.uniformMatrix4fv(shaderModelViewMatrixUniform, false, modelViewMatrix);
  gl.drawArrays(obj.primType, 0, obj.numVertex);
}
