/*
 * Kreator Engine Core
 * Developer: Yigit Koc
 * Version: 1.3.2
 * 
 */
/*
MIT License:

Copyright (c) 2020 Yigit Koc

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE. */


/* Constant Definitions */
/* Primitives */
const GL_POINTS = 0x0000;
const GL_LINES = 0x0001;
const GL_LINE_LOOP = 0x0002;
const GL_LINE_STRIP = 0x0003;
const GL_TRIANGLES = 0x0004;
const GL_TRIANGLE_STRIP = 0x0005;
const GL_TRIANGLE_FAN = 0x0006;
const KR_PRIMITIVES = [GL_POINTS, GL_LINES, GL_LINE_LOOP, GL_LINE_STRIP, GL_TRIANGLES, GL_TRIANGLE_STRIP, GL_TRIANGLE_FAN];

/* Buffers */
const GL_STATIC_DRAW = 0x88E4;  //Used often, updated sometimes
const GL_STREAM_DRAW = 0x88E0;  //Used sometimes
const GL_DYNAMIC_DRAW = 0x88E8; //Used and updated often
const GL_ARRAY_BUFFER = 0x8892; //Array type for buffer
const GL_ELEMENT_ARRAY_BUFFER = 0x8893; //Element array buffer
const GL_BUFFER_SIZE = 0x8764;  //Used to get buffer size
const GL_BUFFER_USAGE = 0x8765;

/* Clrearing Buffers */
const GL_DEPTH_BUFFER_BIT = 0x00000100;
const GL_STENCIL_BUFFER_BIT = 0x00000400;
const GL_COLOR_BUFFER_BIT = 0x00004000;

/* Shaders */
const GL_VERTEX_SHADER = 0x8B31;    //Define shader type vertex shade
const GL_FRAGMENT_SHADER = 0x8B30;  //Define shader type fragment shader
const GL_COMPILE_STATUS = 0x8B81;   //Compile status of shade
const GL_LINK_STATUS = 0x8B82;      //Link status of program

/* Blending Modes */
const GL_ZERO = 0;
const GL_ONE = 1;
const GL_SRC_COLOR = 0x0300;

/* Culling */
const GL_CULL_FACE = 0x0B44;
const GL_FRONT = 0x0404;
const GL_BACK = 0x0405;
const GL_FRONT_AND_BACK = 0x0408;
const GL_CW = 0x0900;
const GL_CCW = 0x0901;

/* Enable/Disable */
const GL_BLEND = 0x0BE2;
const GL_DEPTH_TEST = 0x0B71;
const GL_DITHER = 0x0BD0;
const GL_POLYGON_OFFSET_FILL = 0x8037;
const GL_SCISSOR_TEST = 0x0C11;
const GL_STENCIL_TEST = 0x0B90;




class Kreator{
    __app;
    __gl;
    __glprogram;
    static numComponents = 4;
    static normalize = false;
    static stride = 0;
    static offset = 0;
    static type = 0;
    static vert_loc = 0;
    static color_loc = 0;
    static normal_loc = 0;

    static model_loc = 0;
    static viewmat_loc = 0;
    static projection_loc = 0;
    static light_loc = 0;

    static ambient_loc = 0;
    static diffuse_loc = 0;
    static specular_loc = 0;
    static shininess_loc = 0;

    activeCamera = new KreatorCamera();
    lights = [new KreatorLight(new KreatorVector(4, [0, 600, -200, 1.0]))];
    scene = [];
    animations = {};
    buttons = {};
    /*
     * Setup webGL app
     * 
     * Parameters:
     * CanvasID: id of the canvas used to render app.
     */
    constructor(canvasID, opt_attribs){
        document.title = document.title + " | Created with Kreator Engine";
        let style = document.createElement('style');
        style.textContent = KreatorUIKIT;
        document.head.append(style);
        
        this.__app = document.querySelector(canvasID);
        if(!this.checkApp()) {
            KreatorLogger.fatal("Can't find canvas. Failed to create Kreator object.");
            this.__fatal = true;
            throw new KreatorError("Given Canvas ID is invalid.");
        }
        
        
        if(this.__app.width<480){
            KreatorLogger.info("Changing canvas width to 480, "+this.__app.width+" is too small for Kreator.");
            this.__app.width = 480;   
        }
        if(this.__app.height<480){
            KreatorLogger.info("Changing canvas height to 480, "+this.__app.height+" is too small for Kreator.");
            this.__app.height = 480;
        }
        if(opt_attribs === undefined ) opt_attribs = {enableKeys: true};
        if(opt_attribs.enableKeys === undefined) opt_attribs.enableKeys = true;
        if(opt_attribs.enableKeys){
            let krobj = this;
            document.addEventListener("keypress", function(event){
                krobj.keyEvent(event);
            }); 
        }

        if(KreatorLogger.__level > KreatorLogger.KL_DEBUG){
            this.attachKey(34, ()=>{
                if(this.freezeDraw){
                    KreatorLogger.info("Unfreezed scene!");
                }else{
                    KreatorLogger.info("Freezed scene!");
                }
                this.freezeDraw = !this.freezeDraw;
            });
        }
        
//        if(opt_attribs.enableMouse === undefined) opt_attribs.enableMouse = true;
//        if(opt_attribs.enableMouse){
//            
//        }
        
        this.__gl = this.__app.getContext("webgl2", opt_attribs);
        if(!this.__gl){
            KreatorLogger.fatal("Your browser does not support WebGL2.");
            this.__fatal = true;
            throw new KreatorError("Browser does not support WebGL2.");
        }
        this.__gl.canvas.width = this.__app.clientWidth;
        this.__gl.canvas.heigth = this.__app.clientHeight;
        // this.__gl.viewport(0, 0, this.__gl.canvas.width, this.__gl.canvas.height);
        this.__glprogram = this.__gl.createProgram();
        KreatorLogger.debug("Loading default shaders");
        this.loadDefaultShader(GL_VERTEX_SHADER);
        this.loadDefaultShader(GL_FRAGMENT_SHADER);
        KreatorLogger.debug("Loaded default shaders");
        KreatorLogger.debug("Linking WebGL2 program.");
        this.__gl.linkProgram(this.__glprogram);
        if(!this.__gl.getProgramParameter(this.__glprogram, GL_LINK_STATUS)){
            let status = this.__gl.getProgramInfoLog(this.__glprogram);
            KreatorLogger.fatal("Linking WebGL2 program failed. WebGL returned: "+status);
            this.__fatal = true;
            throw new KreatorError("Linking WebGL2 program failed. WebGL returned: "+status);
        }
        KreatorLogger.debug("Linked WebGL2 program successfully.");
        
        this.__gl.useProgram(this.__glprogram);
        KreatorLogger.debug("WebGL is using linked program.");
        Kreator.type = this.__gl.FLOAT;
        Kreator.vert_loc = this.__gl.getAttribLocation(this.__glprogram, "v_position");
        Kreator.normal_loc = this.__gl.getAttribLocation(this.__glprogram, "v_normal");
        // Kreator.color_loc = this.__gl.getAttribLocation(this.__glprogram, "v_color");
        // Kreator.color_loc = this.__gl.getAttribLocation(this.__glprogram, "v_color");

        Kreator.model_loc = this.__gl.getUniformLocation(this.__glprogram, "model");
        Kreator.viewmat_loc = this.__gl.getUniformLocation(this.__glprogram, "view");
        Kreator.projection_loc = this.__gl.getUniformLocation(this.__glprogram, "projection");
        Kreator.light_loc = this.__gl.getUniformLocation(this.__glprogram, "lightPos");
        Kreator.ambient_loc = this.__gl.getUniformLocation(this.__glprogram, "AmbientProduct");
        Kreator.diffuse_loc = this.__gl.getUniformLocation(this.__glprogram, "DiffuseProduct");
        Kreator.specular_loc = this.__gl.getUniformLocation(this.__glprogram, "SpecularProduct");
        Kreator.shininess_loc = this.__gl.getUniformLocation(this.__glprogram, "Shininess");


        this.shape_buffer =  this.__gl.createBuffer();
        this.__gl.bindBuffer(GL_ARRAY_BUFFER, this.shape_buffer);
        if(opt_attribs.foregroudColor === undefined) opt_attribs.foregroudColor = new KreatorColor("#000000ff");
        this.__gl.clearColor(
                opt_attribs.foregroudColor.getR(), 
                opt_attribs.foregroudColor.getG(), 
                opt_attribs.foregroudColor.getB(), 
                opt_attribs.foregroudColor.getA()
            );
        this.__gl.viewport(0, 0, this.__gl.drawingBufferWidth, this.__gl.drawingBufferHeight);
        this.__gl.enable(GL_DEPTH_TEST);
        this.__gl.frontFace(GL_CCW);
        this.__gl.enable(GL_CULL_FACE);
        this.__gl.cullFace(GL_BACK);
        this.__gl.depthFunc(this.__gl.LEQUAL);
        this.__gl.clearDepth(1.0);
        this.__gl.clear(GL_COLOR_BUFFER_BIT);
       
    }
    
    drawHead(){
        if(this.freezeDraw) return;
        this.__gl.clear(GL_COLOR_BUFFER_BIT);
    }
    
    addObjectToScene(o){
        this.scene = this.scene.concat(o);
    }
    
    bindCamera(c){
        if(c instanceof KreatorCamera){
            this.activeCamera = c;
        }
    }

    updateCamera(){
        if(this.freezeDraw) return;
        this.__gl.uniformMatrix4fv(Kreator.viewmat_loc, false, this.activeCamera.getViewMatrix());
        this.__gl.uniformMatrix4fv(Kreator.projection_loc, false, this.activeCamera.getProjectionMatrix());
        this.__gl.uniform4fv(Kreator.light_loc, this.lights[0].getPos());
    }


    drawScene(){
        if(this.freezeDraw) return;
        for(let i = 0; i<this.scene.length; i++){
            // this.scene[i].updateVertices();
            this.drawObject(this.scene[i]);
        }
    }
    
