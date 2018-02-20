var projectionMatrix;

var shaderProgram, shaderVertexPositionAttribute, shaderVertexColorAttribute,
    shaderProjectionMatrixUniform, shaderModelViewMatrixUniform;

var duration = 5000; // ms

// Attributes: Input variables used in the vertex shader. Since the vertex shader is called on each vertex, these will be different every time the vertex shader is invoked.
// Uniforms: Input variables for both the vertex and fragment shaders. These do not change values from vertex to vertex.
// Varyings: Used for passing data from the vertex shader to the fragment shader. Represent information for which the shader can output different value for each vertex.
var vertexShaderSource =
    "    attribute vec3 vertexPos;\n" +
    "    attribute vec4 vertexColor;\n" +
    "    uniform mat4 modelViewMatrix;\n" +
    "    uniform mat4 projectionMatrix;\n" +
    "    varying vec4 vColor;\n" +
    "    void main(void) {\n" +
    "		// Return the transformed and projected vertex value\n" +
    "        gl_Position = projectionMatrix * modelViewMatrix * \n" +
    "            vec4(vertexPos, 1.0);\n" +
    "        // Output the vertexColor in vColor\n" +
    "        vColor = vertexColor;\n" +
    "    }\n";

// precision lowp float
// This determines how much precision the GPU uses when calculating floats. The use of highp depends on the system.
// - highp for vertex positions,
// - mediump for texture coordinates,
// - lowp for colors.
var fragmentShaderSource =
    "    precision lowp float;\n" +
    "    varying vec4 vColor;\n" +
    "    void main(void) {\n" +
    "    // Return the pixel color: always output white\n" +
    "    gl_FragColor = vColor;\n" +
    "}\n";

function initWebGL(canvas)
{
    var gl = null;
    var msg = "Your browser does not support WebGL, " +
        "or it is not enabled by default.";
    try
    {
        gl = canvas.getContext("experimental-webgl");
    }
    catch (e)
    {
        msg = "Error creating WebGL Context!: " + e.toString();
    }

    if (!gl)
    {
        alert(msg);
        throw new Error(msg);
    }

    return gl;
 }

function initViewport(gl, canvas)
{
    gl.viewport(0, 0, canvas.width, canvas.height);
}

function initGL(canvas)
{
    // Create a project matrix with 45 degree field of view
    projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, Math.PI / 4, canvas.width / canvas.height, 1, 10000);

    rotationAxis = vec3.create();
    vec3.normalize(rotationAxis, [1, 1, 1]);
    // vec3.normalize(rotationAxis, [1, 0, 0.2]);
}

// Create the vertex, color and index data for a multi-colored cube
function createPyramid(gl, translation, rotationAxis)
{
    // Vertex Data
    var vertexBuffer;
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    var verts = [
       // Front face
        0.0,  1.0,  0.0,
       -1.0, -1.0,  1.0,
        1.0, -1.0,  1.0,
       // Right face
        0.0,  1.0,  0.0,
        1.0, -1.0,  1.0,
        1.0, -1.0, -1.0,
       // Back face
        0.0,  1.0,  0.0,
        1.0, -1.0, -1.0,
       -1.0, -1.0, -1.0,
       // Left face
        0.0,  1.0,  0.0,
       -1.0, -1.0, -1.0,
       -1.0, -1.0,  1.0
       ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

    // Color data
    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    var faceColors = [
      [1.0, 0.0, 0.0, 1.0],
      [0.0, 1.0, 0.0, 1.0],
      [0.0, 0.0, 1.0, 1.0],
      // Right face
      [1.0, 0.0, 0.0, 1.0],
      [0.0, 0.0, 1.0, 1.0],
      [0.0, 1.0, 0.0, 1.0],
      // Back face
      [1.0, 0.0, 0.0, 1.0],
      [0.0, 1.0, 0.0, 1.0],
      [0.0, 0.0, 1.0, 1.0],
      // Left face
      [1.0, 0.0, 0.0, 1.0],
      [0.0, 0.0, 1.0, 1.0],
      [0.0, 1.0, 0.0, 1.0]
    ];

    // Each vertex must have the color information, that is why the same color is concatenated 4 times, one for each vertex of the cube's face.
    var vertexColors = [];
    for (var i in faceColors)
    {
        var color = faceColors[i];
        for (var j=0; j < 4; j++)
            // vertexColors = vertexColors.concat(faceColors[(j + 0) % 6]);
            vertexColors = vertexColors.concat(color);
    }

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexColors), gl.STATIC_DRAW);

    // Index data (defines the triangles to be drawn).
    var cubeIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);
    var cubeIndices = [
      0, 1, 2,
      3, 4, 5,
      6, 7, 8,
      9, 10, 11
    ];

    // gl.ELEMENT_ARRAY_BUFFER: Buffer used for element indices.
    // Uint16Array: Array of 16-bit unsigned integers.
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeIndices), gl.STATIC_DRAW);

    var cube = {
            buffer:vertexBuffer, colorBuffer:colorBuffer, indices:cubeIndexBuffer,
            vertSize:3, nVerts:12, colorSize:4, nColors: 12, nIndices:12,
            primtype:gl.TRIANGLES, modelViewMatrix: mat4.create(), currentTime : Date.now()};

    mat4.translate(cube.modelViewMatrix, cube.modelViewMatrix, translation);

    cube.update = function()
    {
        var now = Date.now();
        var deltat = now - this.currentTime;
        this.currentTime = now;
        var fract = deltat / duration;
        var angle = Math.PI * 2 * fract;

        // Rotates a mat4 by the given angle
        // mat4 out the receiving matrix
        // mat4 a the matrix to rotate
        // Number rad the angle to rotate the matrix by
        // vec3 axis the axis to rotate around
        mat4.rotate(this.modelViewMatrix, this.modelViewMatrix, angle, rotationAxis);
    };

    return cube;
}

