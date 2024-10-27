import type { ProjectState, FolderColor } from "../../External/Types/Project";

import { produce } from "immer";

const updateDomainSettings = ({unitMode,unitsPerSecond,steps}:{unitMode: "standard" | "seconds", unitsPerSecond: number, steps: number}) => {
    return produce((projectDraft : ProjectState) => {
        projectDraft.configData.domain.unitMode = unitMode;
        projectDraft.configData.domain.unitsPerSecond = unitsPerSecond;
        projectDraft.configData.domain.steps = steps;
    });
};

const updateReceiverAddress = ({receiverAddress}: {receiverAddress:string}) => {
    return produce((projectDraft : ProjectState) => {
        projectDraft.configData.receiverAddress = receiverAddress;
    });
}


export default {
    updateDomainSettings,
    updateReceiverAddress,
}