    drawObject(o){
        if(this.freezeDraw) return;
        if(o instanceof KreatorInstance){
            let instance = o.getInstance();
            let shape_vert = instance.getVertices();
            let shape_normals = instance.getNormals();
            // let shape_color = instance.getVerticesColors();
            let instanceC = o.instanceCount();
            let material = instance.material;
            let AmbientProduct = material.ambient.color.multiplyEach(this.lights[0].ambient.color);
            let DiffuseProduct = material.diffuse.color.multiplyEach(this.lights[0].diffuse.color);
            let SpecularProduct = material.specular.color.multiplyEach(this.lights[0].specular.color);
            AmbientProduct.set(3, 1.0);
            DiffuseProduct.set(3, 1.0);
            SpecularProduct.set(3, 1.0);

            this.__gl.bufferData(GL_ARRAY_BUFFER, new Float32Array(shape_vert.concat(shape_normals)), GL_DYNAMIC_DRAW);
            this.__gl.vertexAttribPointer( Kreator.vert_loc, Kreator.numComponents, Kreator.type, Kreator.normalize, Kreator.stride, Kreator.offset);
            this.__gl.enableVertexAttribArray(Kreator.vert_loc);
            this.__gl.vertexAttribPointer(Kreator.normal_loc, Kreator.numComponents, Kreator.type, Kreator.normalize, Kreator.stride, shape_vert.length*4);
            this.__gl.enableVertexAttribArray(Kreator.normal_loc);
            this.__gl.uniform4fv(Kreator.ambient_loc, AmbientProduct.toArray());
            this.__gl.uniform4fv(Kreator.diffuse_loc, DiffuseProduct.toArray());
            this.__gl.uniform4fv(Kreator.specular_loc, SpecularProduct.toArray());
            this.__gl.uniform1f(Kreator.shininess_loc, material.getShine());
            // this.__gl.vertexAttribPointer(Kreator.color_loc, KreatorColor.numComponents, Kreator.type, Kreator.normalize, Kreator.stride, shape_vert.length*4);
            // this.__gl.enableVertexAttribArray(Kreator.color_loc);
            for(let i = 0; i<instanceC; i++){
                let modelm = o.getModelMatrix(i);
                this.__gl.uniformMatrix4fv(Kreator.model_loc, false, modelm.toArray());
                this.__gl.drawArrays(instance.drawType, Kreator.offset, instance.getVerticesCount());
            }
            
        }else{
            let shape_vert = o.getVertices();
            // let shape_color = o.getVerticesColors();
            let shape_normals = o.getNormals();
            let modelm = o.getModelMatrix();
            let material = o.material;
            let AmbientProduct = material.ambient.color.multiplyEach(this.lights[0].ambient.color);
            let DiffuseProduct = material.diffuse.color.multiplyEach(this.lights[0].diffuse.color);
            let SpecularProduct = material.specular.color.multiplyEach(this.lights[0].specular.color);
            AmbientProduct.set(3, 1.0);
            DiffuseProduct.set(3, 1.0);
            SpecularProduct.set(3, 1.0);
            this.__gl.uniformMatrix4fv(Kreator.model_loc, false, modelm.toArray());
            this.__gl.bufferData(GL_ARRAY_BUFFER, new Float32Array(shape_vert.concat(shape_normals)), GL_DYNAMIC_DRAW);
            this.__gl.vertexAttribPointer( Kreator.vert_loc, Kreator.numComponents, Kreator.type, Kreator.normalize, Kreator.stride, Kreator.offset);
            this.__gl.enableVertexAttribArray(Kreator.vert_loc);
            this.__gl.vertexAttribPointer(Kreator.normal_loc, Kreator.numComponents, Kreator.type, Kreator.normalize, Kreator.stride, shape_vert.length*4);
            this.__gl.enableVertexAttribArray(Kreator.normal_loc);
            this.__gl.uniform4fv(Kreator.ambient_loc, AmbientProduct.toArray());
            this.__gl.uniform4fv(Kreator.diffuse_loc, DiffuseProduct.toArray());
            this.__gl.uniform4fv(Kreator.specular_loc, SpecularProduct.toArray());
            this.__gl.uniform1f(Kreator.shininess_loc, material.getShine());
            // this.__gl.vertexAttribPointer(Kreator.color_loc, KreatorColor.numComponents, Kreator.type, Kreator.normalize, Kreator.stride, shape_vert.length*4);
            // this.__gl.enableVertexAttribArray(Kreator.color_loc);
            this.__gl.drawArrays(o.drawType, Kreator.offset, o.getVerticesCount());
        }
    }

    drawActiveCamera(lookAt, pos){
        if(lookAt !== undefined){
            if(lookAt === true){
                this.drawObject(this.activeCamera.lookatcube);
            }
        }
    }


    
    loadDefaultShader(shaderType){
        if(this.checkApp()){
            if(shaderType === GL_VERTEX_SHADER){
                KreatorLogger.debug("Loading default vertex shader.");
                let vertexShader = this.__gl.createShader(GL_VERTEX_SHADER);
                this.__gl.shaderSource(vertexShader, KreatorDefaultShaders.vertex_shader);
                KreatorLogger.debug("Compiling default vertex shader.");
                this.__gl.compileShader(vertexShader);
                if( !this.__gl.getShaderParameter(vertexShader, GL_COMPILE_STATUS)){
                    let status = this.__gl.getShaderInfoLog(vertexShader);
                    KreatorLogger.error("WebGL compiler error: "+status);
                    throw new KreatorError("WebGL compiler Error: "+status);
                }
                KreatorLogger.debug("Compiled default vertex shader successfully");
                this.__gl.attachShader(this.__glprogram, vertexShader);
                KreatorLogger.debug("Attached default shader to program.");
                return;
            }else if(shaderType === GL_FRAGMENT_SHADER){
                KreatorLogger.debug("Loading default fragment shader.");
                let fragmentShader = this.__gl.createShader(GL_FRAGMENT_SHADER);
                this.__gl.shaderSource(fragmentShader, KreatorDefaultShaders.fragment_shader);
                KreatorLogger.debug("Compiling default fragment shader");
                this.__gl.compileShader(fragmentShader);
                if( !this.__gl.getShaderParameter(fragmentShader, GL_COMPILE_STATUS)){
                    let status = this.__gl.getShaderInfoLog(fragmentShader);
                    KreatorLogger.error("WebGL compiler error: "+status);
                    throw new KreatorError("WebGL compiler Error: "+status);
                }
                KreatorLogger.debug("Compiled default fragment shader successfully");
                this.__gl.attachShader(this.__glprogram, fragmentShader);
                KreatorLogger.debug("Attached default fragment shader successfully");
                return;
            }
            KreatorLogger.info("Shader type is not specified or not valid.");
        }else{
            KreatorLogger.error("App is not available.");
        }
        
    }
    
    attachKey(charCode, callback){
        let key = "k"+charCode;
        if(!this.animations.hasOwnProperty(key)){
            this.animations[key] = callback;
        }
        KreatorLogger.debug("Key "+charCode+" attached to "+callback.name+".");
    }
    
    keyEvent(e){
        let key = "k"+e.which;
        KreatorLogger.info("Key pressed: "+event.which);
        if(this.animations.hasOwnProperty(key)){
            this.animations[key]();
        }
    }
    
    appWidth(){
    
        return this.__app.clientWidth;
    }

    appHeight(){
        return this.__app.clientHeight;
    }
    attachButton(btnID, callback){
        document.getElementById(btnID).addEventListener("click", function(){callback();});
    }
    
    checkApp(){
        if(!this.__app){
            return false;
        }else{
            return true;
        }
    }
    
}

//Default shaders
class KreatorDefaultShaders{
    static fragment_shader = `#version 300 es
    precision mediump float;

    in mediump vec3 fN;
    in mediump vec3 fV;
    in mediump vec3 fL;
   
    uniform vec4 AmbientProduct, DiffuseProduct, SpecularProduct;
    uniform float Shininess;

    out vec4 o_color; 

    void main(){
        vec3 N = normalize(fN);
        vec3 V = normalize(fV);
        vec3 L = normalize(fL);
        vec3 H = normalize(L+V);

        vec4 ambient = AmbientProduct;

        float Kd = max(dot(L, N), 0.0);
        vec4 diffuse = Kd*DiffuseProduct;

        float Ks = pow(max(dot(N,H), 0.0), Shininess);
        vec4 specular = Ks*SpecularProduct;

        if(dot(L,N)<0.0) specular = vec4(0.0, 0.0, 0.0, 1.0);
 
        if(false){
            o_color = vec4(1.0,1.0,1.0,1.0);
        }else{
            o_color = ambient+diffuse+specular;
            o_color.a = 1.0;

        }
    }
    `;
                                
    static vertex_shader = `#version 300 es
    
     in vec4 v_position;
     in vec4 v_normal;

     out mediump vec3 fN;
     out mediump vec3 fV;
     out mediump vec3 fL;
    
     uniform mat4 model;
     uniform mat4 view;
     uniform vec4 lightPos;
    //  uniform vec4 cameraPos;
     uniform mat4 projection;
                                
     void main(){
        
        mat4 modelview = view*model;
        mat4 normalmat = mat4(transpose(inverse(modelview)));
        fN = (normalmat*v_normal).xyz;
        fV = -(modelview*v_position).xyz;
        fL = lightPos.xyz;

        if(lightPos.w != 0.0){
            fL = lightPos.xyz-fV;
        }

        gl_Position = projection*view*model*v_position;
     }
    `;
}

/* shapes */
class KreatorShape{
    position = new KreatorVector(Kreator.numComponents);
    pivot = new KreatorVector(Kreator.numComponents);
    size = new KreatorVector(3, [1,1,1]);
    normalPoints;
    normals = [];
    color = [new KreatorColor("#ff0000ff")];
    rotation = new KreatorVector(3);
    drawType = GL_TRIANGLES;
    material = KreatorMaterial.defaultMaterial();

