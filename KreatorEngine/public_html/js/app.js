"use strict";
/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

window.onload = function(){
    KreatorLogger.setLogLevel(KreatorLogger.KL_DEBUG);
    // test();
    init();
};
var kr;
var shape;
var shape2;
var cube;
var dragon;
var camera;
var circle;
var direction = -1;
var rotationSpeed = new KreatorVector(3);
var sc = new KreatorVector(3);
sc.setFromArray([0.0, 0.1, 0.0]);
var stopAcc = 0.1;
var stopFac = 1;
var mouseOld = new KreatorVector(2, [0,0]);
var moused = 0;
var mouseto;
function init(){
    kr = new Kreator("#app", {});
    
    kr.attachKey(119, moveUp);
    kr.attachKey(87, moveUp);

    kr.attachKey(43, speedUp);
    kr.attachKey(45, speedDown);

    kr.attachKey(83, moveDown);
    kr.attachKey(115, moveDown);

    document.addEventListener("keydown", function(k){
        if(k.key === "ArrowUp"){
            moveForward();
        }else if(k.key === "ArrowDown"){
            moveBackwards();
        }else if(k.key === "ArrowRight"){
            moveRight();
        }else if(k.key === "ArrowLeft"){
            moveLeft();
        }else if(k.key === "PageUp"){
            moveAscend();
        }else if(k.key === "PageDown"){
            moveDescend();
        }
    });
    
    // kr.attachButton("KRToggleDirection", toggleDirection);
    // kr.attachButton("KRSpeedUp", speedUp);
    // kr.attachButton("KRSpeedDown", speedDown);
    // kr.attachButton("KRColor", changeColor);
    
    
    // kr.attachButton("KRStop", stop);
    // document.addEventListener("mousemove", function(event){
    //     clearTimeout(mouseto);
    //     mouseDetector(event);
    //     mouseto = setTimeout(function(){mouseVector.setFromArray([0,0]);}, 10);
    // });
    
    //Mouse rotation
    kr.__app.requestPointerLock = kr.__app.requestPointerLock || kr.__app.mozRequestPointerLock;
    kr.__app.onclick = function(){
        kr.__app.requestPointerLock();
    };

    document.addEventListener('pointerlockchange', lockChangeAlert, false);
    document.addEventListener('mozpointerlockchange', lockChangeAlert, false);
    // document.addEventListener("mousedown", function(){
    //     moused = 1;
    //     window.requestAnimationFrame(rotateObjectWithMouse);
    // });
    // document.addEventListener("mouseup", function(){
    //     moused = 0;
    // });

    rotationSpeed.setFromArray([0.0, 1, 0]);
    camera = new KreatorCamera(
        new KreatorVector(4, [0, -50, 150, 0]),
        new KreatorVector(4, [0, 0, 0, 0]),
        55,
        kr.appWidth(),
        kr.appHeight(),
        {track: true}      
    );
    kr.bindCamera(camera);
    kr.updateCamera();


    let floor = new KreatorRectangularPrism(
        new KreatorVector(4, [7000,0.25,7000,0]),
        new KreatorVector(4, [0,-6,0,0]),
        [
            new KreatorColor("#ff00ffff"),
        ],
        new KreatorVector(4, [0,0,0,0]),
        GL_TRIANGLES
    );
    
    var material1 = new KreatorMaterial();
    material1.setAmbient(new KreatorColor('#005f00ff'));
    material1.setDiffuse(new KreatorColor('#00ff00ff'));
    material1.setSpecular(new KreatorColor('#ffffffff'));
    material1.setShine(100.0);

    var material2 = new KreatorMaterial();
    material2.setAmbient(new KreatorColor('#ff0000ff'));
    material2.setDiffuse(new KreatorColor('#3f0000ff'));
    material2.setSpecular(new KreatorColor('#0f0f0fff'));
    material2.setShine(10.0);
    
    var material3 = new KreatorMaterial();
    material3.setAmbient(new KreatorColor('#ffff00ff'));
    material3.setDiffuse(new KreatorColor('#3f3f00ff'));
    material3.setSpecular(new KreatorColor('#0f0f0fff'));
    material3.setShine(80.0);

    floor.setMaterial(material2);

    let wall = new KreatorRectangularPrism(
        new KreatorVector(4, [0.25,7000,7000,0]),
        new KreatorVector(4, [-100,-6,0,0]),
        [
            new KreatorColor("#ff00ffff"),
        ],
        new KreatorVector(4, [0,0,0,0]),
        GL_TRIANGLES
    );
    wall.generateNormals();
    wall.setMaterial(material2);
    wall = new KreatorInstance(
        wall,
        [
            new KreatorVector(4, [-3500,0,0,0]),
            new KreatorVector(4, [3500,0,0,0]),
            new KreatorVector(4, [0,0,3500,0])
        ],
        [
            new KreatorVector(4, [0.25,7000,7000,0])
        ],
        [
            new KreatorVector(4, [0,0,0,0]),
            new KreatorVector(4, [0,0,0,0]),
            new KreatorVector(4, [0,Math.PI/2,0,0])
        ],
        [
            new KreatorVector(4, [0,0,0,0])
        ]
    );
    
    
    
    cube = new KreatorRectangularPrism(
        new KreatorVector(4, [20,20,20,0]),
        new KreatorVector(4, [0,10,0,0]),
        [
            new KreatorColor("#ff00ffff"),
        ],
        new KreatorVector(4, [0,0,0,0]),
        GL_TRIANGLES
    );
    cube.generateNormals();
    cube.setMaterial(material3);
    let arrayPos = [];
    for(let i =0; i<20; i++){
        for(let j = 0; j<20; j++){
            arrayPos.push(new KreatorVector(4, [i*40, 0, j*40, 0]));
        }
    }
    cube = new KreatorInstance(
            cube,
            arrayPos,
            [
                new KreatorVector(4, [20, 20, 20, 0])
            ],
            [
                new KreatorVector(4, [0,0,0,0])
            ],
            [
                new KreatorVector(4, [0,0,0,0])
            ]
    );
//    kr.addObjectToScene(cube);
    kr.addObjectToScene(wall);
    kr.addObjectToScene(floor);
    
    dragon = new KreatorOBJ(
        "dragon_opt.obj",
        new KreatorVector(4, [1,1,1,0]),
        new KreatorVector(4, [0,10,0,0]),
        [
            new KreatorColor("#00f000ff"),
        ],
        new KreatorVector(4, [0,0,0,0])
        );
    dragon.objLoad();
    dragon.rotate(new KreatorVector(4,[0,90,0,0]));
    dragon.setMaterial(material1);
    
    floor.generateNormals();
    window.requestAnimationFrame(waitLoad);
}

