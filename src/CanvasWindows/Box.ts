import type { Vec2 } from './types';
import { add } from 'mathjs';


class Box {

    _o: Vec2;
    _w: number;
    _h: number;

    constructor(o : Vec2 = [0,0], w : number = 0, h : number = 0) {
        this._o = o;
        this._w = w;
        this._h = h;
    }

    get w() {
        return this._w;
    }

    set w(w: number) {
        this._w = w;
    }

    get h() {
        return this._h;
    }

    set h(h: number) {
        this._h = h;
    }

    get o() {
        return this._o;
    }

    set o(o: Vec2) {
        this._o = o;
    }

    pointInside(v: Vec2) : boolean {
        const { x, y } = { x: v[0], y: v[1] };

        const { oX, oY } = { oX: this.o[0], oY: this.o[1] };

        if (x < oX || x > oX + this.w) return false;
        if (y < oY || y > oY + this.h) return false;
    
        return true;
    }

    clone() : Box {
        return new Box([...this.o], this.w, this.h);
    }


    getBoundingBox(): Vec2[] {
        return [
            this.o,
            add(this.o, [this.w, 0]),
            add(this.o, [this.w, this.h]),
            add(this.o, [0, this.h]),
        ];
    }

    getCenter() : Vec2 {
        return add(this.o, [this.w/2, this.h/2]) as Vec2;
    }
}

export default Box;