    constructor(vertexCount, size, pos, color, pivot, primitive){
        if(pos instanceof KreatorVector){
            if(pos.dimension >= 3){
                this.position.setFromVec(pos);
                if(pos.dimension === 3){
                    this.position.set(3, 0.0);
                }
            }
        }
        if(size instanceof KreatorVector){
            if(size.dimension >= 2){
                this.size.setFromVec(size);
            }
        }
        if(color){
            this.color = color;
        }
        if(pivot instanceof KreatorVector){
            if(pivot.dimension >= 3){
                this.pivot.setFromVec(pivot);
                if(pivot.dimension === 3){
                    this.pivot.set(3, 0.0);
                }
            }
        }
        if(primitive !== undefined){
            if(KR_PRIMITIVES.includes(primitive)) this.drawType = primitive;
        }


        this.normalPoints = new KreatorMatrix(vertexCount, Kreator.numComponents);
//        this.updateVertices();
    }

    /**
     * 
     * @param {KreatorVector} v 
     */
    pushNormalPoint(v){
        if(v.dimension !== this.normalPoints.columns){
            throw new KreatorError("Vector dimension doesn't match with the matrix columns. \n v:"+v+"\n vertices: ");
        }
        this.normalPoints.append(v);
    }

    generateNormals(){
        for(let i = 0; i<this.normalPoints.rows; i=i+3){
            let vert0 = this.normalPoints.getRowAsVector(i);
            vert0 = vert0.multiplyBy(-1);
            let vert1 = this.normalPoints.getRowAsVector(i+1);
            let vert2 = this.normalPoints.getRowAsVector(i+2);
            let v1 = vert1.add(vert0);
            let v2 = vert2.add(vert0);
            let normal = v2.cross3D(v1);
            let normals = normal.toArray();
            this.normals.push(normals[0]);
            this.normals.push(normals[1]);
            this.normals.push(normals[2]);
            this.normals.push(0.0);
            this.normals.push(normals[0]);
            this.normals.push(normals[1]);
            this.normals.push(normals[2]);
            this.normals.push(0.0);
            this.normals.push(normals[0]);
            this.normals.push(normals[1]);
            this.normals.push(normals[2]);
            this.normals.push(0.0);
        }
    }
    
    getNormals(){
        return this.normals;
    }

    setNormalPoints(int_array){
        if(int_array.length>this.normalPoints.rows*this.normalPoints.columns){
            this.normalPoints = new KreatorMatrix(int_array.length/Kreator.numComponents, Kreator.numComponents);
        }
        this.normalPoints.setFromArray(int_array);
    }
    
    getModelMatrix(){
        let pivotMatrix = new KreatorMatrix(4,4, [
            1,0,0,this.pivot.get(0),
            0,1,0,this.pivot.get(1),
            0,0,1,this.pivot.get(2),
            0,0,0,1
        ]);
        let scalingMatrix = new KreatorMatrix(4,4,[
            this.size.get(0), 0, 0, 0,
            0, this.size.get(1), 0, 0,
            0, 0, this.size.get(2), 0,
            0, 0, 0, 1
        ]);

        

        let translationMatrix = new KreatorMatrix(4,4,[
            1, 0, 0, this.position.get(0),
            0, 1, 0, this.position.get(1),
            0, 0, 1, this.position.get(2),
            0, 0, 0, 1
        ]);
        
        return translationMatrix.multiplyByMat(this.rotationMatrix().multiplyByMat(pivotMatrix)).multiplyByMat(scalingMatrix).transpose();
    }

    rotationMatrix(){
        let c = new KreatorVector(3,
            [
                Math.cos(this.rotation.get(0)),
                Math.cos(this.rotation.get(1)),
                Math.cos(this.rotation.get(2))
            ]);
            
        let s = new KreatorVector(3, [
            Math.sin(this.rotation.get(0)),
            Math.sin(this.rotation.get(1)),
            Math.sin(this.rotation.get(2))
        ]);
            
        //Transform: Rorate
        let rx = new KreatorMatrix( 4, 4, 
        [
            1, 0, 0, 0,
            0, c.get(0), -s.get(0), 0,
            0, s.get(0), c.get(0), 0,
            0, 0, 0, 1
        ]);
        let ry = new KreatorMatrix(4,4, [
            c.get(1), 0, s.get(1), 0,
            0, 1, 0, 0,
            -s.get(1), 0, c.get(1), 0,
            0, 0, 0, 1
        ]);
        let rz = new KreatorMatrix(4,4, [
            c.get(2), -s.get(2), 0, 0,
            s.get(2), c.get(2), 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);

        return rx.multiplyByMat(ry).multiplyByMat(rz);
    }

    
    getVertices(){
        return this.normalPoints.toArray();
    }
    
    getVerticesCount(){
        return this.normalPoints.rows;
    }
    
    setColorArray(c_arr){
        this.color = c_arr;
    }
    
    getVerticesColors(){
        var vertexColors = [];
        for(let i = 0; i<this.normalPoints.rows; i++){
            let colori = 0;
            if(i < this.color.length) colori = i;
            vertexColors = vertexColors.concat(this.color[colori].getColor().toArray());
        };
        return vertexColors;
    }
    
    rotate(s){
        this.rotation.set(0,this.rotation.get(0)+s.get(0)*Math.PI/180);
        this.rotation.set(1,this.rotation.get(1)+s.get(1)*Math.PI/180);
        this.rotation.set(2,this.rotation.get(2)+s.get(2)*Math.PI/180);
    }

    resize(coeff){
        this.size = this.size.multiplyBy(coeff);
    }

    /**
     * 
     * @param {KreatorMaterial} m 
     */
    setMaterial(m){
        this.material = m;
    }

    /*
     * 
     * @param {KreatorVector} vect
     */
    move(vect){
        if(vect.dimension === this.position.dimension){
            this.position = this.position.add(vect);
        }
    }
    
    toString(){
        return "Pos: "+this.position+"\n"+
               "Size: "+this.size+"\n"+
               "Pivot pos: "+this.pivot+"\n"+
               "Colors: "+this.color;
    }
    
    static createQuad(p0, p1, p2, p3){
        let quadPts = [];
        quadPts = quadPts.concat(p0, p1, p2);
        quadPts = quadPts.concat(p0, p2, p3);
        return quadPts;
    }
}

class KreatorOBJ extends KreatorShape{
    objLoaded = false;
    file = "";
    lines = [];
    vertexData = [];
    vnormalData = [];
    tcoordData = [];
    //TODO: implement .obj parser
    static keywords = {
        v(o, parts){ o._kwV(parts) },
        vn(o, parts){ o._kwVN(parts) },
        vt(o, parts){ o._kwVT(parts) },
        f(o, parts){ o._kwF(parts) }
    };
    static _keywordRE = /(\w*)(?: )*(.*)/;

    constructor(file, size, pos, color, pivot){
        super(0, size, pos, color, pivot, GL_TRIANGLES);
        this.objLoaded = false;
        this.file = file;
        KreatorLogger.debug("Model created: "+file)
    }

    async objLoad(){
        let response = await fetch(this.file);
        let content = await response.text();
        this.lines = content.split('\n');
        this._parseContent();
    }

    _parseContent(){
        KreatorLogger.debug("Parsing obj data.");
        for (let i = 0; i < this.lines.length; ++i) {
            let line = this.lines[i].trim();
            if(line === '' || line.startsWith('#')) continue;
            let m = KreatorOBJ._keywordRE.exec(line);
            if(!m) continue;
            let [, keyword, unparsedArgs] = m;
            let parts = line.split(/\s+/).slice(1);
            let handler = KreatorOBJ.keywords[keyword];
            if(!handler){
                KreatorLogger.warn("Keyword not handled: "+keyword+ ", on: "+(i+1));
                continue;
            }
            handler(this, parts, unparsedArgs);
        }
        this.objLoaded = true;
        KreatorLogger.debug("Parsed obj data");
    }

    _kwV(parts){
        let coord = parts.map(parseFloat);
        this.vertexData = this.vertexData.concat(new KreatorVector(4, [coord[0] ? coord[0] : 0.0, coord[1] ? coord[1] : 0.0, coord[2] ? coord[2] : 0.0, 1]));
    }

    _kwVN(parts){
        let coord = parts.map(parseFloat);
        this.vnormalData = this.vnormalData.concat(new KreatorVector(4, [coord[0] ? coord[0] : 0.0, coord[1] ? coord[1] : 0.0, coord[2] ? coord[2] : 0.0, 1]));
    }

    _kwVT(parts){
        let coord = parts.map(parseFloat);
        this.tcoordData = this.tcoordData.concat(new KreatorVector(4, [coord[0] ? coord[0] : 0.0, coord[1] ? coord[1] : 0.0, coord[2] ? coord[2] : 0.0, 1]));
    }

    _kwF(parts){
        if(parts.length === 3){
            let numTrig = parts.length - 2;
            for (let i = 0; i < numTrig; ++i) {
                this._parseTrig(parts[0], parts[i+1], parts[i+2]);
            }
        }else if(parts.length === 4){
            let quad = this._parseQuad(parts[0], parts[1], parts[2], parts[3]);
        }
        
    }

    _parseTrig(vert0, vert1, vert2){
        let errorVertI = 0;
        let vert = "";
        try{
            let verts = [vert1.trim(), vert0.trim(), vert2.trim()];
            for(let i = 0; i<verts.length; i++){
                let ptn = verts[i].split('/');
                if(ptn.length>0 && ptn[0]-1<this.vertexData.length){
                    errorVertI = i;
                    vert = verts[i];
                    super.pushNormalPoint(this.vertexData[ptn[0]-1]);
                }
            }
            
        }catch(e){
            KreatorLogger.error(e.message+"\n error on vert: "+i+"  "+vert);
        }
    }

    _parseQuad(vert0, vert1, vert2, vert3){
        let errorVertI = 0;
        let vert = "";
        try{
            let verts = [vert0, vert1, vert2, vert3];
            let quadV = [];
            for(let i = 0; i<verts.length; i++){
                let ptn = verts[i].split('/');
                if(ptn.length>0 && (ptn[0]-1)<this.vertexData.length){
                    errorVertI = i;
                    vert = verts[i];
                    quadV = quadV.concat(this.vertexData[ptn[0]-1]);
                }
            }   
            let quadToPush = KreatorShape.createQuad(quadV[0], quadV[3], quadV[2], quadV[1]);
            for(let i = 0; i<quadToPush.length; i++){
                errorVertI = i;
                super.pushNormalPoint(quadToPush[i]);
            }
            
        }catch(e){
            KreatorLogger.error(e.message+"\n error on vert: "+i+"  "+vert);
        }
    }
}

class KreatorComposite2D{
    position = new KreatorVector(Kreator.numComponents);
    pivot = new KreatorVector(Kreator.numComponents);
    rotation = new KreatorVector(3);
    composites = [];
    
