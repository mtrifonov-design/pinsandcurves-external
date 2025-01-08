
import PinsAndCurvesHost from "../../PinsAndCurvesHost";
import renderAsImageSequence from "./RenderAsImageSequence";

type Builder = (virtualElement: Element, renderedChild: Element) => Element;
type Updater = (virtualElement: Element) => void;
type UIBuilder = () => HTMLElement;



type Builders = {
    [key: string]: Builder[];
}

type Updaters = {
    [key: string]: Updater[];
}

type UIBuilders = UIBuilder[];

class DocumentManager {

    virtualRoot: Element;
    renderRoot: SVGSVGElement;
    host: PinsAndCurvesHost;
    extensions: Element[];
    builders : Builders = {};
    uiBuilders: UIBuilders = [];

    updaters: Updaters = {};
    initCompleted = false;
    constructor(doc: Element, host: PinsAndCurvesHost) {
        this.host = host;
        this.virtualRoot = doc.querySelector('scene') as Element;
        this.renderRoot = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    
        this.extensions = Array.from(doc.querySelectorAll('extension'));
        this.initPipeline();
        this.host.onUpdate(() => {
            if (this.initCompleted) {
                this.update();
            }
        });
    }


    async initPipeline() {
        await this.initExtensions(this.extensions);
        this.build();
        this.buildUi();
        this.applySignals();
        console.log(this.host)
        this.update();


        this.renderRoot.id = 'pac-root';
        this.renderRoot.style.height = '100%';
        this.renderRoot.style.overflow = 'hidden';
        this.renderRoot.style.background = 'gray';
        this.renderRoot.style.zIndex = '-1';
        document.body.appendChild(this.renderRoot);
        this.initCompleted = true;
    };

    async initExtensions(extensions: Element[]) {
        await Promise.all(extensions.map(async (extension) => {
            const src = extension.getAttribute('src');
            let extensionScript;
            if (src) {
                extensionScript = await import(src);
            }
            const builder = extensionScript ? (extensionScript as any).builder : undefined;
            const updater = extensionScript ? (extensionScript as any).updater : undefined;
            const uiBuilder = extensionScript ? (extensionScript as any).uiBuilder : undefined;
            if (uiBuilder) {
                this.uiBuilders.push(uiBuilder);
            }

            const tagNames = extensionScript ? (extensionScript as any).tagNames : [];

            tagNames.forEach((tagName : string) => {
                if (builder) {
                    if (!this.builders[tagName]) {
                        this.builders[tagName] = [];
                    }
                    this.builders[tagName].push(builder);
                }
                if (updater) {
                    if (!this.updaters[tagName]) {
                        this.updaters[tagName] = [];
                    }
                    this.updaters[tagName].push(updater);
                }
            });
        }));
    }

    buildUi() {
        const uiLayer = document.createElement('div');
        uiLayer.style.position = 'absolute';
        uiLayer.style.zIndex = '100';
        uiLayer.style.width = '100%';
        uiLayer.style.height = '100%';
        uiLayer.style.left = '0';
        uiLayer.style.top = '0';


        this.uiBuilders.forEach((uiBuilder) => {
            uiLayer.appendChild(uiBuilder());
        });
        document.body.appendChild(uiLayer);

        const renderButton = document.createElement('button');
        renderButton.textContent = 'Render';
        renderButton.style.position = 'absolute';
        renderButton.style.bottom = '0';
        renderButton.style.right = '0';
        renderButton.style.zIndex = '100';
        renderButton.onclick = () => {
            this.exportAsFrames();
        };
        uiLayer.appendChild(renderButton);

    }

    traverseBuildRecursive(virtualElement: Element) : Element {
        const renderedChildren = Array.from(virtualElement.children).map(this.traverseBuildRecursive.bind(this));
        console.log(virtualElement.tagName,this.builders, renderedChildren);
        let builder = this.builders[virtualElement.tagName];
        if (!builder) {
            throw new Error(`No builder found for tag ${virtualElement.tagName}`);
        }
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        renderedChildren.forEach((child) => {
            g.appendChild(child);
        });
        const builders = this.builders[virtualElement.tagName];
        if (builders) {
        return builders.reduce((acc : Element, builder) => {
            return builder(virtualElement, acc);
        }, g);
        } else return g;
    }
    build() {
        this.renderRoot = this.traverseBuildRecursive(this.virtualRoot) as SVGSVGElement;
    }


    traverseUpdateRecursive(virtualElement: Element) {
        const updaters = this.updaters[virtualElement.tagName];
        if (updaters) {
            updaters.forEach(updater =>
                updater(virtualElement)
            );
        }

        const virtualChildren = Array.from(virtualElement.children);
        for (let i = 0; i < virtualChildren.length; i++) {
            this.traverseUpdateRecursive(virtualChildren[i]);
        }
    }

    update(frame ?: number) {
        this.applySignals(frame);
        this.traverseUpdateRecursive(this.virtualRoot);
    }


    mode = "view";
    applySignals(frame? : number) {
        const host = this.host;
        const controller = host.c;
        const project = controller.getProject();
        const signalIds = project.orgData.signalIds;
        const currentFrame = project.timelineData.playheadPosition;
        const relativeTime = (frame || currentFrame) / project.timelineData.numberOfFrames;
    
        for (const signalId of signalIds) {
            const signalName = project.orgData.signalNames[signalId];
            const isExportSignal = signalName.startsWith('@') || signalName.startsWith('#');
            if (!isExportSignal) {
                continue;
            }
            const type = signalName.startsWith('@') ? 'idSelector' : 'classSelector';

            // now, assume the signal is structured as follows @ | #[name].[property]
            // extract the name and property
            const parts = signalName.split('.');
            if (parts.length < 2) {
                continue;
            };
            const name = parts[0].slice(1, parts[0].length);
            const property = parts.slice(1).join('.');
            
            const value = host.signal(signalName, frame || currentFrame);
            let elements = [];
            if (type === 'idSelector') {
                const element = this.virtualRoot.querySelector(`#${name}`);
                if (element) elements.push(element);
            } else {
                elements = Array.from(this.virtualRoot.querySelectorAll(`.${name}`));
            }
            elements.forEach((element) => {
                element.setAttribute(property, String(value));
            });
        }
        // now select all elements and apply teh frame
        const elements = Array.from(this.virtualRoot.querySelectorAll('*'));
        elements.forEach((element) => {
            element.setAttribute('frame', String(frame || currentFrame));
            element.setAttribute('relative-time', String(relativeTime));
            element.setAttribute('mode',this.mode);
        });
    }

    exportAsFrames() {
        const focusRange = this.host.c.getProject().timelineData.focusRange;
        const [startFrame, endFrame] = focusRange;
        const fps = this.host.c.getProject().timelineData.framesPerSecond;
        renderAsImageSequence({
            applySignals: this.update.bind(this),
            startFrame,
            endFrame,
            framesPerSecond: fps,
        })
    }


}

export default DocumentManager;