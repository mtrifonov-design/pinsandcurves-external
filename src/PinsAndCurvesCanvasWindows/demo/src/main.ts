


import PathProvider from './Path';
import PathOutline from './PathOutline';
import {Text1,Text2} from './Text';
import { CreateScene, SignalWindow, CartesianVectorHandle, RenderProps,Box } from './Dependencies';
import BallPath from './BallPath';

import { Draw, Group, Effect, Camera, SignalProvider, Image, Mount } from './Dependencies';

// const vh = CartesianVectorHandle.Node({
//     id: 'v1', 


// });
// // BallPath.Node({})

// const p = PathProvider.Node({
//     children: [Text1.Node({}),PathOutline.Node()],
// });

// class Background extends SignalWindow {
//     layer = -200;
//     draw(r: RenderProps): void {
//         const ctx = r.ctx;
//         ctx.fillStyle = '#2D3339';
//         ctx.fillRect(0,0,r.canvasDimensions[0],r.canvasDimensions[1]);
//     }
//     getBox() {
//         return new Box([0,0],1920/2,1080);
//     }
// }

// const o = [(75.6 / 384 )* 1920,(59.5 / 216) * 1080] as Vec2;
// const w = (222 / 384) * 1920;
// const h = (113.6 / 216) * 1080;

CreateScene({},
    Camera({
        x: -960,
        y: -540,
        w: 1920,
        h: 1080,
    }),
    // CartesianVectorHandle({
    //     id: 'asdf',
    //     rangeX: [-960,960],
    //     rangeY: [-540,540],
    //     discrete: true,
    //     onionSkin: false,
    // },),
    // Image(
    //     '/media/text.svg',
    //     0,
    //     (59.5 / 216) * 1080 - 540,
    //     (222 / 384) * 1920,
    //     (113.6 / 216) * 1080,
    // ),

    SignalProvider((signal: any) => {
        const frame = signal.frame;
        const project = signal.project();

        //console.log(project)
        return [
            Group({x:0,y:0,w:0,h:0},
                Effect(ctx => ctx.filter = 'blur(1px) grayscale(100%) opacity(10%)'),
                Image(
                    '/media/text.svg',
                    (75.6 / 384 )* 1920 - 960,
                    (59.5 / 216) * 1080 - 540,
                    (222 / 384) * 1920,
                    (113.6 / 216) * 1080,
                ),
                Effect(ctx => ctx.filter = 'none'),
            ),
            // Image(
            //     '/media/text.svg',
            //     (75.6 / 384 )* 1920 - 960,
            //     (59.5 / 216) * 1080 - 540,
            //     (222 / 384) * 1920,
            //     (113.6 / 216) * 1080,
            // ),
            PathProvider({
                x: -960,
                y: -540,
                w: 1920,
                h: 1080,
            },(getPointAlongPath : any) => {
                //console.log(frame()/project.timelineData.numberOfFrames)
                // const point = getPointAlongPath(frame()/project.timelineData.numberOfFrames);
                // console.log(point)
                return [
                    // Mount(() => {
                    //     setTimeout(() => {
                    //         if (project.orgData.signalIds.includes('ball')) return;
                    //         for (let i = 0; i < project.timelineData.numberOfFrames; i += 5) {
                    //             const relative = i / project.timelineData.numberOfFrames;
                    //             const vector = getPointAlongPath(relative);
                    //             const frame = Math.floor(i * project.timelineData.numberOfFrames);
       
                    //             console.log(vector,i)
                    //             signal.setDiscreteSignal('ball',JSON.stringify(vector),i);
                    //         }
                    //     },1000);
                    // }),
                    // Draw(ctx => {
                    //     ctx.save();
                    //     ctx.strokeStyle = 'rgba(255,255,0,0.3)';
                    //     ctx.beginPath();
                    //     for (let i = 0; i < 1; i += 0.01) {
                            
                    //         // ctx.fillStyle = 'rgba(255,0,0,0.3)';
                    //         const vector = getPointAlongPath(i);
                    //         if (i === 0) {
                    //             ctx.moveTo(vector[0],vector[1]);
                    //         } else ctx.lineTo(vector[0],vector[1]);
                    //         // ctx.arc(vector[0],vector[1],10,0,2*Math.PI);
                    //         // ctx.fill();
                    //     }
                    //     ctx.stroke();
                    //     ctx.restore()
                    //     ctx.beginPath();
                        
                    // },0,0,1920,1080),
                    // Draw(ctx => {

                    //     ctx.beginPath();
                    //     ctx.fillStyle = 'rgba(255,0,0,0.3)';
                    //     let vector = [0,0];
                    //     try {
                    //         // console.log(signal.discrete('ball',Math.floor(i * project.timelineData.numberOfFrames)))
                    //         vector = JSON.parse(signal.discrete('ball',Math.floor(frame())));
                    //     } catch {
                    //         vector = [0,0];
                    //     } 
                    //     ctx.arc(vector[0],vector[1],10,0,2*Math.PI);
                    //     ctx.fill();
                        
                        
                    // },0,0,1920,1080),
                    Draw(ctx => {

                        ctx.beginPath();
                        ctx.fillStyle = 'rgba(255,255,0,0.8)';

                        let progress = signal.continuous('ballprogress',[0,1]);
                        let vector = getPointAlongPath(progress);
                        ctx.arc(vector[0],vector[1],10,0,2*Math.PI);
                        ctx.fill();
                        
                        
                    },0,0,1920,1080),
                    Draw(ctx => {
                          let progress = signal.continuous('ballprogress',[0,1]);
                          let [cx,cy] = getPointAlongPath(progress);
                          const gradient = ctx.createRadialGradient(
                            cx, cy, 0, // Inner circle
                            cx, cy, 100 // Outer circle
                          );
                          gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
                          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                          ctx.fillStyle = gradient;
                        //   const maskCanvas = document.createElement('canvas');
                        //   const [canvasWidth, canvasHeight] = r.canvasDimensions;
                        //   maskCanvas.width = canvasWidth;
                        //   maskCanvas.height = canvasHeight;
                        //   const maskCtx = maskCanvas.getContext('2d');
                        //   if (maskCtx === null) {
                        //     throw new Error('Could not get 2d context for mask canvas'); 
                        //   }
                        //   // Draw the gradient mask on the temporary canvas
                        //   maskCtx.fillStyle = gradient;
                          ctx.fillRect(0, 0, 1920, 1080);
                  
                          // // Apply the mask to the main canvas
                          // maskCtx.drawImage(maskCanvas, 0, 0);
                        ctx.globalCompositeOperation = 'source-in';
                        //   maskCtx.drawImage(img,aox,aoy,this.w*aux,this.h*auy);
                        //   r.ctx.drawImage(maskCanvas, 0, 0);

                    },0,0,1920,1080),
                ];
            }),
        ];
    })



    // Image(
    //     'https://www.w3schools.com/w3images/lights.jpg',
    //     0,
    //     0,
    //     1920,
    //     1080,
    // ),

);




