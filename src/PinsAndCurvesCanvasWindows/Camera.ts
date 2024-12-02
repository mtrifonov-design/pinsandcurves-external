
import { Box, RenderProps } from "./Dependencies";
import SignalWindow from "./SignalWindow";
class Camera extends SignalWindow {

    isSceneCamera = true;
    width = 800;
    height = 600;

    getBox() {
        return new Box([-this.width/2,-this.height/2],this.width,this.height);
    }

    render(r: RenderProps) {
        this.strokeOutline(r, 'white');
    }

}

export default Camera;