    constructor(pos,  pivot){
        if(pos instanceof KreatorVector){
            if(pos.dimension >= 3){
                this.position.setFromVec(pos);
                if(pos.dimension === 3){
                    this.position.set(3, 0.0);
                }
            }
        }
        
        if(pivot instanceof KreatorVector){
            if(pivot.dimension >= 3){
                this.pivot.setFromVec(pivot);
                if(pivot.dimension === 3){
                    this.pivot.set(3, 0.0);
                }
            }
        }
        this.updateVertices();
    }
    
    attachObject(o){
        let objectOriginalPos = o.position.multiplyBy(1);
        objectOriginalPos.set(3, 0.0);
        let compositePos = this.position.multiplyBy(1);
        compositePos.set(3, 0);
        let compositePivot = this.pivot.multiplyBy(1);
        compositePivot.set(3, 0);
        o.position = compositePos;
        o.position.set(3, 0.0);
        o.pivot = compositePivot.add(objectOriginalPos.multiplyBy(-1));
        o.pivot.set(3,0.0);
        o.updateVertices();
        KreatorLogger.debug(o.toString());
        this.composites = this.composites.concat(o);
    }
    
    getObject(i){
        if(i>=this.composites.length){
            throw new KreatorFunctionError("Invalid index for composite");
        }
        return this.composites[i];
    }
    
    updateVertices(){
        for(let i = 0; i<this.composites.length; i++){
            this.composites[i].updateVertices();
        }
    }
    
    getVertices(i){
        if(i>=this.composites.length){
            throw new KreatorFunctionError("Invalid index for composite");
        }
        return this.composites[i].getVertices();
    }
    
    getVerticesCount(i){
        if(i>=this.composites.length){
            throw new KreatorFunctionError("Invalid index for composite");
        }
        return this.composites[i].getVerticesCount();
    }
    
    getVerticesColors(i){
        if(i>=this.composites.length){
            throw new KreatorFunctionError("Invalid index for composite");
        }
        return this.composites[i].getVerticesColors();
    }
    
    rotate(s){
        this.rotation.set(0,this.rotation.get(0)+s.get(0)*Math.PI/180);
        this.rotation.set(1,this.rotation.get(1)+s.get(1)*Math.PI/180);
        this.rotation.set(2,this.rotation.get(2)+s.get(2)*Math.PI/180);
        for(let i = 0; i<this.composites.length; i++){
            this.composites[i].rotate(s);
        }
//        this.updateVertices();
    }

    resize(coeff){
        for(let i = 0; i<this.composites.length; i++){
            this.composites[i].pivot = this.composites[i].pivot.multiplyBy(coeff);
            this.composites[i].resize(coeff);
        }
//        this.updateVertices();
    }

    /*
     * 
     * @param {KreatorVector} vect
     */
    move(vect){
        if(vect.dimension === this.position.dimension){
            this.position = this.position.add(vect);
            for(let i = 0; i<this.composites.length; i++){
                this.composites[i].move(vect);
            }
        }
    }
    
    toString(){
        return "Pos: "+this.position+"\n"+
               "Size: "+this.size+"\n"+
               "Pivot pos: "+this.pivot+"\n";
    }
    
}

class KreatorRectangle2D extends KreatorShape{

    /*
     * 
     * @param {KreatorVec} size
     * @param {KreatorVec} pos
     * @param {KreatorMatrix} color
     * @param {KreatorVec} pivot
     * @returns {KreatorTriangle2D}
     */
    constructor(size, pos, color, pivot){
        super(4, size, pos, color, pivot, GL_TRIANGLE_STRIP);
        super.setNormalPoints([
            -1/2, 1/2, 0, 1,
            1/2, 1/2, 0, 1,
            -1/2, -1/2, 0, 1,
            1/2, -1/2, 0, 1
        ]);
        KreatorLogger.debug("\nRectangle created:\n"+this);
    }
}

class KreatorTriangle2D extends KreatorShape{
    
    /*
     * 
     * @param {KreatorVec} size
     * @param {KreatorVec} pos
     * @param {KreatorMatrix} color
     * @param {KreatorVec} pivot
     * @returns {KreatorTriangle2D}
     */
    constructor(size, pos, color, pivot){
        super(3, size, pos, color, pivot);
        this.setNormalPoints([
            0, 2/3, 0.0, 1.0,
            -1/2, -1/3, 0.0, 1.0,
            1/2, -1/3, 0.0, 1.0
        ]);
        KreatorLogger.debug("\nTriangle created:\n"+this);
    }
}

class KreatorCircular2D extends KreatorShape{
    static resolution = 30;
    /*
     * 
     * @param {KreatorVec} size
     * @param {KreatorVec} pos
     * @param {KreatorMatrix} color
     * @param {KreatorVec} pivot
     * @returns {KreatorTriangle2D}
     */
    constructor(size, pos, color, pivot){
        
        super(KreatorCircular2D.resolution, size, pos, color, pivot, GL_TRIANGLE_FAN);
        let radian = Math.PI/180;
        let step = 360.0/(KreatorCircular2D.resolution-2);
        let normPointArray = [];
        normPointArray = normPointArray.concat([0, 0, 0, 1]);
        for(let i = 0; i<KreatorCircular2D.resolution-1; i++){
            normPointArray = normPointArray.concat([1/2*Math.cos(i*step*radian), 1/2*Math.sin(i*step*radian), 0.0, 1.0]);
        }
        super.setNormalPoints(normPointArray);
        KreatorLogger.debug("\nCircular 2D object created:\n"+this);
    }
    
}

class KreatorRectangularPrism extends KreatorShape{
    /*
     * 
     * @param {KreatorVec} size
     * @param {KreatorVec} pos
     * @param {KreatorMatrix} color
     * @param {KreatorVec} pivot
     * @returns {KreatorTriangle2D}
     */
    constructor(size, pos, color, pivot, type){
        super(type === GL_TRIANGLES ? 36 : 14, size, pos, color, pivot, type === GL_TRIANGLES ? type : GL_TRIANGLE_STRIP);
        let pts = [
                [1/2, -1/2, -1/2, 1],   //0
                [1/2, 1/2, -1/2, 1],    //1
                [1/2, -1/2, 1/2, 1],    //2
                [1/2, 1/2, 1/2, 1],     //3
                [-1/2, -1/2, -1/2, 1],  //4
                [-1/2, 1/2, -1/2, 1],   //5
                [-1/2, 1/2, 1/2, 1],    //6
                [-1/2, -1/2, 1/2, 1]    //7
            ];
        let normPointArray = [];
        if(type === GL_TRIANGLES){
            normPointArray = normPointArray.concat(KreatorShape.createQuad(pts[4], pts[0], pts[1], pts[5])); //ff
            normPointArray = normPointArray.concat(KreatorShape.createQuad(pts[0], pts[2], pts[3], pts[1])); //rf
            normPointArray = normPointArray.concat(KreatorShape.createQuad(pts[2], pts[7], pts[6], pts[3])); //baf
            normPointArray = normPointArray.concat(KreatorShape.createQuad(pts[4], pts[5], pts[6], pts[7])); //lf
            normPointArray = normPointArray.concat(KreatorShape.createQuad(pts[0], pts[4], pts[7], pts[2])); //bof
            normPointArray = normPointArray.concat(KreatorShape.createQuad(pts[1], pts[3], pts[6], pts[5])); //tf

            let color_arr = [];
            for(let f = 0; f<6; f++){
                if(f<color.length){
                    color_arr = color_arr.concat(color[f], color[f], color[f], color[f], color[f], color[f]);
                }else{
                    color_arr = color_arr.concat(
                            color[color.length-1], color[color.length-1], color[color.length-1], 
                            color[color.length-1], color[color.length-1], color[color.length-1]
                                    );
                }
            }
            super.setColorArray(color_arr);
        }else{
            
            normPointArray = normPointArray.concat(pts[3]); //0
            normPointArray = normPointArray.concat(pts[2]); //1
            normPointArray = normPointArray.concat(pts[6]); //2
            normPointArray = normPointArray.concat(pts[7]); //3
            normPointArray = normPointArray.concat(pts[4]); //4
            normPointArray = normPointArray.concat(pts[2]); //5
            normPointArray = normPointArray.concat(pts[0]); //6
            normPointArray = normPointArray.concat(pts[3]); //7
            normPointArray = normPointArray.concat(pts[1]); //8
            normPointArray = normPointArray.concat(pts[6]); //9
            normPointArray = normPointArray.concat(pts[5]); //10
            normPointArray = normPointArray.concat(pts[4]); //11
            normPointArray = normPointArray.concat(pts[1]); //12
            normPointArray = normPointArray.concat(pts[0]); //13
            
        }
        super.setNormalPoints(normPointArray);
        KreatorLogger.debug("\nRectangular prism created:\n"+this);
    }
}

class KreatorPyramid extends KreatorShape{
    constructor(size, pos, color, pivot, type){
//        KreatorLogger.debug(WebGL2RenderingContext.getParameter("READ_BUFFER"));
        super(type === GL_TRIANGLES ? 18 : 8, size, pos, color, pivot, type === GL_TRIANGLES ? type : GL_TRIANGLE_STRIP);
        let pts = [
            [0, 1, 0, 1],        //0
            [-1/2, 0, -1/2, 1],   //1
            [1/2, 0, -1/2, 1],    //2
            [1/2, 0, 1/2, 1],   //3
            [-1/2, 0, 1/2, 1]   //4
        ];
        let normPointArray = [];
        if(type === GL_TRIANGLES){
            normPointArray = normPointArray.concat(pts[0], pts[1], pts[2]); //ff
            normPointArray = normPointArray.concat(pts[0], pts[2], pts[3]); //rf
            normPointArray = normPointArray.concat(pts[0], pts[3], pts[4]); //baf
            normPointArray = normPointArray.concat(pts[0], pts[4], pts[1]); //lf
            normPointArray = normPointArray.concat(KreatorShape.createQuad(pts[1], pts[4], pts[3], pts[2])); //bof
            
            let color_arr = [];
            for(let f = 0; f<6; f++){
                if(f<color.length){
                    color_arr = color_arr.concat(color[f], color[f], color[f]);
                }else{
                    color_arr = color_arr.concat(color[color.length-1], color[color.length-1], color[color.length-1]);
                }
            }
            super.setColorArray(color_arr);
        }else{     
            normPointArray = normPointArray.concat(pts[1]); //0
            normPointArray = normPointArray.concat(pts[0]); //1
            normPointArray = normPointArray.concat(pts[2]); //2
            normPointArray = normPointArray.concat(pts[3]); //3
            normPointArray = normPointArray.concat(pts[1]); //4
            normPointArray = normPointArray.concat(pts[4]); //5
            normPointArray = normPointArray.concat(pts[0]); //6
            normPointArray = normPointArray.concat(pts[3]); //6           
        }
        super.setNormalPoints(normPointArray);
        KreatorLogger.debug("\nRectangular prism created:\n"+this);
    }
}

/* Elements */
class KreatorCamera{
    position = new KreatorVector(4, [0,0,0,0]);
    lookAt = new KreatorVector(4, [1.5,1.5,0,0]);
    lookatcube = undefined;
    track = false;
    up = new KreatorVector(3, [0,1,0]);
    fov = 55; //in mm lens
    near = 1;
    far = 1000;
    rotation = new KreatorVector(4, [0,0,0,0]);
    width = 480;
    height = 480;
    aspectRatio = 1;
    /**
     * 
     * @param {KreatorVector} position 
     * @param {KreatorVec} lookAt 
     * @param {number} fov 
     * @param {number} rotation 
     */
    constructor(position, lookAt, fov, frameWidth, frameHeight, optAtt){
        if(position instanceof KreatorVector){
            if(position.dimension == this.position.dimension){
                this.position.setFromArray(position.toArray());
                this.position.set(3, 0);
            }
            
        }

        if(lookAt instanceof KreatorVector){
            if(lookAt.dimension == this.lookAt.dimension){
                this.lookAt.setFromArray(lookAt.toArray());
                this.lookAt.set(3, 0);
            }
        }
        if(frameWidth !== undefined){
            this.width = frameWidth;
        }
        if(frameHeight !== undefined){
            this.heigth = frameHeight;
        }
        this.aspectRatio = this.width/this.height;
        if(fov > -1 && fov < 361){
            this.fov = fov;
        }

        if(optAtt !== undefined){
            if(optAtt.track !== undefined){
                if(optAtt.track === true){
                    this.track = true;
                }
            }
        }
        this.lookatcube = new KreatorRectangularPrism(
            new KreatorVector(4, [2, 2, 2, 0]),
            this.lookAt.multiplyBy(-1),
            [new KreatorColor("#ffffffa2")],
            new KreatorVector(4),
            GL_TRIANGLES
        );
    }

