var duration = 5000; // ms
var currentTime = Date.now();
var projectionMatrix, modelViewMatrix;
var rotationAxis;

var shaderProgram, shaderVertexPositionAttribute, shaderVertexColorAttribute, 
    shaderProjectionMatrixUniform, shaderModelViewMatrixUniform, shaderSamplerUniform;

var okToRun = false;

var webGLTexture;

// Attributes: Input variables used in the vertex shader. Since the vertex shader is called on each vertex, these will be different every time the vertex shader is invoked.
// Uniforms: Input variables for both the vertex and fragment shaders. These do not change values from vertex to vertex.
// Varyings: Used for passing data from the vertex shader to the fragment shader. Represent information for which the shader can output different value for each vertex.
var vertexShaderSource =
    
    "    attribute vec3 vertexPos;\n" +
    "    attribute vec2 texCoord;\n" +
    "    uniform mat4 modelViewMatrix;\n" +
    "    uniform mat4 projectionMatrix;\n" +
    "    varying vec2 vTexCoord;\n" +
    "    void main(void) {\n" +
    "		// Return the transformed and projected vertex value\n" +
    "        gl_Position = projectionMatrix * modelViewMatrix * \n" +
    "            vec4(vertexPos, 1.0);\n" +
    "        // Output the texture coordinate in vTexCoord\n" +
    "        vTexCoord = texCoord;\n" +
    "    }\n";

var fragmentShaderSource = 
    "    precision mediump float;\n" +
    "    varying vec2 vTexCoord;\n" +
    "    uniform sampler2D uSampler;\n" + 
    "    void main(void) {\n" +
    "    gl_FragColor = texture2D(uSampler, vec2(vTexCoord.s, vTexCoord.t));\n" +
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

function initMatrices(canvas)
{
    // Create a model view matrix with object at 0, 0, -8
    modelViewMatrix = mat4.create();
    mat4.translate(modelViewMatrix, modelViewMatrix, [0, 0, -8]);

    // Create a project matrix with 45 degree field of view
    projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, Math.PI / 4, canvas.width / canvas.height, 1, 10000);

    rotationAxis = vec3.create();
    vec3.normalize(rotationAxis, [1, 1, 1]);
}

// Any power of 2 minus 1 is all ones: 2^N - 1 = 111...
// 8 = 1000.  8-1 = 7 (111)
// 1000 & 0111 = 0000
function isPowerOf2(value) 
{
    return (value & (value - 1)) == 0;
}

function handleTextureLoaded(gl, texture) {
    texture.generateMipmaps = false;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // Pixel storage mode, flips the source data along its vertical axis if true
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    // gl.texImage2D(target, level, internalformat, format, type, ImageData? pixels);
    // target: A GLenum specifying the binding point (target) of the active texture. Possible values: gl.TEXTURE_2D: A two-dimensional texture.
    // level: A GLint specifying the level of detail. Level 0 is the base image level and level n is the nth mipmap reduction level.
    // MIP mapping (also sometimes spelled as mipmapping) is a technique where an original high-resolution texture map is scaled and filtered into multiple resolutions within the texture file. Each scaled texture, or MIP level, represents what the texture would look like at a specific distance from the users viewpoint. The main purpose of this technique is to maintain texture definition on surfaces further from the camera.
    // internalformat: A GLenum specifying the color components in the texture.
    // format: A GLenum specifying the format of the texel data.
    // type: A GLenum specifying the data type of the texel data. Possible values: gl.UNSIGNED_BYTE: 8 bits per channel for gl.RGBA
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    
    if (isPowerOf2(texture.image.width) && isPowerOf2(texture.image.height))
    {
        // Yes, it's a power of 2. Generate mips.
        gl.generateMipmap(gl.TEXTURE_2D);

        // gl.NEAREST, which essentially tells WebGL to compute the pixel color based on scaling the original image up or down. With this option, textures look fine as long as they are not scaled up or down too much, but look blocky and pixelated when too close (scaled up) and jaggy and aliased when too far away (scaled down).
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    } 
    else
    {
        // No, it's not a power of 2. Turn of mips and set wrapping to clamp to edge        
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }

    // Set to null to avoid changing bits in the texture later.
    gl.bindTexture(gl.TEXTURE_2D, null);

    okToRun = true;
}

function initTexture(gl) {
    webGLTexture = gl.createTexture();
    webGLTexture.image = new Image();
    webGLTexture.image.onload = function () {
        handleTextureLoaded(gl, webGLTexture)
    }

    // webGLTexture.image.src = "webGlImages/57080046_turquoise-texture.jpg";
    webGLTexture.image.src = "webGlImages/jaguar.jpg";
}

