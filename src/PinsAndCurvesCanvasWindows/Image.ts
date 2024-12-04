import { Box, RenderProps } from "../CanvasWindows";
import SignalWindow, { ExtendedRenderProps} from "./SignalWindow";
import { Mode } from "./Scene/UIElements/modeMenu";

class ImageClass extends SignalWindow {

    windowDidMount(props: { [key: string]: any; }): void {
        super.windowDidMount(props);
        if (this.props.layer !== undefined) {
            this.setLayer(this.props.layer);
        }
    }

    getBox() {
        return new Box([this.props.x, this.props.y], this.props.w, this.props.h);
    }

    _img: HTMLImageElement | null = null;
    get img() {
        if (!this._img) {
            const newImg = new Image();
            newImg.src = this.props.src;
            newImg.onload = () => {
                this._img = newImg;
            }
            return newImg;
        }
        return this._img;
    }

    draw(r: ExtendedRenderProps) {
        const mode = this.context.mode;
        if (this.props.modes && !this.props.modes.includes(mode)) {
            return;
        }
        r.ctx.save();
        const [aox,aoy] = r.absoluteO;
        const [aux,auy] = this.absoluteUnit;
        r.ctx.translate(aox,aoy);
        r.ctx.drawImage(this.img,0,0,this.props.w * aux,this.props.h * auy);
        r.ctx.restore();
    }
}

function ImageNode(
    src: string,
    x: number = 0,
    y: number = 0,
    w: number = 500,
    h: number = 500,
    options? : {
        layer?: number;
        modes?: Mode[];
    }
) {
    return ImageClass.Node({src,x,y,w,h,...options});
}

export default ImageNode;