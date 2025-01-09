import p5 from 'p5'
import { parseNumberAttribute } from './defaultExtensions/parseDefaultTransform';

let width = 1080;
let height = 1080;

let x1 = 0;
let y1 = 0;
let cx = 0;
let cy = 100;
let x2 = 100;
let y2 = 100;
let canvas;
let s;



function ellipseAlongPath(p, x1, y1, cx, cy, x2, y2, t) {
    const x = p.bezierPoint(x1, cx, cx, x2, t);
    const y = p.bezierPoint(y1, cy, cy, y2, t);
    let tx = p.bezierTangent(x1, cx, cx, x2, t);
    let ty = p.bezierTangent(y1, cy, cy, y2, t);
    const tl = p.sqrt(tx * tx + ty * ty);
    tx /= tl;
    ty /= tl;


    return [x, y, tx, ty];
}

function ellipsePoints(p, x,y, tx,ty) {

    const tLenght = 30;
    const nLength = 150;

    const x1 = x - tx * tLenght;
    const y1 = y - ty * tLenght;

    const x3 = x + tx * tLenght;
    const y3 = y + ty * tLenght;
    
    const [nx, ny] = [ty, -tx];

    const x2 = x - nx * nLength;
    const y2 = y - ny * nLength;

    const x4 = x + nx * nLength;
    const y4 = y + ny * nLength;

    return [   [x1, y1],[x2, y2],[x3, y3],[x4, y4], ];
}



let sketch = function (p) {
    p.setup = function () {
        //   // Important to create the canvas in WEBGL mode
        const c = p.createCanvas(width,height);
        canvas = c.canvas;
        canvas.style.display = 'none';  
        p.noLoop();
        p.colorMode(p.HSB,255,255,255,255);
    };

    p.draw = function () {


        // draw a quadratic curve between (x1, y1) and (x2, y2) with control point (cx, cy)
        p.background("black")
        p.stroke("#000000")
        p.strokeWeight(5)
        p.noFill()
        // p.bezier(x1, y1, cx, cy, cx, cy, x2, y2);

        // draw a circle along the curve
        p.strokeWeight(10)
        p.ellipseMode(p.CENTER)

        const number = 75;
        const accPoints = [];

        for (let i = 0; i < number; i += 1) {
            const t = i / number;
            const even = i % 2 === 0;
            const [x, y, tx, ty] = ellipseAlongPath(p, x1, y1, cx, cy, x2, y2, t);
            const points = ellipsePoints(p, x, y, tx, ty);

            if (even) {
                accPoints.push(points[0]);
                accPoints.push(points[1]);
            }
            else {
                accPoints.push(points[2]);
                accPoints.push(points[3]);
            }
        }

        // p.drawingContext.filter = 'blur(120px)';
        
        // // // draw several larges circles along the path,
        // // // with the color changing along the path

        // const numberCircles = 10;
        // const radius = 500;

        // for (let i = 0; i < numberCircles; i++) {
        //     const t = i / numberCircles;
        //     const [x, y, tx, ty] = ellipseAlongPath(p, x1, y1, cx, cy, x2, y2, t);
        //     const color = p.color(p.map(i, 0, numberCircles, 0, 360), 200, 130,108);
        //     // make it alpha
        //     p.fill(color);
        //     p.noStroke();
        //     p.ellipse(x, y, radius);
        // }
    
        // p.noFill();
        // p.drawingContext.filter = 'none';

        

        
        for (let i = 1; i < accPoints.length - 2; i++) {
            const [x0, y0] = accPoints[i - 1]; // Previous point
            const [x1, y1] = accPoints[i];     // Current point
            const [x2, y2] = accPoints[i + 1]; // Next point
            const [x3, y3] = accPoints[i + 2]; // Point after next
    
            // Use Catmull-Rom interpolation for Bézier control points
            const cx1 = x1 + (x2 - x0) / 6;
            const cy1 = y1 + (y2 - y0) / 6;
            const cx2 = x2 - (x3 - x1) / 6;
            const cy2 = y2 - (y3 - y1) / 6;
    
            const colordark = p.color(p.map(i, 1, accPoints.length - 2, 0, 360), 180, 200,254);
            const w = 5;
            const w2 = w/ 2;


            p.strokeWeight(w2);
            p.stroke(colordark);
            p.bezier(x1, y1 + w2, cx1, cy1 +w2, cx2, cy2 +w2 , x2, y2 +w2);

            p.strokeWeight(w2);
            p.stroke(colordark);
            p.bezier(x1, y1 - w2, cx1, cy1 -w2, cx2, cy2 -w2 , x2, y2 -w2);

            const color = p.color(p.map(i, 1, accPoints.length - 2, 0, 360), 180, 254,254);

            // const shadowColor = p.color(p.map(i, 1, accPoints.length - 2, 0, 360), 180, 234,154);

            // p.drawingContext.shadowColor = shadowColor;
            // p.drawingContext.shadowBlur = 10;
            // p.drawingContext.shadowOffsetX = 0;
            // p.drawingContext.shadowOffsetY = 0;

            p.strokeWeight(10);
            p.stroke(color);
            p.bezier(x1, y1, cx1, cy1, cx2, cy2, x2, y2);
        }


        
    };
};



const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
function builder(virtualElement, renderedChild) {

    const w = parseNumberAttribute(virtualElement, 'width') || 1080;
    const h = parseNumberAttribute(virtualElement, 'height') || 1080;
    width = w;
    height = h;
    image.setAttribute('width', String(width));
    image.setAttribute('height', String(height));
    s = new p5(sketch);
    return image;
}

function updater(el) {
    const mode = el.getAttribute('mode') || 'default';


    x1 = parseNumberAttribute(el, 'x1') || 0;
    y1 = parseNumberAttribute(el, 'y1') || 0;
    cx = parseNumberAttribute(el, 'cx') || 0;
    cy = parseNumberAttribute(el, 'cy') || 500;
    x2 = parseNumberAttribute(el, 'x2') || 500;
    y2 = parseNumberAttribute(el, 'y2') || 500;

    s.redraw();
    const dataUrl = canvas.toDataURL();
    image.setAttribute('href', dataUrl);
    image.setAttribute('preserveAspectRatio', 'none');
}

const tagNames = ['p5slinky'];

export { builder, updater, tagNames };