    getViewMatrix(){
        let viewM = this.lookAtMatrix();
        return viewM.transpose().toArray();
    }

    getProjectionMatrix(){
        let fovdeg = 2*Math.atan(24/(2*this.fov));
        let top = this.near*Math.tan(fovdeg);
        let right = top*this.aspectRatio;
        let left = -right;
        let bottom = -top;
        let projection = new KreatorMatrix(4,4,[
           2*this.near/(right-left),0,(right+left)/(right-left),0,
           0,2*this.near/(top-bottom),(top+bottom)/(top-bottom),0,
           0,0,-(this.far+this.near)/(this.far-this.near), 2*this.far*this.near/(this.far-this.near),
           0,0,-1,1
        ]);
        return projection.toArray();
    }

    
    /*
     * 
     * @param {KreatorVector} vect
     */
    move(vect){
        if(vect.dimension === this.lookAt.dimension){
            if(this.track){
                this.position = this.position.add(vect.multiplyBy(-1));
                this.lookAt = this.lookAt.add(vect.multiplyBy(-1));
                this.lookatcube.move(vect);
            }else{
                let from = new KreatorVector(3);
                from.setFromVec(this.position);
                let to = new KreatorVector(3);
                to.setFromVec(this.lookAt);

                let cameraAxis = this.lookAtMatrix();
                let relVect = cameraAxis.multiplyByVec(vect);
                this.position = this.position.add(relVect.multiplyBy(-1));
            }
        }
    }

    moveForward(unit){
        KreatorLogger.debug(this.position);
        KreatorLogger.debug(this.lookAt);
        let cameraDispVector = this.lookAt.add(this.position.multiplyBy(-1)).normalize();

        this.position = this.position.add(cameraDispVector.multiplyBy(unit));
        if(!this.track){
            this.lookAt = this.lookAt.add(cameraDispVector.multiplyBy(unit));
            this.lookatcube.move(cameraDispVector.multiplyBy(-unit))
        }
    }


    rotate(rot){
        if(this.track){
            this.orbit(rot);
        }else{
            this.pyr(rot);
        }
    }

    pyr(rot){
        if(rot.dimension === this.position.dimension){
            let focusVect = this.lookAt.add(this.position.multiplyBy(-1));
            let n = this.cameraN();
            let u = this.cameraU();
            let v = this.cameraV();
            if(this.up.angleBetween(n)<Math.PI/180*10 ){
                KreatorLogger.info("Hit 0 deg");
                KreatorLogger.debug("n: "+n+" | up:" + this.up)
                if(rot.get(0)<0){
                    rot.set(0, 0);
                }
                // this.up.set(1,-this.up.get(1));
            }else if(this.up.angleBetween(n)>170*Math.PI/180){
                if(rot.get(0)>0){
                    rot.set(0, 0);
                }
            }
            let rotation = rot.multiplyBy(Math.PI/180);
            let rotationMatrixU = this.rotationMatrixVect(rotation.get(0), u);
            let rotationMatrixV = this.rotationMatrixVect(rotation.get(1), v); 
            let rotationMatrixRoll = this.rotationMatrix(new KreatorVector(4, [0, 0, rotation.get(2), 0]));
            let upNormalize = new KreatorVector(4);
            upNormalize.setFromVec(this.up);
            this.up.setFromVec(rotationMatrixRoll.multiplyByVec(upNormalize));
            let rotm = rotationMatrixU.multiplyByMat(rotationMatrixV); 
            let newFocusVect = rotm.multiplyByVec(focusVect);
            this.lookAt = this.position.add(newFocusVect); 
            this.lookatcube.position = this.lookAt.multiplyBy(-1);
        }
    }

    orbit(rot){
        if(rot.dimension === this.position.dimension){
            let focusVect = this.position.add(this.lookAt.multiplyBy(-1));
            let n = this.cameraN();
            let u = this.cameraU();
            let v = this.cameraV();
            if(this.up.angleBetween(n)<Math.PI/180*10 ){
                KreatorLogger.info("Hit 0 deg");
                KreatorLogger.debug("n: "+n+" | up:" + this.up)
                if(rot.get(0)<0){
                    rot.set(0, 0);
                }
                // this.up.set(1,-this.up.get(1));
            }else if(this.up.angleBetween(n)>170*Math.PI/180){
                if(rot.get(0)>0){
                    rot.set(0, 0);
                }
            }
            let rotation = rot.multiplyBy(Math.PI/180);
            let rotationMatrixU = this.rotationMatrixVect(rotation.get(0), u);
            let rotationMatrixV = this.rotationMatrixVect(rotation.get(1), v); 
            let rotationMatrixRoll = this.rotationMatrix(new KreatorVector(4, [0, 0, rotation.get(2), 0]));
            let upNormalize = new KreatorVector(4);
            upNormalize.setFromVec(this.up);
            this.up.setFromVec(rotationMatrixRoll.multiplyByVec(upNormalize));
            let rotm = rotationMatrixU.multiplyByMat(rotationMatrixV); 
            let newFocusVect = rotm.multiplyByVec(focusVect);
            this.position = this.lookAt.add(newFocusVect); 
        }
    }

    rotationMatrixVect(rotation, v){
        let c = Math.cos(rotation);
        let s = Math.sin(rotation);
        v = v.normalize();
        let x = v.get(0);
        let y = v.get(1);
        let z = v.get(2);

        let r = new KreatorMatrix(4,4, [
            c+Math.pow(x, 2)*(1-c),     x*y*(1-c)-z*s,  x*z*(1-c)+y*s,  0,
            y*x*(1-c)+z*s,      c+Math.pow(y, 2)*(1-c), y*z*(1-c)-x*s,  0,
            z*x*(1-c)-y*s,  z*y*(1-c)+x*s,  c+Math.pow(z, 2)*(1-c),     0,
            0,               0,                     0,                  1,
        ]);
        return r;
    }

