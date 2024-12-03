/**
 * @Instructions
 * 		@task1 : Completed 
 * 		@task2 : Completed
 *      @task3: Completed
 *      @task4:
 * 		setMesh, draw, setAmbientLight, setSpecularLight and enableLighting functions
 */

function GetModelViewProjection(
  projectionMatrix,
  translationX,
  translationY,
  translationZ,
  rotationX,
  rotationY
) {
  var trans1 = [
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    translationX,
    translationY,
    translationZ,
    1,
  ];
  var rotatXCos = Math.cos(rotationX);
  var rotatXSin = Math.sin(rotationX);

  var rotatYCos = Math.cos(rotationY);
  var rotatYSin = Math.sin(rotationY);

  var rotatx = [
    1,
    0,
    0,
    0,
    0,
    rotatXCos,
    -rotatXSin,
    0,
    0,
    rotatXSin,
    rotatXCos,
    0,
    0,
    0,
    0,
    1,
  ];

  var rotaty = [
    rotatYCos,
    0,
    -rotatYSin,
    0,
    0,
    1,
    0,
    0,
    rotatYSin,
    0,
    rotatYCos,
    0,
    0,
    0,
    0,
    1,
  ];

  var test1 = MatrixMult(rotaty, rotatx);
  var test2 = MatrixMult(trans1, test1);
  var mvp = MatrixMult(projectionMatrix, test2);

  return mvp;
}

class MeshDrawer {
  // I initialize variables here that will be used for lighting.
  constructor() {
    this.prog = InitShaderProgram(meshVS, meshFS);
    this.mvpLoc = gl.getUniformLocation(this.prog, "mvp");
    this.showTexLoc = gl.getUniformLocation(this.prog, "showTex");
    this.colorLoc = gl.getUniformLocation(this.prog, "color");
    this.vertPosLoc = gl.getAttribLocation(this.prog, "pos");
    this.texCoordLoc = gl.getAttribLocation(this.prog, "texCoord");
    this.vertbuffer = gl.createBuffer();
    this.texbuffer = gl.createBuffer();
    this.numTriangles = 0;
    this.lightPosLoc = gl.getUniformLocation(this.prog, "lightPos");
    this.ambientLoc = gl.getUniformLocation(this.prog, "ambient");
    this.enableLightingLoc = gl.getUniformLocation(this.prog, "enableLighting");
    this.normalLoc = gl.getAttribLocation(this.prog, "normal");
    this.normalbuffer = gl.createBuffer();
    this.enableLightingFlag = false;
    //added for task 2
    this.ambientIntensity = 0.5;
    //added for task 3
    this.specularLoc = gl.getUniformLocation(this.prog, "specularIntensity");
    this.shininessLoc = gl.getUniformLocation(this.prog, "shininess");

    //I added default values for specular intensity and shininess
    this.specularIntensity = 0.1;
    this.shininess = 30.0;

  }

  setMesh(vertPos, texCoords, normalCoords) {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);
    // update texture coordinates
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
    this.numTriangles = vertPos.length / 3;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalCoords), gl.STATIC_DRAW);

    this.numTriangles = vertPos.length / 3;
  }

  draw(trans) {
    gl.useProgram(this.prog);
    gl.uniformMatrix4fv(this.mvpLoc, false, trans);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
    gl.enableVertexAttribArray(this.vertPosLoc);
    gl.vertexAttribPointer(this.vertPosLoc, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
    gl.enableVertexAttribArray(this.texCoordLoc);
    gl.vertexAttribPointer(this.texCoordLoc, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalbuffer);
    gl.enableVertexAttribArray(this.normalLoc);
    gl.vertexAttribPointer(this.normalLoc, 3, gl.FLOAT, false, 0, 0);
    updateLightPos();
    gl.uniform3f(this.lightPosLoc, lightX, lightY, 1.0);
    gl.uniform1f(this.ambientLoc, this.ambientIntensity);
    gl.uniform1i(this.enableLightingLoc, this.enableLightingFlag);
    gl.uniform1f(this.specularLoc, this.specularIntensity);
    gl.uniform1f(this.shininessLoc, this.shininess);
    gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
}

  setTexture(img) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);


    if (isPowerOf2(img.width) && isPowerOf2(img.height)) {
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MIN_FILTER,
        gl.LINEAR_MIPMAP_LINEAR
      );
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }

    gl.useProgram(this.prog);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    const sampler = gl.getUniformLocation(this.prog, "tex");
    gl.uniform1i(sampler, 0);
  }

  showTexture(show) {
    gl.useProgram(this.prog);
    gl.uniform1i(this.showTexLoc, show);
  }

  enableLighting(show) {
    this.enableLightingFlag = show;
    DrawScene(); 
}

