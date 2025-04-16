import PinsAndCurvesHost from "../../PinsAndCurvesClient";
import { debounce } from "./utils";
import DocumentManager from "./DocumentManager";

function init() {
    let host: PinsAndCurvesHost;
    const persistence = true;
    const config = {
        framesPerSecond: 30,
        numberOfFrames: 500,    
    }
    if (persistence) {
        const json = localStorage.getItem('pac');
        if (json) {
            const serialized = JSON.parse(json).project;
            host = PinsAndCurvesHost.FromSerialized(serialized, config) as PinsAndCurvesHost;
            host.onUpdate(debounce(() => {
                localStorage.setItem('pac', JSON.stringify({project:host.serialize()}));
            }, 1000));
        } else {
            host = PinsAndCurvesHost.NewProject(config) as PinsAndCurvesHost;
            host.onUpdate(debounce(() => {
                localStorage.setItem('pac', JSON.stringify({project:host.serialize()}));
            }, 1000));
        }
    } else {
        host = PinsAndCurvesHost.NewProject(config) as PinsAndCurvesHost;
    }

    fetch("scene.pinsandcurves.xml").then(response => {
        return response.text();
    }).then(xml => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xml, "text/xml");
        
        // Get the root <pins-and-curves> element
        const pinsAndCurvesDoc = xmlDoc.getElementsByTagName("pins-and-curves")[0];
        const extensions = pinsAndCurvesDoc.getElementsByTagName("extension")[0];


        const defaultExtensions = [];

        const circle = xmlDoc.createElement("extension");
        circle.setAttribute("src", "./defaultExtensions/circle.js");
        defaultExtensions.push(circle);
    
        const scene = xmlDoc.createElement("extension");
        scene.setAttribute("src", "./defaultExtensions/scene.js");
        defaultExtensions.push(scene);

        for (let i = 0; i < defaultExtensions.length; i++) {
            extensions.insertBefore(defaultExtensions[i], extensions.firstChild);
        };
    
        // Pass the modified document to your DocumentManager
        const docManager = new DocumentManager(pinsAndCurvesDoc, host);

        applyStyles();
    
    });
    


}

function applyStyles() {

    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';
    document.body.style.width = '100vw';
    document.body.style.display = 'flex';
    document.body.style.borderTop = '1px solid #59646E';
    document.body.style.justifyContent = 'center';
    document.body.style.backgroundColor = "#1D2126"



}

export default init;