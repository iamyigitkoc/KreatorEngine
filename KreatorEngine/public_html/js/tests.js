"use strict";

function test(){
    KreatorLogger.info("Unit testing starting...");

    testVector();
    testMatrix();

}

function testMatrix(){
    KreatorLogger.test("Testing Matrix class");
    testMatrixProduct();
    testMatrixAddition();
}

function testMatrixProduct(){
    let m1 = new KreatorMatrix(2,4);
    let m2 = new KreatorMatrix(4,2);
    m1.setFromArray([
        1,1,2,1,
        4,1,6,2
    ]);
    
    m2.setFromArray([
        -1,8,
        2,1,
        1,1,
        12,6
    ]);
    
    let m1cm2 = new KreatorMatrix(2,2);
    m1cm2.setFromArray([
        15,17,
        28,51
    ]);
    let m2cm1 = new KreatorMatrix(4,4);
    m2cm1.setFromArray([
        31, 7, 46, 15,
        6, 3, 10, 4,
        5, 2, 8, 3,
        36, 18, 60, 24
    ]);
    
    KreatorLogger.test("Testing Matrix Multiplication.");
    if(m1cm2.isIdentical(m1.multiplyByMat(m2)) !== 0){
        KreatorLogger.debug("m1 x m2 gave:");
        KreatorLogger.debug(m1.multiplyByMat(m2));
        KreatorLogger.debug("m1:"+ m1);
        KreatorLogger.debug("m2:"+m2);
        throw new KreatorTestError("Matrix multiplication of 2 matrices failed.");
    }
    KreatorLogger.test("Test passed: m1 x m2 gives correct result!");
    if(m2cm1.isIdentical(m2.multiplyByMat(m1)) !== 0){
        KreatorLogger.debug("m2 x m1 gave:");
        KreatorLogger.debug(m2.multiplyByMat(m1));
        KreatorLogger.debug("m1:"+ m1);
        KreatorLogger.debug("m2:"+ m2);
        throw new KreatorTestError("Matrix multiplication of 2 matrices failed.");
    }
    KreatorLogger.test("Test passed: m2 x m1 gives correct result!");
    
    let v1 = new KreatorVector(4);
    v1.setFromArray([2,3,4,-1]);
    
    let m1xv1 = new KreatorVector(2);
    m1xv1.setFromArray([12,33]);
    
    KreatorLogger.test("Testing Matrix Multiplication with Vectors.");
    if(m1xv1.isIdentical(m1.multiplyByVec(v1)) !== 0){
        KreatorLogger.debug("m1 x v1 gave:");
        KreatorLogger.debug(m1.multiplyByVec(v1));
        KreatorLogger.debug("m1:"+ m1);
        KreatorLogger.debug("v1:"+ v1);
        throw new KreatorTestError("Multiplication of a matrix with a vector failed.");
    }
    KreatorLogger.test("Test pased: m1 x v1 gives correct resutl!");
    
    let m1x3 = new KreatorMatrix(4,2);
    m1x3.setFromArray([
        -3,24,
        6,3,
        3,3,
        36,18
    ]);
    
    
    KreatorLogger.test("Testing Matrix product with scalars.");
    if(m1x3.isIdentical(m2.multiplyBy(3)) !== 0){
        KreatorLogger.debug("m2 x 3 gave:");
        KreatorLogger.debug(m2.multiplyBy(3));
        KreatorLogger.debug("m2:"+ m2);
        throw new KreatorTestError("Matrix multiplication by scalar gave wrong result.");
    }
    KreatorLogger.test("Test passed: m2 x 3 gives correct result!");
}

function testMatrixAddition(){
    let m1 = new KreatorMatrix(2,2);
    m1.setFromArray([
        1,2,
        3,4
    ]);
    let m2 = new KreatorMatrix(2,2);
    m2.setFromArray([
        4,-1,
        -10,60
    ]);
    
    let m1pm2 = new KreatorMatrix(2,2);
    m1pm2.setFromArray([
        5,1,
        -7,64
    ]);
    
    KreatorLogger.test("Testing matrix addition.");
    if(m1pm2.isIdentical(m1.add(m2)) !== 0){
        KreatorLogger.debug("m1 + m2 gave:");
        KreatorLogger.debug(m1.add(m2));
        KreatorLogger.debug("m1:"+ m1);
        KreatorLogger.debug("m2:"+ m2);
        throw new KreatorTestError("Matrix multiplication by scalar gave wrong result.");
    }
    KreatorLogger.test("Test passed m1 + m2 gives correct result!")
}

