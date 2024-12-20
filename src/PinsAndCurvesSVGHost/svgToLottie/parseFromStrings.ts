
type MatrixValues = [number, number, number, number, number, number];

/**
 * Parses a matrix string of the form `matrix(a,b,c,d,e,f)` and extracts the numbers.
 * @param input - The matrix string to parse.
 * @returns An array of numbers [a, b, c, d, e, f] or throws an error if the format is invalid.
 */
function parseMatrix(input: string): MatrixValues {
    //console.log(input)
    const regex = /^matrix\((-?\d*\.?\d+), (-?\d*\.?\d+), (-?\d*\.?\d+), (-?\d*\.?\d+), (-?\d*\.?\d+), (-?\d*\.?\d+)\)$/;

    const match = input.match(regex);
    if (!match) {
        throw new Error("Invalid matrix format. Expected format: matrix(a,b,c,d,e,f)");
    }

    // Convert matched groups to numbers
    const values = match.slice(1).map(Number) as MatrixValues;

    if (values.some(isNaN)) {
        throw new Error("Invalid number format in matrix values.");
    }

    return values;
}

function parseColor(input: string) {
    let rgb = input.match(/^rgb\((-?\d*\.?\d+), (-?\d*\.?\d+), (-?\d*\.?\d+)\)$/);
    if (!rgb) {
        throw new Error("Invalid color format. Expected format: rgb(r,g,b)");
    }
    const values = rgb.slice(1).map(Number);
    if (values.some(isNaN)) {
        throw new Error("Invalid number format in color values.");
    }
    return values;
}

function parsePixelValue(input: string) {
    let value = input.match(/^(-?\d*\.?\d+)px$/);
    if (!value) {
        return 0;
        // throw new Error("Invalid pixel value format. Expected format: <number>px");
    }
    return parseFloat(value[1]);
}

export { parseMatrix, parseColor, parsePixelValue };