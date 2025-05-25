import { PinsAndCurvesProjectTransformer, ProjectNode, InterpolateSignalValue } from "..";
import { StateTimeWorm as w } from "..";
import { PACProjectController, Project, Instruction, ProjectNodeEventDispatcher } from "./types";
import constructProjectTools from './ConstructProjectTools';
import { ProjectNodeEvent } from "../ProjectNode";

const HostProjectNode = ProjectNode.HostProjectNode;
const ClientProjectNode = ProjectNode.ClientProjectNode;
const transformer: (p: Project, i: Instruction[]) => Project = PinsAndCurvesProjectTransformer.PinsAndCurvesProjectTransformer;
//const interpolateSignalValue = InterpolateSignalValue.interpolateSignalValue;
type InterpolateSignalReturnType = InterpolateSignalValue.InterpolateSignalReturnType;
type Worm = w.StateTimeWorm<Project, Instruction>;
type WormCommand = w.WormCommand<Instruction>;

type SerializedDistributedWorm = {
    worm: string;
    stateId: string;
    lastAgreedStateId: string;
    outgoingCommands: WormCommand[];
}

type DistributedWormEvent = {
    commands: WormCommand[];
    aStateId: string;
    bStateId: string;
}

class DistributedWorm {
    worm: Worm;
    stateId: string;
    aStateId: string;
    bStateId: string;
    outgoingCommands: WormCommand[] = [];
    constructor(serialised_dworm: SerializedDistributedWorm) {
        this.worm = w.StateTimeWorm.deserialize(serialised_dworm.worm, transformer);
        this.stateId = serialised_dworm.stateId;
        this.aStateId = serialised_dworm.stateId;
        this.bStateId = crypto.randomUUID(); 
        this.outgoingCommands = serialised_dworm.outgoingCommands;
    }

    serialize() {
        return {
            worm: this.worm.serialize(),
            stateId: this.stateId,
            outgoingCommands: this.outgoingCommands
        };
    }

    pushOutgoingCommands(...commands: WormCommand[]) {
        // if (this.outgoingCommands.length === 0) {
        //     this.lastAgreedStateId = this.stateId; // memorize the last cleared state id
        //     this.stateId = crypto.randomUUID(); // issue a new state id, an "out of sync" state
        // }
        this.outgoingCommands.push(...commands);
    }

    transferOutgoingEvent() {
        const event: DistributedWormEvent = {
            commands: this.outgoingCommands,
            aStateId: this.aStateId,
            bStateId: this.bStateId,
        };
        this.aStateId = this.bStateId;
        this.bStateId = crypto.randomUUID(); 
        this.outgoingCommands = [];
        return event;
    }

    receiveIncomingEvent(e: DistributedWormEvent) {
        if (e.aStateId !== this.stateId) {
            throw new Error("Trying to apply commands to a worm that is not in sync");
        }
        this.worm.executeCommands(e.commands);
        this.aStateId = e.bStateId;
        this.bStateId = crypto.randomUUID(); 
        this.stateId = e.bStateId;
    }

}


class TimelineController {
    dworm: DistributedWorm;
    constructor(serialized_dworm: SerializedDistributedWorm) {
        this.dworm = new DistributedWorm(serialized_dworm);
        this.project = this.processProject(this.dworm.worm.content);
        if (window && ("requestAnimationFrame" in window)) this.playingLoop();
        this.onTimelineUpdate(() => {
            const project = this.processProject(this.dworm.worm.content);
            this.project = project;
        })
    }

    // --> CONTINUE HERE <--
    lastFrame = 0;
    playingLoop() {
        const playing = this.project.timelineData.playing;
        if (playing) {
            //this.project = this.processProject(this.dworm.worm.content);
            const project = this.processProject(this.dworm.worm.content);
            const currentFrame = project.timelineData.playheadPosition;
            if (currentFrame !== this.lastFrame) {
                this.lastFrame = currentFrame;
                this.onTimelineUpdateCallbacks.forEach((callback) => callback());
            }
            // this.pushUpdate();
        }
        window.requestAnimationFrame(() => this.playingLoop());
    }


