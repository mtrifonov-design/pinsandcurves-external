export default function cleanUpSignal(signal: [number, number][]) {
    const TOLERANCE = 10;

    // Helper to calculate the perpendicular distance from a point to a line
    const perpendicularDistance = (
        [x0, y0]: [number, number], // point
        [x1, y1]: [number, number],
        [x2, y2]: [number, number]
    ) => {
        const numerator = Math.abs((y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1);
        const denominator = Math.sqrt((y2 - y1) ** 2 + (x2 - x1) ** 2);
        return denominator === 0 ? 0 : numerator / denominator;
    };



    // Recursive function to simplify points
    const simplify = (
        points: [number, number][],
        startIdx: number,
        endIdx: number
    ) => {
        if (startIdx > endIdx) return;

        for (let i = startIdx; i <= endIdx; i++) {
            const point = points[i];
            const closestNextPoint = simplifiedSignal.find(([frame]) => frame > point[0]);
            const closestPrevPoint = simplifiedSignal.findLast(([frame]) => frame < point[0]);
            if (!closestNextPoint || !closestPrevPoint) throw new Error("Invalid simplified signal.");
            const distance = perpendicularDistance(
                point,
                closestPrevPoint,
                closestNextPoint 
            )
            if (distance > TOLERANCE) {
                const halfwayIdx = Math.floor((startIdx + endIdx) / 2);
                simplifiedSignal.push(points[halfwayIdx]);
                const interval1Start = startIdx;
                const interval1End = halfwayIdx - 1;
                const interval2Start = halfwayIdx + 1;
                const interval2End = endIdx;
                simplify(points, interval1Start, interval1End);
                simplify(points, interval2Start, interval2End);
                return;
            }
        }

    };

    // Ensure points are sorted by frame
    signal.sort((a, b) => a[0] - b[0]);
    const simplifiedSignal : [number,number][] = [];
    simplifiedSignal.push(signal[0]); // Add the first point
    simplifiedSignal.push(signal[signal.length - 1]); // Add the last point
    simplify(signal, 1, signal.length - 2);
    // console.log(signal.length,simplifiedSignal.length)
    return simplifiedSignal.sort((a, b) => a[0] - b[0]);
}