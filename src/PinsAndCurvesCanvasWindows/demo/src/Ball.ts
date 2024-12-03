import { PinsAndCurvesProjectController } from '@mtrifonov-design/pinsandcurves-external';
import { CanvasWindow, Box, render, mouseMoveHandler, mouseDownHandler, mouseUpHandler, clickHandler, windowsIntersect, HandlerProps, MouseHandlerProps, RenderProps, Vec2 } from './Dependencies';
import SignalWindow from './SignalWindow';
import Path from './Path';

type ProjectController = PinsAndCurvesProjectController.PinsAndCurvesProjectController;

class Ball extends Path {

    radius: number;

    constructor(p: ProjectController, radius: number) {
        super(p);
        this.radius = radius;
    }

    render(r : RenderProps) {
        const { ctx, localToCanvas, localToCanvasMeasure } = r;
        const l2c = localToCanvas;
        const l2cm = localToCanvasMeasure;
        ctx.fillStyle = '#E6C61E';
        ctx.beginPath();
        const progress = this.useSignal('progress',0.5,[0,1]);
        if (typeof progress !== 'number') {
            throw new Error('Progress signal must be a number');
        }
        const stretch = this.useSignal('stretch',0,[-1,1]);
        if (typeof stretch !== 'number') {
            throw new Error('Stretch signal must be a number');
        }
        const {x,y} = this.pointAtProgress(progress);
        const lastProgress = progress > 0.01 ? progress - 0.01 : 0;
        const {x: px, y: py} = this.pointAtProgress(lastProgress);
        const [pxc, pyc] = localToCanvas([px,py]);
        const [ cx, cy ] = localToCanvas([x,y]);
        const [dx,dy] = [cx - pxc, cy - pyc];
        const [nx,ny] = [dx / Math.sqrt(dx*dx + dy*dy), dy / Math.sqrt(dx*dx + dy*dy)];
        const [cr,_] = l2cm([this.radius,0]);
        // calculate the end point of the ball, starting at cx cy, and moving in the direction of nx ny, with radius cr
        ctx.save();
        ctx.translate(cx + nx * cr,cy + ny * cr);

        const stretchX = 1 - Math.max(0,stretch);
        const stretchY = 1 - Math.abs(Math.min(0,stretch));
        ctx.rotate(Math.atan2(ny,nx));
        ctx.scale(stretchX,stretchY);
        ctx.rotate(-Math.atan2(ny,nx));
        ctx.translate(-nx * cr ,-ny * cr );
        ctx.arc(0,0,cr,0,2*Math.PI);
        ctx.fill();
        ctx.restore();

        //this.strokeBoundingBox(r); 
    }

}


export default Ball;