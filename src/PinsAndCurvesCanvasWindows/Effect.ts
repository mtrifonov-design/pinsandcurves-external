import { Box, RenderProps } from "../CanvasWindows";
import SignalWindow, { ExtendedRenderProps} from "./SignalWindow";

class EffectClass extends SignalWindow {
    globalPositioning: boolean = true;
    getBox() {
        const w = this.context.workingCanvasDimensions[0];
        const h = this.context.workingCanvasDimensions[1];
        return new Box([0, 0], w, h);
    }
    draw(r: ExtendedRenderProps) {
        this.props.draw(r.ctx)
    }
}

function Effect(draw: (ctx: CanvasRenderingContext2D) => void) {
    return EffectClass.Node({ draw});
}

export default Effect;