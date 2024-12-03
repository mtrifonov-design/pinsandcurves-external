import { Box, CanvasNode, RenderProps, Vec2 } from "../CanvasWindows";
import SignalWindow, { ExtendedRenderProps} from "./SignalWindow";

class GroupClass extends SignalWindow {
    getBox() {
        return new Box([this.props.x, this.props.y], this.props.w, this.props.h);
    }
    getChildren() {
        return this.props.children;
    }
}

function Group(
    props: {
        x: number,
        y: number,
        w: number,
        h: number,
    },
    ...children: CanvasNode[]

) {
    const {x,y,w,h} = props;
    return GroupClass.Node({x,y,w,h,children});
}

export default Group;