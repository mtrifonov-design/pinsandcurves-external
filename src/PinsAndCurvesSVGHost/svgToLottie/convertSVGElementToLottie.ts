
import { Circle, LottieManager, Group, ShapeLayer } from './lottieManager';
import type { Transformation } from './types';

const convertElementToLottie : { [key:string] : Function }= {
    "rect": (element: HTMLElement) => {},
    "ellipse": (element: HTMLElement) => {
        const circle = new Circle()
        const transformation = {
            x: [],
            y: [],
            rotation: [],
            scaleX: [],
            scaleY: [],
            opacity: [],
            fillR: [],
            fillG: [],
            fillB: [],
            strokeR: [],
            strokeG: [],
            strokeB: [],

            centerX: [],
            centerY: [],
            radiusX: [],
            radiusY: [],
            strokeWidth: [],
        }
        return [circle,transformation];
    },
    "circle": (element: HTMLElement) => {
        const circle = new Circle()
        const transformation = {
            x: [],
            y: [],
            rotation: [],
            scaleX: [],
            scaleY: [],
            opacity: [],
            fillR: [],
            fillG: [],
            fillB: [],
            strokeR: [],
            strokeG: [],
            strokeB: [],

            centerX: [],
            centerY: [],
            radiusX: [],
            radiusY: [],
            strokeWidth: [],
        }
        return [circle,transformation];
    },
    "g": (element: HTMLElement) => {
        const group = new Group()
        const transformation = {
            x: [],
            y: [],
            rotation: [],
            opacity: [],
            scaleX: [],
            scaleY: [],
        }
        return [group,transformation];
    },
}

export default convertElementToLottie;