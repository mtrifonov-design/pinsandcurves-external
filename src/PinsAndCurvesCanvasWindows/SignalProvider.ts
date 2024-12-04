import { CanvasNode } from "../CanvasWindows";
import { PinsAndCurvesProject } from "../ProjectDataStructure";
import SignalWindow from "./SignalWindow";

type SignalProvider = {
    continuous: (signalId: string, range: [number,number], frame?: number) => number,
    discrete: (signalId: string, frame?: number) => string,
    frame: () => number,
    project: () => PinsAndCurvesProject,
    setDiscreteSignal: (signalId: string, value: string, frame: number) => void,
    setContinuousSignal: (signalId: string, value: number, frame: number, range: [number,number]) => void,
}

class SignalProviderClass extends SignalWindow {
    getChildren() {
        const signal : SignalProvider = {
            continuous: this.useContinuousSignal.bind(this),
            discrete: this.useDiscreteSignal.bind(this),
            frame:() => this.currentFrame,
            project: () => this.context.project,
            setDiscreteSignal: (signalId: string, value: string, frame: number) => this.setDiscreteSignalValue(signalId, value, true, frame),
            setContinuousSignal: (signalId: string, value: number, frame: number, range: [number,number]) => this.setContinuousSignalValue(signalId, value, true, range, frame),
        }

        return this.props.getChildren(signal);
    }
}

function SignalProviderNode(
    getChildren: (signal: SignalProvider) => CanvasNode[],
) {
    return SignalProviderClass.Node({getChildren});
}

export default SignalProviderNode;