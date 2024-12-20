
import { LayerType, TextType, Helpers, Animation, AnimatedProperty, ShapeType, Layer, Shape } from "@lottie-animation-community/lottie-types";


class LottieManager {
    animation: Animation;
    constructor({
        width = 512,
        height = 512,
        framesPerSecond = 30,
        startFrame = 0,
        endFrame = 100,
    }) {
        this.animation = {
            nm: "Bouncy Ball",
            v: "5.5.2",
            ip: startFrame,
            op: endFrame,
            w: width,
            h: height,
            fr: framesPerSecond,
            layers: []
        }
    }
    export() {
        const json = JSON.stringify(this.animation);
        console.log(json)
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "animation.json";
        a.click();
    }

    layers: { [key: string]: ShapeLayer } = {};
    addShapeLayer(layer: ShapeLayer) {
        this.animation.layers.push(layer.layer);
        this.layers[layer.name] = layer;
    }
}


class ShapeLayer {
    layer: Layer.Shape;
    name: string;
    constructor({
        name = 'Layer 1',
        startFrame = 0,
        endFrame = 100,
    }) {
        this.name = name;
        this.layer = {
            "ddd": 0,
            "ty": 4,
            "ind": 0,
            "st": 0,
            "ip": startFrame,
            "op": endFrame,
            "nm": name,
            "ks": {
                "a": {
                    "a": 0,
                    "k": [
                        0,
                        0
                    ]
                },
                "p": {
                    "a": 0,
                    "k": [
                        0,
                        0
                    ]
                },
                "s": {
                    "a": 0,
                    "k": [
                        100,
                        100
                    ]
                },
                "r": {
                    "a": 0,
                    "k": 0
                },
                "o": {
                    "a": 0,
                    "k": 100
                }
            },
            shapes: []
        };
    }
    addShape(shape: any) {
        this.layer.shapes.push(shape.shape);
    }
}

class Property<T extends { k: any, a?: number}> {
    property: T;
    constructor({
        value,
        keyframes,
    } : { value: number | number[] | AnimatedProperty.Keyframe[], keyframes?: AnimatedProperty.Keyframe[] }) {
        this.property = {
            a: keyframes? 1 : 0,
            k: keyframes || value
        } as T;
    }

    addKeyframe(time: number, value: number[]) {
        if (this.property.a === 0) {
            this.property.a = 1;
            this.property.k = [];
        }
        (this.property.k as AnimatedProperty.Keyframe[]).push({
            t: time,
            s: value,
            i: {
                x: [1],
                y: [1]
            },
            o: {
                x: [0],
                y: [0]
            },
            h: 0
        })
        this.property.k = (this.property.k as AnimatedProperty.Keyframe[]).sort((a, b) => a.t - b.t);
    }

    getKeyframe(time: number) {
        if (this.property.a === 1) {
            return (this.property.k as AnimatedProperty.Keyframe[]).find(k => k.t === time);
        }
        return undefined;
    }

    getPreviousKeyframe(time: number) {
        if (this.property.a === 1) {
            return (this.property.k as AnimatedProperty.Keyframe[]).findLast(k => k.t < time);
        }
        return undefined;
    }

    getNextKeyframe(time: number) {
        if (this.property.a === 1) {
            return (this.property.k as AnimatedProperty.Keyframe[]).find(k => k.t > time);
        }
        return undefined;
    }
}


class BaseShape {
    shape: Shape.Value;
    constructor() {
        this.shape = undefined as any;
    }
}

class Transform extends BaseShape {
    shape: Shape.Transform;
    position: Property<AnimatedProperty.Position>;
    scale: Property<AnimatedProperty.MultiDimensional>;
    rotation: Property<AnimatedProperty.Value>;
    opacity: Property<AnimatedProperty.Value>;
    constructor({
        x = 0,
        y = 0,
        rotation = 0,
        scaleX = 100,
        scaleY = 100,
    }) {
        super();
        this.position = new Property({ value: [x, y] });
        this.scale = new Property({ value: [scaleX, scaleY] });
        this.rotation = new Property({ value: rotation });
        this.opacity = new Property({ value: 100 });
        this.shape = {
            ty: "tr",
            a: {
                a: 0,
                k: [
                    x,
                    y
                ]
            },
            p: this.position.property,
            s: this.scale.property,
            r: this.rotation.property,
            o: this.opacity.property,
        }
    }
}


