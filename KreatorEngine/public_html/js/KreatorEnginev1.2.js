"use strict";
/*
 * Kreator Engine Core
 * Developer: Yigit Koc
 * Version: 1.2
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
    static numComponents = 4;
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
        
        document.title = document.title + " | Created with Kreator Engine";
        
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
        this.__gl.clearDepth(1.0);
        this.__gl.enable(this.__gl.DEPTH_TEST);
        this.__gl.depthFunc(this.__gl.LEQUAL);
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
        if(o instanceof KreatorCircular2D) drawType = this.__gl.TRIANGLE_FAN;
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
        KreatorLogger.debug("Key "+charCode+" attached to "+callback.name+".");
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
                    this.position.set(3, 1.0);
                }
            }
        }
        
        if(pivot instanceof KreatorVector){
            if(pivot.dimension >= 3){
                this.pivot.setFromVec(pivot);
                if(pivot.dimension === 3){
                    this.pivot.set(3, 1.0);
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
        o.position.set(3, 1.0);
        o.pivot = compositePivot.add(objectOriginalPos.multiplyBy(-1));
        o.pivot.set(3,1.0);
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

class KreatorRectangle2D{
    position = new KreatorVector(Kreator.numComponents);
    pivot = new KreatorVector(Kreator.numComponents);
    size = new KreatorVector(2);
    vertices = new KreatorMatrix(4,Kreator.numComponents);
    color = [new KreatorColor("#ff0000ff")];
    rotation = new KreatorVector(3);
    /*
     * 
     * @param {KreatorVec} size
     * @param {KreatorVec} pos
     * @param {KreatorMatrix} color
     * @param {KreatorVec} pivot
     * @returns {KreatorTriangle2D}
     */
    constructor(size, pos, color, pivot){
        if(pos instanceof KreatorVector){
            if(pos.dimension >= 3){
                this.position.setFromVec(pos);
                if(pos.dimension === 3){
                    this.position.set(3, 1.0);
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
                    this.pivot.set(3, 1.0);
                }
            }
        }
        this.updateVertices();
        KreatorLogger.debug("\nRectangle created:\n"+this);
    }
    updateVertices(){
        
        let c = new KreatorVector(3);
        c.setFromArray([
            Math.cos(this.rotation.get(0)),
            Math.cos(this.rotation.get(1)),
            Math.cos(this.rotation.get(2))
        ]);
        
        let s = new KreatorVector(3);
        s.setFromArray([
            Math.sin(this.rotation.get(0)),
            Math.sin(this.rotation.get(1)),
            Math.sin(this.rotation.get(2))
        ]);
        
        //Set vertices
        this.vertices.setFromArray([
            -(this.size.get(0)/2.0), (this.size.get(1)/2.0), 0.0, 1.0,
            (this.size.get(0)/2.0), (this.size.get(1)/2.0), 0.0, 1.0,
            -(this.size.get(0)/2.0), -(this.size.get(1)/2.0), 0.0, 1.0,
            (this.size.get(0)/2.0), -(this.size.get(1)/2.0), 0.0, 1.0
        ]);
        
        //Transform: move
        let p = new KreatorMatrix(4,4);
        p.setFromArray([
            -this.pivot.get(0),-this.pivot.get(1),-this.pivot.get(2),0,
            -this.pivot.get(0),-this.pivot.get(1),-this.pivot.get(2),0,
            -this.pivot.get(0),-this.pivot.get(1),-this.pivot.get(2),0,
            -this.pivot.get(0),-this.pivot.get(1),-this.pivot.get(2),0
        ]);
        this.vertices = this.vertices.add(p);
        
        //Transform: Rorate
        let rx = new KreatorMatrix(4,4);
        rx.setFromArray([
            1, 0, 0, 0,
            0, c.get(0), -s.get(0), 0,
            0, s.get(0), c.get(0), 0,
            0, 0, 0, 1
        ]);
        let ry = new KreatorMatrix(4,4);
        ry.setFromArray([
            c.get(1), 0, s.get(1), 0,
            0, 1, 0, 0,
            -s.get(1), 0, c.get(1), 0,
            0, 0, 0, 1
        ]);
        
        let rz = new KreatorMatrix(4,4);
        rz.setFromArray([
            c.get(2), -s.get(2), 0, 0,
            s.get(2), c.get(2), 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
        
        this.vertices.setRow(0, rz.multiplyByMat(ry).multiplyByMat(rx).multiplyByVec(this.vertices.getRow(0)));
        this.vertices.setRow(1, rz.multiplyByMat(ry).multiplyByMat(rx).multiplyByVec(this.vertices.getRow(1)));
        this.vertices.setRow(2, rz.multiplyByMat(ry).multiplyByMat(rx).multiplyByVec(this.vertices.getRow(2)));
        this.vertices.setRow(3, rz.multiplyByMat(ry).multiplyByMat(rx).multiplyByVec(this.vertices.getRow(3)));
        
        //Transform: move
        let t = new KreatorMatrix(4,4);
        t.setFromArray([
            this.position.get(0),this.position.get(1),this.position.get(2),0,
            this.position.get(0),this.position.get(1),this.position.get(2),0,
            this.position.get(0),this.position.get(1),this.position.get(2),0,
            this.position.get(0),this.position.get(1),this.position.get(2),0
        ]);
        this.vertices = this.vertices.add(t);
    }
    
    getVertices(){
        return this.vertices.toArray();
    }
    
    getVerticesCount(){
        return this.vertices.rows;
    }
    
    getVerticesColors(){
        var vertexColors = [];
        for(let i = 0; i<this.vertices.rows; i++){
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
//        this.updateVertices();
    }

    resize(coeff){
        this.size = this.size.multiplyBy(coeff);
//        this.updateVertices();
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
}

class KreatorTriangle2D{

    /*
     * 
     * @param {KreatorVec} size
     * @param {KreatorVec} pos
     * @param {KreatorMatrix} color
     * @param {KreatorVec} pivot
     * @returns {KreatorTriangle2D}
     */
    constructor(size, pos, color, pivot){
        if(pos instanceof KreatorVector){
            if(pos.dimension >= 3){
                this.position.setFromVec(pos);
                if(pos.dimension === 3){
                    this.position.set(3, 1.0);
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
                    this.pivot.set(3, 1.0);
                }
            }
        }
        this.updateVertices();
        KreatorLogger.debug("\nTriangle created:\n"+this);
    }
    updateVertices(){
        
        let c = new KreatorVector(3);
        c.setFromArray([
            Math.cos(this.rotation.get(0)),
            Math.cos(this.rotation.get(1)),
            Math.cos(this.rotation.get(2))
        ]);
        
        let s = new KreatorVector(3);
        s.setFromArray([
            Math.sin(this.rotation.get(0)),
            Math.sin(this.rotation.get(1)),
            Math.sin(this.rotation.get(2))
        ]);
        
        //Set vertices
        this.vertices.setFromArray([
            0, 2*this.size.get(1)/3.0, 0.0, 1.0,
            (-this.size.get(0)/2.0), (-this.size.get(1)/3.0), 0.0, 1.0,
            (this.size.get(0)/2.0), (-this.size.get(1)/3.0), 0.0, 1.0
        ]);
        
        //Transform: move
        let p = new KreatorMatrix(3,4);
        p.setFromArray([
            -this.pivot.get(0),-this.pivot.get(1),-this.pivot.get(2),0,
            -this.pivot.get(0),-this.pivot.get(1),-this.pivot.get(2),0,
            -this.pivot.get(0),-this.pivot.get(1),-this.pivot.get(2),0
        ]);
        this.vertices = this.vertices.add(p);
        
        //Transform: Rorate
        let rx = new KreatorMatrix(4,4);
        rx.setFromArray([
            1, 0, 0, 0,
            0, c.get(0), -s.get(0), 0,
            0, s.get(0), c.get(0), 0,
            0, 0, 0, 1
        ]);
        let ry = new KreatorMatrix(4,4);
        ry.setFromArray([
            c.get(1), 0, s.get(1), 0,
            0, 1, 0, 0,
            -s.get(1), 0, c.get(1), 0,
            0, 0, 0, 1
        ]);
        
        let rz = new KreatorMatrix(4,4);
        rz.setFromArray([
            c.get(2), -s.get(2), 0, 0,
            s.get(2), c.get(2), 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
        
        this.vertices.setRow(0, rz.multiplyByMat(ry).multiplyByMat(rx).multiplyByVec(this.vertices.getRow(0)));
        this.vertices.setRow(1, rz.multiplyByMat(ry).multiplyByMat(rx).multiplyByVec(this.vertices.getRow(1)));
        this.vertices.setRow(2, rz.multiplyByMat(ry).multiplyByMat(rx).multiplyByVec(this.vertices.getRow(2)));
        
        //Transform: move
        let t = new KreatorMatrix(3,4);
        t.setFromArray([
            this.position.get(0),this.position.get(1),this.position.get(2),0,
            this.position.get(0),this.position.get(1),this.position.get(2),0,
            this.position.get(0),this.position.get(1),this.position.get(2),0
        ]);
        this.vertices = this.vertices.add(t);
    }
    
    getVertices(){
        return this.vertices.toArray();
    }
    
    getVerticesCount(){
        return 3;
    }
    
    getVerticesColors(){
        var vertexColors = [];
        for(let i = 0; i<this.vertices.rows; i++){
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
//        this.updateVertices();
    }

    resize(coeff){
        this.size = this.size.multiplyBy(coeff);
//        this.updateVertices();
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
}

class KreatorCircular2D{
    position = new KreatorVector(Kreator.numComponents);
    pivot = new KreatorVector(Kreator.numComponents);
    size = new KreatorVector(2);
    vertices = new KreatorMatrix(30,Kreator.numComponents);
    color = [new KreatorColor("#ff0000ff")];
    rotation = new KreatorVector(3);
    /*
     * 
     * @param {KreatorVec} size
     * @param {KreatorVec} pos
     * @param {KreatorMatrix} color
     * @param {KreatorVec} pivot
     * @returns {KreatorTriangle2D}
     */
    constructor(size, pos, color, pivot){
        if(pos instanceof KreatorVector){
            if(pos.dimension >= 3){
                this.position.setFromVec(pos);
                if(pos.dimension === 3){
                    this.position.set(3, 1.0);
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
                    this.pivot.set(3, 1.0);
                }
            }
        }
        this.updateVertices();
        KreatorLogger.debug("\nCircular 2D object created:\n"+this);
    }
    
    
    updateVertices(){
        let radian = Math.PI/180;
        
        let step = 360.0/(this.vertices.rows-2);
        
        let c = new KreatorVector(3);
        c.setFromArray([
            Math.cos(this.rotation.get(0)),
            Math.cos(this.rotation.get(1)),
            Math.cos(this.rotation.get(2))
        ]);
        
        let s = new KreatorVector(3);
        s.setFromArray([
            Math.sin(this.rotation.get(0)),
            Math.sin(this.rotation.get(1)),
            Math.sin(this.rotation.get(2))
        ]);
        
    
//        
        //Transform: move
        let pvi = this.pivot.multiplyBy(-1);
        pvi.set(3, 0.0);
//        
        //Transform: Rorate
        let rx = new KreatorMatrix(4,4);
        rx.setFromArray([
            1, 0, 0, 0,
            0, c.get(0), -s.get(0), 0,
            0, s.get(0), c.get(0), 0,
            0, 0, 0, 1
        ]);
        let ry = new KreatorMatrix(4,4);
        ry.setFromArray([
            c.get(1), 0, s.get(1), 0,
            0, 1, 0, 0,
            -s.get(1), 0, c.get(1), 0,
            0, 0, 0, 1
        ]);
        
        let rz = new KreatorMatrix(4,4);
        rz.setFromArray([
            c.get(2), -s.get(2), 0, 0,
            s.get(2), c.get(2), 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
        

//        
//        this.vertices.setRow(0, rz.multiplyByMat(ry).multiplyByMat(rx).multiplyByVec(this.vertices.getRow(0)));
//        this.vertices.setRow(1, rz.multiplyByMat(ry).multiplyByMat(rx).multiplyByVec(this.vertices.getRow(1)));
//        this.vertices.setRow(2, rz.multiplyByMat(ry).multiplyByMat(rx).multiplyByVec(this.vertices.getRow(2)));
//        
//        //Transform: move
        let tp = this.position.multiplyBy(1);
        tp.set(3, 0.0);
        this.vertices.setRow(0, rz.multiplyByMat(ry).multiplyByMat(rx).multiplyByVec(new KreatorVector(Kreator.numComponents, [0.0, 0.0, 0.0, 1.0]).add(pvi)).add(tp));
        for(let i = 1; i<this.vertices.rows; i++){
            this.vertices.setRow(i, rz.multiplyByMat(ry).multiplyByMat(rx).multiplyByVec(new KreatorVector(Kreator.numComponents, [this.size.get(0)/2.0*Math.cos(i*step*radian), this.size.get(1)/2.0*Math.sin(i*step*radian), 0.0, 1.0]).add(pvi)).add(tp));
        }
    }
    
    getVertices(){
        return this.vertices.toArray();
    }
    
    getVerticesCount(){
        return this.vertices.rows;
    }
    
    getVerticesColors(){
        var vertexColors = [];
        for(let i = 0; i<this.vertices.rows; i++){
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
        //this.updateVertices();
    }

    resize(coeff){
        this.size = this.size.multiplyBy(coeff);
        //this.updateVertices();
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
}

class KreatorRectangularPrism{
    position = new KreatorVector(Kreator.numComponents);
    pivot = new KreatorVector(Kreator.numComponents);
    size = new KreatorVector(3);
    vertices = new KreatorMatrix(14,Kreator.numComponents);
    color = [new KreatorColor("#ff0000ff")];
    rotation = new KreatorVector(3);
    /*
     * 
     * @param {KreatorVec} size
     * @param {KreatorVec} pos
     * @param {KreatorMatrix} color
     * @param {KreatorVec} pivot
     * @returns {KreatorTriangle2D}
     */
    constructor(size, pos, color, pivot){
        if(pos instanceof KreatorVector){
            if(pos.dimension >= 3){
                this.position.setFromVec(pos);
                if(pos.dimension === 3){
                    this.position.set(3, 1.0);
                }
            }
        }
        if(size instanceof KreatorVector){
            if(size.dimension >= 3){
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
                    this.pivot.set(3, 1.0);
                }
            }
        }
        this.updateVertices();
        KreatorLogger.debug("\nRectangle created:\n"+this);
    }
    updateVertices(){
        
        let c = new KreatorVector(3);
        c.setFromArray([
            Math.cos(this.rotation.get(0)),
            Math.cos(this.rotation.get(1)),
            Math.cos(this.rotation.get(2))
        ]);
        
        let s = new KreatorVector(3);
        s.setFromArray([
            Math.sin(this.rotation.get(0)),
            Math.sin(this.rotation.get(1)),
            Math.sin(this.rotation.get(2))
        ]);
        
        let points = [
            new KreatorVector(4, [(this.size.get(0)/2.0), -(this.size.get(1)/2.0), -(this.size.get(2)/2.0), 1.0]),
            new KreatorVector(4, [(this.size.get(0)/2.0), (this.size.get(1)/2.0), -(this.size.get(2)/2.0), 1.0]),
            new KreatorVector(4, [(this.size.get(0)/2.0), -(this.size.get(1)/2.0), (this.size.get(2)/2.0), 1.0]),
            new KreatorVector(4, [(this.size.get(0)/2.0), (this.size.get(1)/2.0), (this.size.get(2)/2.0), 1.0]),
            new KreatorVector(4, [-(this.size.get(0)/2.0), -(this.size.get(1)/2.0), -(this.size.get(2)/2.0), 1.0]),
            new KreatorVector(4, [-(this.size.get(0)/2.0), (this.size.get(1)/2.0), -(this.size.get(2)/2.0), 1.0]),
            new KreatorVector(4, [-(this.size.get(0)/2.0), (this.size.get(1)/2.0), (this.size.get(2)/2.0), 1.0]),
            new KreatorVector(4, [-(this.size.get(0)/2.0), -(this.size.get(1)/2.0), (this.size.get(2)/2.0), 1.0])
        ];
        
        //Set vertices
        this.vertices.setRow(0, points[3]);
        this.vertices.setRow(1, points[2]);
        this.vertices.setRow(2, points[6]);
        this.vertices.setRow(3, points[7]);
        this.vertices.setRow(4, points[4]);
        this.vertices.setRow(5, points[2]);
        this.vertices.setRow(6, points[0]);
        this.vertices.setRow(7, points[3]);
        this.vertices.setRow(8, points[1]);
        this.vertices.setRow(9, points[6]);
        this.vertices.setRow(10, points[5]);
        this.vertices.setRow(11, points[4]);
        this.vertices.setRow(12, points[1]);
        this.vertices.setRow(13, points[0]);
        
        //Transform: move
        let p = new KreatorMatrix(this.vertices.rows,4);
        let pivm = this.pivot.multiplyBy(-1);
        for(let j = 0; j<this.vertices.rows; j++){
            p.setRow(j, pivm);
        }
        this.vertices = this.vertices.add(p);
        
        //Transform: Rorate
        let rx = new KreatorMatrix(4,4);
        rx.setFromArray([
            1, 0, 0, 0,
            0, c.get(0), -s.get(0), 0,
            0, s.get(0), c.get(0), 0,
            0, 0, 0, 1
        ]);
        let ry = new KreatorMatrix(4,4);
        ry.setFromArray([
            c.get(1), 0, s.get(1), 0,
            0, 1, 0, 0,
            -s.get(1), 0, c.get(1), 0,
            0, 0, 0, 1
        ]);
        
        let rz = new KreatorMatrix(4,4);
        rz.setFromArray([
            c.get(2), -s.get(2), 0, 0,
            s.get(2), c.get(2), 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
        for(let j = 0; j<this.vertices.rows; j++){
            this.vertices.setRow(j, rz.multiplyByMat(ry).multiplyByMat(rx).multiplyByVec(this.vertices.getRow(j)));
        }
        
        //Transform: move
        let t = new KreatorMatrix(this.vertices.rows,4);
        for(let j = 0; j<this.vertices.rows; j++){
            t.setRow(j, this.position);
        }
        this.vertices = this.vertices.add(t);
    }
    
    getVertices(){
        return this.vertices.toArray();
    }
    
    getVerticesCount(){
        return this.vertices.rows;
    }
    
    getVerticesColors(){
        var vertexColors = [];
        for(let i = 0; i<this.vertices.rows; i++){
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
        this.updateVertices();
    }

    resize(coeff){
        this.size = this.size.multiplyBy(coeff);
        this.updateVertices();
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
}

class KreatorVector{
    dimension = 0;
    vec = [];
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
    
    /*
     * This method was used for changing values. Deparced, use set().
     * @param {number} index
     * @param {number} value
     */
    change(index, value){
        this.set(index, value);
    }
    
    /*
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
    
    /*
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
    
    /*
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
    
    /*
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
    
    /*
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
            product = product + this.get(i) * v2.get(i);
        }
        return product;
    }
    
    /*
     * Cross product of 2 3D vectors
     * @param {KreatorVector} v2
     * @returns {KreatorVector}
     */
    cross3D(v2){
        if(this.dimension !== 3 || v2.dimension !== 3){
            throw new KreatorLAError("cross3D is only possible with 3 dimensional vectors!");
        }
        let vf = new KreatorVector(3);
        vf.set(0, (this.get(1)*v2.get(2) - v2.get(1)*this.get(2)));
        vf.set(1, (v2.get(0)*this.get(2) - this.get(0)*v2.get(2)));
        vf.set(2, (this.get(0)*v2.get(1) - v2.get(0)*this.get(1)));
        return vf;
    }
    
    /*
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
    
    /*
     * Normalized vector of vector
     * @returns {KreatorVector}
     */
    normalize(){
        let len = this.length();
        if(len !== 0){
            let u = this.multiplyBy(1/len);
            return u;
        }else{
            KreatorLogger.warn("Zero vectors can't be normalized.");
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
    
    /*
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


//Needs performance improvement
class KreatorMatrix{
    
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
    constructor(rows, columns, opts){
        this.mat = [];
        this.rows = rows;
        this.columns = columns;
        if(opts !== undefined){
            opts = {};
            if(opts.no_init !== undefined){
                opts.no_init = false;
            }
        }
        for(let j = 0; j<this.rows; j++){
            let row = new KreatorVector(this.columns);
            this.mat = this.mat.concat(row);
        }
    }
    
    toArray(){
        let a = [];
        for(let j = 0; j<this.rows; j++){
            a = a.concat(this.getRow(j).toArray());
        }
        return a;
    }
    
    /*
     * Set values from matrix m2
     * @param {KreatorMatrix} mat2
     */
    setFromMat(mat2){
        
    }
    
    setFromArray(arr){
        if(arr.length>=this.rows*this.columns){
            for(let j = 0; j<this.rows; j++){
                for(let i = 0; i<this.columns;i++){
                    this.change(j, i, arr[j*this.columns+i]);
                }
            }
        }else{
            throw new KreatorLAError("Array length is smaller than dimensions.");
        }
    }
    
    /*
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
            let r1 = this.getRow(j);
            let r2 = m2.getRow(j);
            let ra = r1.add(r2);
            ma.setRow(j, ra);
        }
        return ma;
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
        this.mat[j].set(i,val);
    }
    
    set(j, i, val){
        this.mat[j].set(i,val);
    }
    
    /*
     * Set row from vector v
     * @param {number} j
     * @param {KreatorVector} v
     * @returns {undefined}
     */
    setRow(j, v){
        if(this.columns !== v.dimension){
            throw new KreatorLAError("Matrix's column count and vector's dimension can't be different");
        }
        this.mat[j].setFromVec(v);
    }
    
    get(j, i){
        return this.mat[j].get(i);
    }
    
    getRowAsVector(j){
        return this.mat[j];
    }
    
    /*
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
    
    /*
     * Get row as vector
     * @param {number} j
     * @returns {KreatorVector}
     */
    getRow(j){
        return this.mat[j];
    }
    
    /*
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
    
    /*
     * 
     * @param {number} x
     * @returns {KreatorMatrix}
     */
    multiplyBy(x){
        let mf = new KreatorMatrix(this.rows, this.columns);
        for(let j = 0; j<this.rows; j++){
            let v = this.getRow(j);
            v = v.multiplyBy(x);
            mf.setRow(j, v);
        }
        return mf;
    }
    
    /*
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
            let vr = this.getRow(i);
            vm.set(i, vr.dot(vx));
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
            let v1 = this.getRow(j);
            for(let i = 0; i<m2.columns; i++){
                let v2 = m2.getColumn(i);
                mm.set(j, i, v1.dot(v2));
            }
        }
        return mm;
    }
    
    /*
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
            let r1 = this.getRow(j);
            let r2 = m2.getRow(j);
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
      console.log("%cKREATOR [TEST]["+KreatorLogger.now()+"]:%c "+msg, "color: #ff0;", "color: inital");
      return;
    }
    
    static debug(msg){
      if(this.__level < KreatorLogger.KL_DEBUG) return;
      console.log("%cKREATOR [DEBUG]["+KreatorLogger.now()+"]:%c "+msg, "color: #f00;", "color: inital");
      return;
    };
    
    static info(msg){
      if(this.__level < KreatorLogger.KL_INFO) return;
      console.log("%cKREATOR [INFO]["+KreatorLogger.now()+"]:%c "+msg, "color: #00bfff;", "color: inital");
      return;
    };
    
    static warn(msg){
      if(this.__level < KreatorLogger.KL_WARN) return;
      console.log("%cKREATOR [WARN]["+KreatorLogger.now()+"]:%c "+msg, "color: #ffd000;", "color: inital");
      return;
    };
    
    static error(msg){
      if(this.__level < KreatorLogger.KL_ERROR) return;
      console.log("%cKREATOR [ERROR]["+KreatorLogger.now()+"]:%c "+msg,"color: #ff6600;", "color: inital");
      return;
    };
    
    static fatal(msg){
      if(this.__level < KreatorLogger.KL_FATAL) return;
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
         color = vec4(v_color.x*(1.0/((2.0+v_position.z))), v_color.y*(1.0/((2.0+v_position.z))),v_color.z*(1.0/((2.0+v_position.z))), 1.0);
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