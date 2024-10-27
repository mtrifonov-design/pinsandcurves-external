interface RestrictedPinWindow {
    currentPinTime: number;
    currentPinValue: number;
    currentCurve: Curve;
    previousPinTime: number;
    previousPinValue: number;
}

interface PinWindow extends RestrictedPinWindow {
    currentPinId: string;
}

export type { PinWindow, RestrictedPinWindow };