function createRhombus(gl, translation, rotationAxis)
{
    // Vertex Data
    var vertexBuffer;
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    var verts = [
       // Front face
        0.0, 2.0, 0.0,
       -1.0, 0.0, 1.0,
        1.0, 0.0, 1.0,
       // Right face
        0.0, 2.0, 0.0,
        1.0, 0.0, 1.0,
        1.0, 0.0, -1.0,
       // Back face
        0.0, 2.0, 0.0,
        1.0, 0.0, -1.0,
       -1.0, 0.0, -1.0,
       // Left face
        0.0, 2.0, 0.0,
       -1.0, 0.0, -1.0,
       -1.0, 0.0, 1.0,

       // Front face
       -0.0, -2.0, -0.0,
       1.0, 0.0, -1.0,
      -1.0, 0.0, -1.0,
       // Right face
      -0.0, -2.0, -0.0,
      -1.0, 0.0, -1.0,
      -1.0, 0.0, 1.0,
       // Back face
      -0.0, -2.0, -0.0,
      -1.0, 0.0, 1.0,
       1.0, 0.0, 1.0,
       // Left face
      -0.0, -2.0, -0.0,
       1.0, 0.0, 1.0,
       1.0, 0.0, -1.0
       ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

    // Color data
    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    var faceColors = [
      // Right face
      [1.0, 0.0, 0.0, 1.0],
      [0.0, 0.0, 1.0, 1.0],
      [0.0, 1.0, 0.0, 1.0],

      [1.0, 0.0, 0.0, 1.0],
      [0.0, 1.0, 0.0, 1.0],
      [0.0, 0.0, 1.0, 1.0],

      [1.0, 0.0, 0.0, 1.0],
      [0.0, 1.0, 0.0, 1.0],
      [0.0, 0.0, 1.0, 1.0],

      [1.0, 0.0, 0.0, 1.0],
      [0.0, 0.0, 1.0, 1.0],
      [0.0, 1.0, 0.0, 1.0],

      [1.0, 0.0, 0.0, 1.0],
      [0.0, 0.0, 1.0, 1.0],
      [0.0, 1.0, 0.0, 1.0],

      [1.0, 0.0, 0.0, 1.0],
      [0.0, 1.0, 0.0, 1.0],
      [0.0, 0.0, 1.0, 1.0],

      [1.0, 0.0, 0.0, 1.0],
      [0.0, 1.0, 0.0, 1.0],
      [0.0, 0.0, 1.0, 1.0],

      [1.0, 0.0, 0.0, 1.0],
      [0.0, 0.0, 1.0, 1.0],
      [0.0, 1.0, 0.0, 1.0]
    ];

    // Each vertex must have the color information, that is why the same color is concatenated 4 times, one for each vertex of the cube's face.
    var vertexColors = [];
    for (var i in faceColors)
    {
        var color = faceColors[i];
        for (var j=0; j < 4; j++)
            // vertexColors = vertexColors.concat(faceColors[(j + 0) % 6]);
            vertexColors = vertexColors.concat(color);
    }

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexColors), gl.STATIC_DRAW);

    // Index data (defines the triangles to be drawn).
    var cubeIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);
    var cubeIndices = [
      0, 1, 2,
      3, 4, 5,
      6, 7, 8,
      9, 10, 11,
      12, 13, 14,
      15, 16, 17,
      18, 19, 20,
      21, 22, 23
    ];

    // gl.ELEMENT_ARRAY_BUFFER: Buffer used for element indices.
    // Uint16Array: Array of 16-bit unsigned integers.
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeIndices), gl.STATIC_DRAW);

    var cube = {
            buffer:vertexBuffer, colorBuffer:colorBuffer, indices:cubeIndexBuffer,
            vertSize:3, nVerts:24, colorSize:4, nColors: 24, nIndices:24,
            primtype:gl.TRIANGLES, modelViewMatrix: mat4.create(), currentTime : Date.now()};

    mat4.translate(cube.modelViewMatrix, cube.modelViewMatrix, translation);

    cube.update = function()
    {
        var now = Date.now();
        var deltat = now - this.currentTime;
        this.currentTime = now;
        var fract = deltat / duration;
        var angle = Math.PI * 2 * fract;

        // Rotates a mat4 by the given angle
        // mat4 out the receiving matrix
        // mat4 a the matrix to rotate
        // Number rad the angle to rotate the matrix by
        // vec3 axis the axis to rotate around
        mat4.rotate(this.modelViewMatrix, this.modelViewMatrix, angle, rotationAxis);
    };

    return cube;
}

