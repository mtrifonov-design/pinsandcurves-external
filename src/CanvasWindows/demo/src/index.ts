import CanvasRoot from "../../Root";
import { CanvasWindow, MouseHandlerProps, RenderProps } from "../../CanvasWindow";
import Box from "../../Box";
import InteractiveCamera from "./Camera";
import { add, dotMultiply } from "mathjs";

const canvas = document.getElementById("demo-canvas") as HTMLCanvasElement;

class RootWindow extends CanvasWindow {
    getChildren()  {
        const w1 = ExampleWindow.Node({specialWindow: true});
        const w2 = ExampleWindow.Node({specialWindow: false});
        const w3 = ExampleWindow.Node({specialWindow: true});
        const w4 = InteractiveCamera.Node();
        return [w1,w2,w3,w4];
    }
    windowDidUpdate(props: { [key: string]: any; }): void {
        console.log(this.key, "updated",props);
    }

    onMouseMove() {
        // console.log("Mouse moved over",this.key);
    }

    getBox() {
        return new Box([50, 50], canvas.width, canvas.height);
    }

    render(r: RenderProps) {
        this.strokeOutline(r,"red");
    }
}
// Create a root window
const rootWindow = RootWindow.Node();
// rootWindow.setAsPrimaryCamera();

// Initialize the CanvasRoot
const canvasRoot = new CanvasRoot(rootWindow, canvas);
(window as any).canvasRoot = canvasRoot;

// Example rendering logic
class ExampleWindow extends CanvasWindow {

    windowDidMount() {
        console.log(this.key, "mounted")
    }



    getChildren() {
        console.log(this.props)
        if (this.props.specialWindow) {
            return [SpecialWindow.Node()];
        }
        return [];
    }

    getBox() {
        return new Box([0,0],100,100);
    }

    render(r : any) {
        this.strokeOutline(r,"blue");
    }
}

class SpecialWindow extends CanvasWindow {
    getBox() {
        return new Box([0,0],50,50);
    }

    state = 0;
    windowDidUpdate(props: { [key: string]: any; }): void {
        // console.log("SpecialWindow updated",this.state);
        // if (this.state % 2 !== 0) {
        //     this.setState(this.state + 1);
        // }
    }

    render(r : any) {
        this.strokeOutline(r,"green");
    }

    onClick(h: MouseHandlerProps) {
        // this.setState(this.state +1 );
        // console.log(h.absoluteUnit, this.absoluteUnit)
        

        const simulated = add(this.canvasO, dotMultiply(this.canvasUnit, h.canvasPos));
        // console.log(this.canvasUnit,p.canvasUnit)
        console.log('absolutePos', h.absolutePos,simulated);
        // console.log('canvasUnit', h.canvasUnit,this.canvasUnit)
        // console.log('canvasO',h.canvasO,this.canvasO)
        console.assert(h.canvasUnit[0] === this.canvasUnit[0] && h.canvasUnit[1] === this.canvasUnit[1]);
        console.assert(h.canvasO[0] === this.canvasO[0] && h.canvasO[1] === this.canvasO[1]);
    }
}


canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    canvasRoot.clickHandler([x,y],e);
});

canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    canvasRoot.mouseMoveHandler([x,y],e);
});

canvas.addEventListener("mousedown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    canvasRoot.mouseDownHandler([x,y],e);
});

canvas.addEventListener("mouseup", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    canvasRoot.mouseUpHandler([x,y],e);
});

canvas.addEventListener("wheel", (e) => {
    canvasRoot.mouseWheelHandler(e);
})


const f = () => {
    canvasRoot.onAnimationFrame();
    window.requestAnimationFrame(f);
}

f();



// canvasRoot.render();
// canvasRoot.logWindows();
