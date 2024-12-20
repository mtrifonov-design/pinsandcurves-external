
import { Circle, LottieManager, Group, ShapeLayer } from './lottieManager';
import convertElementToLottie from './convertSVGElementToLottie';
import { parseColor, parseMatrix, parsePixelValue } from './parseFromStrings';
import type { Transformation } from './types';
import cleanUpSignal from './cleanUpSignal';
import openLottieViewerInNewTab from './openLottieViewerInNewTab';


class SVGtoLottie {
    framesPerSecond: number;
    startFrame: number;
    endFrame: number;
    applySignals: (frame?: number) => void;
    constructor({
        applySignals,
        framesPerSecond,
        startFrame,
        endFrame,
    }: {applySignals: (frame?: number) => void,
        framesPerSecond: number,
        startFrame: number,
        endFrame: number,
    }) {
        this.startFrame = startFrame;
        this.endFrame = endFrame;
        this.framesPerSecond = framesPerSecond;
        this.applySignals = applySignals;
    }
    sceneElements : {
        element: HTMLElement,
        computedStyle: CSSStyleDeclaration,
        lottieElement: any,
        transformation: Transformation,
    }[] = [];
    captureScene(shapeLayer: ShapeLayer) {
        const svgcanvas = document.getElementById('svgcanvas') as HTMLElement;
        // recursively capture all elements in the scene
        if (svgcanvas.children) {
            for (let i = 0; i < svgcanvas.children.length; i++) {
                this.captureElement(svgcanvas.children[i] as HTMLElement, shapeLayer);
            }
        }
    }
    captureElement(element: HTMLElement, shapeLayer?: ShapeLayer) {
        const captureTagNames = ['rect', 'ellipse', 'g', 'circle'];
        // if element is a group, capture
        const tag = element.tagName.toLowerCase();
        if (captureTagNames.includes(tag)) {
            const computedStyle = window.getComputedStyle(element);
            //console.log(computedStyle)

            const [lottieElement,transformation] = convertElementToLottie[tag](element);
            // if element has children, capture
            if (tag === "g" && element.children) {
                for (let i = 0; i < element.children.length; i++) {
                    const child = this.captureElement(element.children[i] as HTMLElement, undefined);
                    lottieElement.addShape(child);
                }
            }
            if (shapeLayer) {
                shapeLayer.addShape(lottieElement);
            }
            this.sceneElements.push({element,computedStyle,transformation,lottieElement});
            return lottieElement;
        }
    }

    _animation: Animation | null = null;
    convertSceneToLottie() {
        const svgcanvas = document.getElementById('svgcanvas') as HTMLElement;
        const width = parseInt(svgcanvas.getAttribute('width') || '0');
        const height = parseInt(svgcanvas.getAttribute('height') || '0');
        const fps = this.framesPerSecond;

        const animation = new LottieManager({
            width,
            height,
            framesPerSecond: fps,
            startFrame: 0,
            endFrame: this.endFrame,
        });
        const shapeLayer = new ShapeLayer({
            name: 'Layer 1',
            startFrame: this.startFrame,
            endFrame: this.endFrame,
        })

        this.captureScene(shapeLayer);
        animation.addShapeLayer(shapeLayer)

        this.captureFrames();
        console.log(this.sceneElements)
        
        console.log(animation.animation)
        //console.log(JSON.stringify(animation.animation, null, 2))
        // console.log(JSON.stringify(animation))
        openLottieViewerInNewTab(animation.animation);
    }


    captureFrames() {
        for (let i = 0; i < this.sceneElements.length; i++) {
            for (let frame = this.startFrame; frame < this.endFrame; frame++) {
                this.captureFrame(i,frame)
            }
        }
        for (let i = 0; i < this.sceneElements.length; i++) {
            this.cleanUpTransformations(i);
        }
        for (let i = 0; i < this.sceneElements.length; i++) {
            this.applyTransformationsToLottieElements(i);
        }
    }


