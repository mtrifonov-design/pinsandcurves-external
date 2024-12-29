
/**
 * Adds crosshair circles to the root SVG for elements with specified anchor attributes,
 * relative to the transformed bounding box center, and listens for attribute changes.
 * @param {SVGSVGElement} svgRoot - The root SVG element where crosshairs will be added.
 */
function addCrosshairs(svgRoot: SVGSVGElement): void {
    if (!(svgRoot instanceof SVGSVGElement)) {
        console.error("Provided node is not an SVG root element.");
        return;
    }

    const parseAnchorValue = (value: string | null, defaultValue: number): [number, "px" | "%"] => {
        if (!value) return [defaultValue, "px"];
        if (value.endsWith("%")) {
            value = value.slice(0, -1); // Remove the "%" suffix
            return [parseFloat(value) / 100, "%"]; // Percentages are normalized
        } else if (value.endsWith("px")) {
            value = value.slice(0, -2); // Remove the "px" suffix
            return [parseFloat(value), "px"];
        }
        return [parseFloat(value) || defaultValue, "px"];
    };

    const calculateAnchorPosition = (element: SVGElement): { x: number; y: number } | null => {
        const bbox = (element as any).getBBox();
        const ctm = (element as any).getCTM();

        if (!ctm) {
            console.error("Could not get the CTM for the element.");
            return null;
        }

        // Create a point at the bounding box center
        const centerPoint = svgRoot.createSVGPoint();
        centerPoint.x = bbox.x + bbox.width / 2;
        centerPoint.y = bbox.y + bbox.height / 2;

        // Transform the center to the global coordinate system
        const transformedCenter = centerPoint.matrixTransform(ctm);

        // Parse the anchor offsets (data-anchorX and data-anchorY)
        const [anchorXValue,typeX] = parseAnchorValue(element.getAttribute("data-anchor-x"), 0);
        const [anchorYValue,typeY] = parseAnchorValue(element.getAttribute("data-anchor-y"), 0);

        // Handle percentages as relative to bounding box dimensions
        const xOffset = typeX === "%" ? anchorXValue * bbox.width : anchorXValue;
        const yOffset = typeY === "%" ? anchorYValue * bbox.height : anchorYValue;

        // Add the offsets to the transformed center
        return {
            x: centerPoint.x + xOffset,
            y: centerPoint.y + yOffset,
        };
    };

    const createCrosshair = (id: string, x: number, y: number): SVGElement => {
        const crosshairGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        crosshairGroup.setAttribute("class", "crosshair");
        crosshairGroup.setAttribute("data-for", id);
        crosshairGroup.style.transform = (document.querySelector(`#${id}`) as HTMLElement).style.transform || "";

        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", x.toString());
        circle.setAttribute("cy", y.toString());
        circle.setAttribute("r", "5");
        circle.setAttribute("stroke", "black");
        circle.setAttribute("stroke-width", "1");
        circle.setAttribute("fill", "none");

        const hLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        hLine.setAttribute("x1", (x - 10).toString());
        hLine.setAttribute("x2", (x + 10).toString());
        hLine.setAttribute("y1", y.toString());
        hLine.setAttribute("y2", y.toString());
        hLine.setAttribute("stroke", "black");
        hLine.setAttribute("stroke-width", "1");

        const vLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        vLine.setAttribute("x1", x.toString());
        vLine.setAttribute("x2", x.toString());
        vLine.setAttribute("y1", (y - 10).toString());
        vLine.setAttribute("y2", (y + 10).toString());
        vLine.setAttribute("stroke", "black");
        vLine.setAttribute("stroke-width", "1");

        crosshairGroup.appendChild(circle);
        crosshairGroup.appendChild(hLine);
        crosshairGroup.appendChild(vLine);

        return crosshairGroup;
    };

    const updateCrosshair = (element: SVGElement, crosshair: SVGElement) => {
        const position = calculateAnchorPosition(element);
        if (!position) return;

        crosshair.style.transform = element.style.transform || "";

        crosshair.querySelector("circle")?.setAttribute("cx", position.x.toString());
        crosshair.querySelector("circle")?.setAttribute("cy", position.y.toString());
        crosshair.querySelectorAll("line").forEach((line) => {
            if (line.getAttribute("x1") === line.getAttribute("x2")) {
                // Vertical line
                line.setAttribute("x1", position.x.toString());
                line.setAttribute("x2", position.x.toString());
                line.setAttribute("y1", (position.y - 10).toString());
                line.setAttribute("y2", (position.y + 10).toString());
            } else {
                // Horizontal line
                line.setAttribute("x1", (position.x - 10).toString());
                line.setAttribute("x2", (position.x + 10).toString());
                line.setAttribute("y1", position.y.toString());
                line.setAttribute("y2", position.y.toString());
            }
        });
    };

    const addMutationObserver = (element: SVGElement, crosshair: SVGElement) => {
        const observer = new MutationObserver(() => {
            updateCrosshair(element, crosshair);
        });

        observer.observe(element, {
            attributes: true,
            attributeFilter: ["data-anchor-x", "data-anchor-y"],
        });
    };

    const traverseAndAddCrosshairs = (node: SVGElement, first : boolean = false) => {
        if (node.id && !first) {
            const position = calculateAnchorPosition(node);
            if (position) {
                const crosshair = createCrosshair(node.id, position.x, position.y);
                svgRoot.appendChild(crosshair);
                addMutationObserver(node, crosshair);
            }
        }

        // Recursively traverse child elements
        Array.from(node.children).forEach((child) => {
            if (child instanceof SVGElement) {
                traverseAndAddCrosshairs(child);
            }
        });
    };

    traverseAndAddCrosshairs(svgRoot, true);
}

function anchorCheckbox() {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = "anchor-checkbox";
    checkbox.checked = true;
    checkbox.style.zIndex = "1000";
    checkbox.style.cursor = "pointer";
    checkbox.style.transform = "scale(1.5)";
    checkbox.style.transformOrigin = "left";
    
    const label = document.createElement("label");
    label.style.fontSize = "12px";
    label.style.fontFamily = "Arial, sans-serif";
    label.htmlFor = "anchor-checkbox";
    label.textContent = "Anchors";
    label.style.fontSize = "14px";
    label.style.marginLeft = "10px";
    label.style.userSelect = "none";

    const box = document.createElement("div");
    box.style.display = "flex";
    box.style.alignItems = "center";
    box.style.zIndex = "1000";
    box.appendChild(checkbox);
    box.appendChild(label);


    checkbox.addEventListener("change", () => {
        const crosshairs = document.querySelectorAll(".crosshair");
        crosshairs.forEach((crosshair) => {
            (crosshair as HTMLElement).style.display = checkbox.checked ? "block" : "none";
        });
    });
    return box;
}

export { anchorCheckbox };

export default addCrosshairs;