class GroupShape extends BaseShape {
    shape: Shape.Group;
    constructor({
        name = 'Group',
    }) {
        super();
        this.shape = {
            ty: "gr",
            nm: name,
            it: []
        }
    }
    addShape(shape: BaseShape) {
        if (!this.shape.it) {
            this.shape.it = [];
        }
        this.shape.it.push(shape.shape);
    }
}

class CircleShape extends BaseShape {
    shape: Shape.Ellipse;
    center: Property<AnimatedProperty.Position>;
    radius: Property<AnimatedProperty.MultiDimensional>;
    constructor({
        x = 0,
        y = 0,
        radiusX = 100,
        radiusY = 100,
    }) {
        super();
        this.center = new Property({ value: [x, y] });
        this.radius = new Property({ value: [radiusX,radiusY] });
        this.shape = {
            ty: "el",
            nm: "Ellipse",
            p: this.center.property,
            s: this.radius.property,
        }
    }
}

class Fill extends BaseShape {
    shape: Shape.Fill;
    color: Property<AnimatedProperty.Color>;
    constructor({
        color = [0, 0, 0],
        opacity = 100,
    } : { color: Helpers.ColorRgba, opacity: number }) {
        super();
        this.color = new Property({ value: color });
        this.shape = {
            ty: "fl",
            nm: "Fill",
            o: {
                "a": 0,
                "k": opacity
            },
            c: this.color.property,
            r: 1
        }
    }
}

class Stroke extends BaseShape {
    shape: Shape.Stroke;
    color: Property<AnimatedProperty.Color>;
    width: Property<AnimatedProperty.Value>;
    constructor({
        color = [0, 0, 0],
        opacity = 100,
        width = 1,
    } : { color: Helpers.ColorRgba, opacity: number, width: number }) {
        super();
        this.color = new Property({ value: color });
        this.width = new Property({ value: width });
        this.shape = {
            ty: "st",
            nm: "Stroke",
            o: {
                "a": 0,
                "k": opacity
            },
            c: this.color.property,
            w: this.width.property,
            lc: 1,
            lj: 1,
            ml: 4
        }
    }
}

class Circle extends GroupShape {
    transform: Transform;
    stroke: Stroke;
    fill: Fill;
    circle: CircleShape;
    constructor() {
        const x = 0;
        const y = 0;
        const radius = 100;
        const color = [0, 0, 0] as Helpers.ColorRgba;
        const strokeColor = [0, 0, 0] as Helpers.ColorRgba;
        const opacity = 100;
        super({});
        this.circle = new CircleShape({ x, y, radiusX : radius, radiusY: radius });
        this.fill = new Fill({ color, opacity });
        this.stroke = new Stroke({ color: strokeColor, opacity, width: 1 });
        this.transform = new Transform({ x, y });
        this.addShape(this.circle);
        this.addShape(this.fill);
        this.addShape(this.stroke);
        this.addShape(this.transform);
    }
}

class Group extends GroupShape {

    transform: Transform;
    constructor() {
        const name = 'Group';
        const x = 0;     
        const y = 0;
        const rotation = 0;
        const scaleX = 100;
        const scaleY = 100;
        super({name});
        this.transform = new Transform({ x, y, rotation, scaleX, scaleY });
    }

    addShape(shape: BaseShape) {
        if (this.shape.it) this.shape.it.pop();
        const oldIt = this.shape.it || [];
        const newIt = [...oldIt, shape.shape, this.transform.shape];
        this.shape.it = newIt;
    }
}





export { LottieManager, ShapeLayer, Circle, Group };

