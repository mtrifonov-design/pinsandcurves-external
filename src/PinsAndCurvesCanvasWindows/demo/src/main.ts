
import PathProvider from './Path';
import PathOutline from './PathOutline';
import { Text1, Text2 } from './Text';
import { CreateScene, SignalWindow, CartesianVectorHandle, RenderProps, Box, AngularVectorHandle, NormalVectorHandle } from './Dependencies';
import templates from './Templates';

import { Draw, Group, Effect, Camera, SignalProvider, Image, Mount } from './Dependencies';

function OpacityImage(src: string, x: number, y: number, opacity: number = 1, options?: any) {
    return Group(() => [
        Effect(ctx => ctx.globalAlpha = opacity,{layer: options?.layer || 1}),
        Image(src,x,y,{layer: 1, ...options}),
        Effect(ctx => ctx.globalAlpha = 1,{layer: options?.layer || 1}),
    ])
}




CreateScene({
    persistence: true,
    templateCurves: templates,
    numberOfFrames: 500,

}, ({ mode }) => {
    return [SignalProvider((signal: any) => {
        return [Group(() => {
            const darkLetters = [];
            const minOpacity = 0.1;
            return [

                OpacityImage(`/media/0.svg`, 0, 0, signal.continuous('letter0',[0.1,1])),
                OpacityImage(`/media/1.svg`, 0, 0, signal.continuous('letter1',[0.1,1])),
                OpacityImage(`/media/2.svg`, 0, 0, signal.continuous('letter2',[0.1,1])),
                OpacityImage(`/media/3.svg`, 0, 0, signal.continuous('letter3',[0.1,1])),
                OpacityImage(`/media/4.svg`, 0, 0, signal.continuous('letter4',[0.1,1])),
                OpacityImage(`/media/5.svg`, 0, 0, signal.continuous('letter5',[0.1,1])),
                OpacityImage(`/media/6.svg`, 0, 0, signal.continuous('letter6',[0.1,1])),
                OpacityImage(`/media/7.svg`, 0, 0, signal.continuous('letter7',[0.1,1])),
                OpacityImage(`/media/8.svg`, 0, 0, signal.continuous('letter8',[0.1,1])),
                OpacityImage(`/media/10.svg`, 0, 0, signal.continuous('letter10',[0.1,1])),
                OpacityImage(`/media/11.svg`, 0, 0, signal.continuous('letter11',[0.1,1])),
                OpacityImage(`/media/12.svg`, 0, 0, signal.continuous('letter12',[0.1,1])),
                OpacityImage(`/media/14.svg`, 0, 0, signal.continuous('letter14',[0.1,1])),
                OpacityImage(`/media/15.svg`, 0, 0, signal.continuous('letter15',[0.1,1])),
                OpacityImage(`/media/17.svg`, 0, 0, signal.continuous('letter17',[0.1,1])),
                OpacityImage(`/media/18.svg`, 0, 0, signal.continuous('letter18',[0.1,1])),

                OpacityImage(`/media/9.svg`, 0, signal.continuous('letter9_y',[-1,1]) * 5, signal.continuous('letter9',[0.1,1])),
                OpacityImage(`/media/13.svg`, 0, signal.continuous('letter13_y',[-1,1]) * 5, signal.continuous('letter13',[0.1,1])),

                Group(() => [AngularVectorHandle({id: 'anchorangle', initialLength: 255, displayCircle: true})],{x: 1576,y: 932},),
                
                Effect(ctx => {
                    ctx.save();
                    ctx.translate(1576,932);
                    ctx.rotate(signal.continuous('anchorangle',[0,2*Math.PI]));
                    ctx.translate(-1576,-932);
                },{layer: 2}),
                OpacityImage(`/media/16.svg`, 0, signal.continuous('letter16_y',[-1,1]) * 10, signal.continuous('letter16',[0.1,1]),{layer: 2}),
                Effect(ctx => ctx.restore(),{layer: 2}),

                Camera(115,115,1920 * 1.18,1080 * 1.18),
                Image("/media/background_2.svg",0,0,{layer: -1000}),


                // Ball
                CartesianVectorHandle({id: 'ball', rangeX: [-800,3000], rangeY: [-1500,1000]},
                    Draw(ctx => {
                        ctx.fillStyle = 'white';
                        ctx.beginPath();
                        ctx.arc(16,16,16,0,Math.PI * 2);
                        ctx.fill();
                    },-16,-16,32,32),
                ),

                // Draw(ctx => {
                //     ctx.fillStyle = `rgba(0,0,0,${signal.continuous('fade',[0,1])})`;
                //     ctx.fillRect(0,0,1920 * 1.18,1080 * 1.18);
                // },115,115,1920 * 1.18,1080 * 1.18,{layer: 10}),





                // LOGO ANIMATION
                // CartesianVectorHandle({id: 'circle', rangeX: [-800,3000], rangeY: [-1500,1000]},
                //     AngularVectorHandle({id: 'angle', initialLength: 255, displayCircle: true}),
                //     Effect(ctx => {ctx.save();ctx.rotate(signal.continuous('angle',[0,2*Math.PI]))},{layer: 15}),
                //     // Image("/media/l2r.svg",
                //     // -290*signal.continuous('circlescale',[1,5]) ,
                //     // -265*signal.continuous('circlescale',[1,5]) ,
                //     // {layer: 5,w: 580*signal.continuous('circlescale',[1,5]) ,
                //     // h: 530*signal.continuous('circlescale',[1,5]) }),
                //     Image("/media/l2.svg",-290*signal.continuous('circlescale',[1,5]),-155*signal.continuous('circlescale',[1,5]),{layer: 15,
                //         w: 99*signal.continuous('circlescale',[1,5]),h: 308*signal.continuous('circlescale',[1,5])
                //     }),
                //     Effect(ctx => ctx.restore(),{layer: 15}),
                // ),
                // CartesianVectorHandle({id: 'bar', rangeX: [-800,3000], rangeY: [-1500,2500]},
                // Image("/media/l1.svg",-35*signal.continuous('rectscale',[1,5]),-140*signal.continuous('rectscale',[1,5]),{layer: 15,
                //     w: 70*signal.continuous('rectscale',[1,5]),h: 280*signal.continuous('rectscale',[1,5])
                // }),
                // ),
                // CartesianVectorHandle({id: 'diamond', rangeX: [-800,3000], rangeY: [-1500,1000]},
                // AngularVectorHandle({id: 'diamondangle', initialLength: 255, displayCircle: true}),
                // Effect(ctx => {ctx.save();ctx.rotate(signal.continuous('diamondangle',[0,2*Math.PI]))},{layer: 15}),
                // OpacityImage("/media/l3.svg",
                // -60*signal.continuous('diamondscale',[0,5]),
                // -60*signal.continuous('diamondscale',[0,5]),
                // 1, {
                //     w: 120*signal.continuous('diamondscale',[0,5]),
                //     h: 120*signal.continuous('diamondscale',[0,5]),
                //     layer: 15
                // }),
                // Effect(ctx => ctx.restore(),{layer: 15}),
                // ),
                // OpacityImage("/media/logo.svg",0,0,0.5,{layer: 5}),
            ]
        })];
    })]
});