function waitLoad(){
    if(!dragon.objLoaded){
        window.requestAnimationFrame(waitLoad);
    }else{
        dragon.generateNormals();
        kr.addObjectToScene(dragon);
   
        window.requestAnimationFrame(draw);
    }
}


function draw(){
    kr.resize();
    kr.drawHead();
    kr.updateCamera();
    kr.drawScene();
    // dragon.move(new KreatorVector(4, [0,0,0.1,0]));
//    cube.rotate(rotationSpeed.multiplyBy(direction));
    // kr.drawActiveCamera(true, false);
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

function moveForward(){
    camera.moveN(10);
}

function moveBackwards(){
    camera.moveN(-10);
}

function moveRight(){
    camera.moveU(10);
}

function moveLeft(){
    camera.moveU(-10);
}

function moveAscend(){
    camera.move(new KreatorVector(4, [0,1,0,0]));
}

function moveDescend(){
    camera.move(new KreatorVector(4, [0,-1,0,0]));
}

function moveUp(){
    // dragon.move(new KreatorVector(4, [0,0,1,0]));
    camera.moveForward(10);
}

function moveDown(){
    // dragon.move(new KreatorVector(4, [0,0,-1,0]));
    camera.moveForward(-10);
}

// function mouseDetector(event){
//     let mouseOldPos = new KreatorVector(2, mousePos.toArray());
//     let newMousePos = new KreatorVector(2, [event.clientX,event.clientY]);
//     mousePos = newMousePos;
//     mouseVector.setFromVec(newMousePos.add(mouseOldPos.multiplyBy(-1)));
    
// }
// var i =0;
function rotateCamera(event){
    if(moused){
        let rotationVector = new KreatorVector(4, [mouseOld.get(0)/3.0,mouseOld.get(1)/3.0,0.0, 0.0]);
        mouseOld.set(1, event.movementX);
        mouseOld.set(0, event.movementY);
        camera.rotate(rotationVector);
    }
}


function lockChangeAlert() {
    if (document.pointerLockElement === kr.__app ||
        document.mozPointerLockElement === kr.__app) {
            moused = true;
      document.addEventListener("mousemove", rotateCamera, false);
      
    } else {
        moused = false;
      document.removeEventListener("mousemove", rotateCamera, false);
    }
  }