setAmbientLight(ambient) {
  this.ambientIntensity = ambient;
  DrawScene(); 
}

setSpecularLight(intensity) {
  this.specularIntensity = intensity; 
  DrawScene();
}
}

function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}

function normalize(v, dst) {
  dst = dst || new Float32Array(3);
  var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  // make sure we don't divide by 0.
  if (length > 0.00001) {
    dst[0] = v[0] / length;
    dst[1] = v[1] / length;
    dst[2] = v[2] / length;
  }
  return dst;
}

// Vertex shader source code
const meshVS = `
			attribute vec3 pos; 
			attribute vec2 texCoord; 
			attribute vec3 normal;

			uniform mat4 mvp; 

			varying vec2 v_texCoord; 
			varying vec3 v_normal; 

			void main()
			{
				v_texCoord = texCoord;
				v_normal = normal;

				gl_Position = mvp * vec4(pos,1);
			}`;

// Fragment shader source code
/**
 * @Task2 : Updated the fragment shader
 */
const meshFS = `
    precision mediump float;

    uniform bool showTex;
    uniform bool enableLighting;
    uniform sampler2D tex;
    uniform vec3 color; 
    uniform vec3 lightPos;
    uniform float ambient;
    uniform float specularIntensity;
    uniform float shininess;

    varying vec2 v_texCoord;
    varying vec3 v_normal;
    varying vec3 v_fragPos;

    void main()
    {
        vec4 texColor = texture2D(tex, v_texCoord);
        
        if(showTex && enableLighting){
            // Ambient light
            vec3 ambientColor = texColor.rgb * ambient;
            
            // Diffuse lighting
            vec3 norm = normalize(v_normal);
            vec3 lightDir = normalize(lightPos - vec3(0.0, 0.0, 0.0));
            float diffuse = max(dot(norm, lightDir), 0.0);
            vec3 diffuseColor = texColor.rgb * diffuse;
            
            // Specular lighting (Phong reflection model)
            vec3 viewDir = normalize(vec3(0.0, 0.0, 1.0)); // Simplified view direction
            vec3 reflectDir = reflect(-lightDir, norm);
            
            float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
            vec3 specularColor = vec3(1.0) * spec * specularIntensity;
            
            // Combine lighting components
            vec3 finalColor = ambientColor + diffuseColor + specularColor;
            
            gl_FragColor = vec4(finalColor, texColor.a);
        }
        else if(showTex){
            gl_FragColor = texColor;
        }
        else{
            gl_FragColor = vec4(1.0, 0, 0, 1.0);
        }
    }`;
// Light direction parameters for Task 2
var lightX = 1;
var lightY = 1;

const keys = {};
function updateLightPos() {
  const translationSpeed = 1;
  if (keys["ArrowUp"]) lightY -= translationSpeed;
  if (keys["ArrowDown"]) lightY += translationSpeed;
  if (keys["ArrowRight"]) lightX -= translationSpeed;
  if (keys["ArrowLeft"]) lightX += translationSpeed;
}
///////////////////////////////////////////////////////////////////////////////////
