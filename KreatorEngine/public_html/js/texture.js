window.onload = function(){
    KreatorLogger.setLogLevel(KreatorLogger.KL_DEBUG);

    init();
};
var kr;
function init(){
    kr = new Kreator("#app", {});
    
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
    
    let cube = new KreatorRectangularPrism(
                new KreatorVector(4, [20, 20, 20,0]),
                new KreatorVector(4, [0,0,0,0]),
                [
                    new KreatorColor('#ffffffff'),
                ],
                new KreatorVector(4, [0,0,0,0]),
                GL_TRIANGLES
            );
    cube.rotate(new KreatorVector(4, [30,30,10,0]));
    cube.generateNormals();
    kr.addObjectToScene(cube);
    window.requestAnimationFrame(draw);
    
}

function draw(){
    kr.resize();
    kr.drawHead();
    kr.updateCamera();
    kr.drawScene();
    window.requestAnimationFrame(draw); 
}