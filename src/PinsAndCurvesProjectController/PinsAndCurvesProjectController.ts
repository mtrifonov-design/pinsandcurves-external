import { PinsAndCurvesProjectTransformer, ProjectNode, InterpolateSignalValue } from "..";
import { PACProjectController, Project,Instruction, ProjectNodeEventDispatcher} from "./types";
import constructProjectTools from './ConstructProjectTools';
import { ProjectNodeEvent } from "../ProjectNode";

const HostProjectNode = ProjectNode.HostProjectNode;
const ClientProjectNode = ProjectNode.ClientProjectNode;
const transformer : (p:Project,i:Instruction[]) => Project = PinsAndCurvesProjectTransformer.PinsAndCurvesProjectTransformer;
//const interpolateSignalValue = InterpolateSignalValue.interpolateSignalValue;
type InterpolateSignalReturnType = InterpolateSignalValue.InterpolateSignalReturnType;


class PACProjectControllerClass {

    projectNode : ProjectNode.HostProjectNode<Project,Instruction> | ProjectNode.ClientProjectNode<Project,Instruction>;
    connectToHost : (onConnected: Function) => void;

    constructor(dispatch : ProjectNodeEventDispatcher,host: boolean,project? : Project, worm? : string) {
        if (host) {
            if (!project && !worm) throw new Error("Project or worm must be provided to host project controller");
            let projectNode;
            if (project) {
                projectNode = HostProjectNode.fromProject({
                    dispatch,
                    projectTransformer: transformer
                },project);
                projectNode.worm.saveAsNamedState("commit");
            }
            if (worm) {
                projectNode = HostProjectNode.fromSerializedWorm({
                    dispatch,
                    projectTransformer: transformer
                },worm);
            }
            if (!projectNode) throw new Error("Project node not created");
            this.projectNode = projectNode;
            this.connectToHost = () => {throw new Error("Host project controller cannot connect to host")};
        } else {
            this.projectNode = new ClientProjectNode({
                dispatch,
                projectTransformer: transformer
            });
            const requestProject = this.projectNode.requestProject.bind(this.projectNode);
            this.connectToHost = requestProject;
        }
    }

    static Host(dispatch : ProjectNodeEventDispatcher,project : Project) {
        return new PACProjectControllerClass(dispatch,true,project);
    }

    static HostFromProject(dispatch : ProjectNodeEventDispatcher,project : Project) {
        return new PACProjectControllerClass(dispatch,true,project);
    }

    serializeWorm() {
        if (!this.projectNode.initialized) throw new Error("Project not initialized");
        if (!this.projectNode.worm) throw new Error("Project node worm not found");
        return this.projectNode.worm.serialize();
    }

    static HostFromSerializedWorm(dispatch : ProjectNodeEventDispatcher,worm : string) {
        return new PACProjectControllerClass(dispatch,true,undefined,worm);
    }

    static Client(dispatch : ProjectNodeEventDispatcher) {
        return new PACProjectControllerClass(dispatch,false,undefined);
    }

    receive(e: ProjectNodeEvent<Project, Instruction>) {
        this.projectNode.receive(e);
    }


    get projectTools() {
        if (!this.projectNode.initialized) throw new Error("Project not initialized");

        const pushUpdate = this.projectNode.pushUpdate.bind(this.projectNode);
        const getProject = this.projectNode.getProject.bind(this.projectNode);
        const pushCommand = this.projectNode.pushCommand.bind(this.projectNode);
        const pushCommands = this.projectNode.pushCommands.bind(this.projectNode);

        return constructProjectTools(pushUpdate,pushCommand,pushCommands,getProject);
    }

    getProject() {
        if (!this.projectNode.initialized) throw new Error("Project not initialized");
        return this.projectNode.getProject();
    }

    prettyPrintProject() {
        if (!this.projectNode.initialized) throw new Error("Project not initialized");
        console.log(JSON.stringify(this.projectNode.getProject(),null,2));
    }

    subscribeToProjectUpdates(callback: Function) {
        return this.projectNode.subscribeToProjectUpdates(callback);
    }

    interpolateSignalValueAtTime(signalId: string, frame: number): InterpolateSignalReturnType {
        if (!this.projectNode.initialized) throw new Error("Project not initialized");
        const project = this.projectNode.getProject();
        // console.log(JSON.stringify(project,null,2));
        
        const result = InterpolateSignalValue.interpolateSignalValue(project,signalId,frame);
        return result;
    }
}

export default PACProjectControllerClass;