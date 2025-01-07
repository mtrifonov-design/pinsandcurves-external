
function parseNumberAttribute(virtualElement, attributeName) {
    const attribute = virtualElement.getAttribute(attributeName);
    if (attribute) {
        const float = parseFloat(attribute);
        if (!isNaN(float)) {
            return float;
        }
    }
    return undefined;
}

function parseDefaultTransform(virtualElement) {

    const x = parseNumberAttribute(virtualElement, "x") || 0;
    const y = parseNumberAttribute(virtualElement, "y") || 0;
    const anchorX = parseNumberAttribute(virtualElement, "anchorX") || 0;
    const anchorY = parseNumberAttribute(virtualElement, "anchorY") || 0;
    const rotation = parseNumberAttribute(virtualElement, "rotation") || 0;
    const scale = parseNumberAttribute(virtualElement, "scale") || 1;
    const scaleX = parseNumberAttribute(virtualElement, "scaleX") || scale;
    const scaleY = parseNumberAttribute(virtualElement, "scaleY") || scale;
    const skewX = parseNumberAttribute(virtualElement, "skewX") || 0;
    const skewY = parseNumberAttribute(virtualElement, "skewY") || 0;
    const transform = {
        x: x,
        y: y,
        anchorX: anchorX,
        anchorY: anchorY,
        rotation: rotation,
        scaleX: scaleX,
        scaleY: scaleY,
        skewX: skewX,
        skewY: skewY
    };
    return transform;
}

export {parseDefaultTransform, parseNumberAttribute}