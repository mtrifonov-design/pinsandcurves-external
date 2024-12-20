
import { ProjectTools } from "../PinsAndCurvesProjectController";
import { PinsAndCurvesProject } from "../ProjectDataStructure";

function generateId() {
    return Math.random().toString(36).substring(2, 15);
}

class AudioManager {

    source: HTMLAudioElement;
    fps: number;
    constructor(source: HTMLAudioElement, fps: number) {
        this.source = source;
        this.fps = fps;
    }

    playing: boolean = false;
    onUpdate(project: PinsAndCurvesProject) {
        const frame = project.timelineData.playheadPosition;
        const playing = project.timelineData.playing;
        const focusRange = project.timelineData.focusRange;
        if (!this.playing && playing) {
            this.playing = true;
            this.playAudio(frame);
        }
        if (this.playing && playing) {
            this.adjustAudio(frame, focusRange);
        }

        if (this.playing && !playing) {
            this.playing = false;
            this.source.pause();
        }
    }

    adjustAudio(frame: number, focusRange: [number, number]) {
        const fps = this.fps;
        const now = Date.now();
        const elapsed = now - (this.playbackStartTime as number);
        const elapsedFrames = Math.floor(elapsed / 1000 * fps);
        const [min,max] = focusRange;
        const duration = max - min;
        const needsReset = ((this.frame as number + elapsedFrames) - min) > duration;
        if (needsReset) {
            this.playAudio(frame);
        }
    }

    frame: number | undefined;
    playbackStartTime: number | undefined;
    playAudio(startFrame: number) {
        const frame = startFrame;
        const fps = this.fps;
        this.frame = frame;
        this.playbackStartTime = Date.now();
        // compute current time from fps and frame
        const currentTime = frame / fps;
        const audio = this.source;
        audio.pause();
        audio.currentTime = currentTime;
        audio.play();
    }

    async castAudioToSignal(project: PinsAndCurvesProject, projectTools: ProjectTools) {
        const sourceURL = this.source.src;
        // if signal exists, exit
        if (project.orgData.signalIds.includes(sourceURL)) {
            return;
        }


        const audioBuffer = await loadAndDecodeAudio(sourceURL) as AudioBuffer;
        const channelData = (audioBuffer as AudioBuffer).getChannelData(0);
        const fps = project.timelineData.framesPerSecond;
        const msPerChunk = 1000 / (fps * 10);
        const chunkSize = Math.round((audioBuffer.sampleRate * msPerChunk) / 1000);
        let chunkTotalValue = 0;
        const chunkAverages = [];
        let currentChunkSize = 0;
        for (let i = 0; i < audioBuffer.length; i++) {
            // Channel data will be between -1 and 1
            // Absolute value ensures negatives don't just cancel out positives
            const value = Math.abs(channelData[i]);
            currentChunkSize++;
            chunkTotalValue += value;
            if (i > 0 && (i % chunkSize === 0 || i === audioBuffer.length - 1)) {
                const chunkAverage = chunkTotalValue / currentChunkSize;
                chunkAverages.push(chunkAverage);
                chunkTotalValue = 0;
                currentChunkSize = 0;
            }
        }
        const max = Math.max(...chunkAverages);
        const normalizedChunkValues = chunkAverages.map((avg) => {
            return avg / max;
        });

        const functionString = `
            const audioData = ${JSON.stringify(normalizedChunkValues)};
            const index = Math.floor(Number(frame.toFixed(1)) * 10);
            return audioData[index];
        `

        const signalName = sourceURL;
        const signalId = sourceURL;
        projectTools.createContinuousSignal(signalId,signalName, [0,1], 0, "return 0;");
        projectTools.addPinContinuous(signalId, generateId(), 0,0, "return 0;", true);
        const lastFrame = project.timelineData.numberOfFrames;
        projectTools.addPinContinuous(signalId, generateId(), lastFrame,0, functionString, true);
        return;
    }




}

// Helper function to fetch and decode from a URL
async function loadAndDecodeAudio(audioURL: string) {
    const response = await fetch(audioURL);
    const arrayBuffer = await response.arrayBuffer();
    return decodeAudioData(arrayBuffer);
}

// Decodes the ArrayBuffer into an AudioBuffer
// This gives access to the raw channel data which we use to generate the waveform
// https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer
// https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/decodeAudioData
async function decodeAudioData(arrayBuffer: ArrayBuffer) {
    return new Promise((resolve, reject) => {
        const audioContext = new (window.AudioContext ||
            (window as any).webkitAudioContext)();
        audioContext.decodeAudioData(arrayBuffer, resolve, reject);
    });
}



export default AudioManager;