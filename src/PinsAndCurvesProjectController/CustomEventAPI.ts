import { ProjectNode, ProjectDataStructure } from "..";
import type { Project, Instruction } from './types';

type ProjectNodeEvent = ProjectNode.ProjectNodeEvent<Project, Instruction>;

function dispatchProjectEvent(channel: string = "default") {
    return (event: ProjectNodeEvent) => {
        const packagedEvent = new CustomEvent("projectNodeEvent", {
            detail: {
                event: event,
                channel: channel
            }
        });
        window.dispatchEvent(packagedEvent);
    }
}

function subscribeToProjectEvents(
    channel: string = "default") {
        return (onEvent: (e: ProjectNodeEvent) => void) => {
        function handler(e: CustomEvent) {
            if (e.type === "projectNodeEvent" && e.detail.channel === channel) {
                const unpackagedEvent = e.detail.event as ProjectNodeEvent;
                onEvent(unpackagedEvent);
            }
        }
        window.addEventListener("projectNodeEvent", handler as EventListener) ;
        return () => window.removeEventListener("projectNodeEvent", handler as EventListener);
    }
}

export { dispatchProjectEvent, subscribeToProjectEvents };