// Create the vertex, color and index data for a multi-colored cube
function createIcosahedron(gl, translation, rotationAxis)
{
  // Vertex Data
  var vertexBuffer;
  vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

  var verts = [
    // Front face
    -0.5257, 0, 0.85,
    0.5257, 0, 0.85,
    -0.5257, 0, -0.85,
    0.5257, 0, -0.85,
    0, 0.85, 0.5257,
    0, 0.85, -0.5257,
    0, -0.85, 0.5257,
    0, -0.85, -0.5257,
    0.85, 0.5257, 0,
    -0.85, 0.5257, 0,
    0.85, -0.5257, 0,
    -0.85, -0.5257, 0,
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

  // Color data
  var colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  var faceColors = [
    [1.0, 0.0, 1.0, 1.0], // Front face
    [1.0, 1.0, 1.0, 1.0], // Back face
    [0.7, 0.7, 0.7, 1.0], // Top face
    [1.0, 0.0, 1.0, 1.0], // Front face
    [1.0, 1.0, 1.0, 1.0], // Back face
    [0.7, 0.7, 0.7, 1.0], // Top face
    [1.0, 0.0, 1.0, 1.0], // Front face
    [1.0, 1.0, 1.0, 1.0], // Back face
    [0.7, 0.7, 0.7, 1.0], // Top face
    [1.0, 0.0, 1.0, 1.0], // Front face
    [1.0, 1.0, 1.0, 1.0], // Back face
    [0.7, 0.7, 0.7, 1.0], // Top face
    [1.0, 0.0, 1.0, 1.0], // Front face
    [1.0, 1.0, 1.0, 1.0], // Back face
    [0.7, 0.7, 0.7, 1.0], // Top face
    [1.0, 0.0, 1.0, 1.0], // Front face
    [1.0, 1.0, 1.0, 1.0], // Back face
    [0.7, 0.7, 0.7, 1.0], // Top face
    [1.0, 0.0, 1.0, 1.0], // Front face
    [0.7, 0.7, 0.7, 1.0]
  ];

  // Each vertex must have the color information, that is why the same color is concatenated 4 times, one for each vertex of the cube's face.
  var vertexColors = [];
  for (var i in faceColors)
  {
    var color = faceColors[i%faceColors.length];
    for (var j=0; j < 3; j++)
    // vertexColors = vertexColors.concat(faceColors[(j + 0) % 6]);
    vertexColors = vertexColors.concat(color);
  }

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexColors), gl.STATIC_DRAW);

  // Index data (defines the triangles to be drawn).
  var cubeIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);
  var cubeIndices = [
    0,6,1,
    0,11,6,
    1,4,0,
    1,8,4,
    1,10,8,
    2,5,3,
    2,9,5,
    2,11,9,
    3,7,2,
    3,10,7,
    4,8,5,
    4,9,0,
    5,8,3,
    5,9,4,
    6,10,1,
    6,11,7,
    7,10,6,
    7,11,2,
    8,10,3,
    9,11,0
  ];

  // gl.ELEMENT_ARRAY_BUFFER: Buffer used for element indices.
  // Uint16Array: Array of 16-bit unsigned integers.
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeIndices), gl.STATIC_DRAW);

  var cube = {
    buffer:vertexBuffer, colorBuffer:colorBuffer, indices:cubeIndexBuffer,
    vertSize:3, nVerts:12, colorSize:4, nColors: 20, nIndices:60,
    primtype:gl.TRIANGLES, modelViewMatrix: mat4.create(), currentTime : Date.now()};

    mat4.translate(cube.modelViewMatrix, cube.modelViewMatrix, translation);

    var up = true;
    var i = 0;

    cube.update = function()
    {
      var now = Date.now();
      var deltat = now - this.currentTime;
      this.currentTime = now;
      var fract = deltat / duration;
      var angle = Math.PI * 2 * fract;

      if(i > 1 && up) {
        up = false;
      } else if (i < -1 && !up) {
        up = true;
      }

      if(up) {
        mat4.translate(obj.modelViewMatrix, obj.modelViewMatrix, [0, 0.01, 0]);
        i += 0.01;
      } else {
        mat4.translate(obj.modelViewMatrix, obj.modelViewMatrix, [0, -0.01, 0]);
        i -= 0.01;
      }

      mat4.rotate(this.modelViewMatrix, this.modelViewMatrix, angle, rotationAxis);
    };

    return cube;
  }

