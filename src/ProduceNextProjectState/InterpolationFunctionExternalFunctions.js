import interpolateSignalValue from '../InterpolateSignalValue/InterpolateSignalValue';

const externalFunctions = {
    sin: ([time],inaccessibleExternalContext) => Math.sin(time),
    cos: ([time],inaccessibleExternalContext) => Math.cos(time),
    atan2: ([y,x],inaccessibleExternalContext) => Math.atan2(y,x),
    ceil: ([value],inaccessibleExternalContext) => Math.ceil(value),
    floor: ([value],inaccessibleExternalContext) => Math.floor(value),
    round: ([value],inaccessibleExternalContext) => Math.round(value),
    abs: ([value],inaccessibleExternalContext) => Math.abs(value),
    sqrt: ([value],inaccessibleExternalContext) => Math.sqrt(value),
    log: ([value],inaccessibleExternalContext) => Math.log(value),
    pow: ([base,exponent],inaccessibleExternalContext) => Math.pow(base,exponent),
    zigzag: ([time],inaccessibleExternalContext) => {
        return time % 1;
    },

    sign: ([value],inaccessibleExternalContext) => {
        return Math.sign(value);
    },

    signal: ([id,time],inaccessibleExternalContext) => {
        const signalData = inaccessibleExternalContext.signalData;
        const visitedSignals = inaccessibleExternalContext.visitedSignals;
        const value = interpolateSignalValue(signalData, id, time,[...visitedSignals]);
        return value;
    },

    linear: ([],inaccessibleExternalContext) => {
        const ppv = inaccessibleExternalContext.pinWindow.previousPinValue;
        const cpv = inaccessibleExternalContext.pinWindow.currentPinValue;
        const ppt = inaccessibleExternalContext.pinWindow.previousPinTime;
        const cpt = inaccessibleExternalContext.pinWindow.currentPinTime;
        const t = inaccessibleExternalContext.time;
        const rt = (t-ppt)/(cpt-ppt); 
        const value = ppv + (cpv-ppv)*rt;
        return value;
    },

    cubicEasyEase: ([],inaccessibleExternalContext) => {
        const ppv = inaccessibleExternalContext.pinWindow.previousPinValue;
        const cpv = inaccessibleExternalContext.pinWindow.currentPinValue;
        const ppt = inaccessibleExternalContext.pinWindow.previousPinTime;
        const cpt = inaccessibleExternalContext.pinWindow.currentPinTime;
        const t = inaccessibleExternalContext.time;
        const rt = (t-ppt)/(cpt-ppt);
        const rtE = rt < 0.5 ? 4 * rt * rt * rt : 1 - Math.pow(-2 * rt + 2, 3) / 2;
        const value = ppv + (cpv-ppv)*rtE;
        return value;
    },

    cubicEaseOut: ([],inaccessibleExternalContext) => {
        const ppv = inaccessibleExternalContext.pinWindow.previousPinValue;
        const cpv = inaccessibleExternalContext.pinWindow.currentPinValue;
        const ppt = inaccessibleExternalContext.pinWindow.previousPinTime;
        const cpt = inaccessibleExternalContext.pinWindow.currentPinTime;
        const t = inaccessibleExternalContext.time;
        const rt = (t-ppt)/(cpt-ppt);
        const rtE = 1 - Math.pow(1 - rt, 3);
        const value = ppv + (cpv-ppv)*rtE;
        return value;
    },

    cubicEaseIn: ([],inaccessibleExternalContext) => {
        const ppv = inaccessibleExternalContext.pinWindow.previousPinValue;
        const cpv = inaccessibleExternalContext.pinWindow.currentPinValue;
        const ppt = inaccessibleExternalContext.pinWindow.previousPinTime;
        const cpt = inaccessibleExternalContext.pinWindow.currentPinTime;
        const t = inaccessibleExternalContext.time;
        const rt = (t-ppt)/(cpt-ppt);
        const rtE = Math.pow(rt, 3);
        const value = ppv + (cpv-ppv)*rtE;
        return value;
    },

    step: ([],inaccessibleExternalContext) => {
        const cpv = inaccessibleExternalContext.pinWindow.currentPinValue;
        return cpv;
    }
};

export default externalFunctions;