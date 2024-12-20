import PinsAndCurvesHost from "../PinsAndCurvesHost";
import SVGtoLottie from "./svgToLottie/svgToLottie";
import renderAsImageSequence from "./ImageSequenceRenderer/RenderAsImageSequence";


interface Config {
    framesPerSecond: number;
    numberOfFrames: number;
    templates?: { [key: string]: Function };
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
        host.onUpdate(host.applySignals.bind(host));
        return host;

    }


    applySignals(frame?: number) {
        const controller = this.c;
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
                const transformation = `translate(${x}, ${y}) rotate(${rotation}) scale(${scaleX}, ${scaleY})`;
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