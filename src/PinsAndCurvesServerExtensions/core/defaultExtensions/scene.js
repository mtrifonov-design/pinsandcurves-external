import { parseDefaultTransform,parseNumberAttribute } from "./parseDefaultTransform";
const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');


function builder(virtualElement, renderedChild) {
    svg.appendChild(renderedChild);
    return svg;
}

function updater(virtualElement) {
    const width = parseNumberAttribute(virtualElement, "width") || 800;
    const height = parseNumberAttribute(virtualElement, "height") || 600;
    const viewBox = `0 0 ${width} ${height}`;
    svg.setAttribute('viewBox', viewBox);   
}

// function uiBuilder() {
//     const h1 = document.createElement('h1');
//     h1.innerHTML = 'p5brush extension';
//     return h1;
// }

const tagNames = ['scene'];

export { builder, updater, tagNames };

