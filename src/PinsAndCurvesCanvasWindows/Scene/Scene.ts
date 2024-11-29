import { CanvasWindow, Controller, ProjectBuilder, PostMessageAPI, Box, RenderProps } from "../Dependencies";
import Camera from "../Camera";

import modeMenu, { ModeManager, Mode } from "./UIElements/modeMenu";


class Frame extends CanvasWindow {

    layer = 100;
    getBox() {
        return new Box([this.context.dimensions.width,this.context.dimensions.height],this.context.dimensions.width,this.context.dimensions.height);
    }
    getChildren() {
        return this.props.objects;
    }

    render(r: RenderProps) {
        // console.log('me',this.w,this.h,this.o);
        this.strokeOutline(r, 'white');
    }
}

interface SceneProps {
    controller: Controller;
    modeManager: ModeManager;
    dimensions: {width: number, height: number};
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

        this.props.modeManager.subscribeToModeUpdates((mode : Mode) => {
            this.setContext('mode', mode);
        })
        this.setContext('setMode', (mode: Mode) => {
            this.props.modeManager.setMode(mode);
        });
        this.setContext('dimensions', this.props.dimensions);
    }

    getChildren(props: SceneProps) {
        const w = [];
        w.push(Camera.Node({subscribeToCanvasResize: this.props.subscribeToCanvasResize}));
        w.push(Frame.Node({objects:this.props.objects}));
        return w;
    }


}

export default Scene;