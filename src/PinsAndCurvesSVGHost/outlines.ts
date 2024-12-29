/**
 * Adds hover outline effects to SVG nodes with IDs.
 * @param {SVGElement} svgNode - The root SVG element.
 */
function addHoverOutline(svgNode : HTMLElement) {
    if (!(svgNode instanceof SVGElement)) {
        console.error("Provided node is not an SVG element.");
        return;
    }
        // Create a tooltip element
        const tooltip = document.createElement("div");
        tooltip.style.position = "absolute";
        tooltip.style.background = "rgba(0, 0, 0, 0.8)";
        tooltip.style.color = "white";
        tooltip.style.padding = "4px 8px";
        tooltip.style.borderRadius = "4px";
        tooltip.style.fontSize = "14px";
        tooltip.style.fontFamily = "monospace";
        tooltip.style.pointerEvents = "none";
        tooltip.style.display = "none";
        tooltip.style.zIndex = "1000";
        document.body.appendChild(tooltip);

        const addHoverEffect = (element : HTMLElement) => {
            element.addEventListener("mouseenter", (event) => {

                    element.style.outline = "2px solid red";
                    tooltip.textContent = element.id;
                    tooltip.style.display = "block";

            });
        
            element.addEventListener("mousemove", (event) => {
                if (tooltip.style.display === "block") {
                    tooltip.style.left = `${event.pageX + 10}px`;
                    tooltip.style.top = `${event.pageY + 10}px`;
                }
            });
        
            element.addEventListener("mouseleave", (event) => {
                element.style.outline = "";
                tooltip.style.display = "none";
            });
        };
        

    // Traverse through all child elements
    const traverse = (node : HTMLElement, first : boolean = false) => {
        if (node.id && !first) {
            addHoverEffect(node);
        }

        if (!node.children) {
            return;
        }
        for (const child of node.children) {
            traverse(child as HTMLElement);
        }
    };

    traverse(svgNode, true);
}

export default addHoverOutline;