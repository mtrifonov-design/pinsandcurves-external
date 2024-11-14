import { PinsAndCurvesProject } from "./Project";
import ProjectBuilder from "./ProjectBuilder";

function getDefaultProject() {
    const pb = new ProjectBuilder();
    pb.addDiscreteSignal('signal1', 'Signal 1');
    pb.addContinuousSignal('signal2', 'Signal 2', [0, 1]);
    pb.addPin('signal1', 100, 'VALUE');
    pb.addPin('signal2', 100, 0, 'return easyLinear();');
    pb.setSignalActiveStatus('signal1', true);
    pb.setSignalActiveStatus('signal2', true);
    const project : PinsAndCurvesProject = pb.getProject();
    return project;
}


export default getDefaultProject;