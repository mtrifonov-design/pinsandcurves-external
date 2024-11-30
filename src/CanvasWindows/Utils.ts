import type {Vec2, BoundingBox} from "./types";

function add(a: Vec2, b: Vec2) : Vec2 {
    return [a[0] + b[0], a[1] + b[1]];
}
function subtract(a: Vec2, b: Vec2) : Vec2 {
    return [a[0] - b[0], a[1] - b[1]];
}
function dotMultiply(a: Vec2, b: Vec2) : Vec2 {
    return [a[0] * b[0], a[1] * b[1]];
}

function norm(a: Vec2) : number {
    return Math.sqrt(a[0]**2 + a[1]**2);
}

function dotProduct(a: Vec2, b: Vec2) : number {
    return a[0] * b[0] + a[1] * b[1];
}

function scale(a: Vec2, s: number) : Vec2 {
    return [a[0] * s, a[1] * s];
}

function boxesIntersect(a: BoundingBox, b: BoundingBox) {
    // console.log(a,b)
    const [ax1, ay1, ax2, ay2] = [a[0][0], a[0][1], a[2][0], a[2][1]];
    const [bx1, by1, bx2, by2] = [b[0][0], b[0][1], b[2][0], b[2][1]];
    //console.log(ax1,ay1,ax2,ay2,bx1,by1,bx2,by2)
    // 50 50 150 150 0 0 500 500
    // 50 > 500 || 150 < 0
    // 50 > 500 || 150 < 0
    if (ax1 > bx2 || ax2 < bx1) return false;
    if (ay1 > by2 || ay2 < by1) return false;
    // console.log('intersecting')
    return true;
}



export {add, subtract, dotMultiply, boxesIntersect, norm, dotProduct, scale};