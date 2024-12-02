function RenderCanvas() {
    const canvas = document.createElement('canvas');
    canvas.style.display = 'none';
    canvas.style.background = '#242526';
    canvas.style.border = '1px solid #4D5762';
    canvas.style.height = '100vh';
    //canvas.style.zIndex = '1000';
    const container = document.createElement('div');
    container.style.background = '#242526';
    container.style.width = '100vw';
    container.style.height = '100vh';
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'center';
    container.style.position = 'absolute';
    container.style.top = '0';
    container.style.left = '0';
    container.style.zIndex = '-10';


    container.appendChild(canvas);
    document.body.appendChild(container);
    return canvas;
}

export default RenderCanvas;