    private processProject(project: Project) {
        const playing = project.timelineData.playing;
        const playingTimestamp = project.timelineData.playingTimestamp;
        if (playing) {
            // If the project is playing, we need to set the playhead position to the current frame
            const elapsedFrames = Math.floor((Date.now() - playingTimestamp) / (1000 / project.timelineData.framesPerSecond));
            let playheadPosition = project.timelineData.playheadPosition;
            const [rangeStart, rangeEnd] = project.timelineData.focusRange;
            if (playheadPosition < rangeStart || playheadPosition > rangeEnd) {
                playheadPosition = rangeStart;
            }
            let currentFrame = playheadPosition + elapsedFrames;
            currentFrame -= rangeStart;
            currentFrame = currentFrame % (rangeEnd - rangeStart);
            currentFrame += rangeStart;
            project = {
                ...project,
                timelineData: {
                    ...project.timelineData,
                    playheadPosition: currentFrame,
                },
            };
        }
        return project;
    }

    static fromProject(project: Project) {
        const worm = new w.StateTimeWorm(project, transformer);
        const stateId = "initialState";
        const serialized_dworm: SerializedDistributedWorm = {
            worm: worm.serialize(),
            stateId,
            lastAgreedStateId: stateId,
            outgoingCommands: []
        };
        return new TimelineController(serialized_dworm);
    }

    static fromSerializedWorm(serialized_dworm: SerializedDistributedWorm) {
        return new TimelineController(serialized_dworm);
    }

    serialize() {
        return this.dworm.serialize();
    }

    receiveIncomingEvent(e: DistributedWormEvent) {
        this.dworm.receiveIncomingEvent(e);
        this.onTimelineUpdateCallbacks.forEach((callback) => callback());
    }

    onTimelineUpdateCallbacks: (() => void)[] = [];
    onTimelineUpdate(callback: () => void) {
        this.onTimelineUpdateCallbacks.push(callback);
        return () => {
            this.onTimelineUpdateCallbacks = this.onTimelineUpdateCallbacks.filter((c) => c !== callback);
        }
    }


    transferOutgoingEvent() {
        return this.dworm.transferOutgoingEvent();
    }

    getWorm() {
        return this.dworm.worm;
    }

    private pushCommand(commandFunction: () => w.WormCommand<Instruction>) {
        try {
            const command = commandFunction();
            //this.dworm.worm.executeCommand(command);
            this.dworm.pushOutgoingCommands(command);
        } catch (e) {
            console.error(e);
        }
    }

    private pushCommands(commandsFunction: () => w.WormCommand<Instruction>[]) {
        try {
            const commands = commandsFunction();
            //this.dworm.worm.executeCommands(commands);
            this.dworm.pushOutgoingCommands(...commands);
        } catch (e) {
            console.error(e);
        }
    }

    onPushUpdateCallbacks : (() => void)[] = [];
    onPushUpdate(callback: () => void) {
        this.onPushUpdateCallbacks.push(callback);
        return () => {
            this.onPushUpdateCallbacks = this.onPushUpdateCallbacks.filter((c) => c !== callback);
        }
    }
    private pushUpdate() {
        this.onPushUpdateCallbacks.forEach((callback) => callback());
        this.onTimelineUpdateCallbacks.forEach((callback) => callback());
    }

    get projectTools() {
        const pushUpdate = this.pushUpdate.bind(this);
        const getProject = this.getProject.bind(this);
        const pushCommand = this.pushCommand.bind(this);
        const pushCommands = this.pushCommands.bind(this);
        return constructProjectTools(pushUpdate, pushCommand, pushCommands, getProject);
    }

    project : Project
    getProject() {
        return this.project;
    }

    prettyPrintProject() {
        console.log(JSON.stringify(this.getProject(), null, 2));
    }

    interpolateSignalValueAtTime(signalId: string, frame: number): InterpolateSignalReturnType {
        const project = this.getProject();
        const result = InterpolateSignalValue.interpolateSignalValue(project, signalId, frame);
        return result;
    }
}


export default TimelineController;