    rotationMatrix(rotation){
        let c = new KreatorVector(3,
            [
                Math.cos(rotation.get(0)),
                Math.cos(rotation.get(1)),
                Math.cos(rotation.get(2))
            ]);
            
        let s = new KreatorVector(3, [
            Math.sin(rotation.get(0)),
            Math.sin(rotation.get(1)),
            Math.sin(rotation.get(2))
        ]);
            
        //Transform: Rorate
        let rx = new KreatorMatrix( 4, 4, 
        [
            1, 0, 0, 0,
            0, c.get(0), -s.get(0), 0,
            0, s.get(0), c.get(0), 0,
            0, 0, 0, 1
        ]);
        let ry = new KreatorMatrix(4,4, [
            c.get(1), 0, s.get(1), 0,
            0, 1, 0, 0,
            -s.get(1), 0, c.get(1), 0,
            0, 0, 0, 1
        ]);
        let rz = new KreatorMatrix(4,4, [
            c.get(2), -s.get(2), 0, 0,
            s.get(2), c.get(2), 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);

        return rx.multiplyByMat(ry).multiplyByMat(rz);
    }

    /**
     * 
     * @param {KreatorVector} from 
     * @param {KreatorVector} to 
     */
    lookAtMatrix(){
        let eye = new KreatorVector(3);
        eye.setFromVec(this.position);
        let center = new KreatorVector(3);
        center.setFromVec(this.lookAt);

        let n = eye.add(center.multiplyBy(-1)).normalize();
        let u = this.up.cross3D(n).normalize();
        let v = n.cross3D(u).normalize();
        // this.up = v;

        let lookAtMatrix = new KreatorMatrix(4,4,[
            u.get(0), u.get(1), u.get(2), u.dot(eye),
            v.get(0), v.get(1), v.get(2), v.dot(eye),
            n.get(0), n.get(1), n.get(2), n.dot(eye),
            0, 0, 0, 1
        ]);

        return lookAtMatrix;
    }


    /**
     * camera axis Y
     */
    cameraV(){
        let eye = new KreatorVector(3);
        eye.setFromVec(this.position);
        let center = new KreatorVector(3);
        center.setFromVec(this.lookAt);

        let n = eye.add(center.multiplyBy(-1)).normalize();
        let u = this.up.cross3D(n).normalize();
        let v = n.cross3D(u).normalize();

        return v;
    }

    /**
     * camera axis x
     */
    cameraU(){
        let eye = new KreatorVector(3);
        eye.setFromVec(this.position);
        let center = new KreatorVector(3);
        center.setFromVec(this.lookAt);

        let n = eye.add(center.multiplyBy(-1)).normalize();
        let u = this.up.cross3D(n).normalize();

        return u;
    }

    /**
     * camera axis z
     */
    cameraN(){
        let eye = new KreatorVector(3);
        eye.setFromVec(this.position);
        let center = new KreatorVector(3);
        center.setFromVec(this.lookAt);

        let n = eye.add(center.multiplyBy(-1)).normalize();

        return n;
    }

    cameraAxis(){
        let eye = new KreatorVector(3);
        eye.setFromVec(this.position);
        let center = new KreatorVector(3);
        center.setFromVec(this.lookAt);

        let n = eye.add(center.multiplyBy(-1)).normalize();
        let u = this.up.cross3D(n).normalize();
        let v = n.cross3D(u).normalize();

        let lookAtMatrix = new KreatorMatrix(4,4,[
            u.get(0), u.get(1), u.get(2), 0,
            v.get(0), v.get(1), v.get(2), 0,
            n.get(0), n.get(1), n.get(2), 0,
            0, 0, 0, 1
        ]);

        return lookAtMatrix;
    }
}

class KreatorInstance{
    positions = [new KreatorVector(4, [0,0,0,0])];
    rotations = [new KreatorVector(4, [0,0,0,0])];
    pivots = [new KreatorVector(4, [0,0,0,0])];
    scales = [new KreatorVector(4, [1,1,1,0])];
    object;
    constructor(object, positions, scales, rotations, pivots){
        if(positions instanceof Array){
            this.positions = positions;
        }
        if(scales instanceof Array){
            this.scales = scales;
        }
        if(rotations instanceof Array){
            this.rotations = rotations;
        }
        if(pivots instanceof Array){
            this.pivots = pivots;
        }
        this.object = object;
    }

    getInstance(){
        return this.object;
    }

    instanceCount(){
        return this.positions.length;
    }

    getVertices(){
        return this.object.getVertices();
    }

    getModelMatrix(i){
        let pivot;
        if(i<this.pivots.length && i>=0){
            pivot = this.pivots[i];
        }else{
            pivot = this.pivots[0];
        }
        let pivotMatrix = new KreatorMatrix(4,4, [
            1,0,0,pivot.get(0),
            0,1,0,pivot.get(1),
            0,0,1,pivot.get(2),
            0,0,0,1
        ]);

        let scale;
        if(i<this.scales.length && i>=0){
            scale = this.scales[i];
        }else{
            scale = this.scales[0];
        }
        let scalingMatrix = new KreatorMatrix(4,4,[
            scale.get(0), 0, 0, 0,
            0, scale.get(1), 0, 0,
            0, 0, scale.get(2), 0,
            0, 0, 0, 1
        ]);

        let position;
        if(i<this.positions.length && i>=0){
            position = this.positions[i];
        }else{
            position = this.positions[0];
        }
        let translationMatrix = new KreatorMatrix(4,4,[
            1, 0, 0, position.get(0),
            0, 1, 0, position.get(1),
            0, 0, 1, position.get(2),
            0, 0, 0, 1
        ]);
        
        return translationMatrix.multiplyByMat(this.rotationMatrix(i).multiplyByMat(pivotMatrix)).multiplyByMat(scalingMatrix).transpose();
    }

    rotationMatrix(i){
        let rotation;
        if(i<this.rotations.length && i>=0){
            rotation = this.rotations[i];
        }else{
            rotation = this.rotations[0];
        }
        let c = new KreatorVector(3,
            [
                Math.cos(rotation.get(0)),
                Math.cos(rotation.get(1)),
                Math.cos(rotation.get(2))
            ]);
            
        let s = new KreatorVector(3, [
            Math.sin(rotation.get(0)),
            Math.sin(rotation.get(1)),
            Math.sin(rotation.get(2))
        ]);
            
        //Transform: Rorate
        let rx = new KreatorMatrix( 4, 4, 
        [
            1, 0, 0, 0,
            0, c.get(0), -s.get(0), 0,
            0, s.get(0), c.get(0), 0,
            0, 0, 0, 1
        ]);
        let ry = new KreatorMatrix(4,4, [
            c.get(1), 0, s.get(1), 0,
            0, 1, 0, 0,
            -s.get(1), 0, c.get(1), 0,
            0, 0, 0, 1
        ]);
        let rz = new KreatorMatrix(4,4, [
            c.get(2), -s.get(2), 0, 0,
            s.get(2), c.get(2), 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);

        return rx.multiplyByMat(ry).multiplyByMat(rz);
    }
}

class KreatorMaterial{
    shine = 10.0;
    diffuse = new KreatorColor('#ff0000ff');
    specular = new KreatorColor('#020202ff');
    ambient = new KreatorColor('#af0000ff');
    emission = new KreatorColor('#ffffffff');
    texture;
    normal;
    bump;
    

    constructor(){

    }

    /**
     * 
     * @param {KreatorColor} c 
     */
    setDiffuse(c){
        this.diffuse = c;
    }

    /**
     * 
     * @param {KreatorColor} c 
     */
    setSpecular(c){
        this.specular = c;
    }

    /**
     * 
     * @param {KreatorColor} c 
     */
    setAmbient(c){
        this.ambient = c;
    }

    /**
     * 
     * @param {number} s 
     */
    setShine(s){
        this.shine = s;
    }

    getDiffuse(){
        return this.diffuse.toArray();
    }

    getSpecular(){
        return this.specular.toArray();
    }

    getAmbient(){
        return this.ambient.toArray();
    }

    getEmission(){
        return this.emission.toArray();
    }

    getShine(){
        return this.shine;
    }
    
    static defaultMaterial(){
        return new KreatorMaterial();
    }
}

//TODO: light types, currently point
class KreatorLight{
    pos = new KreatorVector(4, [10,200,0,0]);
    diffuse = new KreatorColor([1,1,1,1]);
    specular = new KreatorColor([1,1,1,1]);
    ambient = new KreatorColor([0.25,0.25,0.25,1.0]);
    emission = new KreatorColor('#ffffffff');

    constructor(pos){
        if(pos instanceof KreatorVector){
            if(pos.dimension === 4){
                this.pos = pos;
            }
        }
    }

    /**
     * 
     * @param {KreatorColor} c 
     */
    setDiffuse(c){
        this.diffuse = c;
    }

    /**
     * 
     * @param {KreatorColor} c 
     */
    setSpecular(c){
        this.specular = c;
    }

    /**
     * 
     * @param {KreatorColor} c 
     */
    setAmbient(c){
        this.ambient = c;
    }


    /**
     * 
     * @param {KreatorVector} v 
     */
    move(v){
        let transform = new KreatorMatrix(4,4, [
            1,0,0,v.get(0),
            0,1,0,v.get(1),
            0,0,1,v.get(2),
            0,0,0,1
        ]);
        this.pos = transform.multiplyByVec(this.pos);
    }

    getDiffuse(){
        return this.diffuse.toArray();
    }

    getSpecular(){
        return this.specular.toArray();
    }

    getAmbient(){
        return this.ambient.toArray();
    }

    getEmission(){
        return this.emission.toArray();
    }

    getPos(){
        return this.pos.toArray();
    }

}

/* Data Types */
class KreatorVector{
    dimension = 0;
    vec = [];
    /**
     * 
     * @param {number} dimension 
     * @param {Array} array 
     */
    constructor(dimension, array){
        if(dimension<1){
            throw new KreatorLAError("Vector size can't be smaller than 1!");
        }
        
        this.vec = [];
        for(let i = 0; i<dimension; i++){
            this.vec = this.vec.concat(0);
        }
        this.dimension = dimension;
        
        if(array !== undefined){
            this.setFromArray(array);
        }
    }
    
    /** 
     * This method was used for changing values. Deparced, use set().
     * @param {number} index
     * @param {number} value
     */
    change(index, value){
        this.set(index, value);
    }
    
    /**
     * Set value in index to value
     * @param {number} index
     * @param {number} value
     */
    set(index, value){
        if(index >= this.dimension){
            throw new KreatorFunctionError("Index doesn't exist in vector!");
        }
        this.vec[index] = value;
    }
    
    toArray(){
        return this.vec;
    }
    
    /**
     * 
     * @param {KreatorVector} v2
     */
    setFromVec(v2){
        for(let i = 0; i<this.dimension; i++){
            if(i<v2.dimension){
                this.set(i, v2.get(i));
            }
        }
    }
    
    setFromArray(arr){
        if(arr.length >= this.dimension){
            for(let i = 0; i<this.dimension; i++){
                this.set(i, arr[i]);
            }
        }else{
            throw new KreatorLAError("Array size is smaller than dimension.");
        }
    }
    
    /*
     * Get value on index i. Deparced, use get().
     * @param {number} i
     * @returns {Array}
     */
    getValue(i){
        this.get(i);
    }
    
    /**
     * Get value on index
     * @param {number} index
     * @returns {number} 
     */
    get(index){
        if(index >= this.dimension){
            throw new KreatorFunctionError("Index doesn't exist in vector!");
        }
        return this.vec[index];
    }
    