function testVector(){
    KreatorLogger.test("Testing Vector Class");
    testVectorMultiplication();
    testVectorOtherFunctions();
}

function testVectorMultiplication(){
    KreatorLogger.test("Testing Vector Multiplication.");
    let v1 = new KreatorVector(3);
    v1.setFromArray([3,2,5]);
    let v2 = new KreatorVector(3);
    v2.setFromArray([1,-6,3]);
    
    let dot = 6;
    KreatorLogger.test("Testing for dot product.");
    if(v1.dot(v2) !== dot){
        KreatorLogger.debug("v1 . v2 gave:");
        KreatorLogger.debug(v1.dot(v2));
        KreatorLogger.debug("v1:"+ v1);
        KreatorLogger.debug("v2:"+ v2);
        throw new KreatorTestError("Dot product v1 . v2 gave wrong result.");
    }
    KreatorLogger.test("Test passed: v1 . v2 gives correct result");
    
    
    let vcross = new KreatorVector(3);
    vcross.setFromArray([36,-4,-20]);
    KreatorLogger.test("Testing for cross product of 2 3D vectors.");
    if(vcross.isIdentical(v1.cross3D(v2))){
        KreatorLogger.debug("v1 x v2 gave:");
        KreatorLogger.debug(v1.cross3D(v2));
        KreatorLogger.debug("v1:"+ v1);
        KreatorLogger.debug("v2:"+ v2);
        throw new KreatorTestError("Dot product v1 x v2 gave wrong result.");
    }
    KreatorLogger.test("Test passed: v1 x v2 gives correct result.");
    
    let vcross2 = new KreatorVector(3);
    vcross2.setFromArray([-36,4,20]);
    KreatorLogger.test("Testing for inverse.");
    if(vcross2.isIdentical(v2.cross3D(v1))){
        KreatorLogger.debug("v2 x v1 gave:");
        KreatorLogger.debug(v2.cross3D(v1));
        KreatorLogger.debug("v2:"+ v1);
        KreatorLogger.debug("v1:"+ v2);
        throw new KreatorTestError("Dot product v2 x v1 gave wrong result.");
    }
    KreatorLogger.test("Test passed: v2 x v1 gives correct result.");
    KreatorLogger.test("Test Passed: cross product works as expected.")
    
    let vscalar = new KreatorVector(3);
    vscalar.setFromArray([12,8,20]);
    KreatorLogger.test("Testing for scalar product of vector.");
    if(vscalar.isIdentical(v1.multiplyBy(4))){
        KreatorLogger.debug("v1 x 4 gave:");
        KreatorLogger.debug(v1.multiplyBy(4));
        KreatorLogger.debug("v1:"+ v1);
        throw new KreatorTestError("Dot product v1 x 4 gave wrong result.");
    }
    KreatorLogger.test("Test passed: v1 x 4 gives correct result");
}

function testVectorOtherFunctions(){
    KreatorLogger.test("Testing other Vector Functions.");
    
    let v1 = new KreatorVector(4);
    v1.setFromArray([2,4,5,6]);
    let leng = 9;
    KreatorLogger.test("Testing for length calculation.");
    if(v1.length() !== leng){
        KreatorLogger.debug("v1.length() gave:");
        KreatorLogger.debug(v1.length());
        KreatorLogger.debug("v1:"+ v1);
        throw new KreatorTestError("v1.length() gave wrong result.");
    }
    KreatorLogger.test("Test passed: v1.length() gives correct result");
    
    
    
    let u1 = new KreatorVector(4);
    u1.setFromArray([2/9.0, 4/9.0, 5/9.0, 2/3.0]);
    KreatorLogger.test("Testing for normalization.");
    if(u1.isIdentical(v1.normalize())){
        KreatorLogger.debug("v1.normalize() gave:");
        KreatorLogger.debug(v1.normalize());
        KreatorLogger.debug("v1:"+ v1);
        throw new KreatorTestError("v1.normalize() gave wrong result.");
    }
    KreatorLogger.test("Test passed: v1.normalize() gives correct result");
    
}