import { Box, RenderProps } from "../CanvasWindows";
import { Mode } from "./Scene/UIElements/modeMenu";
import SignalWindow, { ExtendedRenderProps} from "./SignalWindow";

class EffectClass extends SignalWindow {

    windowDidMount(props: { [key: string]: any; }): void {
        super.windowDidMount(props);
        if (this.props.layer !== undefined) {
            this.setLayer(this.props.layer);
        }
    }

    globalPositioning: boolean = true;
    getBox() {
        const w = this.context.workingCanvasDimensions[0];
        const h = this.context.workingCanvasDimensions[1];
        return new Box([0, 0], w, h);
    }
    draw(r: ExtendedRenderProps) {
        // console.log(r.ctx.globalCompositeOperation)
        const mode = this.context.mode;
        if (this.props.modes && !this.props.modes.includes(mode)) {
            return;
        }
        this.props.draw(r.ctx)
    }
}

function Effect(draw: (ctx: CanvasRenderingContext2D) => void, options? : {
    layer?: number;
    modes?: Mode[];
}) {
    return EffectClass.Node({ draw, ...options });
}

export default Effect;