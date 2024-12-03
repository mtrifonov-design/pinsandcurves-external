
import { CanvasNode, CanvasWindow } from "../CanvasWindows";
import { Box, RenderProps } from "./Dependencies";
import SignalWindow from "./SignalWindow";

interface CameraProps {
    w?: number;
    h?: number;
    x?: number;
    y?: number;
    children?: CanvasNode[];
}

class CameraClass extends SignalWindow {
    isSceneCamera = true;

    getChildren() {
        return this.props.children;
    }

    getBox() {
        return new Box([this.props.x || 0, this.props.y || 0], this.props.w || 500, this.props.h || 500);
    }

    render(r: RenderProps) {
        this.strokeOutline(r, 'white');
    }

}

function Camera(props : Omit<CameraProps,'children'>,...children : CanvasNode[]) {
    const camera = CameraClass.Node({ ...props, children });
    return camera;
}

export default Camera;