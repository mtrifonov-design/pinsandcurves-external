import { parseDefaultTransform,parseNumberAttribute } from "./parseDefaultTransform";
const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');

function builder(virtualElement, renderedChild) {
    return circle;
}

function updater(virtualElement) {
    const r = parseNumberAttribute(virtualElement, "r") || 50;
    const fill = virtualElement.getAttribute("fill") || "red";
    const stroke = virtualElement.getAttribute("stroke") || "transparent";
    const strokeWidth = virtualElement.getAttribute("stroke-width") || "0";
    const style = virtualElement.getAttribute("style") || "";

    const cx = parseNumberAttribute(virtualElement, "cx") || 0;
    const cy = parseNumberAttribute(virtualElement, "cy") || 0;


    let { x, y, anchorX, anchorY, rotation, scaleX, scaleY, skewX, skewY } = parseDefaultTransform(virtualElement);
    x += cx;
    y += cy;
    const matrix = `matrix(${scaleX}, ${skewX}, ${skewY}, ${scaleY}, ${0}, ${0})`;
    circle.setAttribute("cx", "0");
    circle.setAttribute("cy", "0");
    circle.setAttribute('r', r);
    circle.setAttribute('fill', fill);
    circle.setAttribute('stroke', stroke);
    circle.setAttribute('stroke-width', strokeWidth);
    circle.setAttribute('style', style);
    circle.setAttribute('transform', `
    translate(${x} ${y})
    translate(${anchorX} ${anchorY})
    ${matrix}
    rotate(${rotation})
    translate(${-anchorX} ${-anchorY}) 
    `);
}

// function uiBuilder() {
//     const h1 = document.createElement('h1');
//     h1.innerHTML = 'p5brush extension';
//     return h1;
// }

const tagNames = ['circle'];

export { builder, updater, tagNames };

