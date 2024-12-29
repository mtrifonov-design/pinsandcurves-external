import { ProjectNode, ProjectDataStructure } from "..";
import type { Project, Instruction } from './types';

type ProjectNodeEvent = ProjectNode.ProjectNodeEvent<Project, Instruction>;

function dispatchProjectEvent(targetWindow: Window,serverURL: string, channel: string = "default") {

    const url = new URL(serverURL);
    const origin = url.origin;

    return (event: ProjectNodeEvent) => {
        const packagedEvent = {
            type: "projectNodeEvent",
            event: event,
            channel: channel
        };
        targetWindow.postMessage(packagedEvent, origin);
    }
}

function subscribeToProjectEvents(
    serverURL: string,
    channel: string = "default") {
        const url = new URL(serverURL);
        const parsedOrigin = url.origin;
    return (onEvent: (e: ProjectNodeEvent) => void) => {
        function handler(e: MessageEvent) {
            if (e.origin === parsedOrigin && e.data.type === "projectNodeEvent" && e.data.channel === channel) {
                const unpackagedEvent = e.data.event as ProjectNodeEvent;
                onEvent(unpackagedEvent);
            }
        }
        window.addEventListener("message", handler);
        return () => window.removeEventListener("message", handler);
    }
}

export { dispatchProjectEvent, subscribeToProjectEvents };