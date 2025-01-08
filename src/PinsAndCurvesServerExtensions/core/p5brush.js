import * as brush from 'p5.brush'
import p5 from 'p5'
import { parseNumberAttribute } from './defaultExtensions/parseDefaultTransform';


function generateWavePath(freq,phase) {
    const path = [];
    const number = 1000
    for (let i = 0; i < number; i++) {
        path.push([(i / number), (Math.sin((i / number) * Math.PI * 2 * freq + phase) + 1) / 2]);
    }
    return path
}





let canvas;

let palette = ["#7b4800", "#002185", "#003c32", "#fcd300", "#ff2702", "#6b9404"]

let width = 1080;
let height = 1080;
let x = 100;
let y = 100;
let w = 100;
let h = 100;
let phase = 0;
let r = 3;

const factor = 4;
let t = 0;

let sketch = function (p) {

    // Register instance method here, sending your function arg p
    brush.instance(p)

    p.setup = function () {
        //   // Important to create the canvas in WEBGL mode
        const c = p.createCanvas(width / factor,height / factor, p.WEBGL);
        canvas = c.canvas;
        canvas.style.display = 'none';  
        brush.load()
        p.noLoop();
    };

    p.draw = function () {
        p.angleMode(p.DEGREES)
        p.background("#fffceb")
     
        p.translate(-p.width/2,-p.height/2);

        // p.fill("#000000");
        // p.circle(500,500,r);

        // brush.addField("waves2", function(t, field) {
        //     let sinrange = 5 * Math.sin(t);
        //     let cosrange = 3 * Math.cos(t);
        //     let baseAngle = 20 * Math.cos(t);
        //     for (let column = 0; column < field.length; column++) {
        //         for (let row = 0; row < field[0].length; row++) {               
        //             let angle = Math.sin(sinrange * column) * (baseAngle * Math.cos(row * cosrange)) * 100;
        //             field[column][row] = (Math.sin(t * Math.PI * 100) + 1) / 2 * 10;
        //         }
        //     }
        //     return field;
        // });
        // console.log(t)
        // brush.field("waves2", t);

        // brush.field("waves", t);
        brush.seed(1)




        let available_brushes = brush.box();
        // const rainbowColors = ["red","green","orange"];
        // const startR = r;
        // for (let i = 0; i < 5; i++) {
        //     const curR = startR - i * (startR / 5);
        //     const color = rainbowColors[i % rainbowColors.length];
        //     // brush.fill(color, 75);
        //     brush.set(available_brushes[10], color, (r / 30) * 10 / factor)
        //     const xOffset = (x) / i;
        //     const yOffset = (y) / i;

        //     brush.circle(p.width/2 + xOffset,p.height/2 + yOffset, curR);
        // }

        // const springPath = generateSpringPath(p.width / factor * 2, 0, p.width / factor * 2, 250, 5, 100);


        




        const wavePath = generateWavePath(2,phase);

        brush.beginStroke();

        brush.set(available_brushes[10], "green", r);


        // for (let i = 0; i < wavePath.length - 1; i++) {
        //     const p1 = wavePath[i];
        //     const p2 = wavePath[i + 1];

        //     const relative = i / wavePath.length;

        //     brush.set(available_brushes[10], rainbowColors[i % rainbowColors.length], 5);
        //     const w = 50;
        //     const h = 300;
        //     // brush.line(p1[1] * w,p1[0] * h,p2[1] * w,p2[0] * h);
        //     brush.vertex(p1[1] * w,p1[0] * h);
        // }







        brush.spline(wavePath.map(p => [p[1] * w + x,p[0] * h + y]),0);

        brush.endStroke();

        // add a circle shape for the snake head
        // const lastPoint = wavePath[0];
        // // brush.noStroke();
        // const headSize = 14;
        // brush.circle(lastPoint[1] * w + x ,lastPoint[0] * h + y ,headSize);
        // brush.fill("green", 100);



        // 
        // // Set the stroke to a random brush, color, and weight = 1
        // // You set a brush like this: brush.set(name_brush, color, weight)  
        // brush.set(available_brushes[0], "black", 10)
        // brush.flowLine(0,0,500,500);


     
    };
};

const s = new p5(sketch);

const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
function builder(virtualElement, renderedChild) {
    image.setAttribute('width', String(width));
    image.setAttribute('height', String(height));
    return image;
}

function updater(el) {
    const mode = el.getAttribute('mode') || 'default';

    const neww = width / factor;
    const newh = height / factor;

    x = (parseNumberAttribute(el, 'x') || 0) * neww;
    y = (parseNumberAttribute(el, 'y') || 0) * 2 * newh - newh;
    w = (parseNumberAttribute(el, 'w') || 0) * width / factor;
    h = (parseNumberAttribute(el, 'h') || 0) * height / factor;
    phase = (parseNumberAttribute(el, 'phase') || 0) * Math.PI * 2;

    r = parseNumberAttribute(el, 'r') || 3;
    // if (newR !== r || newT !== t) {
    //     // r = newR;

        s.redraw();
        const dataUrl = canvas.toDataURL();
        image.setAttribute('href', dataUrl);
        image.setAttribute('preserveAspectRatio', 'none');
    // }
}

const tagNames = ['p5brush'];

export { builder, updater, tagNames };