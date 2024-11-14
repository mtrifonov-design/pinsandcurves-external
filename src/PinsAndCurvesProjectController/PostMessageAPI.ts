import { ProjectNode, ProjectDataStructure } from "..";
import type { Project, Instruction } from './types';

type ProjectNodeEvent = ProjectNode.ProjectNodeEvent<Project, Instruction>;

function dispatchProjectEvent(targetWindow: Window,targetOrigin: string, channel: string = "default") {
    return (event: ProjectNodeEvent) => {
        const packagedEvent = {
            type: "projectNodeEvent",
            event: event,
            channel: channel
        };
        targetWindow.postMessage(packagedEvent, targetOrigin);
    }
}

function subscribeToProjectEvents(
    origin: string,
    channel: string = "default") {
    return (onEvent: (e: ProjectNodeEvent) => void) => {
        function handler(e: MessageEvent) {
            if (e.origin === origin && e.data.type === "projectNodeEvent" && e.data.channel === channel) {
                const unpackagedEvent = e.data.event as ProjectNodeEvent;
                onEvent(unpackagedEvent);
            }
        }
        window.addEventListener("message", handler);
        return () => window.removeEventListener("message", handler);
    }
}

export { dispatchProjectEvent, subscribeToProjectEvents };