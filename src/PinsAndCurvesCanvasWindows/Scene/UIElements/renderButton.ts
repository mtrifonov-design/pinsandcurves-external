
import { Project, ProjectTools } from '../../../PinsAndCurvesProjectController';
import { CanvasRoot } from '../../Dependencies';
import { SceneConfig } from '../CreateScene';

async function recordCanvas(canvas : HTMLCanvasElement, startFrame: number, endFrame: number, fps:number, goToFrame: (frameIndex: number) => void) {
    const stream = canvas.captureStream(0); // Capture canvas as a video stream
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
    // for (let i = startFrame; i < endFrame; i++) {
    //     goToFrame(i);
    //     stream.requestFrame();
    //     await new Promise((resolve) => setTimeout(resolve, 100));
    //     requestAnimationFrame(() => goToFrame(i));
    // }

    let frame = startFrame;
    const captureFrame = () => {
        goToFrame(frame)
        stream.getTracks()[0].requestFrame();
        frame++;
        if (frame <= endFrame) {
            setTimeout(captureFrame, 1000 / fps);
        } else {
            mediaRecorder.stop();
        }
    }

    captureFrame();

    // mediaRecorder.stop();
}

async function createVideo(canvas: HTMLCanvasElement, projectTools: ProjectTools,project: Project) {
    const frameRate = project.timelineData.framesPerSecond;
    const [startFrame, endFrame] = project.timelineData.focusRange;
    recordCanvas(canvas, startFrame, endFrame, frameRate, (frameIndex) => {
        projectTools.updatePlayheadPosition(frameIndex,false);
    });
}


function renderButton(root: CanvasRoot, canvas: HTMLCanvasElement, projectTools: ProjectTools,project: Project) {
    const button = document.createElement('button');
    button.innerHTML = 'Render';
    button.id = 'render';
    button.onclick = () => {
        createVideo(canvas, projectTools,project);
    };
    return button;
}
export default renderButton;