    interpolateSignalAtPoint(signal: [number, number][], frame: number) {
        const [frame1, value1] = signal.findLast(([currentFrame]) => currentFrame <= frame) || [0,0];
        const [frame2, value2] = signal.find(([currentFrame]) => currentFrame >= frame) || [0,0];
        if (frame1 === frame2) {
            return value1;
        }
        const t = (frame - frame1) / (frame2 - frame1);
        return value1 + (value2 - value1) * t;
    }

    zipSignals(signals: [number, number][][]) {
        const dimension = signals.length;
        const zippedSignals : number[][] = [];
        for (let i = 0; i < dimension; i++) {
            const signal = signals[i];
            for (let j = 0; j < signal.length; j++) {
                const frame = signal[j][0];
                const pointExists = zippedSignals.find(([currentFrame]) => currentFrame === frame);
                if (pointExists) {
                    continue;
                } else {
                    const newPoint = Array(dimension+1).fill(0);
                    newPoint[0] = frame;
                    for (let k = 0; k < dimension; k++) {
                        const value = this.interpolateSignalAtPoint(signals[k],frame);
                        newPoint[k+1] = value
                    }
                    zippedSignals.push(newPoint);
                }
            }
        }
        return zippedSignals;
        
    }

    cleanUpTransformations(elementIndex: number) {
        const { transformation } = this.sceneElements[elementIndex];

        const keys = Object.keys(transformation);
        for (let key of keys) {
            if (transformation[key as keyof Transformation]) {
                transformation[key as keyof Transformation] = cleanUpSignal(transformation[key as keyof Transformation] as [number, number][]);
            }
        }
    }

    applyTransformationsToLottieElements(elementIndex: number) {
        const { lottieElement, transformation } = this.sceneElements[elementIndex];
        const { x, y, rotation, scaleX, scaleY, fillR, fillG, fillB, strokeR, strokeG, strokeB, opacity,
            centerX, centerY, radiusX, radiusY, strokeWidth, startX, startY
        } = transformation;
        console.log(transformation)

        if (centerX && centerY) {
            const center = this.zipSignals([centerX,centerY]);
            center.forEach(([frame,centerX,centerY]) => {
                lottieElement.circle.center.addKeyframe(frame, [centerX,centerY]);
            });
        }

        if (radiusX && radiusY) {
            const radius = this.zipSignals([radiusX,radiusY]);
            radius.forEach(([frame,radiusX,radiusY]) => {
                lottieElement.circle.radius.addKeyframe(frame, [radiusX,radiusY]);
            });
        }

        if (strokeWidth) {
            strokeWidth.forEach(([frame,strokeWidth]) => {
                lottieElement.stroke.width.addKeyframe(frame, strokeWidth);
            });
        }

        if (x && y) {
            const position = this.zipSignals([x,y]);
            position.forEach(([frame,x,y]) => {
                lottieElement.transform.position.addKeyframe(frame, [x,y]);
            });
        }
        if (scaleX && scaleY) {
            const scale = this.zipSignals([scaleX,scaleY]);
            scale.forEach(([frame,scaleX,scaleY]) => {
                lottieElement.transform.scale.addKeyframe(frame, [scaleX,scaleY]);
            });
        }
        if (rotation) {
            rotation.forEach(([frame,rotation]) => {
                lottieElement.transform.rotation.addKeyframe(frame, rotation);
            });
        }
        if (fillR && fillG && fillB) {
            const fill = this.zipSignals([fillR,fillG,fillB]);
            fill.forEach(([frame,fillR,fillG,fillB]) => {
                lottieElement.fill.color.addKeyframe(frame, [fillR,fillG,fillB]);
            });
        }
        if (strokeR && strokeG && strokeB) {
            const stroke = this.zipSignals([strokeR,strokeG,strokeB]);
            stroke.forEach(([frame,strokeR,strokeG,strokeB]) => {
                lottieElement.stroke.color.addKeyframe(frame, [strokeR,strokeG,strokeB]);
            });
        }
        if (opacity) {
            opacity.forEach(([frame,opacity]) => {
                lottieElement.transform.opacity.addKeyframe(frame, opacity);
            });
        }
    }


