import JSZip from 'jszip';

function generateImage(frame: number) {
    const svgcanvas = document.getElementById('svgcanvas') as HTMLCanvasElement;
    const data = (new XMLSerializer()).serializeToString(svgcanvas);
    const svgBlob = new Blob([data], {
        type: 'image/svg+xml;charset=utf-8'
    });

    const url = URL.createObjectURL(svgBlob);

    // load the SVG blob to a flesh image object
    const img = new Image();
    img.addEventListener('load', () => {
        console.log('image loaded',frame);

        // draw the image on an ad-hoc canvas
        const bbox = svgcanvas.getBoundingClientRect();
      
        const canvas = document.createElement('canvas');
        canvas.width = bbox.width;
        canvas.height = bbox.height;
      
        const context = canvas.getContext('2d') as CanvasRenderingContext2D;
        context.drawImage(img, 0, 0, bbox.width, bbox.height);
      
        URL.revokeObjectURL(url);
      });
    img.src = url;
    return img;
}

function openImageSequenceInNewTab(imageSequence: any[],fps:number, width:number, height:number) {
    const w = window.open();
    if (!w) return;
    const tabDoc = w.document;
    const player = tabDoc.createElement('div');
    player.style.display = 'flex';
    player.style.flexDirection = 'column';
    player.style.justifyContent = 'center';
    player.style.alignItems = 'center';
    player.style.marginTop = '20px';

    const canvas = tabDoc.createElement('canvas');
    canvas.id = 'canvas';
    canvas.width = width;
    canvas.height = height;
    canvas.style.border = '1px solid grey';

    tabDoc.body.style.margin = '0';


    const tools = tabDoc.createElement('div');
    tools.style.display = 'flex';
    tools.style.flexDirection = 'row';
    tools.style.justifyContent = 'center';
    tools.style.alignItems = 'center';
    tools.style.marginTop = '20px';
    tools.style.gap = '10px';

    const downloadButton = tabDoc.createElement('button');
    downloadButton.id = 'downloadButton';
    downloadButton.innerText = 'Download';
    const playButton = tabDoc.createElement('button');
    playButton.id = 'playButton';
    playButton.innerText = 'Play / Pause';
    
    const frameCounter = tabDoc.createElement('div');
    frameCounter.innerText = `0 / ${imageSequence.length}`;
    
    tools.appendChild(downloadButton);
    tools.appendChild(playButton);
    tools.appendChild(frameCounter);



    player.appendChild(canvas);
    player.appendChild(tools);
    tabDoc.body.appendChild(player);


    const draw = (lastTime: number) => {
        if (!playing) {
            return;
        }
        const now = performance.now(); 
        const elapsed = now - lastTime;
        const frameTime = 1000 / fps;
        if (elapsed < frameTime) {
            w.requestAnimationFrame(draw);
            return;
        }
        const ctx = canvas.getContext('2d');
        if (ctx) {
            const image = imageSequence[frame];
            if (image) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(image, 0, 0);
                frameCounter.innerText = `${frame} / ${imageSequence.length}`;
                frame = (frame + 1) % imageSequence.length;
                lastTime = performance.now();
                w.requestAnimationFrame(() => draw(lastTime));
            }
        }
    }

    let playing = true;
    let frame = 0;
    playButton.addEventListener('click', () => {
        playing = !playing;
        let lastTime = performance.now();
        if (playing) {
            draw(lastTime);
        }
    })
    draw(performance.now());

    downloadButton.addEventListener('click', async () => {
        const jsZip = new JSZip();
        const images = jsZip.folder('images');
        const blobs = imageSequence.map(imageToBlob);

        await Promise.all(blobs);

        blobs.forEach((blob, i) => {
            (images as any).file(`frame_${i}.png`, blob);
        });

        jsZip.generateAsync({type: 'blob'}).then((content) => {
            const url = URL.createObjectURL(content);
            const a = tabDoc.createElement('a');
            a.href = url;
            a.download = 'image_sequence.zip';
            a.click();
        });
    
    });


    w.document.close();
}

function imageToBlob(img : HTMLImageElement) {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    ctx.drawImage(img, 0, 0);
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}



async function renderAsImageSequence({applySignals, startFrame, endFrame, framesPerSecond}:{
    applySignals: any,
    startFrame: number,
    endFrame: number,
    framesPerSecond: number
}) {

    const imageSequence = [];
    for (let i = startFrame; i <= endFrame; i++) {
        applySignals(i);
        imageSequence.push(generateImage(i));
    }

    // wait until all images are loaded
    await Promise.all(imageSequence.map(img => new Promise(resolve => img.onload = resolve)))

    const svgcanvas = document.getElementById('svgcanvas') as HTMLCanvasElement;
    const bbox = svgcanvas.getBoundingClientRect();
    const width = bbox.width;
    const height = bbox.height;

    openImageSequenceInNewTab(imageSequence,framesPerSecond, width, height);
}

export default renderAsImageSequence;