    /**
     * Multiply vector with number x
     * @param {number} x
     * @returns {KreatorVec}
     */
    multiplyBy(x){
        let vf = new KreatorVector(this.dimension);
        for(let i = 0; i<vf.dimension; i++){
            vf.set(i, this.get(i)*x);
        }
        return vf;
    }

    multiplyEach(v2){
        if(this.dimension !== v2.dimension) throw new KreatorError("Dimensions don't match!");
        let a = new KreatorVector(this.dimension);
        for(let i=0;i<this.dimension;i++){
            a.set(i, this.vec[i]*v2.get(i));
        }

        return a;
    }
    
    /**
     * Vector addition with v2
     * @param {KreatorVector} v2
     * @returns {KreatorVector}
     */
    add(v2){
        if(this.dimension !== v2.dimension){
            throw new KreatorLAError("Vector addition is only possible with vectors that have same dimensions!");
        }
        let vf = new KreatorVector(this.dimension);
        for(let i = 0; i<vf.dimension; i++){
            vf.set(i, this.get(i)+v2.get(i));
        }
        return vf;
    }
    
    /**
     * Dot product with v2
     * @param {int} v2
     * @returns {number}
     */
    dot(v2){
        if(this.dimension !== v2.dimension){
            throw new KreatorLAError("Vector dot product is only possible with vectors that have same dimensions!");
        }
        let product = 0;
        for(let i = 0; i<this.dimension; i++){
            product = product + this.get(i) * v2.get(i);
        }
        return product;
    }
    
    /**
     * Cross product of 2 3D vectors
     * @param {KreatorVector} v2
     * @returns {KreatorVector}
     */
    cross3D(v2){
        if(this.dimension < 3 || v2.dimension < 3){
            KreatorLogger.error("V1: "+this+" | v2: "+ v2);
            throw new KreatorLAError("cross3D is only possible with 3 dimensional vectors!");
        }
        let vf = new KreatorVector(3);
        vf.set(0, (this.get(1)*v2.get(2) - v2.get(1)*this.get(2)));
        vf.set(1, (v2.get(0)*this.get(2) - this.get(0)*v2.get(2)));
        vf.set(2, (this.get(0)*v2.get(1) - v2.get(0)*this.get(1)));
        return vf;
    }
    
    /**
     * returns length of vector
     * @returns {number}
     */
    length(){
        let l = 0;
        for(let i = 0; i<this.dimension; i++){
            l = l+Math.pow(this.get(i), 2);
        }
        l = Math.sqrt(l);
        return l;
    }

    /**
     * 
     * @param {KreatorVector} v2 
     */
    angleBetween(v2){
        if(this.dimension !== v2.dimension ){
            throw new KreatorLAError("Angle between two vectors is not possible! v1.dim: "+this.dimension+"  v2.dim: "+v2.dimension);
        }
        let dotp = this.dot(v2);
        let lenp = this.length() * v2.length();
        return Math.acos(dotp/lenp);
    }   

    /**
     * 
     * @param {KreatorVector} v2 
     */
    projectOn(v2){
        if(this.dimension !== v2.dimension ){
            throw new KreatorLAError("Projection is not possible!");
        }
        let v2normalize = v2.normalize();
        return this.dot(v2normalize)/(this.length()*v2.length())*this.length()*v2normalize;
    }
    
    /**
     * Normalized vector of vector
     * @returns {KreatorVector}
     */
    normalize(){
        let len = this.length();
        if(len !== 0){
            let u = this.multiplyBy(1/len);
            return u;
        }else{
            return new KreatorVector(this.dimension);
        }
    }
    
    toString(){
        let ret = "<"+this.get(0);
        for(let i = 1; i<this.dimension; i++){
            ret = ret+", "+this.get(i);
        }
        ret = ret+">";
        return ret;
    }
    
    append(val){
        this.dimension++;
        this.vec.push(val);
    }

    /**
     * check if 2 vectors are identical
     * -1 means dimensions are different
     * 1 means vectors are not identical
     * 0 means vectors are identical
     * @param {KreatorVector} v2
     * @returns {number}
     */
    isIdentical(v2){
        if(this.dimension !== v2.dimension) return -1;
        for(let i = 0; i<this.dimension; i++){
            if(this.get(i) !== v2.get(i)){
                return 1;
            }
        }
        return 0;
    }
}

class KreatorMatrix{
    
    /**
     * +----->i
     * |
     * |
     * v
     * j
     * @param {number} rows
     * @param {number} columns
     * @returns {KreatorMatrix}
     */
    constructor(rows, columns, int_array){
        this.mat = [];
        this.rows = rows;
        this.columns = columns;
        

        if(int_array === undefined ){
            for(let j = 0; j<this.rows; j++){
                for(let i = 0; i<this.columns; i++) this.mat.push(0);
            }
        }else{
            if(int_array.length < this.rows*this.columns) throw new KreatorError("Given array has a size less than matrix specified");
            for(let j = 0; j<this.rows; j++){
                for(let i = 0; i<this.columns; i++){
                    this.mat.push(int_array[j*this.columns+i]);
                }
            }
            
        }
    }
    
    toArray(){
    
        return this.mat;
    }
    
    /**
     * append vector to the rows
     * @param {KreatorVector} v 
     */
    append(v){
        if(v.dimension != this.columns) throw new KreatorError("Dimension doesn't match with column count!");
        this.rows = this.rows+1;
        let arr = v.toArray();
        for(let i = 0; i<arr.length; i++) this.mat.push(arr[i]);
    }

    /**
     * Set values from matrix m2
     * @param {KreatorMatrix} mat2
     */
    setFromMat(mat2){
        
    }
    
    setFromArray(arr){
        for(let j = 0; j<this.rows; j++){
            for(let i = 0; i<this.columns;i++){
                if(j*this.columns+i < arr.length){
                    this.mat[j*this.columns+i] = arr[j*this.columns+i];
                }else{
                    if(i<4){
                        this.change(j, i, 0);
                    }else{
                        this.change(j, i, 1);
                    }
                    
                }
                
            }
        }
    }
    
    /**
     * Addition of 2 matrices
     * @param {KreatorMatrix} m2
     * @returns {KreatorMatrix}
     */
    add(m2){
        if(this.isIdentical(m2) === -1){
            throw new KreatorLAError("Matrices have different dimensions! Matrix addition is only possible with matrices having same dimensions.");
        }
        let ma = new KreatorMatrix(this.rows, this.columns);
        for(let j = 0; j<this.rows; j++){
            let r1 = this.getRowAsVector(j);
            let r2 = m2.getRowAsVector(j);
            let ra = r1.add(r2);
            ma.setRow(j, ra);
        }
        return ma;
    }
    
    /**
     * 
     * @param {number} i
     * @param {number} j
     * @returns {number}
     */
    getValue(j, i){
        return this.mat[j].getValue(i);
    }

    change(j,i,val){
        this.mat[j*this.columns+i] = val;
    }
    
    set(j, i, val){
        this.mat[j*this.columns+i] = val;
    }
    
    /**
     * Set row from vector v
     * @param {number} j
     * @param {KreatorVector} v
     * @returns {undefined}
     */
    setRow(j, v){
        if(this.columns !== v.dimension){
            throw new KreatorLAError("Matrix's column count and vector's dimension can't be different");
        }
        for(let i = 0; i<this.columns; i++){
            this.mat[j*this.columns+i] = v.get(i);
        }
    }
    
    get(j, i){
        return this.mat[j*this.columns+i];
    }
    
    getRowAsVector(j){
        let a = [];
        for(let i = 0; i<this.columns; i++) a.push(this.mat[j*this.columns+i]);
        let v = new KreatorVector(this.columns, a);
        return v;
    }
    
    /**
     * 
     * @param {number} j
     * @returns {KreatorVector}
     */
    getColAsVector(i){
        let vr = new KreatorVector(this.rows);
        for(let j = 0; j<this.rows; j++){
            vr.change(j, this.get(j,i));
        }
        return vr;
    }
    
    /**
     * Get row as vector
     * @param {number} j
     * @returns {KreatorVector}
     */
    getRow(j){
        let a = [];
        for(let i = 0; i<this.columns; i++) a.push(this.mat[j][i]);
        return a;
    }
    
    /**
     * Get column as vector
     * @param {number} i
     * @returns {KreatorVector}
     */
    getColumn(i){
        let colV = new KreatorVector(this.rows);
        for(let j = 0; j<this.rows; j++){
            colV.set(j, this.get(j,i));
        }
        return colV;
    }
    
    /**
     * 
     * @param {number} x
     * @returns {KreatorMatrix}
     */
    multiplyBy(x){
        let mf = new KreatorMatrix(this.rows, this.columns);
        for(let j = 0; j<this.rows; j++){
            let v = this.getRowAsVector(j);
            v = v.multiplyBy(x);
            mf.setRow(j, v);
        }
        return mf;
    }
    
    /**
     * 
     * @param {KreatorVector} vx
     * @returns {KreatorVector}
     */
    multiplyByVec(vx){
        if(vx.dimension !== this.columns){
            throw new KreatorLAError("Matrix multipliccation with vector is possible if matrix's column count is equal to vector's dimension!");
        }
        let vm = new KreatorVector(this.rows);
        for(let i = 0; i<this.rows; i++){
            let vr = this.getRowAsVector(i);
            vm.set(i, vr.dot(vx));
        }
        return vm;
    }
    
    /**
     * 
     * @param {KreatorMatrix} m2
     * @returns {KreatorMatrix}
     */
    multiplyByMat(m2){
        if(this.columns !== m2.rows){
            throw new KreatorLAError("Matrix multiplication with another matrix is only possible if m1's column count is equal to m2's row count");
        }
        let mm = new KreatorMatrix(this.rows, m2.columns);
        for(let j = 0; j<this.rows; j++){
            let v1 = this.getRowAsVector(j);
            for(let i = 0; i<m2.columns; i++){
                let v2 = m2.getColumn(i);
                mm.set(j, i, v1.dot(v2));
            }
        }
        return mm;
    }
    
    /**
     * @returns {KreatorMatrix}
     */
    transpose(){
        let tmp = new KreatorMatrix(this.columns, this.rows);
        for(let j = 0; j<this.rows; j++){
            for(let i =0; i<this.columns; i++){
                tmp.set(i, j, this.get(j, i));
            }
        }
        return tmp;
    }


