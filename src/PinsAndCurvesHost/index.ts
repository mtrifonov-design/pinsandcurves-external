import { ProjectBuilder } from '../ProjectDataStructure';
import { PinsAndCurvesProjectController as Controller, PostMessageAPI } from '../PinsAndCurvesProjectController'
import { interpolateSignalValue } from '../InterpolateSignalValue';

const CLIENT_URL = "https://pinsandcurves.app";

interface Config {
    framesPerSecond: number;
    numberOfFrames: number;
}

function getDispatch() {
    let dispatch = (e: any) => { };
    if (window.parent !== null) {
        const dispatchProjectEvent = PostMessageAPI.dispatchProjectEvent(window.parent, CLIENT_URL);
        dispatch = (e: any) => {
            dispatchProjectEvent(e);
        };
    }
    return dispatch;
}

class PinsAndCurvesHost {
    c: Controller;
    constructor(c: Controller) {
        const receive = c.receive.bind(c);
        const subscribe = PostMessageAPI.subscribeToProjectEvents(CLIENT_URL);
        subscribe((e: any) => {
            receive(e);
        });
        this.c = c;
        if (window.location.hostname !== "pinsandcurves") {
            const cleanedHref = window.location.href.replace(/\/$/, ''); // Remove trailing slash
            console.log(`PinsAndCurves Host Server initialized.
To open editor, open https://pinsandcurves.app/#/run/${encodeURIComponent(cleanedHref)}`);
        }

    }

    static NewProject(config?: Partial<Config>) {
        const defaultConfig = {
            framesPerSecond: 30,
            numberOfFrames: 250,
        };
        config = { ...defaultConfig, ...config };
        const pb = new ProjectBuilder();
        pb.setTimelineData(config.numberOfFrames as number, config.framesPerSecond as number, 20);
        const c = Controller.HostFromProject(getDispatch(), pb.getProject());

        // c.projectTools.addPinContinuous("signalId","pinId",pinTime,pinValue,functionString, commit)

        return new PinsAndCurvesHost(c);
    }
    static fromSerialized(serialized: string) {
        const c = Controller.HostFromSerializedWorm(getDispatch(), serialized);
        return new PinsAndCurvesHost(c);
    }
    serialize() {
        return this.c.serializeWorm();
    }

    signal(name: string) {
        const project = this.c.getProject()
        const signalIdEntry = Object.entries(project.orgData.signalNames).find(([key, value]) => value === name);
        if (signalIdEntry === undefined) {
            console.warn(`Signal ${name} not found in project.`);
            return 0;
        }
        const signalId = signalIdEntry[0];

        try {
            const value = interpolateSignalValue(project, signalId, project.timelineData.playheadPosition);
            if (value[1].length > 0) {
                console.warn(`Signal ${name} has ${value[1].length} warnings:`);
                console.warn(value[1]);
            }
            return value[0];
        } catch(e: any) {
            console.error(e);
        }
    }

}

export default PinsAndCurvesHost;