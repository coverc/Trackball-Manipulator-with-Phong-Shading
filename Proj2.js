var canvas;
var gl;
var delay = 10;

var lightPos = vec4(1.0, 1.0, 1.0, 0.0);
var lightA = vec4(0.1, 0.1, 0.1, 1.0 );
var lightD = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightS = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialA = vec4( 0.5, 0.5, 0.5, 1.0 );
var materialD = vec4( 1.0, 0.8, 0.0, 1.0);
var materialS = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialShininess = 100.0;

var modelView;
var projectionMatrix;
var program;

var Quaternion;
var QuaternionLoc;

var  angle = 0.0;
var  axis = [0, 0, 1];

var tracking = false;
var trackball = false;

var last = [0, 0, 0];
var currentx, currenty;
var startX, startY;
var dx, dy, dz;

function mouseMove(x, y){

    var current = trackballPosition(x, y);
    if(tracking == true) {
      dx = current[0] - last[0];
      dy = current[1] - last[1];
      dz = current[2] - last[2];

      if (dx || dy || dz) {
	     angle = -2.0 * Math.sqrt(dx*dx + dy*dy + dz*dz);


	     axis[0] = last[1]*current[2] - last[2]*current[1];
	     axis[1] = last[2]*current[0] - last[0]*current[2];
	     axis[2] = last[0]*current[1] - last[1]*current[0];

         last[0] = current[0];
	     last[1] = current[1];
	     last[2] = current[2];
      }
    }
    if(trackball == true) {
          axis = normalize(axis);
          var cos = Math.cos(angle/2.0);
          var sin = Math.sin(angle/2.0);

          var rotation = vec4(cos, sin*axis[0], sin*axis[1], sin*axis[2]);
          Quaternion = multquaternion(Quaternion, rotation);

          gl.uniform4fv(QuaternionLoc, flatten(Quaternion));
        }
}

function MouseIsDown(x, y){
    tracking = true;
    trackball=true;
    last = trackballPosition(x,y);
}

function MouseIsUp(){
    tracking = false;
    trackball = false;
	angle = 0.0;
	trackball = false;
}

window.onload = function init() {
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.5, 0.5, 0.5, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    createTeapot();

    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(teapot[1]), gl.STATIC_DRAW );
    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(teapot[0]), gl.STATIC_DRAW );
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    projectionMatrix = ortho(-10, 10, -10, 10, -10, 10);

    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPos) );

    gl.uniformMatrix4fv( gl.getUniformLocation(program, "projectionMatrix"), false, flatten(projectionMatrix));

//quat
    Quaternion = vec4(1,0,0,0);
    QuaternionLoc = gl.getUniformLocation(program, "rotate");
    gl.uniform4fv(QuaternionLoc, flatten(Quaternion));

    canvas.addEventListener("mousedown", function(event){
        var x = 2*(event.pageX/canvas.width)-1;
        var y = 2*(canvas.height-event.pageY)/canvas.height-1;
        MouseIsDown(x, y);
    });

    canvas.addEventListener("mouseup", function(event){
        var x = 2*(event.pageX/canvas.width)-1;
        var y = 2*(canvas.height-event.pageY)/canvas.height-1;
        MouseIsUp(x, y);
    });

    canvas.addEventListener("mouseout", function(event){
        var x = 2*(event.pageX/canvas.width)-1;
        var y = 2*(canvas.height-event.pageY)/canvas.height-1;
        MouseIsUp(x, y);
    });

    canvas.addEventListener("mousemove", function(event){
        var x = 2*(event.pageX/canvas.width)-1;
        var y = 2*(canvas.height-event.pageY)/canvas.height-1;
        mouseMove(x, y);
    });

    render();
}

function createTeapot(){
    teapot = createTeapotGeometry(5);
}

function render(){

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var xlight = document.getElementById('lightX').value;
    var ylight = document.getElementById('lightY').value;
    var zlight = document.getElementById('lightZ').value;
    lightPos = vec4(xlight/100, ylight/100, zlight/100, 0.0);
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPos) );

    var rDiff = document.getElementById('Rdiff').value;
    var gDiff = document.getElementById('Gdiff').value;
    var bDiff = document.getElementById('Bdiff').value;
    materialD = vec4(rDiff/100, gDiff/100, bDiff/100, 1.0);

    var rSpec = document.getElementById('Rspec').value;
    var gSpec = document.getElementById('Gspec').value;
    var bSpec = document.getElementById('Bspec').value;
    materialS = vec4(rSpec/100, gSpec/100, bSpec/100, 1.0);

    materialShininess = (document.getElementById('shininessslider').value) * (-1);

    ambientProduct = mult(lightA, materialA);
    diffuseProduct = mult(lightD, materialD);
    specularProduct = mult(lightS, materialS);

    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct) );
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct) );
    gl.uniform1f(gl.getUniformLocation(program, "shininess"),materialShininess);

    modelView = mat4();

    gl.uniformMatrix4fv( gl.getUniformLocation(program, "modelViewMatrix"), false, flatten(modelView) );

    gl.drawArrays( gl.TRIANGLES, 0, 4800 );

    setTimeout(
            function (){requestAnimFrame(render);}, delay
        );
}

function ortho( left, right, bottom, top, near, far )
{
    var w = right - left;
    var h = top - bottom;
    var d = far - near;

    var matrixResult = mat4();
    matrixResult[0][0] = 2.0 / w;
    matrixResult[1][1] = 2.0 / h;
    matrixResult[2][2] = -2.0 / d;
    matrixResult[0][3] = -(left + right) / w;
    matrixResult[1][3] = -(top + bottom) / h;
    matrixResult[2][3] = -(near + far) / d;

    return matrixResult;
}

function multquaternion(w, v) {
   var s = vec3(w[1], w[2], w[3]);
   var t = vec3(v[1], v[2], v[3]);
   return(vec4(w[0]*v[0] - dot(s,t), add(cross(t, s), add(scale(w[0],t), scale(v[0],s)))));
}

function trackballPosition(x, y) {
    var d, a;
    var v = [];

    v[0] = x;
    v[1] = y;

    d = v[0]*v[0] + v[1]*v[1];
    if (d < 1.0)
      v[2] = Math.sqrt(1.0 - d);
    else {
      v[2] = 0.0;
      a = 1.0 /  Math.sqrt(d);
      v[0] *= a;
      v[1] *= a;
    }
    return v;
}
