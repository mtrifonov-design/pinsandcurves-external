// Function to load SVG and extract path data as an array of interpolated points
// Function to load SVG and extract path data as an array of interpolated points
async function loadSVGPath(svgUrl, segments = 1000) {
    const response = await fetch(svgUrl);
    const svgText = await response.text();
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
    
    // Find the path element
    const pathElement = svgDoc.querySelector('path');
    if (!pathElement) {
      console.error('No path found in SVG.');
      return [];
    }
  
    return parseSVGPathToPoints(pathElement, segments);
  }
  
  // Function to parse SVG path to an array of points using getPointAtLength
  function parseSVGPathToPoints(pathElement, segments) {
    const points = [];
    const totalLength = pathElement.getTotalLength();
  
    // Sample points along the path at equal intervals
    for (let i = 0; i <= segments; i++) {
      const distance = (i / segments) * totalLength;
      const point = pathElement.getPointAtLength(distance);
      points.push({ x: point.x, y: point.y });
    }
  
    return points;
  }
  
// Function to normalize and plot a path within a specified bounding box
function plotPath(sketch, points, startX, startY, width, height) {
    if (points.length === 0) return;
  
    // Calculate the bounding box of the path
    const minX = Math.min(...points.map(p => p.x));
    const maxX = Math.max(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y));
    const maxY = Math.max(...points.map(p => p.y));
  
    const originalWidth = maxX - minX;
    const originalHeight = maxY - minY;
  
    // Scale and translate points to fit within the specified bounding box
    sketch.beginShape();
    points.forEach(point => {
      const normalizedX = (point.x - minX) / originalWidth; // Normalize to range [0, 1]
      const normalizedY = (point.y - minY) / originalHeight; // Normalize to range [0, 1]
      
      const mappedX = startX + normalizedX * width;
      const mappedY = startY + normalizedY * height;
      
      sketch.vertex(mappedX, mappedY);
    });
    sketch.endShape();
  }

  // Function to get an interpolated point along the normalized path within a bounding box at a given progress
function getPointAlongPath(points, startX, startY, width, height, progress) {
    if (points.length === 0) return null;
  
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
  
    const mappedX = startX + normalizedX * width;
    const mappedY = startY + normalizedY * height;
  
    return { x: mappedX, y: mappedY };
  }
  

  export { loadSVGPath, parseSVGPathToPoints, interpolateCubicBezier, interpolateQuadraticBezier, plotPath, getPointAlongPath };