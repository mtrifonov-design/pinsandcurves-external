import { Box, CanvasNode, RenderProps, Vec2 } from "../CanvasWindows";
import SignalWindow, { ExtendedRenderProps} from "./SignalWindow";

class GroupClass extends SignalWindow {
    getBox() {
        const x = this.props.x || 0;
        const y = this.props.y || 0;
        return new Box([x,y], 0,0);
    }
    getChildren() {
        return this.props.getChildren();
    }
}

function Group(

    getChildren: () => CanvasNode[],
    options?: {
        x?: number,
        y?: number,
    },

) {
    return GroupClass.Node({getChildren,...options});
}

export default Group;