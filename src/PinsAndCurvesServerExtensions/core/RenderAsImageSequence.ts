import JSZip from 'jszip';


function padWithZeros(number : number, length : number) {
    return String(number).padStart(length, '0');
}

async function generateImage(frame: number): Promise<HTMLImageElement> {
    return new Promise(async (resolve, reject) => {
        try {
            // Get the SVG canvas element
            const svgcanvas = document.getElementById("pac-root") as any as SVGSVGElement;
            if (!svgcanvas) {
                reject(new Error("SVG canvas not found"));
                return;
            }

            // Ensure the SVG has the correct namespace
            svgcanvas.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

            // Replace all <image> hrefs with data URLs
            const images = Array.from(svgcanvas.querySelectorAll('image'));
            await Promise.all(images.map((image: SVGImageElement) => {
                // check if image is already a data URL
                if (image.href.baseVal.startsWith('data:')) {
                    return Promise.resolve();
                }
                return new Promise<void>((resolveImage, rejectImage) => {
                    const img = new Image();
                    img.crossOrigin = 'anonymous'; // Allow cross-origin loading for images
                    img.onload = () => {
                        const canvas = document.createElement('canvas');

                        canvas.width = image.width.baseVal.value;
                        canvas.height = image.height.baseVal.value;
                        const ctx = canvas.getContext('2d')!;
                        ctx.drawImage(img, 0, 0);
                        const dataUrl = canvas.toDataURL('image/png');
                        image.setAttribute('href', dataUrl);
                        resolveImage();
                    };
                    img.onerror = () => rejectImage(new Error(`Failed to load image: ${image.href.baseVal}`));
                    img.src = image.href.baseVal || image.getAttribute('href')!;
                });
            }));

            // Serialize the updated SVG to a string
            const serializedSvg = new XMLSerializer().serializeToString(svgcanvas);
            

            // Create a Blob from the serialized SVG
            const svgBlob = new Blob([serializedSvg], { type: 'image/svg+xml;charset=utf-8' });
            const blobUrl = URL.createObjectURL(svgBlob);



            // draw the blob to a canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error("Failed to create canvas 2D context"));
                return;
            }
            const img = new Image();
            img.onload = () => {
                const bbox = svgcanvas.getBBox();
                canvas.width = bbox.width;
                canvas.height = bbox.height;
                ctx.drawImage(img, 0, 0);
                resolve(canvas as any);
            };
            img.onerror = () => reject(new Error("Failed to load SVG blob URL"));
            img.src = blobUrl;

            // // Create an HTMLImageElement from the Blob URL
            // const img = new Image();
            // img.onload = () => {
            //     URL.revokeObjectURL(blobUrl); // Clean up the Blob URL
            //     resolve(img); // Return the loaded image
            // };
            // img.onerror = (e : any) => {
            //     URL.revokeObjectURL(blobUrl); // Clean up the Blob URL
            //     console.log(e);
            //     reject(new Error("Failed to load SVG blob URL"));
            // };
            // img.src = blobUrl;
        } catch (error) {
            reject(error); // Catch any unexpected errors
        }
    });
}




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

        console.log('blobs done');

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


        // Combine the canvas and audio streams
        const combinedStream = new MediaStream([
            ...canvasStream.getVideoTracks(),
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
    console.log('image to blob');
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 1));
}



async function renderAsImageSequence({ applySignals, startFrame, endFrame, framesPerSecond }: {
    applySignals: any,
    startFrame: number,
    endFrame: number,
    framesPerSecond: number,
}) {

    let imageSequence = [];
    for (let i = startFrame; i <= endFrame; i++) {
        console.log("Starting work on frame", i);
        applySignals(i);
        await new Promise((resolve) => setTimeout(resolve, 0));
        imageSequence.push(generateImage(i));
    }
    imageSequence = await Promise.all(imageSequence);
    

    console.log('image sequence', imageSequence);
    const svgcanvas = document.getElementById('pac-root') as HTMLCanvasElement;
    const viewBox = svgcanvas.getAttribute('viewBox')?.split(' ').map(v => parseFloat(v)) || [0, 0, 0, 0];
    const width = viewBox[2];
    const height = viewBox[3];
    openImageSequenceInNewTab(imageSequence, framesPerSecond, width, height, startFrame, endFrame);
}

export default renderAsImageSequence;