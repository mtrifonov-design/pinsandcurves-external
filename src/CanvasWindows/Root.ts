import Box from "./Box";
import { CanvasWindow } from "./CanvasWindow";
import { render, mouseDownHandler, mouseMoveHandler, mouseUpHandler, mouseWheelHandler, clickHandler } from "./Render";


function generateId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

class CanvasRoot {
    canvas: HTMLCanvasElement;
    isCanvasRoot: true = true;
    rootNode : CanvasWindow;

    constructor(root: (p : CanvasWindow | CanvasRoot) => CanvasWindow, canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.rootNode = root(this);
        this.rootNode._needsUpdate = true;
        this.scheduleUpdate();
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
    

    expirePositions() {
        this.windows.forEach(w => w._boxSnapshot = undefined);
    }
    
    positionExpirationScheduled = false;
    expirePositionsAfterTaskCompletes() {
        // the positionUpdateNeeded should be set to true after all code has run synchronously
        // as a microtask:
        if (this.positionExpirationScheduled) return;
        this.positionExpirationScheduled = true;
        Promise.resolve().then(() => {
            this.expirePositions();
            this.positionExpirationScheduled = false;
        });
    }

    onUpdateFunction : Function | undefined = undefined;
    onUpdate(f: Function) {
        this.onUpdateFunction = f;
    }

    get cameraSnapshot() {
        if (!this.cameraNode) return new Box([0,0],this.canvas.width,this.canvas.height);
        return new Box(this.cameraNode.globalO,this.cameraNode.w,this.cameraNode.h);
        // return this.cameraNode.getBoxPrimitive().clone();
    }

    cameraNode: CanvasWindow | undefined = undefined;
    installCamera(node: CanvasWindow) {
        if (this.cameraNode === node) return;
        else {
            this.cameraNode = node;
        }
    }


    scheduledStateUpdates: [string,() => void][] = [];
    scheduleStateUpdate(node: CanvasWindow<any,any,any>, newState: any) {
        const stateUpdateCallback = () => {
            node.state = newState;
        }
        const id = this.scheduleUpdate();
        this.scheduledStateUpdates.push([id,stateUpdateCallback]);

    }

    scheduleContextUpdate(node: CanvasWindow<any,any,any>, contextKey: any, newContext: any) {
        const contextUpdateCallback = () => {
            node.context[contextKey] = newContext;
        }
        const id = this.scheduleUpdate();
        this.scheduledStateUpdates.push([id,contextUpdateCallback]);
        
    }

    // updateScheduled = true;
    // scheduledUpdateIds: string[] = [];
    // scheduleUpdate() {
    //     // if (this.updateScheduled) return;
    //     // this.updateScheduled = true; 
    //     const id = generateId();
    //     this.scheduledUpdateIds.push(id);
    //     Promise.resolve().then(() => {
    //         this.scheduledUpdateIds = this.scheduledUpdateIds.filter(i => i !== id);
    //         this.updateRecursive();
    //     });

    // }

    scheduledUpdateIds: string[] = [];
    currentUpdateId: string = "";

    updateScheduled = false;
    updateRunning = false;
    scheduleUpdate() {
        if (!this.updateRunning && !this.updateScheduled) {
            this.updateScheduled = true;
            const id = generateId();
            this.scheduledUpdateIds.push(id);
            this.currentUpdateId = id;
            Promise.resolve().then(() => {
                // Execute the batched updates
                //console.log("Executing batched updates");
                this.updateRunning = true;
                while (this.scheduledUpdateIds.length > 0) {
                    this.updateScheduled = false;
                    this.updateCurrentId();
                }
                this.updateRunning = false;
            });
            return this.currentUpdateId;
        }
        if (!this.updateRunning && this.updateScheduled) {
            return this.currentUpdateId;
        }
        if (this.updateRunning && !this.updateScheduled) {
            this.updateScheduled = true;
            const id = generateId();
            this.scheduledUpdateIds.push(id);
            this.currentUpdateId = id;
            return this.currentUpdateId;
        }
        if (this.updateRunning && this.updateScheduled) {
            return this.currentUpdateId
        }
        throw new Error("Invalid state");
    }

    onAnimationFrame() {
        try {
            // this.updateRecursive();
            this.render();
        } catch (e) {
            console.error(e);
        }
    }


    private updateCurrentId() {
        //console.log("Updating current ID", this.currentUpdateId);
        const id = this.scheduledUpdateIds[0];
        this.scheduledUpdateIds = this.scheduledUpdateIds.filter(i => i !== id);
        const relevantStateUpdates = this.scheduledStateUpdates.filter(([updateId]) => updateId === id);
        relevantStateUpdates.forEach(([_,update]) => update());
        this.scheduledStateUpdates = this.scheduledStateUpdates.filter(([updateId]) => updateId !== id);
        this.update();
        this.expirePositions();
    }

    private update() {
        if (this.onUpdateFunction) {
            this.onUpdateFunction();
        }

        // find the first window that needs updating
        // let continueSearch = true; 
        const findUpdateRootRecursive = (window: CanvasWindow) : void => {
            // if (!continueSearch) return;
            if (window._needsUpdate) {
                window.updateSelf();
                return;
                // continueSearch = false;
            } else {
                window.children.forEach(findUpdateRootRecursive);
            }
        };

        findUpdateRootRecursive(this.rootNode);

        // deal with camera
        const camera = this.windows.find(w => w._isPrimaryCamera);
        if (camera) {
            this.installCamera(camera);
            this.windows.forEach(w => w.cameraDidUpdate());
        }
    }

    render() {
        const ctx = this.canvas.getContext('2d');
        if (!ctx) throw new Error("Could not get 2d context from canvas");
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        render(this.cameraSnapshot, this.windows, this.canvas, ctx);
    }


    // Handlers
    mouseDownHandler(mousePos: [number, number], e: MouseEvent) {
        mouseDownHandler(this.cameraSnapshot, this.windows, this.canvas, mousePos, e);
    }

    mouseMoveHandler(mousePos: [number, number], e: MouseEvent) {
        mouseMoveHandler(this.cameraSnapshot, this.windows, this.canvas, mousePos, e);
    }

    mouseUpHandler(mousePos: [number, number], e: MouseEvent) {
        mouseUpHandler(this.cameraSnapshot, this.windows, this.canvas, mousePos, e);
    }

    mouseWheelHandler(e: WheelEvent) {
        mouseWheelHandler(this.cameraSnapshot, this.windows, this.canvas, e);
    }

    clickHandler(mousePos: [number, number], e: MouseEvent) {
        clickHandler(this.cameraSnapshot, this.windows, this.canvas, mousePos, e);
    }
}

export default CanvasRoot;

