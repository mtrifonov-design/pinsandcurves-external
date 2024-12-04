


import PathProvider from './Path';
import PathOutline from './PathOutline';
import { Text1, Text2 } from './Text';
import { CreateScene, SignalWindow, CartesianVectorHandle, RenderProps, Box } from './Dependencies';
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


function hello() {
    console.log('hello');
}

function extractFunctionBody(func : Function) {
    const funcString = func.toString();
    const bodyMatch = funcString.match(/\{([\s\S]*)\}/);
    return bodyMatch ? bodyMatch[1].trim() : null;
}

const bodyOnly = extractFunctionBody(hello);
console.log(bodyOnly);


CreateScene({
    persistence: false,

}, ({ mode }) => {
    return [

        SignalProvider((signal: any) => {
            const frame = signal.frame;
            const project = signal.project();

            //console.log(project)
            return [
                Group({ x: 0, y: 0, w: 0, h: 0 },
                    Effect(ctx => ctx.filter = 'blur(1px) grayscale(100%) opacity(10%)'),
                    Image(
                        '/media/text.svg',
                        (75.6 / 384) * 1920 - 960,
                        (59.5 / 216) * 1080 - 540,
                        (222 / 384) * 1920,
                        (113.6 / 216) * 1080,
                    ),
                    Effect(ctx => ctx.filter = 'none'),
                ),
                PathProvider({
                    x: -960,
                    y: -540,
                    w: 1920,
                    h: 1080,
                }, (getPointAlongPath: any) => {
                    //console.log(frame()/project.timelineData.numberOfFrames)
                    // const point = getPointAlongPath(frame()/project.timelineData.numberOfFrames);
                    // console.log(point)
                    let progress = signal.continuous('ballprogress', [0, 1]);
                    const vectors = [];
                    for (let i = -0.15; i < 0.15; i += 0.04) {
                        const ap = Math.min(1, Math.max(0, progress + i));
                        const vector = getPointAlongPath(ap);
                        vectors.push(vector);
                    }
                    let vector = vectors.reduce((acc, cur) => {
                        return [acc[0] + cur[0], acc[1] + cur[1]];
                    }, [0, 0]).map((v : number) => v / vectors.length);
                    return [
                        // Mount(() => {
                        //     setTimeout(() => {
                        //         // if (project.orgData.signalIds.includes('ballprogress')) return;
                        //         for (let i = 0; i < project.timelineData.numberOfFrames; i += 5) {
                        //             const relative = i / project.timelineData.numberOfFrames;
                        //             const vector = getPointAlongPath(relative);
                        //             const frame = Math.floor(i * project.timelineData.numberOfFrames);

                        //             // console.log(vector,i)
                        //             const x = vector[0];
                        //             const y = vector[1];

                        //             signal.setDiscreteSignal('ball',JSON.stringify(vector),i);
                        //         }
                        //     },1000);
                        // }),
                        // Mount(() => {
                        //     setTimeout(() => {
                        //         // if (project.orgData.signalIds.includes('ballprogress')) return;
                        //         for (let i = 0; i < project.timelineData.numberOfFrames; i += 5) {
                        //             const relative = i / project.timelineData.numberOfFrames;
                        //             const vector = getPointAlongPath(relative);
                        //             // const frame = Math.floor(i * project.timelineData.numberOfFrames);

                        //             signal.setContinuousSignal('ballprogress', relative, i,  [0, 1]);

                        //             // // console.log(vector,i)
                        //             // const x = vector[0];
                        //             // const y = vector[1];

                        //             // signal.setDiscreteSignal('ball',JSON.stringify(vector),i);
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
                            ctx.fillStyle = 'rgba(255,255,0,1)';

                            let progress = signal.continuous('ballprogress', [0, 1]);
                            let vector = getPointAlongPath(progress);
                            ctx.arc(vector[0], vector[1], 13, 0, 2 * Math.PI);
                            ctx.fill();


                        }, 0, 0, 1920, 1080, { layer: 16 }),
                        Camera({
                            x: vector[0]-960 / 2,
                            y: vector[1]-540 / 2,
                            w: 1920 / 2,
                            h: 1080 / 2,
                        }),
                        Draw(ctx => {
                            ctx.fillStyle = '#2C333A';
                            ctx.fillRect(0, 0, 1920, 1080);
                        },
                        vector[0]-960 / 2,
                        vector[1]-540 / 2,
                        1920 / 2,
                        1080 / 2,
                        { layer: -5 }),


                        Draw(ctx => {
                            let progress = signal.continuous('ballprogress', [0, 1]);
                            let [cx, cy] = getPointAlongPath(progress);
                            const gradient = ctx.createRadialGradient(
                                cx, cy, 0, // Inner circle
                                cx, cy, 100 // Outer circle
                            );
                            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
                            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                            ctx.fillStyle = gradient;
                            ctx.fillRect(0, 0, 1920, 1080)
                        }, 0, 0, 1920, 1080, { layer: 15, modes: ['view'] }),
                        Effect(ctx => { ctx.globalCompositeOperation = 'source-in'; }, { layer: 15, modes: ['view'] }),
                    ];
                }),
                Image('/media/text.svg',
                    (75.6 / 384) * 1920 - 960,
                    (59.5 / 216) * 1080 - 540,
                    (222 / 384) * 1920,
                    (113.6 / 216) * 1080, { layer: 15, modes: ['view'] }),
            ];}),
    ]});




