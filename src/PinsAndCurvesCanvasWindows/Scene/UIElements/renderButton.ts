
import { Project, ProjectTools } from '../../../PinsAndCurvesProjectController';


async function recordCanvas(canvas : HTMLCanvasElement, frames: number, width : number, height: number, fps:number, goToFrame: (frameIndex: number) => void) {
    const stream = canvas.captureStream(fps); // Capture canvas as a video stream
    const mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    const chunks = []; // Store recorded chunks

    mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
            chunks.push(e.data);
        }
    };

    mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/mp4" });
        // Create a download link for the recorded video
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = "animation.webm";
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        console.log("Recording complete and downloaded!");
    };

    mediaRecorder.start();

    // Render each frame on the canvas
    for (let i = 0; i < frames; i++) {
        goToFrame(i);
        await new Promise((resolve) => setTimeout(resolve, 1000 / fps));
    }

    mediaRecorder.stop();
}

async function createVideo(canvas: HTMLCanvasElement, projectTools: ProjectTools,project: Project) {
    const frameRate = project.timelineData.framesPerSecond;
    const frameCount = project.timelineData.numberOfFrames;

    // Custom render logic
    async function renderFrame(canvas : HTMLCanvasElement, frameIndex : number) {
        projectTools.updatePlayheadPosition(frameIndex,false);
        await new Promise<void>((resolve) => {
            requestAnimationFrame(() => {
                resolve();
            });
        });
    }
    recordCanvas(canvas, frameCount, canvas.width, canvas.height, frameRate, (frameIndex) => {
        projectTools.updatePlayheadPosition(frameIndex,false);
    });
}


function renderButton(canvas: HTMLCanvasElement, projectTools: ProjectTools,project: Project) {
    const button = document.createElement('button');
    button.innerHTML = 'Render';
    button.id = 'render';
    button.onclick = () => {
        createVideo(canvas, projectTools,project);
    };
    return button;
}
export default renderButton;