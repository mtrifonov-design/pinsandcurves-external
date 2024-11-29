
let callbacks : Function[] = [];
function FullscreenCanvas() {
    const canvas = document.createElement('canvas');
    canvas.style.background = '#242526';
    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';
    document.body.appendChild(canvas);
    
    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  
    // Call resizeCanvas initially to set the correct size
    resizeCanvas();
  
    // ResizeObserver to automatically adjust canvas size
    const resizeObserver = new ResizeObserver(() => {
      callbacks.forEach((callback) => callback());
      resizeCanvas();
    });

    const subscribe = (callback: Function) => {
        callbacks.push(callback);
        return () => {
            callbacks = callbacks.filter(cb => cb !== callback);
        };
    }
  
    // Observe the document body for any changes to its size
    resizeObserver.observe(document.body);
  
    return {canvas, subscribeToCanvasResize: subscribe};
  }

  
  export default FullscreenCanvas;