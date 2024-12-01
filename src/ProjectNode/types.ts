import { StateTimeWorm as w } from "..";

type ProjectNodeEvent<Project, ProjectInstruction> =
  | {
      authorId: string,
      authorIsHost: false;
      type: "requestProject";
      requestId?: string;
    }
  | {
      authorId: string,
      authorIsHost: true;
      type: "pushProject";
      serializedWorm: string;
      initialProjectStateId: string;
      requestId?: string;
    }
  | {
      authorId: string,
      authorIsHost: boolean;
      type: "pushUpdate";
      instructions: w.WormCommand<ProjectInstruction>[];
      lastAgreedProjectStateId: string;
      newProjectStateId: string;
    }
  | {
      authorId: string,
      authorIsHost: true;
      type: "hostIsConnected";
    }
  

interface ProjectNodeProps<Project, ProjectInstruction> {
  dispatch: (e: ProjectNodeEvent<Project, ProjectInstruction>) => void;
  projectTransformer: (project: Project, instructions: ProjectInstruction[]) => Project;
}

interface HostProjectNodeProps<Project, ProjectInstruction> extends ProjectNodeProps<Project, ProjectInstruction> {
  project: Project;
}

export type { ProjectNodeEvent, ProjectNodeProps, HostProjectNodeProps };