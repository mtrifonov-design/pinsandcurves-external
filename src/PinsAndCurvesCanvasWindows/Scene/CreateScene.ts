import { CanvasWindow, Controller, ProjectBuilder, PostMessageAPI, Box, RenderProps, CanvasRoot } from "../Dependencies";
import FullscreenCanvas from "../FullscreenCanvas";
import Camera from "../Camera";
import resetButton_ from "./UIElements/resetButton";
import loadInterface_ from "./UIElements/loadInterface";
import saveInterface_ from "./UIElements/saveInterface";
import modeMenu_ from "./UIElements/modeMenu";
import uiIsland_ from "./UIElements/uiIsland";
import renderButton_ from "./UIElements/renderButton";
import Scene from "./Scene";

function getController(dispatch: any, config: SceneConfig) {
    // check if project in local storage
    let worm = localStorage.getItem('pinsandcurvescontroller');
    if (worm) {
        const c = Controller.HostFromSerializedWorm(dispatch, worm);
        return c;
    } else {
        const pb = new ProjectBuilder();
        pb.setTimelineData(config.numberOfFrames, config.framesPerSecond, 20);
        const c = Controller.HostFromProject(dispatch, pb.getProject());
        return c;
    }
}

function getDispatch() {
    let dispatch = (e: any) => { };
    if (window.parent !== null) {
        console.log(window.parent.postMessage({ test: "something" }, 'http://localhost:6006'));
        const dispatchProjectEvent = PostMessageAPI.dispatchProjectEvent(window.parent, 'http://localhost:6006');
        dispatch = (e: any) => {
            dispatchProjectEvent(e);
        };
    }
    return dispatch;
}


const _default_config = {
    canvasWidth: 800,
    canvasHeight: 600,
    framesPerSecond: 30,
    numberOfFrames: 250,
}

interface SceneConfig {
    canvasWidth: number;
    canvasHeight: number;
    framesPerSecond: number;
    numberOfFrames: number;
}
function CreateScene(objects: ((parent: CanvasWindow | CanvasRoot) => CanvasWindow)[], config:Partial<SceneConfig> = {}) {

    const {canvas,subscribeToCanvasResize} = FullscreenCanvas();
    const resetButton = resetButton_();
    const loadInterface = loadInterface_();
    const saveInterface = saveInterface_();



    const dispatch = getDispatch();
    const controller = getController(dispatch, { ..._default_config, ...config });
    const renderButton = renderButton_(canvas,controller.projectTools,controller.getProject());
    const {modeMenu,modeManager} = modeMenu_();
    const uiIsland = uiIsland_([resetButton,loadInterface,saveInterface,renderButton,modeMenu]);
    document.body.appendChild(uiIsland);
    document.body.appendChild(canvas);

    const receive = controller.receive.bind(controller);
    const subscribe = PostMessageAPI.subscribeToProjectEvents('http://localhost:6006');
    subscribe((e: any) => {
        receive(e);
    });
    controller.subscribeToProjectUpdates(() => {
        localStorage.setItem('pinsandcurvescontroller', controller.serializeWorm());
    });

    const scene = Scene.Node({
        controller, 
        modeManager, 
        subscribeToCanvasResize,
        dimensions: {width: config.canvasWidth || _default_config.canvasWidth, height: config.canvasHeight || _default_config.canvasHeight},
        objects,
    });

    const root = new CanvasRoot(scene, canvas);

    (window as any).canvasRoot = root;
    (window as any).controller = controller;

    canvas.addEventListener("click", (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        root.clickHandler([x,y],e);
    });

    canvas.addEventListener("mousemove", (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        root.mouseMoveHandler([x,y],e);
    });

    canvas.addEventListener("mousedown", (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        root.mouseDownHandler([x,y],e);
    });

    canvas.addEventListener("mouseup", (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        root.mouseUpHandler([x,y],e);
    });

    canvas.addEventListener("wheel", (e) => {
        root.mouseWheelHandler(e);
    })

    const f = () => {
        root.onAnimationFrame();
        window.requestAnimationFrame(f);
    }

    f();
}

export type { SceneConfig };
export default CreateScene;