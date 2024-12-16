import { Box, RenderProps } from "../CanvasWindows";
import SignalWindow, { ExtendedRenderProps} from "./SignalWindow";
import { Mode } from "./Scene/UIElements/modeMenu";

class DrawClass extends SignalWindow {

    windowDidMount(props: { [key: string]: any; }): void {
        super.windowDidMount(props);
        if (this.props.layer !== undefined) {
            this.setLayer(this.props.layer);
        }
    }

    getBox() {
        return new Box([this.props.x, this.props.y], this.props.w, this.props.h);
    }
    draw(r: ExtendedRenderProps) {
        const mode = this.context.mode;
        if (this.props.modes && !this.props.modes.includes(mode)) {
            return;
        }


        r.ctx.save();
        const [aox,aoy] = r.absoluteO;
        r.ctx.translate(aox,aoy);

        let originalCtx = r.ctx;
        const a2cm = this.absoluteToCanvasMeasure;
        const [aux,auy] = this.absoluteUnit;

        const adjustedMethods : { [key:string] : any} = {
            moveTo: (x: number, y: number) => {
                originalCtx.moveTo(x* aux,y*auy);
            },
            lineTo: (x: number, y: number) => {
                originalCtx.lineTo(x* aux,y*auy);
            },
            arc: (x: number, y: number, r: number, start: number, end: number, ccw: boolean) => {
                originalCtx.arc(x*aux,y*auy,r * aux,start,end,ccw);
            },
            fillRect: (x: number, y: number, w: number, h: number) => {
                originalCtx.fillRect(x * aux, y*auy,w * aux,h * auy);
            },
            strokeRect: (x: number, y: number, w: number, h: number) => {
                originalCtx.strokeRect(x * aux, y*auy,w * aux,h * auy);
            },
            fillText: (text: string, x: number, y: number) => {
                originalCtx.fillText(text,x * aux, y*auy,);
            },
            strokeText: (text: string, x: number, y: number) => {
                originalCtx.strokeText(text,x * aux, y*auy,);
            },
            arcTo: (x1: number, y1: number, x2: number, y2: number, r: number) => {
                originalCtx.arcTo(x1 * aux, y1*auy,x2 * aux, y2*auy,r * aux);
            },
            bezierCurveTo: (cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number) => {
                originalCtx.bezierCurveTo(cp1x * aux, cp1y*auy,cp2x * aux, cp2y*auy,x * aux, y*auy);
            },
            quadraticCurveTo: (cpx: number, cpy: number, x: number, y: number) => {
                originalCtx.quadraticCurveTo(cpx * aux, cpy*auy,x * aux, y*auy);
            },
            rect: (x: number, y: number, w: number, h: number) => {
                originalCtx.rect(x * aux, y*auy,w * aux,h * auy);
            },
            clearRect: (x: number, y: number, w: number, h: number) => {
                originalCtx.clearRect(x * aux, y*auy,w * aux,h * auy);
            },
            translate: (x: number, y: number) => {
                originalCtx.translate(x * aux,y * auy);
            },
            transform: (a: number, b: number, c: number, d: number, e: number, f: number) => {
                originalCtx.transform(a,b,c,d,e * aux,f * auy);
            },
            setTransform: (a: number, b: number, c: number, d: number, e: number, f: number) => {
                originalCtx.setTransform(a,b,c,d,e * aux,f * auy);
            },
            createRadialGradient: (x0: number, y0: number, r0: number, x1: number, y1: number, r1: number) => {
                return originalCtx.createRadialGradient(x0 * aux,y0 * auy,r0 * aux,x1 * aux,y1 * auy,r1 * aux);
            }
        }
        const adjustedCtx = new Proxy(r.ctx, {
            get: (target, prop) => {
                if (prop in adjustedMethods) {
                    return adjustedMethods[prop as string];
                }
                const value = Reflect.get(target, prop);
                if (typeof value === 'function') {
                    return value.bind(target);
                }
                return value;
            },
            set: (target, prop, value) => {
                if (prop in adjustedMethods) {
                    return Reflect.set(target, prop, value);
                }
                return Reflect.set(target, prop, value);
            }
        });


        // we need to trim the canvas to the effect's box

        adjustedCtx.beginPath();
        adjustedCtx.rect(0,0,this.props.w,this.props.h);
        adjustedCtx.clip();
        this.props.draw(adjustedCtx);
        // if (this.props.separateCanvas) {
        //     r.ctx.drawImage(originalCtx.canvas,0,0);
        // }

        r.ctx.restore();
    }
}

function Draw(
    draw: (ctx: CanvasRenderingContext2D) => void,
    x: number = 0,
    y: number = 0,
    w: number = 500,
    h: number = 500,
    options? : {
        layer?: number,
        modes?: Mode[];
    }
) {


    return DrawClass.Node({draw,x,y,w,h,...options});
}

export default Draw;