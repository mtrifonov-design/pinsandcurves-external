import { ProjectBuilder } from '../ProjectDataStructure';
import { PinsAndCurvesProjectController as Controller, PostMessageAPI } from '../PinsAndCurvesProjectController'
import { interpolateSignalValue } from '../InterpolateSignalValue';

const CLIENT_URL = "http://localhost:6006" // = "https://pinsandcurves.app";

interface Config {
    framesPerSecond: number;
    numberOfFrames: number;
    templates?: { [key: string]: Function };
}

const defaultConfig = {
    framesPerSecond: 30,
    numberOfFrames: 250,
};

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
    config: Config;

    constructor(c: Controller, config: Config) {
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
        c.subscribeToProjectUpdates(this._onUpdate.bind(this));

        this.config = config
        if (config.templates) {
            for (let key in config.templates) {
                if (c.getProject().templateData[key]) {
                    c.projectTools.updateCurveTemplate(key, config.templates[key].toString());
                    continue;
                }
                c.projectTools.addCurveTemplate(key, config.templates[key].toString());
            }
            for (let key in c.getProject().templateData) {
                if (!config.templates[key]) {
                    c.projectTools.deleteCurveTemplate(key);
                }
            }
        }

    }

    static NewProject(config?: Partial<Config>) {

        config = { ...defaultConfig, ...config };
        const pb = new ProjectBuilder();
        pb.setTimelineData(config.numberOfFrames as number, config.framesPerSecond as number, 20);
        const c = Controller.HostFromProject(getDispatch(), pb.getProject());

        // c.projectTools.addPinContinuous("signalId","pinId",pinTime,pinValue,functionString, commit)
        return new this(c, config as Config);
    }
    static FromSerialized(serialized: string, config?: Partial<Config>) {
        const c = Controller.HostFromSerializedWorm(getDispatch(), serialized);
        config = { ...defaultConfig, ...config };
        return new this(c, config as Config);
    }
    serialize() {
        return this.c.serializeWorm();
    }

    signal(name: string, frame?: number) {
        const project = this.c.getProject()
        const signalIdEntry = Object.entries(project.orgData.signalNames).find(([key, value]) => value === name);
        if (signalIdEntry === undefined) {
            console.warn(`Signal ${name} not found in project.`);
            return 0;
        }
        const signalId = signalIdEntry[0];

        try {
            const value = interpolateSignalValue(project, signalId, frame || project.timelineData.playheadPosition);
            if (value[1].length > 0) {
                console.warn(`Signal ${name} has ${value[1].length} warnings.`);
                // console.warn(value[1]);
            }
            return value[0];
        } catch(e: any) {
            console.error(e);
        }
    }

    subscribers : Function[] = [];
    private _onUpdate() {
        this.subscribers.forEach((s) => {
            s();
        });
    }
    onUpdate(callback: () => void) {
        this.subscribers.push(callback);
        return () => {
            this.subscribers = this.subscribers.filter((s) => s !== callback);
        }
    }

}

export default PinsAndCurvesHost;