    /**
     * Check if 2 matrices are identical.
     * -1 means dimensions are not same
     * 1 means matrices are not identical but dimensions are same
     * 0 means matrices are identical
     * @param {KreatorMatrix} m2
     * @returns {number}
     */
    isIdentical(m2){
        if(this.rows !== m2.rows || this.columns !== m2.columns ){
            return -1;
        }
        for(let j = 0; j<this.rows; j++){
            let r1 = this.getRowAsVector(j);
            let r2 = m2.getRowAsVector(j);
            if(r1.isIdentical(r2) !== 0){
                return 1;
            }
        }
        return 0;
    }
    
    toString(){
        let ret = "\nMatrix:\n";
        for(let j = 0; j<this.rows; j++){
            let row = "|\t";
            for(let i = 0; i<this.columns; i++){
                row = row+this.get(j,i)+"\t";
            }
            row = row+"|";
            ret = ret+ row + "\n";
        }
        return ret;
    }
}

class KreatorColor{
    static numComponents = 4;
    color = new KreatorVector(4);
    constructor(val){
        let colorArr = [];
        let alpha = 1.0;
        if(val instanceof Array){
            if(val.length === 3 || val.length === 4){
                alpha = 1.0;
                for(let i = 0; i<val.length; i++){
                    if(i<3){
                        colorArr = colorArr.concat(val[i]);
                    }else{
                        alpha = val[i];
                    }
                }
            }
        }else{
            let c;
            if(/^#([A-Fa-f0-9]{4}){1,2}$/.test(val)){
                c= val.substring(1).split('');
                if(c.length === 3){
                    c= [c[0], c[0], c[1], c[1], c[2], c[2]];
                }
                c= '0x'+c.join('');
                colorArr = [((c>>24)&255)/255.0, ((c>>16)&255)/255.0, ((c>>8)&255)/255.0];
                alpha = (c&255)/255.0;
            }else if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(val)){
                c= val.substring(1).split('');
                if(c.length === 3){
                    c= [c[0], c[0], c[1], c[1], c[2], c[2]];
                }
                c= '0x'+c.join('');
                colorArr = [((c>>16)&255)/255.0, ((c>>8)&255)/255.0, (c&255)/255.0];
                alpha = 1.0;
            }else{
                KreatorLogger.error("Given value for color is not correct!");
                throw new KreatorError("Given value for color is not correct!");
            }
        }
        colorArr = colorArr.concat(alpha);
        this.color.setFromArray(colorArr);
    }
    
    getColor(){
        return this.color;
    }

    toArray(){
        return this.color.toArray();
    }
    
    toString(){
        let color = this.color.toArray();
        return 'KreatorColor['+color.join(',')+']';
    }
    
    getR(){
        return this.color.get(0);
    }
    
    getG(){
        return this.color.get(1);
    }
    
    getB(){
        return this.color.get(2);
    }
    
    getA(){
        return this.color.get(3);
    }
}

/* Supporters */

/* Logger */
class KreatorLogger{
    static KL_SILENT = 0;
    static KL_FATAL = 1;
    static KL_ERROR = 2;
    static KL_WARN = 3;
    static KL_INFO = 4;
    static KL_DEBUG = 5;
    static KL_TEST = 6;
    static __level = KreatorLogger.KL_ERROR;
    
    static setLogLevel(level){
        switch(level){
            case KreatorLogger.KL_SILENT: KreatorLogger.__level = KreatorLogger.KL_SILENT;
                    return;
            case KreatorLogger.KL_FATAL: KreatorLogger.__level = KreatorLogger.KL_FATAL;
                    return;
            case KreatorLogger.KL_ERROR: KreatorLogger.__level = KreatorLogger.KL_ERROR;
                    return;
            case KreatorLogger.KL_WARN: KreatorLogger.__level = KreatorLogger.KL_WARN;
                    return;
            case KreatorLogger.KL_INFO: KreatorLogger.__level = KreatorLogger.KL_INFO;
                    this.info("Log level changed to INFO");
                    return;
            case KreatorLogger.KL_DEBUG: KreatorLogger.__level = KreatorLogger.KL_DEBUG;
                    this.info("Log level changed to DEBUG");
                    return;
            case KreatorLogger.KL_TEST: KreatorLogger.__level = KreatorLogger.KL_TEST;
                    this.info("Log level changed to TEST");
                    return;
            default: KreatorLogger.__level = KreatorLogger.KL_ERROR;
                    return;
        }
     
    };
    
    static test(msg){
      if(this.__level < KreatorLogger.KL_TEST) return;
      console.log("%cKREATOR [TEST]["+KreatorLogger.now()+"]["+ this.line()[2] +"]:%c "+msg, "color: #ff0;", "color: inital");
      return;
    }
    
    static debug(msg){
      if(this.__level < KreatorLogger.KL_DEBUG) return;
      console.debug("%cKREATOR [DEBUG]["+KreatorLogger.now()+"]["+ this.line()[2] +"]:%c "+msg, "color: #f00;", "color: inital");
        return;
    };
    
    static info(msg){
      if(this.__level < KreatorLogger.KL_INFO) return;
      console.info("%cKREATOR [INFO]["+KreatorLogger.now()+"]["+ this.line()[2] +"]:%c "+msg, "color: #00bfff;", "color: inital");
      return;
    };
    
    static warn(msg){
      if(this.__level < KreatorLogger.KL_WARN) return;
      console.warn("%cKREATOR [WARN]["+KreatorLogger.now()+"]["+ this.line()[2] +"]:%c "+msg, "color: #ffd000;", "color: inital");
      return;
    };
    
    static error(msg){
      if(this.__level < KreatorLogger.KL_ERROR) return;
      console.error("%cKREATOR [ERROR]["+KreatorLogger.now()+"]["+ this.line()[2] +"]:%c "+msg,"color: #ff6600;", "color: inital");
      return;
    };
    
    static fatal(msg){
      if(this.__level < KreatorLogger.KL_FATAL) return;
      console.error("%cKREATOR [FATAL]["+KreatorLogger.now()+"]["+ this.line()[2] +"]:%c "+msg,"background-color: #f00; color: #000;", "color: inital");
      return;
    };
    
    static now(){
        var n = new Date();
        return ""+n.getDate()+"."+n.getMonth()+"."+n.getFullYear()+" "+n.getHours()+":"+n.getMinutes()+":"+n.getSeconds();
    }
    
    static line(){
        let e = new Error();
        let files = e.stack.match(/http:\/\/[^()\n]+|https:\/\/[^()\n]+/g);
//        let lines = e.stack.match(/\/[a-zA-Z0-9.]*:[0-9]*:[0-9]/g);
//        let functions = e.stack.match(/(    at [a-zA-Z][a-zA-Z0-9.]*)/g);
        for(let i = 0; i<files.length; i++){
            files[i] = files[i].match(/[a-zA-Z0-9.]+.js:[0-9:]*/g);
        }
        
        return files;
    }
}

/* Exceptions */
class KreatorError extends Error{
    constructor(message){
        super(message);
        this.name = "KreatorError";
    }
}

class KreatorFunctionError extends KreatorError{
    constructor(message){
        super(message);
        KreatorLogger.error(message);
        this.name = "KreatorFunctionError";
    }
}

class KreatorLAError extends KreatorError{
    constructor(message){
        super(message);
        KreatorLogger.warn(message);
        this.name = "KreatorLAError";
    }
}

class KreatorTestError extends KreatorError{
    constructor(message){
        super(message);
        KreatorLogger.fatal(message);
        this.name = "KreatorTestError";
    }
}

/* CSS */
const KreatorUIKIT = `
/* 
    Created on : Nov 17, 2020, 9:29:27 AM
    Author     : Yigit Koc
    Version    : v1.2.4
    Description: UI element kit for Kreator Engine
*/
@import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@200;400;600&family=Roboto:ital,wght@0,100;0,300;0,500;1,400&display=swap');

body{
    font-family: 'Roboto', sans-serif;
}

.btn-grp{
    padding: 4px;
    overflow:hidden;
    width: 480px;
    display: box;
    text-align: center;
    position: relative;
}

.btn{
   padding: 8px;
   font-size: 1em;
   border: none;
   text-align: center;
   text-decoration: none;
   display: inline-block;
}

input {
    padding: 8px;
    font-size: 1em;
    border: none;
    text-align: center;
    text-decoration: none;
    display: inline-block;
}

label{
    font-size: 1.2em;
    font-weight: 500;
    font-style: italic;
    line-height: 1.2em;
}

label.slider{
    height: 20px;
    margin-top:18px;
    margin-right: 16px;
    position:relative;
    display: inline-block;
    float:left;
}

input[type=number]{
    color: #f1f1f1;
    background-color: #303030;
}

input[type=number]:focus, input[type=number]:active{
   background-color: #0a0a0a;
}

input[type=number]::-webkit-inner-spin-button {
  opacity: 1;
}

input[type=range]{
    margin: 8px;
    appearance: none;
    -webkit-appearance: none;
    width: auto;
    box-sizing: border-box;
    padding: 8px;
    background-color: #f1f1f1;
    border-style: none;
    display: inline-block;
    float:left;
}

input[type=range]:focus, input[type=range]:active{
    margin: 8px;
    appearance: none;
    -webkit-appearance: none;
    background-color: #d0d0d0;
    border-style: none;
}

input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none; /* Override default look */
  appearance: none;
  width: 8px; /* Set a specific slider handle width */
  height: 25px; /* Slider handle height */
  background: #303030; /* Green background */
  cursor: pointer; /* Cursor on hover */
}

input[type=range]::-moz-range-thumb {
  width: 8px; /* Set a specific slider handle width */
  height: 25px; /* Slider handle height */
  background: #303030; /* Green background */
  cursor: pointer; /* Cursor on hover */
}


.btn:focus, .btn:active{
   padding: 8px;
   font-size: 1em;
   border: none;
   text-decoration: none;
   display: inline-block;
}

.btn-dark{
    color: #f1f1f1;
    background-color: #303030;
}

.btn-dark:hover{
    background-color: #0a0a0a;
}

.btn-dark:active{
    background-color: #000;
}
`;