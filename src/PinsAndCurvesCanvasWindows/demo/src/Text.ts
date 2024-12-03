
import { Box, RenderProps, render, Vec2, CanvasWindow } from './Dependencies';
import { SignalWindow} from './Dependencies'
import Path from './Path';
import { add, subtract } from 'mathjs';

class Text1 extends SignalWindow {

    windowDidMount(props: { [key: string]: any; }): void {
      const image = new Image();
      image.src = '/media/text.svg';
      image.onload = () => {
        this.setContext('image',image);
      }
    }

    getBox() {
      const o = [(75.6 / 384 )* 1920,(59.5 / 216) * 1080] as Vec2;
      const w = (222 / 384) * 1920;
      const h = (113.6 / 216) * 1080;
      return new Box(o, w, h);
    }

    draw(r: RenderProps): void {
      const img = this.context.image;
      if (img) {
        const [aox,aoy] = r.absoluteO;
        const [aux,auy] = this.absoluteUnit;
        const progress = this.useContinuousSignal('progress',[0,1]);
        const [x,y] : Vec2 = this.context.pathManager.getPointAlongPath(progress);
        const [gx,gy] = this.o;
        const [lx,ly] = [x-gx,y-gy];
        const [cx,cy] = r.localToCanvas([lx,ly]);
        const gradient = r.ctx.createRadialGradient(
          cx, cy, 0, // Inner circle
          cx, cy, 100 // Outer circle
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        r.ctx.fillStyle = gradient;
        const maskCanvas = document.createElement('canvas');
        const [canvasWidth, canvasHeight] = r.canvasDimensions;
        maskCanvas.width = canvasWidth;
        maskCanvas.height = canvasHeight;
        const maskCtx = maskCanvas.getContext('2d');
        if (maskCtx === null) {
          throw new Error('Could not get 2d context for mask canvas'); 
        }
        // Draw the gradient mask on the temporary canvas
        maskCtx.fillStyle = gradient;
        maskCtx.fillRect(0, 0, canvasWidth, canvasHeight);

        // // Apply the mask to the main canvas
        // maskCtx.drawImage(maskCanvas, 0, 0);
        maskCtx.globalCompositeOperation = 'source-in';
        maskCtx.drawImage(img,aox,aoy,this.w*aux,this.h*auy);
        r.ctx.drawImage(maskCanvas, 0, 0);
      }

    }


  }

  class Text2 extends SignalWindow {
    layer = -10;

    windowDidMount(props: { [key: string]: any; }): void {
      const image = new Image();
      image.src = '/media/text.svg';
      image.onload = () => {
        this.setContext('image',image);
      }
    }

    getBox() {
      const o = [(75.6 / 384 )* 1920,(59.5 / 216) * 1080] as Vec2;
      const w = (222 / 384) * 1920;
      const h = (113.6 / 216) * 1080;
      return new Box(o, w, h);
    }

    draw(r: RenderProps): void {
      const img = this.context.image;
      if (img) {
        const [aox,aoy] = r.absoluteO;
        const [aux,auy] = this.absoluteUnit;
        r.ctx.filter = 'grayscale(100%) opacity(10%) blur(2px)';
        r.ctx.drawImage(img,aox,aoy,this.w*aux,this.h*auy);
      }

    }


  }

  export { Text1, Text2 };