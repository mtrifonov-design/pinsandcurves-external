import Box from "./Box";
import { CanvasWindow } from "./CanvasWindow";
import { render, mouseDownHandler, mouseMoveHandler, mouseUpHandler, mouseWheelHandler, clickHandler } from "./Render";
import { orderBy } from "lodash";

function generateId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

class CanvasRoot {
    canvas: HTMLCanvasElement;
    isCanvasRoot: true = true;
    rootNode : CanvasWindow;
    DEBUG = false;

    constructor(root: (p : CanvasWindow | CanvasRoot) => CanvasWindow, canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.rootNode = root(this);
        this.rootNode.windowDidMountPrimitive(this.rootNode.props);
        this.rootNode.setAsPrimaryCamera();
    }

    get windows() {
        const getWindowsRecursive = (window: CanvasWindow) : CanvasWindow[] => {
            const children = window.children;
            return [window, ...children.flatMap(getWindowsRecursive)];
        }
        return orderBy(getWindowsRecursive(this.rootNode), w => w.getLayer(), 'asc');
    }


    logWindows() {
        const logWindowRecursive = (w: CanvasWindow): string[] => {
            const existingBox = w._boxSnapshot;
            const lines = [];
            lines.push(`KEY: ${w.key}`);
            if (w._isPrimaryCamera) lines.push(`[[PRIMARY CAMERA]]`);
            lines.push(`LAYER: ${w.getLayer()}`);
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
            w._boxSnapshot = existingBox;

            return lines;
        };
    
        console.log(logWindowRecursive(this.rootNode).join('\n'));
    }
    

    // expirePositions() {
    //     this.windows.forEach(w => w._boxSnapshot = undefined);
    // }
    
    // positionExpirationScheduled = false;
    // expirePositionsAfterTaskCompletes() {
    //     // the positionUpdateNeeded should be set to true after all code has run synchronously
    //     // as a microtask:
    //     if (this.positionExpirationScheduled) return;
    //     this.positionExpirationScheduled = true;
    //     Promise.resolve().then(() => {
    //         this.expirePositions();
    //         this.positionExpirationScheduled = false;
    //     });
    // }

    onUpdateFunction : Function | undefined = undefined;
    onUpdate(f: Function) {
        this.onUpdateFunction = f;
    }

    get cameraSnapshot() {
        if (!this.cameraNode) return new Box([0,0],this.canvas.width,this.canvas.height);
        return new Box(this.cameraNode.globalO,this.cameraNode.w,this.cameraNode.h);
        // return this.cameraNode.getBoxPrimitive().clone();
    }




    scheduledStateUpdates: [string,() => void][] = [];
    scheduleStateUpdate(node: CanvasWindow<any,any,any>, newState: any) {
        const stateUpdateCallback = () => {
            node.state = newState;
        }
        const id = this.scheduleUpdate(node);
        this.scheduledStateUpdates.push([id,stateUpdateCallback]);

    }

