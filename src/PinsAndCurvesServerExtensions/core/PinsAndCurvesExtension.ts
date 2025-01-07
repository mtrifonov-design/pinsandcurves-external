class PinsAndCurvesExtension extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        const src = this.getAttribute('src');
        if (src) {
            const script = document.createElement('script');
            script.src = src;
            this.appendChild(script);
        }
        // if the custom element has a child script tag, execute it
        const script = this.querySelector('script');
        if (script) {
            const scriptText = script.textContent;
            if (scriptText) {
                // eslint-disable-next-line no-eval
                eval(scriptText);
            }
        }
    }
}

export default PinsAndCurvesExtension;