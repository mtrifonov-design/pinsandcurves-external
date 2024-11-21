import Box from "./Box";
import { CanvasWindow } from "./CanvasWindow";
import { render, mouseDownHandler, mouseMoveHandler, mouseUpHandler, mouseWheelHandler, clickHandler } from "./Render";

// function getWindows(root: CanvasWindow) : CanvasWindow[] {
//     const getWindowsRecursive = (window: CanvasWindow) : CanvasWindow[] => {
//         const children = window.getChildrenPrimitive();
//         return [window, ...children.flatMap(getWindowsRecursive)];
//     };
//     return getWindowsRecursive(root);
// }

// type KeyArray = string[];

// function setParents(windows: CanvasWindow[]) {
//     const processedWindows : [CanvasWindow, KeyArray, number][] = windows.map(w => {
//         const keyArray = w.globalKey.split('@');
//         const depth = keyArray.length;
//         return [w, keyArray, depth];
//     });
//     const windowDict: {
//         [key: string]: CanvasWindow | undefined
//     } = windows.reduce((acc, w) => {
//         acc[w.globalKey] = w;
//         return acc;
//     }, {} as { [key: string]: CanvasWindow | undefined });

//     processedWindows.forEach(([w, keyArray, depth]) => {
//         if (depth === 1) {
//             w._parent = undefined;
//         } else {
//             const parentKey = keyArray.slice(0, -1).join('@');
//             w._parent = windowDict[parentKey];
//         }
//     });
// }

// function setChildren(windows: CanvasWindow[]) {
//     const processedWindows : [CanvasWindow, KeyArray, number][] = windows.map(w => {
//         const keyArray = w.globalKey.split('@');
//         const depth = keyArray.length;
//         return [w, keyArray, depth];
//     });

//     const windowDict: {
//         [key: string]: CanvasWindow | undefined
//     } = windows.reduce((acc, w) => {
//         acc[w.globalKey] = w;
//         return acc;
//     }, {} as { [key: string]: CanvasWindow | undefined });

//     processedWindows.forEach(([w, keyArray, depth]) => {
//         if (depth === 1) {
//             w.children = [];
//         } else {
//             const parentKey = keyArray.slice(0, -1).join('@');
//             const parent = windowDict[parentKey];
//             if (parent) {
//                 parent.children.push(w);
//             }
//         }
//     });
// }


class CanvasRoot {
    canvas: HTMLCanvasElement;
    cameraSnapshot: Box;
    isCanvasRoot: true = true;
    rootNode : CanvasWindow;

    constructor(root: (p : CanvasWindow | CanvasRoot) => CanvasWindow, canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.cameraSnapshot = new Box([0,0],canvas.width, canvas.height);
        this.rootNode = root(this);
    }

    get windows() {
        const getWindowsRecursive = (window: CanvasWindow) : CanvasWindow[] => {
            const children = window.children;
            return [window, ...children.flatMap(getWindowsRecursive)];
        }
        return getWindowsRecursive(this.rootNode);
    }


    logWindows() {
        const logWindowRecursive = (w: CanvasWindow): string[] => {
            const lines = [];
            lines.push(`KEY: ${w.key}`);
            if (w._isPrimaryCamera) lines.push(`[[PRIMARY CAMERA]]`);
            lines.push(`BOX: [${w.o[0]}, ${w.o[1]}, ${w.w}, ${w.h}]`);
            lines.push(`GLOBAL O: [${w.globalO[0]}, ${w.globalO[1]}]`);
            lines.push(`CHILDREN:`);
            if (w.children.length > 0) {

                const children = w.children;
                const childrenLines = [];
                for (let i = 0; i < children.length; i++) {
                    const child = children[i];
                    childrenLines.push(logWindowRecursive(child));
                }
                lines.push(' |')
                for (let i = 0; i < childrenLines.length; i++) {
                    const childLines = childrenLines[i];
                    const prefix = i === childrenLines.length - 1 ? ' └─' : ' ├─';
                    for (let j = 0; j < childLines.length; j++) {
                        const correctPrefix = j === 0 ? prefix : i === childrenLines.length - 1 ? "   " :  " | ";
                        const line = childLines[j];
                        lines.push(`${correctPrefix}  ${line}`);
                    }
                    if (i < childrenLines.length -1 ) lines.push(` |`);
                }
            } else {
                lines.push('  |')
                lines.push(`  └─ (no children)`);
            }

            return lines;
        };
    
        console.log(logWindowRecursive(this.rootNode).join('\n'));
    }
    
    

