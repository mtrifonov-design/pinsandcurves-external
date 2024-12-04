import { CanvasWindow, Controller, ProjectBuilder, PostMessageAPI, Box, RenderProps, Vec2 } from "../Dependencies";
import InteractiveCamera from "../InteractiveCamera";
import modeMenu, { ModeManager, Mode } from "./UIElements/modeMenu";
import type { SceneProps as ExtSceneProps } from "./CreateScene";
const workingCanvasDimensions : Vec2 = [10000,10000];

class Frame extends CanvasWindow {
    layer = 100;
    getBox() {
        const [x,y] = this.context.workingCanvasDimensions;
        return new Box([x/2,y/2],0,0);    
    }
    getChildren() {
        return this.props.objects;
    }

    render(r: RenderProps) {
        // console.log("rendering frame")
        if (this.context.mode === "view") return;
        // draw little crosshair in the middle of the screen
        const ctx = r.ctx;
        const [ox,oy] = r.absoluteO;
        const lineLength = 13;

        // console.log("rendering",ox,oy)
        
        const points = [
            [ox,oy+lineLength], // top
            [ox,oy-lineLength], // bottom
            [ox+lineLength,oy], // right
            [ox-lineLength,oy], // left
        ]

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(points[0][0],points[0][1]);
        ctx.lineTo(points[1][0],points[1][1]);
        ctx.moveTo(points[2][0],points[2][1]);
        ctx.lineTo(points[3][0],points[3][1]);
        ctx.stroke();
    }
}

interface SceneProps {
    controller: Controller;
    modeManager: ModeManager;
    getObjects: () => CanvasWindow[];
    objects: ((parent: CanvasWindow) => CanvasWindow)[];
}

class Scene extends CanvasWindow {
    windowDidMount(props: SceneProps): void {
        const controller = this.props.controller;
        this.setContext('controller', controller);
        this.setContext('project', controller.getProject());
        this.setContext('projectTools', controller.projectTools)
        controller.subscribeToProjectUpdates(() => {
            const project = controller.getProject();
            this.setContext('project', project);
        });

        this.setContext('workingCanvasDimensions', workingCanvasDimensions);
        this.props.modeManager.subscribeToModeUpdates((mode : Mode) => {
            this.setContext('mode', mode);
        })
        this.setContext('setMode', (mode: Mode) => {
            this.props.modeManager.setMode(mode);
        });
    }

    getChildren(props: SceneProps) {
        const w = [];
        w.push(InteractiveCamera.Node({subscribeToCanvasResize: this.props.subscribeToCanvasResize}));
        const sceneProps = {
            mode: this.props.mode,
        }
        w.push(Frame.Node({objects:this.props.getObjects(sceneProps)}));
        return w;
    }

}

export default Scene;