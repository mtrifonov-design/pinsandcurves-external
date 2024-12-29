function createNoise1D(seed = 0) {
    // Pseudo-random generator with seed
    const random = (() => {
        let s = seed % 2147483647;
        if (s <= 0) s += 2147483646;
        return () => {
            s = (s * 16807) % 2147483647;
            return (s - 1) / 2147483646;
        };
    })();

    // Precompute gradients and permutation table
    const gradients = Array(256).fill(0).map(() => random() * 2 - 1);
    const perm = Array(256)
        .fill(0)
        .map((_, i) => i)
        .sort(() => random() - 0.5);
    const permMod256 = [...perm, ...perm];

    // Fade and linear interpolation functions
    const fade = (t : number) => t * t * t * (t * (t * 6 - 15) + 10);
    const lerp = (a : number, b : number, t: number) => a + t * (b - a);

    return function noise1D(x:number) {
        const xi = Math.floor(x) & 255; // Integer part of x, wrapped to 256
        const xf = x - Math.floor(x); // Fractional part of x
        const u = fade(xf); // Fade function

        const g0 = gradients[permMod256[xi]];
        const g1 = gradients[permMod256[xi + 1]];

        return lerp(g0 * xf, g1 * (xf - 1), u); // Interpolated value
    };
}

// Example usage
const seed = 42;
const noise = createNoise1D(seed);


export default noise;