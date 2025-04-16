import { ProjectBuilder } from '../ProjectDataStructure';
import { PinsAndCurvesProjectController as Controller, PostMessageAPI } from '../PinsAndCurvesProjectController'
import { interpolateSignalValue } from '../InterpolateSignalValue';

const CLIENT_URL = window.location.origin

console.log(CLIENT_URL)


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

class PinsAndCurvesClient {
    c: Controller;

    constructor() {
        const c = Controller.Client(getDispatch());
        const receive = c.receive.bind(c);
        const subscribe = PostMessageAPI.subscribeToProjectEvents(CLIENT_URL);
        subscribe((e: any) => {
            //console.log("RECEIVED EVENT",e)
            receive(e);
        });
        this.c = c;
        
    }

    connect() {
        this.c.connectToHost(() => {
            this.c.subscribeToProjectUpdates(this._onUpdate.bind(this));
        });
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

export default PinsAndCurvesClient;