"use strict";
/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

window.onload = function(){
    KreatorLogger.setLogLevel(KreatorLogger.KL_TEST);
    test();
    init();
};
var kr;
var shape;
var shape2;
var dragon;
var camera;
var circle;
var direction = -1;
var rotationSpeed = new KreatorVector(3);
var sc = new KreatorVector(3);
sc.setFromArray([0.0, 0.1, 0.0]);
var stopAcc = 0.1;
var stopFac = 1;
var mousePos = new KreatorVector(2, [0,0]);
var mouseVector = new KreatorVector(2, [0,0]);
var moused = 0;
var mouseto;
function init(){
    kr = new Kreator("#app", {});
    
    kr.attachKey(119, moveUp);
    kr.attachKey(87, moveUp);

    kr.attachKey(83, moveDown);
    kr.attachKey(115, moveDown);
    
    kr.attachButton("KRToggleDirection", toggleDirection);
    kr.attachButton("KRSpeedUp", speedUp);
    kr.attachButton("KRSpeedDown", speedDown);
    kr.attachButton("KRColor", changeColor);
    
    
    kr.attachButton("KRStop", stop);
    document.addEventListener("mousemove", function(event){
        clearTimeout(mouseto);
        mouseDetector(event);
        mouseto = setTimeout(function(){mouseVector.setFromArray([0,0]);}, 10);
    });
    
    //Mouse rotation
    document.addEventListener("mousedown", function(){
        moused = 1;
        window.requestAnimationFrame(rotateObjectWithMouse);
    });
    document.addEventListener("mouseup", function(){
        moused = 0;
    });

    rotationSpeed.setFromArray([0.0, 0, 0]);
    camera = new KreatorCamera(
        new KreatorVector(4, [0, -50, 100, 0]),
        new KreatorVector(4, [0, 0, 0, 0]),
        55,
        kr.appWidth(),
        kr.appHeight(),
        {track: false}      
    );
    kr.bindCamera(camera);
    kr.updateCamera();


    let floor = new KreatorRectangularPrism(
        new KreatorVector(4, [200,0.25,200,0]),
        new KreatorVector(4, [0,-6,0,0]),
        [
            new KreatorColor("#ff00ffff"),
        ],
        new KreatorVector(4, [0,0,0,0]),
        GL_TRIANGLES
    );
    let wall = new KreatorRectangularPrism(
        new KreatorVector(4, [0.25,200,200,0]),
        new KreatorVector(4, [-100,-6,0,0]),
        [
            new KreatorColor("#ff00ffff"),
        ],
        new KreatorVector(4, [0,0,0,0]),
        GL_TRIANGLES
    );
    // wall = new KreatorInstance(
    //     wall,
    //     [
    //         new KreatorVector(4, [-100,94,0,0]),
    //         new KreatorVector(4, [100,94,0,0]),
    //         new KreatorVector(4, [0,94,100,0])
    //     ],
    //     [
    //         new KreatorVector(4, [0.25,200,200,0])
    //     ],
    //     [
    //         new KreatorVector(4, [0,0,0,0]),
    //         new KreatorVector(4, [0,0,0,0]),
    //         new KreatorVector(4, [0,Math.PI/2,0,0])
    //     ],
    //     [
    //         new KreatorVector(4, [0,0,0,0])
    //     ]
    // );
    // kr.addObjectToScene(wall);
    kr.addObjectToScene(floor);
    
    dragon = new KreatorOBJ(
        "car.obj",
        new KreatorVector(4, [10,10,10,0]),
        new KreatorVector(4, [0,0,0,0]),
        [
            new KreatorColor("#00f000ff"),
        ],
        new KreatorVector(4, [0,0,0,0])
        );
    dragon.objLoad();
    dragon.rotate(new KreatorVector(4,[0,90,0,0]))

    window.requestAnimationFrame(waitLoad);
}

function waitLoad(){
    if(!dragon.objLoaded){
        window.requestAnimationFrame(waitLoad);
    }else{
        kr.addObjectToScene(dragon);
        window.requestAnimationFrame(draw);
    }
}


function draw(){
    kr.drawHead();
    kr.updateCamera();
    kr.drawScene();
    dragon.move(new KreatorVector(4, [0,0,0.1,0]));
    dragon.rotate(rotationSpeed.multiplyBy(direction));
 
    window.requestAnimationFrame(draw);
}

function toggleDirection(){
    direction = direction*-1;
    return;
}

function speedUp(){
    rotationSpeed = rotationSpeed.add(sc);
    return;
}

function speedDown(){
    if(rotationSpeed.length() > sc.length()){
        rotationSpeed = rotationSpeed.add(sc.multiplyBy(-1));
        if(rotationSpeed.length()<sc.length()){
            rotationSpeed = sc;
        }
    }
    return;
}

var steps = 0;
var stopAnim;
function stop(){
    stopAnim = window.setInterval(function(){ 
        if(speed > 0.001){
            speed = speed - stopAcc*stopFac*steps/100.0;
            steps++;
            if(speed < -1){
                steps = 0;
                speed = 0;
                stopFac = 1;
                window.clearInterval(stopAnim);
            }
        }else {
            steps = 0;
            speed = 0;
            stopFac = 1;
            window.clearInterval(stopAnim);
        }
    }, 100);
}

function changeColor(){
//    shape.composites[0].color = generateColorArray(1);
    return;
}

function getRandomColor() {
  let r = (Math.floor(Math.random() * 256))/255.0;
  let g = (Math.floor(Math.random() * 256))/255.0;
  let b = (Math.floor(Math.random() * 256))/255.0;
  return new KreatorColor([r,g,b]);
}

function generateColorArray(a){
    let colors = [];
    for(let i = 0; i<a; i++) colors = colors.concat(getRandomColor());
    return colors;
}

function moveUp(){
    // dragon.move(new KreatorVector(4, [0,0,1,0]));
    camera.moveForward(10);
}

function moveDown(){
    // dragon.move(new KreatorVector(4, [0,0,-1,0]));
    camera.moveForward(-10);
}

function mouseDetector(event){
    let mouseOldPos = new KreatorVector(2, mousePos.toArray());
    let newMousePos = new KreatorVector(2, [event.clientX,event.clientY]);
    mousePos = newMousePos;
    mouseVector.setFromVec(newMousePos.add(mouseOldPos.multiplyBy(-1)));
    
}
var i =0;
function rotateObjectWithMouse(event){

    let rotationVector = new KreatorVector(4, [-(mouseVector.get(1)*1/1.5),-(mouseVector.get(0)*1/2.0),0.0, 0.0]);
    camera.rotate(rotationVector);
    i=0;
    if(moused !== 0){
        window.requestAnimationFrame(rotateObjectWithMouse);
    }
}
