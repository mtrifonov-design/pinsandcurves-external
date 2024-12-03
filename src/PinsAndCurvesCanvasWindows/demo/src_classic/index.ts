import { Draw, Effect, SignalProvider } from "../..";
import Camera from "../../Camera";
import CreateScene from "../../Scene/CreateScene";
import { CartesianVectorHandle, AngularVectorHandle, NormalVectorHandle } from "../../VectorHandle/VectorHandle";
import { Vec2 } from "../../Dependencies";
import Image from "../../Image";
// CreateScene(
//     {numberOfFrames: 100},
//     SignalProvider((signal) => {
//         const { vector } : { vector : Vec2} = JSON.parse(signal.discrete("v1"));
//         const { angle } : { angle : number} = JSON.parse(signal.discrete("v2"));
//         return [CartesianVectorHandle(
//             {id: 'v1',
//             range: [-100,100],
//             displayLine: true, 
//             discrete: true},
//             AngularVectorHandle(
//                 {id: 'v2',
//                 displayCircle: true,
//                 initialLength: 50,
//                 discrete: true},
//                 NormalVectorHandle(
//                     {id: 'v3',
//                     range: [-100,100],
//                     displayLine: true,
//                     initialDirection: [1,1],
//                     discrete: true, 
//                     onionSkin: true
//                 }),
//             ),
//         ),
//         Draw((ctx) => {
//             ctx.fillStyle = 'red';
//             ctx.rotate(angle);
//             ctx.fillRect(0,0,300,300);
//         },
//         ...vector,500,500),
//     ]})
// );



CreateScene({},
    Camera({
        x: -960,
        y: -540,
        w: 1920,
        h: 1080,
    }),
    CartesianVectorHandle({
        id: 'snowflake',
        range: [-500,500],
    },
        Effect((ctx) => {

            ctx.filter = 'blur(10px)';
        }),
        Image(
            'https://www.w3schools.com/w3images/lights.jpg',
        ),
    )

);

