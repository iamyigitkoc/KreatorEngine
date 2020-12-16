"use strict";
/*
 * Kreator Engine Core
 * Developer: Yigit Koc
 * Version: 1.0
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
class Kreator{
    __app;
    __gl;
    __glprogram;
    static numComponents = 2;
    static normalize = false;
    static stride = 0;
    static offset = 0;
    static type = 0;
    static vert_loc = 0;
    static color_loc = 0;
    animations = {};
    buttons = {};
    /*
     * Setup webGL app
     * 
     * Parameters:
     * CanvasID: id of the canvas used to render app.
     */
    constructor(canvasID, opt_attribs){
        this.__app = document.querySelector(canvasID);
        if(!this.checkApp()) {
            KreatorLogger.fatal("Can't find canvas. Failed to create Kreator object.");
            this.__fatal = true;
            throw new KreatorError("Given Canvas ID is invalid.");
        }
        if(!this.__app.width<480){
            KreatorLogger.info("Changing canvas width to 480, "+this.__app.width+" is too small for Kreator.");
            this.__app.width = 480;   
        }
        if(!this.__app.height<480){
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
        this.__gl = this.__app.getContext("webgl2", opt_attribs);
        if(!this.__gl){
            KreatorLogger.fatal("Your browser does not support WebGL2.");
            this.__fatal = true;
            throw new KreatorError("Browser does not support WebGL2.");
        }
        
        this.__gl.viewport(0, 0, this.__gl.canvas.width, this.__gl.canvas.height);
        this.__glprogram = this.__gl.createProgram();
        KreatorLogger.debug("Loading default shaders");
        this.loadDefaultShader(this.__gl.VERTEX_SHADER);
        this.loadDefaultShader(this.__gl.FRAGMENT_SHADER);
        KreatorLogger.debug("Loaded default shaders");
        KreatorLogger.debug("Linking WebGL2 program.");
        this.__gl.linkProgram(this.__glprogram);
        if(!this.__gl.getProgramParameter(this.__glprogram, this.__gl.LINK_STATUS)){
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
        Kreator.color_loc = this.__gl.getAttribLocation(this.__glprogram, "v_color");
        
        this.shape_buffer =  this.__gl.createBuffer();
        this.__gl.bindBuffer(this.__gl.ARRAY_BUFFER, this.shape_buffer);
        if(opt_attribs.foregroudColor === undefined) opt_attribs.foregroudColor = new KreatorColor("#000000ff");
        this.__gl.clearColor(
                opt_attribs.foregroudColor.getR(), 
                opt_attribs.foregroudColor.getG(), 
                opt_attribs.foregroudColor.getB(), 
                opt_attribs.foregroudColor.getA()
            );
        this.__gl.clear(this.__gl.COLOR_BUFFER_BIT);
       
    }
    
    drawHead(){
        this.__gl.clear(this.__gl.COLOR_BUFFER_BIT);
    }
    
    drawObject(o){
        let shape_vert = o.getVertices();
        let shape_color = o.getVerticesColors();
        this.__gl.bufferData(this.__gl.ARRAY_BUFFER, new Float32Array(shape_vert.concat(shape_color)), this.__gl.STATIC_DRAW);
        this.__gl.vertexAttribPointer( Kreator.vert_loc, Kreator.numComponents, Kreator.type, Kreator.normalize, Kreator.stride, Kreator.offset);
        this.__gl.enableVertexAttribArray(Kreator.vert_loc);
        this.__gl.vertexAttribPointer(Kreator.color_loc, KreatorColor.numComponents, Kreator.type, Kreator.normalize, Kreator.stride, shape_vert.length*4);
        this.__gl.enableVertexAttribArray(Kreator.color_loc);
        
        let drawType = this.__gl.TRIANGLE_STRIP;
        if(o instanceof KreatorRectangle2D) drawType = this.__gl.TRIANGLE_STRIP;
        if(o instanceof KreatorCircle2D) drawType = this.__gl.TRIANGLE_FAN;
        if(o instanceof KreatorTriangle2D) drawType = this.__gl.TRIANGLES;
        this.__gl.drawArrays(drawType, Kreator.offset, o.getVerticesCount());
    }
    
    loadDefaultShader(shaderType){
        if(this.checkApp()){
            if(shaderType === this.__gl.VERTEX_SHADER){
                KreatorLogger.debug("Loading default vertex shader.");
                let vertexShader = this.__gl.createShader(this.__gl.VERTEX_SHADER);
                this.__gl.shaderSource(vertexShader, KreatorDefaultShaders.vertex_shader);
                KreatorLogger.debug("Compiling default vertex shader.");
                this.__gl.compileShader(vertexShader);
                if( !this.__gl.getShaderParameter(vertexShader, this.__gl.COMPILE_STATUS)){
                    let status = this.__gl.getShaderInfoLog(vertexShader);
                    KreatorLogger.error("WebGL compiler error: "+status);
                    throw new KreatorError("WebGL compiler Error: "+status);
                }
                KreatorLogger.debug("Compiled default vertex shader successfully");
                this.__gl.attachShader(this.__glprogram, vertexShader);
                KreatorLogger.debug("Attached default shader to program.");
                return;
            }else if(shaderType === this.__gl.FRAGMENT_SHADER){
                KreatorLogger.debug("Loading default fragment shader.");
                let fragmentShader = this.__gl.createShader(this.__gl.FRAGMENT_SHADER);
                this.__gl.shaderSource(fragmentShader, KreatorDefaultShaders.fragment_shader);
                KreatorLogger.debug("Compiling default fragment shader");
                this.__gl.compileShader(fragmentShader);
                if( !this.__gl.getShaderParameter(fragmentShader, this.__gl.COMPILE_STATUS)){
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
        console.log(this.animations);
    }
    
    keyEvent(e){
        let key = "k"+e.which;
        KreatorLogger.info("Key pressed: "+event.which);
        if(this.animations.hasOwnProperty(key)){
            this.animations[key]();
        }
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

class KreatorColor{
    static numComponents = 4;
    constructor(val){
        this.rgb = [];
        this.alpha = 0;
        if(val instanceof Array){
            if(val.length === 3 || val.length === 4){
                this.alpha = 1.0;
                for(let i = 0; i<val.length; i++){
                    if(i<3){
                        this.rgb = this.rgb.concat(val[i]);
                    }else{
                        this.alpha = val[i];
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
                this.rgb = [((c>>24)&255)/255.0, ((c>>16)&255)/255.0, ((c>>8)&255)/255.0];
                this.alpha = (c&255)/255.0;
            }else if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(val)){
                c= val.substring(1).split('');
                if(c.length === 3){
                    c= [c[0], c[0], c[1], c[1], c[2], c[2]];
                }
                c= '0x'+c.join('');
                this.rgb = [((c>>16)&255)/255.0, ((c>>8)&255)/255.0, (c&255)/255.0];
                this.alpha = 1.0;
            }else{
                KreatorLogger.error("Given value for color is not correct!");
                throw new KreatorError("Given value for color is not correct!");
            }
        }
    }
    
    getColor(){
        let color = this.rgb;
        color = color.concat(this.alpha);
        return color;
    }
    
    toString(){
        let color = this.rgb;
        color = color.concat(this.alpha);
        return 'KreatorColor['+color.join(',')+']';
    }
    
    getR(){
        return this.rgb[0];
    }
    
    getG(){
        return this.rgb[1];
    }
    
    getB(){
        return this.rgb[2];
    }
    
    getA(){
        return this.alpha;
    }
}

class KreatorRectangle2D{
    position = [0.0, 0.0];
    pivot = [0.0, 0.0];
    width = 1;
    height = 1;
    rotation = 0;
    vertices = [
        -0.5,0.5,
        -0.5,-0.5,
        0.5,-0.5,
        0.5,0.5
    ];
    color = [new KreatorColor("#ffffffff")];
    constructor(width, height, color, pos, rotation_deg, pivot){
        if(pos){
            this.position = pos;
        }
        if(color){
            this.color = [];
            this.color = this.color.concat(color);
        }
        if(width){
            this.width=width;
        }
        if(height){
            this.height=height;
        }
        if(pivot){
            this.pivot = pivot;
        }
        if(rotation_deg){
            this.rotation = rotation_deg;
        }
        this.updateVertices();
    }
    updateVertices(){
        let rotation = this.rotation * Math.PI/180;
        this.vertices = [];
        //a
        this.vertices = this.vertices.concat([
            this.position[0]+(this.width/2.0)*Math.cos(rotation)-(this.height/2.0)*Math.sin(rotation)+this.pivot[0],
            this.position[1]+(this.width/2.0)*Math.sin(rotation)+(this.height/2.0)*Math.cos(rotation)+this.pivot[1]   
        ]);
        //b
        this.vertices = this.vertices.concat([
            this.position[0]+(this.width/2.0)*Math.cos(rotation)+(this.height/2.0)*Math.sin(rotation)+this.pivot[0],
            this.position[1]+(this.width/2.0)*Math.sin(rotation)-(this.height/2.0)*Math.cos(rotation)+this.pivot[1]   
        ]);
        //c
        this.vertices = this.vertices.concat([
            this.position[0]-(this.width/2.0)*Math.cos(rotation)-(this.height/2.0)*Math.sin(rotation)+this.pivot[0],
            this.position[1]-(this.width/2.0)*Math.sin(rotation)+(this.height/2.0)*Math.cos(rotation)+this.pivot[1]   
        ]);
        //d
        this.vertices = this.vertices.concat([
            this.position[0]-(this.width/2.0)*Math.cos(rotation)+(this.height/2.0)*Math.sin(rotation)+this.pivot[0],
            this.position[1]-(this.width/2.0)*Math.sin(rotation)-(this.height/2.0)*Math.cos(rotation)+this.pivot[1]   
        ]);
    }
    
    getVertices(){
        return this.vertices;
    }
    
    getVerticesCount(){
        return 4;
    }
    
    getVerticesColors(){
        let vertexCount = parseInt(this.vertices.length/2, 10);
        var vertexColors = [];
        for(let i = 0; i<vertexCount; i++){
            let colori = 0;
            if(i < this.color.length) colori = i;
            vertexColors = vertexColors.concat(this.color[colori].getColor());
        };
        return vertexColors;
    }
    
    rotate(angle){
        this.rotation = this.rotation + angle;
        this.updateVertices();
    }

    resize(coeff){
        this.width = this.width*coeff;
        this.height = this.height*coeff;
        this.updateVertices();
    }
    
    moveX(d){
        this.move(d, 0);
    }
    
    moveY(d){
        this.move(0, d);   
    }
    
    move(xd, yd){
        this.position[0] = this.position[0]+xd;
        this.position[1] = this.position[1]+yd;
        this.updateVertices();
    }
    
    toString(){
        return "Pos: "+this.position+"\n"+
               "Pivot pos: "+this.pivot+"\n"+
               "Rotation: "+this.rotation+"\n"+
               "Width: "+this.width+"\n"+
               "Height: "+this.height+"\n"+
               "Colors: "+this.color;
    }
}

class KreatorTriangle2D{
    position = [0.0, 0.0];
    pivot = [0.0, 0.0];
    width = 1;
    height = 1;
    rotation = 0;
    vertices = [
        0.0,1,
        -0.5,0.0,
        0.5,0.0
    ];
    color = [new KreatorColor("#ffffffff")];
    constructor(baseWidth, height, color, pos, rotation_deg, pivot){
        if(pos){
            this.position = pos;
        }
        if(color){
            this.color = [];
            this.color = this.color.concat(color);
        }
        if(baseWidth){
            this.width=baseWidth;
        }
        if(height){
            this.height=height;
        }
        if(pivot){
            this.pivot = pivot;
        }
        if(rotation_deg){
            this.rotation = rotation_deg;
        }
        this.updateVertices();
    }
    updateVertices(){
        let rotation = this.rotation * Math.PI/180;
        
        this.vertices = [];
        //a
        this.vertices = this.vertices.concat([
            (this.position[0])*Math.cos(rotation)-(this.height*2.0/3.0+this.position[1])*Math.sin(rotation),
            (this.position[0])*Math.sin(rotation)+(this.height*2.0/3.0+this.position[1])*Math.cos(rotation)   
        ]);
        //b
        this.vertices = this.vertices.concat([
            (this.position[0]-(this.width/2.0))*Math.cos(rotation)-(-this.height/3.0+this.position[1])*Math.sin(rotation),
            (this.position[0]-(this.width/2.0))*Math.sin(rotation)+(-this.height/3.0+this.position[1])*Math.cos(rotation)   
        ]);
        //c
        this.vertices = this.vertices.concat([
            (this.position[0]+(this.width/2.0))*Math.cos(rotation)-(-this.height/3.0+this.position[1])*Math.sin(rotation),
            (this.position[0]+(this.width/2.0))*Math.sin(rotation)+(-this.height/3.0+this.position[1])*Math.cos(rotation)  
        ]);
    }
    
    getVertices(){
        return this.vertices;
    }
    
    getVerticesCount(){
        return 3;
    }
    
    getVerticesColors(){
        let vertexCount = parseInt(this.vertices.length/2, 10)+1;
        var vertexColors = [];
        for(let i = 0; i<vertexCount; i++){
            let colori = 0;
            if(i < this.color.length) colori = i;
            vertexColors = vertexColors.concat(this.color[colori].getColor());
        };
        return vertexColors;
    }
    
    rotate(angle){
        this.rotation = this.rotation + angle;
        this.updateVertices();
    }

    resize(coeff){
        this.width = this.width*coeff;
        this.height = this.height*coeff;
        this.updateVertices();
    }
    
    moveX(d){
        this.move(d, 0);
    }
    
    moveY(d){
        this.move(0, d);   
    }
    
    move(xd, yd){
        this.position[0] = this.position[0]+xd;
        this.position[1] = this.position[1]+yd;
        this.updateVertices();
    }
    
    toString(){
        return "Pos: "+this.position+"\n"+
               "Pivot pos: "+this.pivot+"\n"+
               "Rotation: "+this.rotation+"\n"+
               "Base Width: "+this.width+"\n"+
               "Height: "+this.height+"\n"+
               "Colors: "+this.color;
    }
}

class KreatorCircle2D{
    position = [0.0, 0.0];
    pivot = [0.0, 0.0];
    radious = 1;
    rotation = 0;
    vertices = [];
    color = [new KreatorColor("#ffffffff")];
    constructor(radius, color, pos, rotation_deg, pivot){
        if(pos){
            this.position = pos;
        }
        if(color){
            this.color = [];
            this.color = this.color.concat(color);
        }
        if(radius){
            this.radius=radius;
        }
        if(pivot){
            this.pivot = pivot;
        }
        if(rotation_deg){
            this.rotation = rotation_deg;
        }
        this.updateVertices();
    }
    updateVertices(){
        var radian = Math.PI/180;
        var rotation = this.rotation * Math.PI/180;
        this.vertices = [];
        let centerPosition = [
            this.position[0] * Math.cos(rotation) - this.position[1] * Math.sin(rotation) + this.pivot[0],
            this.position[0] * Math.sin(rotation) + this.position[1] * Math.cos(rotation) + this.pivot[1]
        ];  
        
        for(var i = 0; i<360; i++){
            this.vertices = this.vertices.concat([this.radius*Math.cos(i*radian)+centerPosition[0], this.radius*Math.sin(i*radian) + centerPosition[1]]);
        }
    }
    
    getVertices(){
        return this.vertices;
    }
    
    getVerticesCount(){
        return 360;
    }
    
    getVerticesColors(){
        let vertexCount = parseInt(this.vertices.length/2, 10);
        var vertexColors = [];
        let vertexColorCount = vertexCount/this.color.length;
        let colori = 0;
        for(let i = 0; i<vertexCount; i++){
            
            if(i%vertexColorCount === 0) colori = colori + 1;
            if(colori>=this.color.length) colori = this.color.length -1;
            vertexColors = vertexColors.concat(this.color[colori].getColor());
        };
        return vertexColors;
    }
    
    rotate(angle){
        this.rotation = this.rotation + angle;
        this.updateVertices();
    }
   
    resize(coeff){
        this.radius = this.radius*coeff;
        this.updateVertices();
    }
    
    moveX(d){
        this.move(d, 0);
    }
    
    moveY(d){
        this.move(0, d);   
    }
    
    move(xd, yd){
        this.position[0] = this.position[0]+xd;
        this.position[1] = this.position[1]+yd;
        this.updateVertices();
    }
    
    toString(){
        return "Pos: "+this.position+"\n"+
               "Pivot pos: "+this.pivot+"\n"+
               "Rotation: "+this.rotation+"\n"+
               "radius: "+this.radius+"\n"+
               "Colors: "+this.color;
    }
}

class KreatorVec{
    dimension = 0;
    vec = [];
    constructor(dimension){
        if(dimension<1){
            throw new KreatorLAError("Vector size can't be smaller than 1!");
        }
        this.vec = [];
        for(let i = 0; i<dimension; i++){
            this.vec = this.vec.concat(0);
        }
        this.dimension = dimension;
    }
    
    change(index, value){
        if(index >= this.dimension){
            throw new KreatorFunctionError("Index doesn't exist in vector!");
        }
        this.vec[index] = value;
    }
    
    toArray(){
        return this.vec;
    }
    
    setFromArray(arr){
        if(arr.length >= this.dimension){
            for(let i = 0; i<this.dimension; i++){
                this.vec[i] = arr[i];  
            }
        }
    }
    
    getValue(i){
       if(i >= this.dimension){
            throw new KreatorFunctionError("Index doesn't exist in vector!");
        }
        return this.vec[i];
    }
    
    /*
     * Multiply vector with number x
     * @param {number} x
     * @returns {KreatorVec}
     */
    multiplyBy(x){
        let vf = new KreatorVec(this.dimension);
        for(let i = 0; i<vf.dimension; i++){
            vf.change(i, this.getValue(i)*x);
        }
        return vf;
    }
    
    /*
     * Vector addition with v2
     * @param {KreatorVec} v2
     * @returns {KreatorVec}
     */
    add(v2){
        if(this.dimension !== v2.dimension){
            throw new KreatorLAError("Vector addition is only possible with vectors that have same dimensions!");
        }
        let vf = new KreatorVec(this.dimension);
        for(let i = 0; i<vf.dimension; i++){
            vf.change(i, this.getValue(i)+v2.getValue(i));
        }
        return vf;
    }
    
    /*
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
            product = product + this.getValue(i) * v2.getValue(i);
        }
        return product;
    }
    
    /*
     * Cross product of 2 3D vectors
     * @param {KreatorVec} v2
     * @returns {KreatorVec}
     */
    cross3D(v2){
        if(this.dimension !== 3 || v2.dimension !== 3){
            throw new KreatorLAError("cross3D is only possible with 3 dimensional vectors!");
        }
        let vf = new KreatorVec(3);
        vf.change(0, (this.getValue(1)*v2.getValue(2) - v2.getValue(1)*this.getValue(2)));
        vf.change(1, (v2.getValue(0)*this.getValue(2) - this.getValue(0)*v2.getValue(2)));
        vf.change(1, (this.getValue(0)*v2.getValue(1) - v2.getValue(0)*this.getValue(1)));
        return vf;
    }
    
    /*
     * returns length of vector
     * @returns {number}
     */
    length(){
        let l = 0;
        for(let i = 0; i<this.dimension; i++){
            l = l+Math.pow(this.getValue(i), 2);
        }
        l = Math.sqrt(l);
        return l;
    }
    
    /*
     * Normalized vector of vector
     * @returns {KreatorVec}
     */
    normalize(){
        let len = this.length;
        if(len !== 0){
            let u = this.multiplyBy(1/len);
            return u;
        }else{
            KreatorLogger.warn("Zero vectors can't be normalized.");
        }
    }
    
    toString(){
        let ret = "<"+this.getValue(0);
        for(let i = 1; i<this.dimension; i++){
            ret = ret+", "+this.getValue(i);
        }
        ret = ret+">";
        return ret;
    }
}

class KreatorMatrix{
    
    mat = [];
    rows = 0;
    columns = 0;
    /*
     * +----->i
     * |
     * |
     * v
     * j
     * @param {number} rows
     * @param {number} columns
     * @returns {KreatorMatrix}
     */
    constructor(rows, columns){
        this.mat = [];
        this.rows = rows;
        this.columns = columns;
        for(let j = 0; j<this.rows; j++){
            let row = new KreatorVec(this.columns);
            this.mat = this.mat.concat(row);
        }
    }
    
    toArray(){
        return this.mat;
    }
    
    setFromArray(arr){
        if(arr.length>=this.rows){
            if(arr[0].length>=this.columns){
                for(let j = 0; j<this.rows; j++){
                    for(let i = 0; i<this.columns;i++){
                        this.change(j, i, arr[j][i]);
                    }
                }
            }
        }
    }
    
    /*
     * 
     * @param {number} i
     * @param {number} j
     * @returns {number}
     */
    getValue(j, i){
        return this.mat[j].getValue(i);
    }
    
    change(j,i,val){
        this.mat[j].change(i,val);
    }
    
    getRowAsVector(j){
        return this.mat[j];
    }
    
    /*
     * 
     * @param {number} j
     * @returns {KreatorVec}
     */
    getColAsVector(i){
        let vr = new KreatorVec(this.rows);
        for(let j = 0; j<this.rows; j++){
            vr.change(j, this.getValue(j,i));
        }
        return vr;
    }
    
    /*
     * 
     * @param {number} x
     * @returns {KreatorMatrix}
     */
    multiplyBy(x){
        let mf = new KreatorMatrix(this.rows, this.columns);
        for(let j = 0; j<mf.rows; j++){
            let row = [];
            for(let i = 0; i<mf.columns; i++){
                row = row.concat(this.getValue(j,i)*x);
            }
            mf = mf.concat(row);
        }
        return mf;
    }
    
    /*
     * 
     * @param {KreatorVec} vx
     * @returns {KreatorVec}
     */
    multiplyByVec(vx){
        if(vx.dimension !== this.columns){
            throw new KreatorLAError("Matrix multipliccation with vector is possible if matrix's column count is equal to vector's dimension!");
        }
        let vm = KreatorVec(vx.dimension);
        for(let i = 0; i<this.rows; i++){
            let vr = this.getRowAsVector(i);
            vm.change(i, vr.dot(vx));
        }
        return vm;
    }
    
    /*
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
            for(let i = 0;i<m2.columns;i++){
                let v2 = m2.getColAsVector(i);
                mm.change(j, i, v1.dot(v2));
            }
        }
        return mm;
    }
    
    toString(){
        let ret = "\nMatrix:\n";
        for(let j = 0; j<this.rows; j++){
            let row = "|\t";
            for(let i = 0; i<this.columns; i++){
                row = row+this.getValue(j,i)+"\t";
            }
            row = row+"|";
            ret = ret+ row + "\n";
        }
        return ret;
    }
}

class KreatorLogger{
    static __level = 3;
    static setLogLevel(level){
        switch(level){
            case 0: KreatorLogger.__level = 0;
                    return;
            case 1: KreatorLogger.__level = 1;
                    return;
            case 2: KreatorLogger.__level = 2;
                    return;
            case 3: KreatorLogger.__level = 3;
                    return;
            case 4: KreatorLogger.__level = 4;
                    this.info("Log level changed to INFO");
                    return;
            case 5: KreatorLogger.__level = 5;
                    this.info("Log level changed to DEBUG");
                    return;
            default: KreatorLogger.__level = 3;
                    return;
        }
     
    };
    
    static debug(msg){
      if(this.__level < 5) return;
      console.log("%cKREATOR [DEBUG]["+KreatorLogger.now()+"]:%c "+msg, "color: #f00;", "color: inital");
      return;
    };
    
    static info(msg){
      if(this.__level < 4) return;
      console.log("%cKREATOR [INFO]["+KreatorLogger.now()+"]:%c "+msg, "color: #00bfff;", "color: inital");
      return;
    };
    
    static warn(msg){
      if(this.__level < 3) return;
      console.log("%cKREATOR [WARN]["+KreatorLogger.now()+"]:%c "+msg, "color: #ffd000;", "color: inital");
      return;
    };
    
    static error(msg){
      if(this.__level < 2) return;
      console.log("%cKREATOR [ERROR]["+KreatorLogger.now()+"]:%c "+msg,"color: #ff6600;", "color: inital");
      return;
    };
    
    static fatal(msg){
      if(this.__level < 1) return;
      console.log("%cKREATOR [FATAL]["+KreatorLogger.now()+"]:%c "+msg,"background-color: #f00; color: #000;", "color: inital");
      return;
    };
    
    static now(){
        var n = new Date();
        return ""+n.getDate()+"."+n.getMonth()+"."+n.getFullYear()+" "+n.getHours()+":"+n.getMinutes()+":"+n.getSeconds();
    }
}

class KreatorDefaultShaders{
    static fragment_shader = `#version 300 es
    precision mediump float;
                                
    in vec4 color;
    out vec4 o_color;
                                
    void main(){
        o_color = color;
    }
    `;
                                
    static vertex_shader = `#version 300 es
    
     in vec4 v_position;
     in vec4 v_color;
     out vec4 color; 
                                
     void main(){
         gl_Position = v_position;
         color = v_color;
     }
    `;
}

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

/**
 * Kreator Linear Algebra Errors
 */
class KreatorLAError extends KreatorError{
    constructor(message){
        super(message);
        KreatorLogger.warning(message);
        this.name = "KreatorLAError";
    }
}
