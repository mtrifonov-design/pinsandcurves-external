import { Box, RenderProps } from "../CanvasWindows";
import SignalWindow, { ExtendedRenderProps} from "./SignalWindow";
import { Mode } from "./Scene/UIElements/modeMenu";

function generateId() {
    return Math.random();
}

class ImageClass extends SignalWindow {

    windowDidMount(props: { [key: string]: any; }): void {
        super.windowDidMount(props);
        if (this.props.layer !== undefined) {
            this.setLayer(this.props.layer);
        }
    }


    getBox() {
        const w = this.props.w === undefined ? (this.img ? this.img?.width : 0) : this.props.w;
        const h = this.props.h === undefined ? (this.img ? this.img?.height : 0) : this.props.h;
        // console.log(this.props,this.img?.width,this.img?.height)
        return new Box([this.props.x, this.props.y], w, h);
    }

    _img: HTMLImageElement | null = null;
    get img() {
        if (!this._img) {
            const newImg = new Image();
            newImg.src = this.props.src;
            newImg.onload = () => {
                this._img = newImg;
                this.setState({seed:generateId()})
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
        r.ctx.drawImage(this.img,0,0,this.w * aux,this.h * auy);
        r.ctx.restore();
    }
}

function ImageNode(
    src: string,
    x: number = 0,
    y: number = 0,
    options? : {
        layer?: number;
        modes?: Mode[];
        w?: number,
        h?: number,
    }
) {
    return ImageClass.Node({src,x,y,...options});
}

export default ImageNode;