    captureFrame(elementIndex: number, frame: number) {
        this.applySignals(frame);
        const { computedStyle, transformation } = this.sceneElements[elementIndex];
        const transform = computedStyle.transform;

        let x, y, rotation, scaleX, scaleY;
        if (transform === 'none') {
            x = 0;
            y = 0;
            rotation = 0;
            scaleX = 100;
            scaleY = 100;
        } else {
            const values = parseMatrix(transform);
            const [a, b, c, d, e, f] = values;
            x = e;
            y = f;
            rotation = Math.atan2(b, a);
            scaleX = Math.sqrt(a * a + b * b) * 100;
            scaleY = Math.sqrt(c * c + d * d) * 100;
        }

        const fill = computedStyle.fill;
        const stroke = computedStyle.stroke;

        let fillR,fillG,fillB;
        if (fill === 'none') {
            fillR=0;
            fillG=0;
            fillB=0;
        } else {
            let rgb = parseColor(fill);
            fillR = rgb[0] / 255;
            fillG = rgb[1] / 255;
            fillB = rgb[2] / 255;
        }

        let strokeR,strokeG,strokeB;
        if (stroke === 'none') {
            strokeR=0;
            strokeG=0;
            strokeB=0;
        } else {
            let rgb = parseColor(stroke);
            strokeR = rgb[0] / 255;
            strokeG = rgb[1] / 255;
            strokeB = rgb[2] / 255;
        }

        const opacity = parseFloat(computedStyle.opacity) * 100;

        if (transformation.opacity) transformation.opacity.push([frame,opacity]);

        const cx = (computedStyle as any).cx;
        const centerX = cx ? parsePixelValue(cx) : 0;

        const cy = (computedStyle as any).cy;
        const centerY = cy ? parsePixelValue(cy) : 0;

        const r = (computedStyle as any).r;
        const radius = r ? parsePixelValue(r) : 0;

        const rx = (computedStyle as any).rx;
        let radiusX = rx ? parsePixelValue(rx) : 0;

        const ry = (computedStyle as any).ry;
        let radiusY = ry ? parsePixelValue(ry) : 0;

        if (rx === "auto" || ry === "auto") {
            radiusX = radius;
            radiusY = radius;
        }

        const sw = (computedStyle as any).strokeWidth;
        const strokeWidth = sw ? parsePixelValue(sw) : 0;

        const sx = (computedStyle as any).x;
        const startX = sx ? parsePixelValue(sx) : 0;

        const sy = (computedStyle as any).y;
        const startY = sy ? parsePixelValue(sy) : 0;


        if (transformation.centerX) transformation.centerX.push([frame,centerX]);
        if (transformation.centerY) transformation.centerY.push([frame,centerY]);
        if (transformation.radiusX) transformation.radiusX.push([frame,radiusX]);
        if (transformation.radiusY) transformation.radiusY.push([frame,radiusY]);
        if (transformation.strokeWidth) transformation.strokeWidth.push([frame,strokeWidth]);
        if (transformation.startX) transformation.startX.push([frame,startX]);
        if (transformation.startY) transformation.startY.push([frame,startY]);

        if (transformation.fillR) transformation.fillR.push([frame,fillR]);
        if (transformation.fillG) transformation.fillG.push([frame,fillG]);
        if (transformation.fillB) transformation.fillB.push([frame,fillB]);
        if (transformation.strokeR) transformation.strokeR.push([frame,strokeR]);
        if (transformation.strokeG) transformation.strokeG.push([frame,strokeG]);
        if (transformation.strokeB) transformation.strokeB.push([frame,strokeB]);

        if (transformation.x) transformation.x.push([frame,x]);
        if (transformation.y) transformation.y.push([frame,y]);
        if (transformation.rotation) transformation.rotation.push([frame,rotation]);
        if (transformation.scaleX) transformation.scaleX.push([frame,scaleX]);
        if (transformation.scaleY) transformation.scaleY.push([frame,scaleY]);
    }
}






export default SVGtoLottie;