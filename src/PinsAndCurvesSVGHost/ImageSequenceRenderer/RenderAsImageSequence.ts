import JSZip from 'jszip';
import AudioManager from '../audioManager';

function padWithZeros(number : number, length : number) {
    return String(number).padStart(length, '0');
}


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
        console.log('image loaded', frame);

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

const audioManagers: AudioManager[] = [];

function openImageSequenceInNewTab(imageSequence: any[], fps: number, width: number, height: number, startFrame: number, endFrame: number) {
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
    downloadButton.innerText = 'Export as .png sequence';
    const playButton = tabDoc.createElement('button');
    playButton.id = 'playButton';
    playButton.innerText = 'Play / Pause';


    const downloadAsWebmButton = tabDoc.createElement('button');
    downloadAsWebmButton.id = 'downloadAsWebmButton';
    downloadAsWebmButton.innerText = 'Export as .webm';


    const frameCounter = tabDoc.createElement('div');
    frameCounter.innerText = `0 / ${imageSequence.length}`;


    tools.appendChild(downloadButton);
    tools.appendChild(downloadAsWebmButton);
    tools.appendChild(playButton);
    tools.appendChild(frameCounter);



    player.appendChild(canvas);
    player.appendChild(tools);
    tabDoc.body.appendChild(player);


    const audioElements = document.querySelectorAll('audio');

    for (let i = 0; i < audioElements.length; i++) {
        const audio = audioElements[i] as HTMLAudioElement;
        const hiddenAudio = tabDoc.createElement('audio');
        hiddenAudio.src = audio.src;
        hiddenAudio.style.display = 'none';
        tabDoc.body.appendChild(hiddenAudio);
        const audioManager = new AudioManager(hiddenAudio, fps);
        audioManagers.push(audioManager);
    }



    const draw = (lastTime: number) => {
        if (!playing) {
            return;
        }



        const now = performance.now();

        const elapsed = now - lastTime;
        const frameTime = 1000 / fps;
        const elapsedFrames = Math.floor(elapsed / frameTime);
        if (elapsedFrames === 0) {
            w.requestAnimationFrame(() => draw(lastTime));
            return;
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
            const image = imageSequence[frame];
            if (image) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(image, 0, 0);
                frameCounter.innerText = `${frame} / ${imageSequence.length}`;
                repeat = elapsedFrames > imageSequence.length 
                frame = elapsedFrames % imageSequence.length;
                const convertedFrame = startFrame + frame;
                audioManagers.forEach(audioManager => audioManager.adjustAudio(convertedFrame, [startFrame, endFrame]));
                w.requestAnimationFrame(() => draw(lastTime));
            }
        }

        if (mediaRecorder) {
            if (repeat) {
                console.log("Recording stopped...");
                mediaRecorder.stop();
                repeat = false;
                playButton.click();
            }
        }
    }

    let playing = false;
    let frame = 0;
    let repeat = false;
    playButton.addEventListener('click', () => {
        playing = !playing;
        let lastTime = performance.now();
        if (playing) {
            draw(lastTime);
            const convertedFrame = startFrame + frame;
            audioManagers.forEach(audioManager => audioManager.playAudio(convertedFrame));
        }
        if (!playing) {
            audioManagers.forEach(audioManager => audioManager.source.pause());
        }
    })
    const ctx = canvas.getContext('2d');
    if (ctx) {
        const image = imageSequence[0];
        if (image) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(image, 0, 0);
            frameCounter.innerText = `${frame} / ${imageSequence.length}`;
        }
    }


    downloadButton.addEventListener('click', async () => {
        const jsZip = new JSZip();
        const images = jsZip.folder('images');
        const blobs = imageSequence.map((img) => imageToBlob(img, width, height));

        await Promise.all(blobs);

        blobs.forEach((blob, i) => {
            (images as any).file(`frame_${padWithZeros(i,5)}.png`, blob);
        });

        jsZip.generateAsync({ type: 'blob' }).then((content) => {
            const url = URL.createObjectURL(content);
            const a = tabDoc.createElement('a');
            a.href = url;
            a.download = 'image_sequence.zip';
            a.click();
        });

    });

    let mediaRecorder : MediaRecorder | null = null;
    let chunks : any[] = [];
    downloadAsWebmButton.addEventListener('click', async () => {
        const canvasStream = canvas.captureStream(fps); // 30 FPS

        // Capture the audio stream
        const audioStreams = audioManagers.map(audioManager => {
            const audioContext = new AudioContext();
            const source = audioContext.createMediaElementSource(audioManager.source);
            const destination = audioContext.createMediaStreamDestination();
            source.connect(audioContext.destination); // For playback
            source.connect(destination); // For recording
            return destination.stream;

        });

        // Combine the canvas and audio streams
        const combinedStream = new MediaStream([
            ...canvasStream.getVideoTracks(),
            ...audioStreams.flatMap(audioStream => audioStream.getAudioTracks())
        ]);


        // Set up the MediaRecorder
        mediaRecorder = new MediaRecorder(combinedStream);
        mediaRecorder.ondataavailable = event => chunks.push(event.data);
        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            // Create a download link
            const a = tabDoc.createElement('a');
            a.href = url;
            a.download = 'canvas-audio.webm';
            tabDoc.body.appendChild(a);
            a.click();
            tabDoc.body.removeChild(a);
            mediaRecorder = null;
        };


        if (playing) playButton.click();
        frame = 0;

        setTimeout(() => {
            playButton.click();
            (mediaRecorder as MediaRecorder).start();
            console.log('Recording started...');
        }, 50);
    })


    w.document.close();
}

function imageToBlob(img: HTMLImageElement, width : number, height: number) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    ctx.drawImage(img, 0, 0);
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 1));
}



async function renderAsImageSequence({ applySignals, startFrame, endFrame, framesPerSecond }: {
    applySignals: any,
    startFrame: number,
    endFrame: number,
    framesPerSecond: number,
}) {

    const imageSequence = [];
    for (let i = startFrame; i <= endFrame; i++) {
        applySignals(i);
        imageSequence.push(generateImage(i));
    }

    // wait until all images are loaded
    await Promise.all(imageSequence.map(img => new Promise(resolve => img.onload = resolve)))

    const svgcanvas = document.getElementById('svgcanvas') as HTMLCanvasElement;
    const viewBox = svgcanvas.getAttribute('viewBox')?.split(' ').map(v => parseFloat(v)) || [0, 0, 0, 0];
    const width = viewBox[2];
    const height = viewBox[3];

    openImageSequenceInNewTab(imageSequence, framesPerSecond, width, height, startFrame, endFrame);
}

export default renderAsImageSequence;