import * as brush from 'p5.brush'
import p5 from 'p5'
import { parseNumberAttribute } from './defaultExtensions/parseDefaultTransform';

let canvas;

let palette = ["#7b4800", "#002185", "#003c32", "#fcd300", "#ff2702", "#6b9404"]

let r = 150;

let sketch = function (p) {
    let x = 100;
    let y = 100;

    // Register instance method here, sending your function arg p
    brush.instance(p)

    p.setup = function () {
        //   // Important to create the canvas in WEBGL mode
        const c = p.createCanvas(1000, 1000, p.WEBGL);
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

        brush.field("waves")



        const rainbowColors = ["#fff570", "#fffbc7", "#fffbc7", "#e875ff", "#c175ff", "#4b0082", "#8b00ff"];

        
        let available_brushes = brush.box();
        const startR = r;
        for (let i = 0; i < 10; i++) {
            const curR = startR - i * (startR / 10);
            const color = rainbowColors[i % rainbowColors.length];
            // brush.fill(color, 75);
            brush.set(available_brushes[9], color, 5)
            brush.circle(500,500, curR);
        }

        
     
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
    return image;
}

function updater(el) {
    image.setAttribute('width', '1000');
    image.setAttribute('height', '1000');

    const newR = parseNumberAttribute(el, 'r') || 150;
    if (newR !== r) {
        r = newR;
        s.redraw();
        const dataUrl = canvas.toDataURL();
        image.setAttribute('href', dataUrl);
    }
}

const tagNames = ['p5brush'];

export { builder, updater, tagNames };