// Create the vertex, color and index data for a multi-colored cube
function createCube(gl) 
{
    // Vertex Data
    var vertexBuffer;
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    var verts = [
        // Front face
        -1.0, -1.0,  1.0,
        1.0, -1.0,  1.0,
        1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0,

        // Back face
        -1.0, -1.0, -1.0,
        -1.0,  1.0, -1.0,
        1.0,  1.0, -1.0,
        1.0, -1.0, -1.0,

        // Top face
        -1.0,  1.0, -1.0,
        -1.0,  1.0,  1.0,
        1.0,  1.0,  1.0,
        1.0,  1.0, -1.0,

        // Bottom face
        -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, -1.0,  1.0,
        -1.0, -1.0,  1.0,

        // Right face
        1.0, -1.0, -1.0,
        1.0,  1.0, -1.0,
        1.0,  1.0,  1.0,
        1.0, -1.0,  1.0,

        // Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0,  1.0,
        -1.0,  1.0,  1.0,
        -1.0,  1.0, -1.0
        ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

    var texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);

    // Texture coordinates for each vertex. These are floating point pairs for each vertex, with values ranging from 0 to 1. These represent the x and y offsets into the image data.
    var textureCoords = [
        // Front face
        0.0, 0.0,
        0.5, 0.0,
        0.5, 0.5,
        0.0, 0.5,

        // 0.0, 0.0,
        // 1.0, 0.0,
        // 1.0, 1.0,
        // 0.0, 1.0,

        // Back face
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,

        // Top face
        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,

        // Bottom face
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0,

        // Right face
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,

        // Left face
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);

    // Index data (defines the triangles to be drawn)
    var cubeIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);
    var cubeIndices = [
        0, 1, 2,      0, 2, 3,    // Front face
        4, 5, 6,      4, 6, 7,    // Back face
        8, 9, 10,     8, 10, 11,  // Top face
        12, 13, 14,   12, 14, 15, // Bottom face
        16, 17, 18,   16, 18, 19, // Right face
        20, 21, 22,   20, 22, 23  // Left face
    ];
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeIndices), gl.STATIC_DRAW);
    
    var cube = {buffer:vertexBuffer, texCoordBuffer:texCoordBuffer, indices:cubeIndexBuffer,
            vertSize:3, nVerts:24, texCoordSize:2, nTexCoords: 24, nIndices:36,
            primtype:gl.TRIANGLES};
    
    return cube;
}

function createShader(gl, str, type) 
{
    var shader;
    if (type == "fragment") 
    {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (type == "vertex") 
    {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else 
    {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

function initShader(gl) {

    // load and compile the fragment and vertex shader
    //var fragmentShader = getShader(gl, "fragmentShader");
    //var vertexShader = getShader(gl, "vertexShader");
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

    shaderTexCoordAttribute = gl.getAttribLocation(shaderProgram, "texCoord");
    gl.enableVertexAttribArray(shaderTexCoordAttribute);
    
    shaderProjectionMatrixUniform = gl.getUniformLocation(shaderProgram, "projectionMatrix");
    shaderModelViewMatrixUniform = gl.getUniformLocation(shaderProgram, "modelViewMatrix");
    shaderSamplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
    
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }
}

function draw(gl, obj)
{
    // clear the background (with black)
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT  | gl.DEPTH_BUFFER_BIT);

    // set the shader to use
    gl.useProgram(shaderProgram);

    gl.bindBuffer(gl.ARRAY_BUFFER, obj.buffer);
    gl.vertexAttribPointer(shaderVertexPositionAttribute, obj.vertSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, obj.texCoordBuffer);
    gl.vertexAttribPointer(shaderTexCoordAttribute, obj.texCoordSize, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indices);

    gl.uniformMatrix4fv(shaderProjectionMatrixUniform, false, projectionMatrix);
    gl.uniformMatrix4fv(shaderModelViewMatrixUniform, false, modelViewMatrix);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, webGLTexture);
    
    // Tell the shader we bound the texture to texture unit 0
    gl.uniform1i(shaderSamplerUniform, 0);

    // draw the object
    gl.drawElements(obj.primtype, obj.nIndices, gl.UNSIGNED_SHORT, 0);
}

function animate() 
{
    var now = Date.now();
    var deltat = now - currentTime;
    currentTime = now;
    var fract = deltat / duration;
    var angle = Math.PI * 2 * fract;
    mat4.rotate(modelViewMatrix, modelViewMatrix, angle, rotationAxis);
}

function run(gl, cube) 
{
    requestAnimationFrame(function() { run(gl, cube); });
    if (okToRun)
    {
        draw(gl, cube);
        animate();
    }
}