import { CanvasWindow } from "../CanvasWindows";


class MountWindow extends CanvasWindow {
    windowDidMount(props: { [key: string]: any; }): void {
        this.props.onMount();
    }
}

function Mount(onMount: () => void) {
    return MountWindow.Node({onMount});
}

export default Mount;