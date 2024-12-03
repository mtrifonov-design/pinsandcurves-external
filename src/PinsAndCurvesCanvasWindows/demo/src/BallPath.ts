import { SignalWindow, Box, RenderProps } from "./Dependencies";

const radius = 13;

class Ball extends SignalWindow {
    getBox() {
        const [cux,cuy] = this.canvasUnit;
        const o = [-radius * cux,-radius * cuy] as Vec2;
        const w = 2 * radius * cux;
        const h = 2 * radius * cuy;
        return new Box(o,w,h);
    }

    draw(r: RenderProps): void {
        const [aux,auy] = this.absoluteUnit;
        const [aox,aoy] = r.absoluteO;
        const [cx,cy] = [aox + this.w * aux / 2, aoy + this.h * auy / 2];
        const ctx = r.ctx;
        ctx.fillStyle = 'white';
        ctx.filter = 'blur(3px)';
        ctx.beginPath();
        ctx.arc(cx,cy,radius * aux,0,2*Math.PI);
        ctx.fill();
        ctx.filter = 'drop-shadow(0px 0px 5px rgba(0,0,0,0.5))'
        ctx.beginPath();
        ctx.arc(cx,cy,radius * aux,0,2*Math.PI);
        ctx.fill();
        ctx.filter = 'none';
    }

}


class BallPath extends SignalWindow {
    getBox() {
        const progress = this.useContinuousSignal('progress',[0,1]);
        const pos = this.context.pathManager.getPointAlongPath(progress);
        return new Box(pos, 0,0);
    }

    getChildren(props?: { [key: string]: any; } | undefined): ((parent: CanvasWindow) => CanvasWindow)[] {
        return [Ball.Node()];
    }
}

export default BallPath;