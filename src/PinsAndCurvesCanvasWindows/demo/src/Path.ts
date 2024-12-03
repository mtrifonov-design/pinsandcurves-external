
import { PinsAndCurvesProjectController, ProjectDataStructure } from '../../../';
import { loadSVGPath,parseSVGPathToPoints,plotPath , getPointAlongPath} from './handleSvg';
import { SignalWindow, Vec2, Box, RenderProps, CanvasNode } from './Dependencies';


class PathProviderClass extends SignalWindow {
  windowDidMount(props: { [key: string]: any; }): void {
    this.setContext('pathManager',this.props.pm);
  }
  getBox() {
    return new Box([this.props.x,this.props.y],this.props.w,this.props.h);
  }

  getChildren() {
    const w = [];
    w.push(Path.Node({pathManager: this.context.pathManager}));
    w.push(...this.props.getChildren(this.context.pathManager.getPointAlongPath.bind(this.context.pathManager)));
    return w;
  }
}

function PathProvider({x,y,w,h}:{x:number,y:number,w:number,h: number},getChildren: (getPointAlongPath: (progress: number) => Vec2) => CanvasNode[]) {
  const pm = new PathManager();
  return PathProviderClass.Node({getChildren,pm,x,y,w,h});
}

class PathManager {

  attachPointAlongPathFunction(f: (progress: number) => Vec2) {
    this._getPointAlongPath = f;
    return () => {
      this._getPointAlongPath = undefined;
    }
  }
  _getPointAlongPath?: (progress: number) => Vec2;

  getPointAlongPath(progress: number) : Vec2 {
    if (this._getPointAlongPath === undefined) {
      return [0,0];
    }
    return this._getPointAlongPath(progress);
  }
}

class Path extends SignalWindow {

    points?: {x: number, y: number}[];
    unsubscribe?: () => void;
    windowDidMount({pathManager} : {pathManager: PathManager}) {
      async function initSvg() {
        const points = await loadSVGPath('/media/path.svg');
        return points;
      }
      initSvg().then((points) => {
        this.points = points;
      });
      this.unsubscribe = pathManager.attachPointAlongPathFunction(this.pointAtProgress.bind(this));
    }

    windowWillUnmount(): void {
      if (this.unsubscribe !== undefined) {
        this.unsubscribe();
      }
    }

    getBox() {
      const o = [(114 / 384) * 1920,(24.9 / 216) * 1080] as Vec2;
      const w = (183 / 384) * 1920;
      const h = (127.8 / 216) * 1080;
      return new Box(o, w, h);
    }

  
    pointAtProgress(progress: number) {
      if (this.points === undefined) {
        return [0,0] as Vec2;
      }
      const points = this.points;
      const width = this.w;
      const height = this.h;
      // Calculate the bounding box of the path
      const minX = Math.min(...points.map(p => p.x));
      const maxX = Math.max(...points.map(p => p.x));
      const minY = Math.min(...points.map(p => p.y));
      const maxY = Math.max(...points.map(p => p.y));
  
      const originalWidth = maxX - minX;
      const originalHeight = maxY - minY;
  
      // Calculate exact position within the path array
      const scaledIndex = progress * (points.length - 1);
      const index = Math.floor(scaledIndex);
      const nextIndex = Math.min(index + 1, points.length - 1);
      const t = scaledIndex - index; // Interpolation factor between 0 and 1
  
      // Interpolate between points[index] and points[nextIndex]
      const point1 = points[index];
      const point2 = points[nextIndex];
  
      const interpolatedX = point1.x + t * (point2.x - point1.x);
      const interpolatedY = point1.y + t * (point2.y - point1.y);
  
      // Normalize and map the interpolated point to the specified bounding box
      const normalizedX = (interpolatedX - minX) / originalWidth;
      const normalizedY = (interpolatedY - minY) / originalHeight;
  
      const mappedX = normalizedX * width;
      const mappedY = normalizedY * height;

      const [ox,oy] = this.o;
  
      return [ox + mappedX,oy+ mappedY] as Vec2; 
    }
    get pathLoaded() {
      return this.points !== undefined;
    }

  }
  

  export default PathProvider;

