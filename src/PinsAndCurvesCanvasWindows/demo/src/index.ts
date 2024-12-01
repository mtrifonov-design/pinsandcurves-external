import CreateScene from "../../Scene/CreateScene";
import { CartesianVectorHandle, AngularVectorHandle, NormalVectorHandle } from "../../VectorHandle/VectorHandle";


// objects

const vh3 = NormalVectorHandle.Node({id: 'v3',range: [-100,100],displayLine: true,initialDirection: [1,1]});
const vh2 = AngularVectorHandle.Node({id: 'v2',displayCircle: true,children: [vh3],initialLength: 50});

const vh = CartesianVectorHandle.Node({id: 'v1',range: [-100,100],displayLine: true,children: [vh2]});


CreateScene([vh],{numberOfFrames: 100});