    updateNeeded: boolean = true;
    scheduleUpdate() {
        this.updateNeeded = true;
    }

    onUpdateFunction : Function | undefined = undefined;
    onUpdate(f: Function) {
        this.onUpdateFunction = f;
    }

    private update() {
        if (!this.updateNeeded) return;

        if (this.onUpdateFunction) {
            this.onUpdateFunction();
        }

        // find the first window that needs updating
        let continueSearch = true; 
        const findUpdateRootRecursive = (window: CanvasWindow) : void => {
            if (!continueSearch) return;
            if (window._needsUpdate) {
                this.updateNeeded = false;
                window.updateSelf();
                continueSearch = false;
            } else {
                window.children.forEach(findUpdateRootRecursive);
            }
        };

        findUpdateRootRecursive(this.rootNode);

        // deal with camera
        const camera = this.windows.find(w => w._isPrimaryCamera);
        if (camera) {
            this.cameraSnapshot = new Box([...camera.globalO], camera.w, camera.h);
            this.windows.forEach(w => w.cameraDidUpdate());
        }

        this.update();
    }

    // private updateWindowsAndCamera() {
    //     const existingWindowsMap: { [key: string]: CanvasWindow } = this.windows.reduce((acc, w) => {
    //         acc[w.globalKey] = w;
    //         return acc;
    //     } , {} as { [key: string]: CanvasWindow });

    //     const getWindowsRecursive = (window: CanvasWindow) : CanvasWindow[] => {
    //         const children = window.getChildrenPrimitive(existingWindowsMap);
    //         return [window, ...children.flatMap(getWindowsRecursive)];
    //     }

    //     const newWindows = getWindowsRecursive(this.root);

    //     this.windows = newWindows;
    //     this.windows.forEach(w => {
    //         if (!w._didMount) {
    //             w.windowDidMount();
    //         }
    //         if (w._needsUpdate) {
    //             w.windowDidUpdate();
    //         }
    //     })

    //     const camera = this.windows.find(w => w._isPrimaryCamera);
    //     if (camera) {
    //         camera.getBoxPrimitive();
    //         this.cameraSnapshot = new Box([...camera.globalO], camera.w, camera.h);
    //         this.windows.forEach(w => w.cameraDidUpdate());
    //     }

    //     const removedWindows = Object.keys(existingWindowsMap).filter(k => !newWindows.includes(existingWindowsMap[k]!));
    //     removedWindows.forEach(k => {
    //         const w = existingWindowsMap[k]!;
    //         w.windowWillUnmount();
    //     });

    //     this.updateNeeded = false;
    // }




    // externalState: any;
    // setInitialExternalState(externalState: any) {
    //     this.externalState = externalState;
    //     this.windows.forEach(w => w.setExternalState(externalState));
    // }
    // updateExternalState(externalState: any) {
    //     if (this.externalState === externalState) return;
    //     this.windows.forEach(w => w.setExternalState(externalState));
    // }

    render() {
        this.update();
        const ctx = this.canvas.getContext('2d');
        if (!ctx) throw new Error("Could not get 2d context from canvas");
        render(this.cameraSnapshot, this.windows, this.canvas, ctx);
    }

    mouseDownHandler(mousePos: [number, number], e: MouseEvent) {
        this.update();
        mouseDownHandler(this.cameraSnapshot, this.windows, this.canvas, mousePos, e);
    }

    mouseMoveHandler(mousePos: [number, number], e: MouseEvent) {
        this.update();
        mouseMoveHandler(this.cameraSnapshot, this.windows, this.canvas, mousePos, e);
    }

    mouseUpHandler(mousePos: [number, number], e: MouseEvent) {
        this.update();
        mouseUpHandler(this.cameraSnapshot, this.windows, this.canvas, mousePos, e);
    }

    mouseWheelHandler(e: WheelEvent) {
        this.update();
        mouseWheelHandler(this.cameraSnapshot, this.windows, this.canvas, e);
    }

    clickHandler(mousePos: [number, number], e: MouseEvent) {
        this.update();
        clickHandler(this.cameraSnapshot, this.windows, this.canvas, mousePos, e);
    }
}

export default CanvasRoot;

