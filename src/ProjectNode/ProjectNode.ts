import { StateTimeWorm as w } from "..";
import type { ProjectNodeEvent, ProjectNodeProps, HostProjectNodeProps } from "./types";


abstract class ProjectNodeBase<Project, ProjectInstruction> {
  abstract worm?: w.StateTimeWorm<Project, ProjectInstruction>;
  abstract projectStateId?: string;
  abstract host: boolean;
  authorId: string;
  subscribers: Function[] = [];
  update: w.WormCommand<ProjectInstruction>[] = [];

  abstract get initialized(): boolean;

  dispatch: (e: ProjectNodeEvent<Project, ProjectInstruction>) => void;

  constructor(dispatch: (e: ProjectNodeEvent<Project, ProjectInstruction>) => void) {
    this.dispatch = dispatch;
    this.authorId = `a${generateId()}`;
  }

  subscribeToProjectUpdates(callback: Function) {
    if (!this.worm || !this.projectStateId)
      throw new Error("Worm not initialized");
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter((c) => c !== callback);
    }
  }

  getProject(): Project {
    if (!this.worm || !this.projectStateId)
      throw new Error("Worm not initialized");
    return this.worm.content;
  }

  pushCommand(commandFunction: () =>  w.WormCommand<ProjectInstruction>) {
    if (!this.worm || !this.projectStateId)
      throw new Error("Worm not initialized");
    try {
      const command = commandFunction();
      this.worm.executeCommand(command);
      this.update.push(command);
    } catch (e) {
      console.error(e);
    }
  }

  pushCommands(commandsFunction: () => w.WormCommand<ProjectInstruction>[]) {
    if (!this.worm || !this.projectStateId)
      throw new Error("Worm not initialized");
    try {
      const commands = commandsFunction();
      this.worm.executeCommands(commands);
      this.update.push(...commands);
    } catch (e) {
      console.error(e);
    }

  }

  pushUpdate() {
    if (!this.worm || !this.projectStateId)
      throw new Error("Worm not initialized");

    const update = this.update;
    this.update = [];
    const lastAgreedProjectStateId = this.projectStateId;
    this.projectStateId = `ps${generateId()}`;
    this.subscribers.forEach((s) => s());
    this.dispatch({
      authorId: this.authorId,
      authorIsHost: this.host,
      type: "pushUpdate",
      instructions: update,
      lastAgreedProjectStateId,
      newProjectStateId: this.projectStateId,
    });
    
  }

  processUpdate(e: ProjectNodeEvent<Project, ProjectInstruction> & { type: "pushUpdate" }) {
    if (!this.worm || !this.projectStateId) return;

    const lastAgreedProjectStateId = e.lastAgreedProjectStateId;
    const newProjectStateId = e.newProjectStateId;
    
    let accepted : boolean;

    if (this.host) {
      accepted = 
        lastAgreedProjectStateId === this.projectStateId 
        && e.authorIsHost === false
        && this.update.length === 0;
    } else {
      accepted = lastAgreedProjectStateId === this.projectStateId;
    };

    if (accepted) {
      this.update = [];
      this.worm.executeCommands(e.instructions);
      this.projectStateId = newProjectStateId;
      this.subscribers.forEach((s) => s());
    } else {
      if (!this.host) {
        this.dispatch({ authorId: this.authorId, authorIsHost: false, type: "requestProject" });
      }
    }
  }
}

class HostProjectNode<Project, ProjectInstruction> extends ProjectNodeBase<Project, ProjectInstruction> {
  worm: w.StateTimeWorm<Project, ProjectInstruction>;
  projectStateId: string;
  host: boolean = true;

  get initialized(): boolean {return true}

  constructor(props: ProjectNodeProps<Project, ProjectInstruction>, worm: w.StateTimeWorm<Project, ProjectInstruction>) {
    super(props.dispatch);
    this.worm = worm;
    this.projectStateId = `ps${generateId()}`;
    this.dispatch({ authorId: this.authorId, authorIsHost: true, type: "hostIsConnected" });
  }

  static fromProject<Project, ProjectInstruction>( projectNodeProps: ProjectNodeProps<Project, ProjectInstruction>, project: Project) { 
    const worm = new w.StateTimeWorm(project, projectNodeProps.projectTransformer);
    return new HostProjectNode(projectNodeProps, worm);
  }

  static fromSerializedWorm<Project,ProjectInstruction>(projectNodeProps: ProjectNodeProps<Project, ProjectInstruction>, serializedWorm: string) {
    const worm = w.StateTimeWorm.deserialize(serializedWorm, projectNodeProps.projectTransformer);
    return new HostProjectNode(projectNodeProps, worm);
  }

  receive(e: ProjectNodeEvent<Project, ProjectInstruction>): void {
    if (e.authorId === this.authorId) return;
    switch (e.type) {
      case "requestProject":
        this.pushProject(e.requestId);
        break;
      case "hostIsConnected":
        break;
      case "pushProject":
        break;
      case "pushUpdate":
        this.processUpdate(e);
        break;
      default:
        throw new Error("Invalid event type");
    }
  }

  pushProject(requestId?: string) {
    this.dispatch({
      authorId: this.authorId,
      authorIsHost: true,
      type: "pushProject",
      serializedWorm: this.worm.serialize(),
      initialProjectStateId: this.projectStateId,
      requestId,
    });
  }
}

class ClientProjectNode<Project, ProjectInstruction> extends ProjectNodeBase<Project, ProjectInstruction> {
  worm?: w.StateTimeWorm<Project, ProjectInstruction>;
  projectStateId?: string;
  host: boolean = false;
  __projectTransformer: (project: Project, instructions: ProjectInstruction[]) => Project;
  projectRequestCallbacks: { [key: string]: Function } = {};

  constructor(props: ProjectNodeProps<Project, ProjectInstruction>) {
    super(props.dispatch);
    this.__projectTransformer = props.projectTransformer;
  }

  get initialized(): boolean {
    return this.worm !== undefined && this.projectStateId !== undefined;
  }

  receive(e: ProjectNodeEvent<Project, ProjectInstruction>): void {
    if (e.authorId === this.authorId) return;
    switch (e.type) {
      case "requestProject":
        break;
      case "hostIsConnected":
        this.requestProject();
        break;
      case "pushProject":
        this.worm = w.StateTimeWorm.deserialize(
          e.serializedWorm,
          this.__projectTransformer
        );
        this.projectStateId = e.initialProjectStateId;
        if (e.requestId && this.projectRequestCallbacks[e.requestId]) {
          this.projectRequestCallbacks[e.requestId]();
          delete this.projectRequestCallbacks[e.requestId];
        }
        break;
      case "pushUpdate":
        this.processUpdate(e);
        break;
      default:
        throw new Error("Invalid event type");
    }
  }

  requestProject(callback?: Function) {
    let requestId;
    if (callback) {
      requestId = `r${generateId()}`;
      this.projectRequestCallbacks[requestId] = callback; 
    }
    this.dispatch({ authorId: this.authorId, authorIsHost: false, type: "requestProject", requestId });
  }

}

const generateId = (): string => {
  let id = "";
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  for (let i = 0; i < 10; i++) {
    id += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return id;
};


export { HostProjectNode, ClientProjectNode };