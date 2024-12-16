import { CanvasWindow, Controller, ProjectBuilder, PostMessageAPI, Box, RenderProps, CanvasRoot } from "../Dependencies";
import FullscreenCanvas from "../FullscreenCanvas";
import resetButton_ from "./UIElements/resetButton";
import loadInterface_ from "./UIElements/loadInterface";
import saveInterface_ from "./UIElements/saveInterface";
import modeMenu_, { Mode } from "./UIElements/modeMenu";
import uiIsland_ from "./UIElements/uiIsland";
import renderButton_ from "./UIElements/renderButton";
import Scene from "./Scene";
import { throttle } from "lodash";
import RenderCanvas from "../RenderCanvas";
import { CanvasNode } from "../../CanvasWindows";

const CLIENTURL = 'https://pinsandcurves.app';

function getController(dispatch: any, config: SceneConfig) {
    // check if project in local storage
    let worm = localStorage.getItem('pinsandcurvescontroller');
    if (worm) {
        const c = Controller.HostFromSerializedWorm(dispatch, worm);
        c.projectTools.updateFramesPerSecond(config.framesPerSecond);
        c.projectTools.updateNumberOfFrames(config.numberOfFrames);
        for (let key in config.templateCurves) {
            if (c.getProject().templateData[key]) {
                c.projectTools.updateCurveTemplate(key, config.templateCurves[key].toString());
                continue;
            }
            c.projectTools.addCurveTemplate(key, config.templateCurves[key].toString());
        }
        for (let key in c.getProject().templateData) {
            if (!config.templateCurves[key]) {
                c.projectTools.deleteCurveTemplate(key);
            }
        }
        return c;
    } else {
        const pb = new ProjectBuilder();
        pb.setTimelineData(config.numberOfFrames, config.framesPerSecond, 20);
        for (let key in config.templateCurves) {
            pb.addCurveTemplate(key, config.templateCurves[key].toString());
        }

        const c = Controller.HostFromProject(dispatch, pb.getProject());
        return c;
    }
}

function getDispatch() {
    let dispatch = (e: any) => { };
    if (window.parent !== null) {
        console.log(window.parent.postMessage({ test: "something" }, CLIENTURL));
        const dispatchProjectEvent = PostMessageAPI.dispatchProjectEvent(window.parent, CLIENTURL);
        dispatch = (e: any) => {
            dispatchProjectEvent(e);
        };
    }
    return dispatch;
}


const _default_config = {
    framesPerSecond: 30,
    numberOfFrames: 250,
    persistence: true,
    renderResolution: [1920, 1080] as [number,number],
    templateCurves: {},
}

interface SceneConfig {
    framesPerSecond: number;
    numberOfFrames: number;
    persistence: boolean;
    renderResolution: [number, number];
    templateCurves: { [key: string]: Function };
}

interface SceneProps {
    mode: Mode;
}

let initialized = false;
function CreateScene(config:Partial<SceneConfig> = {},getObjects: (s:SceneProps) => CanvasNode[]) {

    const {canvas,subscribeToCanvasResize} = FullscreenCanvas();
    const resetButton = resetButton_();
    const loadInterface = loadInterface_();
    const saveInterface = saveInterface_();
    const composedConfig = { ..._default_config, ...config };
    const renderCanvas = RenderCanvas();

    const dispatch = getDispatch();

    const controller = getController(dispatch, composedConfig);
    const {modeMenu,modeManager} = modeMenu_();
    document.body.appendChild(canvas);
    const receive = controller.receive.bind(controller);
    const subscribe = PostMessageAPI.subscribeToProjectEvents(CLIENTURL);
    subscribe((e: any) => {
        receive(e);
    });
    controller.subscribeToProjectUpdates(() => {
        if (config.persistence === false) return;
        localStorage.setItem('pinsandcurvescontroller', controller.serializeWorm());
    });

    const scene = Scene.Node({
        controller, 
        modeManager, 
        subscribeToCanvasResize,
        getObjects,
    });

    const root = new CanvasRoot(scene, canvas);
    const renderButton = renderButton_(root,renderCanvas,controller.projectTools,controller.getProject());

    modeManager.subscribeToModeUpdates((mode) => {
        if (!initialized) return;
        if (mode === 'view') {
            canvas.style.display = 'none';
            renderCanvas.style.display = 'block';

            // disable primary camera
            const sceneCamera = root.windows.find((w : any) => w.isSceneCamera !== undefined) as any;
            if (!sceneCamera) throw new Error("Could not find scene camera");
            sceneCamera.setAsPrimaryCamera();
            const [w,h] = composedConfig.renderResolution;
            renderCanvas.width = w;
            renderCanvas.height = h;
            root.canvas = renderCanvas;
        } else {
            // disable primary camera
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

export type { SceneConfig, SceneProps };
export default CreateScene;