function createShader(gl, str, type)
{
    var shader;
    if (type == "fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (type == "vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

function initShader(gl)
{
    // load and compile the fragment and vertex shader
    var fragmentShader = createShader(gl, fragmentShaderSource, "fragment");
    var vertexShader = createShader(gl, vertexShaderSource, "vertex");

    // link them together into a new program
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // get pointers to the shader params
    shaderVertexPositionAttribute = gl.getAttribLocation(shaderProgram, "vertexPos");
    gl.enableVertexAttribArray(shaderVertexPositionAttribute);

    shaderVertexColorAttribute = gl.getAttribLocation(shaderProgram, "vertexColor");
    gl.enableVertexAttribArray(shaderVertexColorAttribute);

    shaderProjectionMatrixUniform = gl.getUniformLocation(shaderProgram, "projectionMatrix");
    shaderModelViewMatrixUniform = gl.getUniformLocation(shaderProgram, "modelViewMatrix");

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }
}

function draw(gl, objs)
{
    // clear the background (with black)
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT  | gl.DEPTH_BUFFER_BIT);

    // set the shader to use
    gl.useProgram(shaderProgram);

    for(i = 0; i<objs.length; i++)
    {
        obj = objs[i];
        // connect up the shader parameters: vertex position, color and projection/model matrices
        // set up the buffers
        gl.bindBuffer(gl.ARRAY_BUFFER, obj.buffer);
        gl.vertexAttribPointer(shaderVertexPositionAttribute, obj.vertSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, obj.colorBuffer);
        gl.vertexAttribPointer(shaderVertexColorAttribute, obj.colorSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indices);

        gl.uniformMatrix4fv(shaderProjectionMatrixUniform, false, projectionMatrix);
        gl.uniformMatrix4fv(shaderModelViewMatrixUniform, false, obj.modelViewMatrix);

        // Draw the object's primitives using indexed buffer information.
        // void gl.drawElements(mode, count, type, offset);
        // mode: A GLenum specifying the type primitive to render.
        // count: A GLsizei specifying the number of elements to be rendered.
        // type: A GLenum specifying the type of the values in the element array buffer.
        // offset: A GLintptr specifying an offset in the element array buffer.
        gl.drawElements(obj.primtype, obj.nIndices, gl.UNSIGNED_SHORT, 0);
    }
}

function run(gl, objs)
{
    // The window.requestAnimationFrame() method tells the browser that you wish to perform an animation and requests that the browser call a specified function to update an animation before the next repaint. The method takes a callback as an argument to be invoked before the repaint.
    requestAnimationFrame(function() { run(gl, objs); });
    draw(gl, objs);

    for(i = 0; i<objs.length; i++)
        objs[i].update();
}
