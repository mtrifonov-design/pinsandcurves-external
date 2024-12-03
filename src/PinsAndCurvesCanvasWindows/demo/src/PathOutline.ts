import { SignalWindow, RenderProps, Vec2, Box } from "./Dependencies";


class PathOutline extends SignalWindow {

    getBox() {
        //console.log('PathOutline getBox');
        return new Box([0,0],1920,1080);
    }

    layer = 100;

    windowDidMount(props: { [key: string]: any; }): void {

    }

    generatePoints() {
        const points :Vec2[] = [];
        for (let i= 0; i < 100; i++) {
            const p = this.context.pathManager.getPointAlongPath(i/100);
            points.push(p);
        }
        return points;
    }

    draw(r: RenderProps): void {
        const points = this.generatePoints();
        const ctx = r.ctx;
        ctx.strokeStyle = 'yellow';
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        const [ox,oy] = r.absoluteO;
        const [aux,auy] = this.absoluteUnit;
        // console.log('PathOutline draw',this.points);
        for (const [x,y] of points) {
            //console.log(x,y)
            ctx.lineTo(ox + x * aux,oy + y * auy);
        }
        ctx.stroke();
    }
}

export default PathOutline;