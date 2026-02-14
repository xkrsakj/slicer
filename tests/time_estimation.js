function estimateTime(d, vMax, a) {
    var da = Math.pow(vMax, 2) / (2 * a);

    if (d > 2 * da) {
        return vMax / a + (d - 2 * da) / vMax + vMax / a;
    }

    return t = 2 * Math.sqrt(d / a);
}

console.log(estimateTime(100, 166.6667, 200));