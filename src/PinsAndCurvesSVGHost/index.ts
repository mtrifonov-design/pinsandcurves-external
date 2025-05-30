import PinsAndCurvesHost from "../PinsAndCurvesClient";
import SVGtoLottie from "./svgToLottie/svgToLottie";
import renderAsImageSequence from "./ImageSequenceRenderer/RenderAsImageSequence";
import AudioManager from "./audioManager";
import addHoverOutline from "./outlines";
import addCrosshairs, { anchorCheckbox} from "./anchors";
import addDomControls from "./addDomControls";

interface Config {
    framesPerSecond: number;
    numberOfFrames: number;
    templates?: { [key: string]: Function };
    svgCanvas?: SVGSVGElement;
}

function debounce(func: Function, wait: number) {
    let timeout: any;
    return function (this: any, ...args: any[]) {
        const context = this;
        const later = function () {
            timeout = null;
            func.apply(context, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}


function mergeNestedObjects(target : any, source : any) {
    for (let key in source) {
        if (source[key] instanceof Object && key in target) {
            Object.assign(source[key], mergeNestedObjects(target[key], source[key]));
        }
    }
    Object.assign(target || {}, source);
    return target;
  }


class PinsAndCurvesSVGHost extends PinsAndCurvesHost {

    svgCanvas: SVGSVGElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    static Init(config: Config, persistence?: boolean) {
        let host: PinsAndCurvesSVGHost;
        if (persistence) {
            const json = localStorage.getItem('pac');
            if (json) {
                const serialized = JSON.parse(json).project;
                host = PinsAndCurvesSVGHost.FromSerialized(serialized, config) as PinsAndCurvesSVGHost;
                host.onUpdate(debounce(() => {
                    localStorage.setItem('pac', JSON.stringify({project:host.serialize()}));
                }, 1000));
            } else {
                host = PinsAndCurvesSVGHost.NewProject(config) as PinsAndCurvesSVGHost;
                host.onUpdate(debounce(() => {
                    localStorage.setItem('pac', JSON.stringify({project:host.serialize()}));
                }, 1000));
            }
        } else {
            host = PinsAndCurvesSVGHost.NewProject(config) as PinsAndCurvesSVGHost;
        }


        if (config.svgCanvas) {
            host.svgCanvas = config.svgCanvas;
        } else {
            const svgElements = document.querySelectorAll('svg');
            // find the most top level svg element
            const topLevel = Array.from(svgElements).find((svgElement) => {
                return svgElement.parentNode === document.body;
            });
            if (topLevel) {
                host.svgCanvas = topLevel;
            } else {
                throw new Error('No top level svg element found');
            }
        }
        host.svgCanvas.id = 'svgcanvas';

        host.onUpdate(host.applySignals.bind(host));
        host.addAudioSources();
        host.applySignals();
        addDomControls();

        // (document.getElementById('island') as any).style.display = 'none';

        document.getElementById('island')?.appendChild(anchorCheckbox());
        const renderButton = document.createElement('button');
        renderButton.innerText = 'Render';
        renderButton.id = 'renderButton';
        renderButton.onclick = () => host.renderAsImageSequence.bind(host)();

        document.getElementById('island')?.appendChild(renderButton);

        const saveAsJSONButton = document.createElement('button');
        saveAsJSONButton.innerText = 'Save as JSON';
        saveAsJSONButton.onclick = () => host.saveAsJSON.bind(host)();
        document.getElementById('island')?.appendChild(saveAsJSONButton);

        const loadFromJSONButton = document.createElement('button');
        loadFromJSONButton.innerText = 'Load from JSON';
        loadFromJSONButton.onclick = () => host.loadFromJSON.bind(host)();
        document.getElementById('island')?.appendChild(loadFromJSONButton);

        const clearButton = document.createElement('button');
        clearButton.innerText = 'Clear';
        clearButton.onclick = () => host.clear.bind(host)();
        document.getElementById('island')?.appendChild(clearButton);

        addCrosshairs(host.svgCanvas as any);
        addHoverOutline(host.svgCanvas as any);

        

        return host;

    }

    addAudioSources() {
        const audioElements = document.querySelectorAll('audio');
        for (let i = 0; i < audioElements.length; i++) {
            const audio = audioElements[i] as HTMLAudioElement;
            const fps = this.c.getProject().timelineData.framesPerSecond;
            const audioManager = new AudioManager(audio,fps);
            audioManager.castAudioToSignal(this.c.getProject(), this.c.projectTools);
            this.onUpdate(() => audioManager.onUpdate(this.c.getProject()));
        }
    }

    lastFrame = 0;

    applySignals(frame?: number) {
        
        const controller = this.c;

        const thisFrame = controller.getProject().timelineData.playheadPosition;
        if (thisFrame > this.lastFrame + 1) {
            // console.log("skipped frame", thisFrame);
        }
        this.lastFrame = thisFrame;


        const project = controller.getProject();
        const signalIds = project.orgData.signalIds;
        const objectProps : {[key:string]:any}= {};
        for (let i = 0; i < signalIds.length; i++) {
            const signalId = signalIds[i];
            let signalName = project.orgData.signalNames[signalId];
            if (!signalName.startsWith('.') && !signalName.startsWith('#')) {
                continue;
            }
            let formatString = "::";
            let cleanedSignalName = signalName;
            if (signalName.includes('[') && signalName.includes(']')) {
                let parts = signalName.split('[');
                let key = parts[0];
                let value = parts[1].slice(0, -1); // Remove the closing bracket
                formatString = value;
                cleanedSignalName = key;
            }

            let signalComponents;
            if (signalName.startsWith('.')) {
                signalComponents = cleanedSignalName.substring(1).split('.');
                signalComponents[0] = '.' + signalComponents[0];
            } else {
                signalComponents = cleanedSignalName.split('.');
            }

            // Create the nested object
            let nestedObject = signalComponents.reduceRight((acc, key, index) => {
                if (index === signalComponents.length - 1) {
                    let [pre, suf] = formatString.split('::');
                    const value = frame ? this.signal(signalName,frame) : this.signal(signalName);
                    return {
                        [key]: pre + value + suf
                    }
                } else {
                    return { [key]: acc }; // Create nested object
                }
            }, {});

            // Merge the nested object with the root object
            mergeNestedObjects(objectProps, nestedObject);
        };

        for (let key in objectProps) {
            const element = document.querySelector(key) as any;
            const object = objectProps[key] as any;
            if (element) {
                const x = object.x ? object.x : "0px";
                const y = object.y ? object.y : "0px";
                const rotation = object.rotation ? object.rotation : "0";
                const scaleX = object.scaleX ? object.scaleX : 1;
                const scaleY = object.scaleY ? object.scaleY : 1;
                const anchorX = object.anchorX ? object.anchorX : "0px";
                const anchorY = object.anchorY ? object.anchorY : "0px";

                const bbox = element.getBBox();
                const width = bbox.width;
                const height = bbox.height;
                const midPoint = {x: bbox.x + width / 2, y: bbox.y + height / 2};
                // const transformation = `translate(${x}, ${y}) rotate(${rotation}) scale(${scaleX}, ${scaleY})`;
                
                const transformation = `translate(${x}, ${y})
                translate(${anchorX}, ${anchorY})
                translate(${midPoint.x}px, ${midPoint.y}px)
                scale(${scaleX}, ${scaleY})
                rotate(${rotation}) 
                translate(calc(-1 * ${anchorX}), calc(-1 * ${anchorY}))
                translate(calc(-1 * ${midPoint.x}px), calc(-1 * ${midPoint.y}px))
                
                `;
                
                //console.log(transformation);
                element.dataset.anchorX = anchorX;
                element.dataset.anchorY = anchorY;
                element.style.transform = transformation;
                const style = object.style ? object.style : {};
                for (let key in style) {
                    element.style[key] = style[key];
                }
                const dataset = object.dataset ? object.dataset : {};
                for (let key in dataset) {
                    element.dataset[key] = dataset[key];
                }
                for (let key in object) {
                    if (key !== 'x' && key !== 'y' && key !== 'rotation' && key !== 'scaleX' && key !== 'scaleY' && key !== 'style' && key !== 'dataset') {
                        element[key] = object[key];
                    }
                }
            }
        }
    }

    clear() {
        localStorage.removeItem('pac');
    }

    saveAsJSON() {
        const json = JSON.stringify({project:this.serialize()});
        const blob = new Blob([json], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pac.json';
        a.click();
    }

    loadFromJSON() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const json = (event.target as FileReader).result as string;
                    const serialized = JSON.parse(json).project;
                    localStorage.setItem('pac', JSON.stringify({project:serialized}));
                    window.location.reload();
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    renderAsLottie() {

        const project = this.c.getProject();

        const startFrame = project.timelineData.focusRange[0];
        const endFrame = project.timelineData.focusRange[1];
        const framesPerSecond = project.timelineData.framesPerSecond;
        
        const svgToLottie = new SVGtoLottie({applySignals:this.applySignals.bind(this),
            startFrame,
            endFrame,
            framesPerSecond
        });
        svgToLottie.convertSceneToLottie();
    }

    renderAsImageSequence() {
        const project = this.c.getProject();

        const startFrame = project.timelineData.focusRange[0];
        const endFrame = project.timelineData.focusRange[1];
        const framesPerSecond = project.timelineData.framesPerSecond;

        renderAsImageSequence({
            applySignals: this.applySignals.bind(this),
            startFrame,
            endFrame,
            framesPerSecond
        });
    }








}


export default PinsAndCurvesSVGHost;