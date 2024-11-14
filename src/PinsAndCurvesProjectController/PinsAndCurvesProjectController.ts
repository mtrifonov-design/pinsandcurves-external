import { PinsAndCurvesProjectTransformer, ProjectNode, InterpolateSignalValue } from "..";
import { PACProjectController, Project,Instruction, ProjectNodeEventDispatcher} from "./types";
import constructProjectTools from './ConstructProjectTools';
import { ProjectNodeEvent } from "../ProjectNode";

const HostProjectNode = ProjectNode.HostProjectNode;
const ClientProjectNode = ProjectNode.ClientProjectNode;
const transformer : (p:Project,i:Instruction) => Project = PinsAndCurvesProjectTransformer.PinsAndCurvesProjectTransformer;
//const interpolateSignalValue = InterpolateSignalValue.interpolateSignalValue;
type InterpolateSignalReturnType = InterpolateSignalValue.InterpolateSignalReturnType;


class PACProjectControllerClass implements PACProjectController {

    projectNode : ProjectNode.HostProjectNode<Project,Instruction> | ProjectNode.ClientProjectNode<Project,Instruction>;
    connectToHost : (onConnected: Function) => void;

    constructor(dispatch : ProjectNodeEventDispatcher,host: boolean,project? : Project) {
        if (host) {
            if (!project) throw new Error("Project must be provided to host project controller");
            this.projectNode = new HostProjectNode({
                dispatch,
                project,
                projectTransformer: transformer
            });
            this.projectNode.worm.saveAsNamedState("commit");
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

        return constructProjectTools(pushUpdate,pushCommand,getProject);
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