    scheduleContextUpdate(node: CanvasWindow<any,any,any>, contextKey: any, newContext: any) {
        const contextUpdateCallback = () => {
            node.context[contextKey] = newContext;
        }
        const id = this.scheduleUpdate(node);
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
    scheduledUpdateNodeMap: { [updateId: string] : {
        [key:string] : boolean 
    }} = {};
    currentUpdateId: string = "";

    updateScheduled = false;
    updateRunning = false;


    setSingleUpdateFlag(node: CanvasWindow,id: string) {
        if (!this.scheduledUpdateNodeMap[id]) this.scheduledUpdateNodeMap[id] = {};
        this.scheduledUpdateNodeMap[id][node.globalKey] = true;
    }

    scheduleUpdate(node:CanvasWindow) {

        const debugMessage = () => {
            if (this.DEBUG) {
                console.log(`Scheduling update for ${node.globalKey}. Received id ${this.currentUpdateId}`);
            }
        }

        if (!this.updateRunning && !this.updateScheduled) {
            this.updateScheduled = true;
            const id = generateId();
            this.scheduledUpdateIds.push(id);
            this.currentUpdateId = id;
            Promise.resolve().then(() => {
                // Execute the batched updates
                //console.log("Executing batched updates");
                if (this.DEBUG) {
                    console.log(`Executing batched updates: Update Ids are ${JSON.stringify(this.scheduledUpdateIds,null,2)}.
                    `)
                }

                this.updateRunning = true;
                while (this.scheduledUpdateIds.length > 0) {
                    this.updateScheduled = false;
                    this.updateCurrentId();
                }
                this.updateRunning = false;
            });
            
            this.setSingleUpdateFlag(node,this.currentUpdateId);
            debugMessage();
            return this.currentUpdateId;
        }
        if (!this.updateRunning && this.updateScheduled) {
            this.setSingleUpdateFlag(node,this.currentUpdateId);
            debugMessage();
            return this.currentUpdateId;
        }
        if (this.updateRunning && !this.updateScheduled) {
            this.updateScheduled = true;
            const id = generateId();
            this.scheduledUpdateIds.push(id);
            this.currentUpdateId = id;
            this.setSingleUpdateFlag(node,this.currentUpdateId);
            debugMessage();
            return this.currentUpdateId;
        }
        if (this.updateRunning && this.updateScheduled) {
            this.setSingleUpdateFlag(node,this.currentUpdateId);
            debugMessage();
            return this.currentUpdateId
        }
        throw new Error("Invalid state");
    }

    onAnimationFrame() {
        try {
            this.render();
        } catch (e) {
            console.error(e);
        }
    }


    propogateUpdateFlags(id: string) {
        const recursive = (propogateNode: CanvasWindow,id:string,flag: boolean) => {
            if (!this.scheduledUpdateNodeMap[id]) this.scheduledUpdateNodeMap[id] = {};
            if (this.scheduledUpdateNodeMap[id][propogateNode.globalKey]) flag = true;
            this.scheduledUpdateNodeMap[id][propogateNode.globalKey] = flag;
            propogateNode.children.forEach(child => recursive(child,id,flag));
        }
        recursive(this.rootNode,id,false);
    }
    private updateCurrentId() {
        //console.log("Updating current ID", this.currentUpdateId);
        const id = this.scheduledUpdateIds[0];
        Object.keys(this.scheduledUpdateNodeMap[id]).forEach(key => {
            this.propogateUpdateFlags(id);
        });

        if (this.DEBUG) {
            console.log(`STARTING UPDATE: Update with id: ${this.scheduledUpdateIds[0]}. 
STATE UPDATE STAGE. State updates are scheduled for ${this.scheduledStateUpdates.map(([id]) => id)}.
            `)
        }

        this.scheduledUpdateIds = this.scheduledUpdateIds.filter(i => i !== id);
        const relevantStateUpdates = this.scheduledStateUpdates.filter(([updateId]) => updateId === id);
        relevantStateUpdates.forEach(([_,update]) => update());
        this.scheduledStateUpdates = this.scheduledStateUpdates.filter(([updateId]) => updateId !== id);
        const updateMapSnapshot = this.scheduledUpdateNodeMap[id];
        this.update(updateMapSnapshot);
        delete this.scheduledUpdateNodeMap[id];
        //this.expirePositions();
    }


    taintedLayers: number[] = [];
    taintLayer(layer: number) {
        if (!this.taintedLayers.includes(layer)) {
            this.taintedLayers.push(layer);
        }
    }
    

    findCameraPathRecursive(window: CanvasWindow, updateMap: { [key:string] : boolean}) : { [key:string] : boolean} | undefined {
        if (window._isPrimaryCamera) {
            const key = window.globalKey;
            const newUpdateMap = {...updateMap, [key]: true};
            return newUpdateMap;
        } else {
            const children = window.children;
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                const key = child.globalKey;
                const newUpdateMap = {...updateMap, [key]: true};
                const result = this.findCameraPathRecursive(child, newUpdateMap);
                if (result) return result;
            }
        }
    }


    // get updateMapSnapshot() : { [key:string] : boolean} {
    //     return this.getUpdateMapSnapshotRecursive(this.rootNode
    //     );
    // }
    // getUpdateMapSnapshotRecursive(node: CanvasWindow) : { [key:string] : boolean} {
    //     const children = node.children;
    //     const map = {[node.globalKey]: node._needsUpdate};
    //     for (let i = 0; i < children.length; i++) {
    //         const child = children[i];
    //         const childMap = this.getUpdateMapSnapshotRecursive(child);
    //         Object.assign(map,childMap);
    //     }
    //     return map;
    // }

    AND_updateMaps(map1: { [key:string] : boolean}, map2: { [key:string] : boolean}) : { [key:string] : boolean} {
        const result: { [key:string] : boolean} = {};
        for (const key in map1) {
            if (map2[key]) {
                result[key] = true;
            }
        }
        return result;
    }

