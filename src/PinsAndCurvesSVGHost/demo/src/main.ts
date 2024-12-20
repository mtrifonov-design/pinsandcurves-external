import PinsAndCurvesSVGHost from '../..';


// Create the SVG host
const host = PinsAndCurvesSVGHost.Init({
    framesPerSecond: 30,
    numberOfFrames: 250,
},true)

const renderButton = document.getElementById('renderButton');
renderButton?.addEventListener('click', () => {
    host.renderAsImageSequence();
});


//window.render = host.render.bind(host);
// console.log("TEST")