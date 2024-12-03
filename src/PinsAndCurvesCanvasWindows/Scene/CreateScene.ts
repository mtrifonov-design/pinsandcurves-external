import { CanvasWindow, Controller, ProjectBuilder, PostMessageAPI, Box, RenderProps, CanvasRoot } from "../Dependencies";
import FullscreenCanvas from "../FullscreenCanvas";
import resetButton_ from "./UIElements/resetButton";
import loadInterface_ from "./UIElements/loadInterface";
import saveInterface_ from "./UIElements/saveInterface";
import modeMenu_ from "./UIElements/modeMenu";
import uiIsland_ from "./UIElements/uiIsland";
import renderButton_ from "./UIElements/renderButton";
import Scene from "./Scene";
import { throttle } from "lodash";
import RenderCanvas from "../RenderCanvas";
import { CanvasNode } from "../../CanvasWindows";

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
    framesPerSecond: 30,
    numberOfFrames: 250,
}

interface SceneConfig {
    framesPerSecond: number;
    numberOfFrames: number;
}

let initialized = false;
function CreateScene(config:Partial<SceneConfig> = {},...objects: CanvasNode[]) {

    const {canvas,subscribeToCanvasResize} = FullscreenCanvas();
    const resetButton = resetButton_();
    const loadInterface = loadInterface_();
    const saveInterface = saveInterface_();

    const renderCanvas = RenderCanvas();

    const dispatch = getDispatch();
    const controller = getController(dispatch, { ..._default_config, ...config });
    const {modeMenu,modeManager} = modeMenu_();
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
        objects,
    });

    const root = new CanvasRoot(scene, canvas);
    const renderButton = renderButton_(root,renderCanvas,controller.projectTools,controller.getProject());

    modeManager.subscribeToModeUpdates((mode) => {
        if (!initialized) return;
        if (mode === 'view') {
            canvas.style.display = 'none';
            renderCanvas.style.display = 'block';

            // disable primary camera
            root.windows.forEach((w : any) => {
                w._isPrimaryCamera = false;
            });
            const sceneCamera = root.windows.find((w : any) => w.isSceneCamera !== undefined) as any;
            if (!sceneCamera) throw new Error("Could not find scene camera");
            sceneCamera.setAsPrimaryCamera();
            renderCanvas.width = sceneCamera.w;
            renderCanvas.height = sceneCamera.h;
            root.canvas = renderCanvas;
        } else {
            // disable primary camera
            root.windows.forEach((w : any) => {
                w._isPrimaryCamera = false;
            });
            const interactiveCamera = root.windows.find((w : any) => w.isInteractiveCamera !== undefined);
            if (!interactiveCamera) throw new Error("Could not find interactive camera");
            interactiveCamera.setAsPrimaryCamera();

            canvas.style.display = 'block';
            renderCanvas.style.display = 'none';
            root.canvas = canvas;
        }
    });

    const uiIsland = uiIsland_([resetButton,loadInterface,saveInterface,renderButton,modeMenu]);
    document.body.appendChild(uiIsland);

    (window as any).canvasRoot = root;
    (window as any).controller = controller;

    canvas.addEventListener("click", (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        root.clickHandler([x,y],e);
    });

    const throttledMouseMove = throttle((e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        root.mouseMoveHandler([x,y],e);
    });
    canvas.addEventListener("mousemove", throttledMouseMove);

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
    initialized = true;
}

export type { SceneConfig };
export default CreateScene;