    XOR_updateMaps(map1: { [key:string] : boolean}, map2: { [key:string] : boolean}) : { [key:string] : boolean} {
        const result: { [key:string] : boolean} = {};
        for (const key in map1) {
            if (!map2[key]) {
                result[key] = true;
            }
        }
        for (const key in map2) {
            if (!map1[key]) {
                result[key] = true;
            }
        }
        return result;
    }

    factorizeUpdateMap(updateMap: { [key:string] : boolean}, cameraPath: { [key:string] : boolean}) : [{ [key:string] : boolean},{ [key:string] : boolean}] {
        const firstPass :{ [key:string] : boolean} = this.AND_updateMaps(updateMap,cameraPath);
        const secondPass: { [key:string] : boolean} = this.XOR_updateMaps(updateMap,firstPass);
        return [firstPass,secondPass];
    }

    setNeedsUpdateToMap(map: { [key:string] : boolean}) {
        const setNeedsUpdateRecursive = (window: CanvasWindow) => {
            const key = window.globalKey;
            if (map[key]) {
                window._needsUpdate = true;
            } else {
                window._needsUpdate = false;
            }
            window.children.forEach(child => setNeedsUpdateRecursive(child));
        }
        setNeedsUpdateRecursive(this.rootNode);
    }

    setNeedsUpdateToMapAdd(map: { [key:string] : boolean}) {
        const setNeedsUpdateRecursive = (window: CanvasWindow) => {
            const key = window.globalKey;
            if (map[key]) {
                window._needsUpdate = true;
            } 
            window.children.forEach(child => setNeedsUpdateRecursive(child));
        }
        setNeedsUpdateRecursive(this.rootNode);
    }

    cameraNode: CanvasWindow | undefined = undefined;
    scheduledCameraNode: CanvasWindow | undefined = undefined;
    installCamera(node: CanvasWindow) {
        if (this.cameraNode === node) return;
        else {
            // if (this.cameraNode) {
            //     this.cameraNode._isPrimaryCamera = false;
            // }
            // this.cameraNode = node;
            this.scheduledCameraNode = node;
            this.scheduleUpdate(this.rootNode);
        };
    }


    private update(updateMapSnapshot: { [key:string] : boolean}) {
        if (this.onUpdateFunction) {
            this.onUpdateFunction();
        }

        if (this.scheduledCameraNode) {
            if (this.cameraNode) {
                this.cameraNode._isPrimaryCamera = false;
            }
            this.cameraNode = this.scheduledCameraNode;
            this.cameraNode._isPrimaryCamera = true;
            this.scheduledCameraNode = undefined;
        }

        const cameraPath = this.findCameraPathRecursive(this.rootNode, {});
        if (!cameraPath) { throw new Error("No camera found in the tree"); }

        const [firstPass,secondPass] = this.factorizeUpdateMap(updateMapSnapshot,cameraPath);

        if (this.DEBUG) {
            console.log(`RENDER STAGE. Updates flags are set for: ${JSON.stringify(Object.keys(updateMapSnapshot),null,2)}.
Will update in the two passes:
First pass: ${JSON.stringify(Object.keys(firstPass),null,2)}
Second pass: ${JSON.stringify(Object.keys(secondPass),null,2)}
            `)
        }

        // find the first window that needs updating
        const findUpdateRootRecursive = (window: CanvasWindow,cameraPass: boolean) : void => {
            // if (!continueSearch) return;
            if (window._needsUpdate) {
                if (cameraPass) window.cameraPassUpdateSelf();
                else window.regularPassUpdateSelf();
                return;
            } else {
                window.children.forEach(child => findUpdateRootRecursive(child,cameraPass));
            }
        };

        this.setNeedsUpdateToMap(firstPass);
        findUpdateRootRecursive(this.rootNode,true);
        this.setNeedsUpdateToMapAdd(secondPass);
        findUpdateRootRecursive(this.rootNode,false);
        this.setNeedsUpdateToMap({});

        if (this.DEBUG) {
            console.log(`RENDER STAGE COMPLETE. The new tree will be displayed below.
Dirty layers are ${JSON.stringify(this.taintedLayers,null,2)}.
            `)
            this.logWindows();
        }

    }

    render() {
        const ctx = this.canvas.getContext('2d');
        if (!ctx) throw new Error("Could not get 2d context from canvas");
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        render(this.cameraSnapshot, this.windows, this.canvas, ctx, this.taintedLayers);
        this.taintedLayers = [];
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

