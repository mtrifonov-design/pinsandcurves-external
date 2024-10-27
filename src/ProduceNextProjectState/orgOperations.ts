import type { ProjectState, FolderColor } from "../../External/Types/Project";

import { produce } from "immer";

const __updateSignalOrder = (projectDraft : ProjectState) : void => {
    const folderIds = projectDraft.org.folderIds;
    const trackOrder = [];
    for (let i = 0; i < folderIds.length; i++) {
        const folderId = folderIds[i];
        const trackIds = projectDraft.org.folderContents[folderId].signalIds;
        for (let j = 0; j < trackIds.length; j++) {
            trackOrder.push(trackIds[j]);
        }
    }
    projectDraft.org.signalIds = trackOrder;  
};

const __updateActiveSignalOrder = (projectDraft : ProjectState) : void => {
    const trackIds = projectDraft.org.signalIds;
    const activeTrackIds = trackIds.filter(trackId => projectDraft.org.activeSignalIds.includes(trackId));
    projectDraft.org.activeSignalIds = [...activeTrackIds];
};

const __setSignalActiveStatus = (projectDraft: ProjectState, signalId: string, status: boolean) : void => {
    if (status === true) {
        if (projectDraft.org.activeSignalIds.includes(signalId)) return;
        projectDraft.org.activeSignalIds.push(signalId);
    } else {
        if (projectDraft.org.activeSignalIds.includes(signalId)) {
            projectDraft.org.activeSignalIds = projectDraft.org.activeSignalIds.filter(id => id !== signalId);
            return;
        }
        return;
    }
}

const __locateFolderId = (projectDraft: ProjectState, signalId: string) : string => {
    let folderId = Object.keys(projectDraft.org.folderContents)
    .find(folderId => projectDraft.org.folderContents[folderId].signalIds.includes(signalId));
    if (folderId !== undefined) return folderId;
    throw new Error("Did not find folder Id");
}

const __updateParentFolder = (projectDraft: ProjectState,signalId: string, value: string | undefined) : void => {
    // const signalIds = projectDraft.org.signalIds;
    // let parentFolders : {
    //     [signalId: string] : string
    // } = {};
    // for (let i = 0; i < signalIds.length; i++) {
    //     const signalId = signalIds[i];
    //     const folderId = __locateFolderId(projectDraft,signalId);
    //     parentFolders[signalId] = folderId;
    // }
    // projectDraft.org.parentFolders = parentFolders;
    if (value === undefined) {
        delete projectDraft.org.parentFolders[signalId];
        return;
    }
    projectDraft.org.parentFolders[signalId] = value;

}

const __deleteSignal = (projectDraft: ProjectState, signalId: string) : void => {
    let folderId = __locateFolderId(projectDraft,signalId);
    projectDraft.org.folderContents[folderId].signalIds = projectDraft.org.folderContents[folderId].signalIds.filter(id => id !== signalId);
    delete projectDraft.org.signalNames[signalId];
    __setSignalActiveStatus(projectDraft,signalId,false)
    delete projectDraft.org.signalMetadata[signalId];
    delete projectDraft.signalData[signalId];
    __updateSignalOrder(projectDraft);
    __updateActiveSignalOrder(projectDraft); 
    __updateParentFolder(projectDraft,signalId,undefined);
}

const createFolder = ({folderId} : {folderId: string}) => {
    return produce((projectDraft : ProjectState) => {
        projectDraft.org.folderIds.push(folderId);
        projectDraft.org.folderContents[folderId] = {
            signalIds: [],
        };
        projectDraft.org.folderNames[folderId] = "New Folder";
        projectDraft.org.folderMetadata[folderId] = "";
        projectDraft.org.folderColors[folderId] = "red";

        __updateSignalOrder(projectDraft);
        __updateActiveSignalOrder(projectDraft); 
    })
};

const deleteSignal = ({signalId}:{signalId: string}) => {
    return produce((projectDraft : ProjectState) => {
        __deleteSignal(projectDraft,signalId);
    });
};

const deleteFolder = ({folderId} : {folderId : string}) => {
    return produce((projectDraft : ProjectState) => {
        projectDraft.org.folderIds.splice(projectDraft.org.folderIds.indexOf(folderId), 1);
        delete projectDraft.org.folderNames[folderId];
        delete projectDraft.org.folderMetadata[folderId];
        delete projectDraft.org.folderColors[folderId];
        for (let signalId of projectDraft.org.folderContents[folderId].signalIds) {
            if (projectDraft.org.parentFolders[signalId] === folderId) {
                __deleteSignal(projectDraft,signalId);
            }
        }
        delete projectDraft.org.folderContents[folderId];
        if (projectDraft.org.openFolder === folderId) {
            projectDraft.org.openFolder = undefined;
        }
        __updateSignalOrder(projectDraft);
        __updateActiveSignalOrder(projectDraft); 
    })
};

const createSignal = ({signalId,folderId}:{signalId:string, folderId:string}) => {
    return produce((projectDraft : ProjectState) => {
        projectDraft.org.folderContents[folderId].signalIds.push(signalId);
        projectDraft.org.signalNames[signalId] = "New Track";
        projectDraft.org.signalMetadata[signalId] = "";
        projectDraft.org.parentFolders[signalId] = folderId;

        __setSignalActiveStatus(projectDraft,signalId, true);
        projectDraft.signalData[signalId] = {
            pinIds: ["kf1"],
            pinTimes: {
                kf1: 1,                        
            },
            pinValues: {
                kf1: 0.5,
            },
            curves: {
                kf1: {
                    error: "",
                    functionString: "-> step();",
                }
            },
            range: [0, 1],
        }
        __updateSignalOrder(projectDraft);
        __updateActiveSignalOrder(projectDraft); 
    });
};

const updateSignalMetadata = ({signalId,metadata}:{signalId: string, metadata: string}) => {
    return produce((projectDraft : ProjectState) => {
        projectDraft.org.signalMetadata[signalId] = metadata;
    });
}

const updateFolderMetadata = ({folderId,metadata}:{folderId: string, metadata: string}) => {
    return produce((projectDraft : ProjectState) => {
        projectDraft.org.folderMetadata[folderId] = metadata;
    });
}

const updateFolderColor = ({folderId,color}:{folderId: string, color: FolderColor}) => {
    return produce((projectDraft : ProjectState) => {
        projectDraft.org.folderColors[folderId] = color;
    });
}

const moveFolder = ({folderId,folderDesId}:{folderId: string, folderDesId: string}) => {
    return produce((projectDraft : ProjectState) => {
        let folderIds = projectDraft.org.folderIds;
        let folderDesIndex = folderIds.indexOf(folderDesId);
        folderIds = folderIds.filter(id => id !== folderId);
        folderIds.splice(folderDesIndex, 0, folderId);
        projectDraft.org.folderIds = folderIds;


        __updateSignalOrder(projectDraft);
        __updateActiveSignalOrder(projectDraft); 
    });   
};


const moveSignal = ({signalId,signalDesId,folderDesId}:{signalId: string,signalDesId:string,folderDesId:string}) => {
    return produce((projectDraft : ProjectState) => {
        let folderId = __locateFolderId(projectDraft,signalId);
        let signalIds = projectDraft.org.folderContents[folderId].signalIds;
        
        let trackDesIndex;
        if (folderDesId === folderId) {
            trackDesIndex = signalIds.indexOf(signalDesId);
            signalIds = signalIds.filter(id => id !== signalId);
            signalIds.splice(trackDesIndex, 0, signalId);
            projectDraft.org.folderContents[folderId].signalIds = signalIds;
        } else {
            signalIds = signalIds.filter(id => id !== signalId);
            projectDraft.org.folderContents[folderId].signalIds = signalIds;
            signalIds = projectDraft.org.folderContents[folderDesId].signalIds;
            trackDesIndex = signalIds.indexOf(signalDesId);
            trackDesIndex = trackDesIndex === -1 ? 0 : trackDesIndex;
            signalIds.splice(trackDesIndex, 0, signalId);
            projectDraft.org.folderContents[folderDesId].signalIds = signalIds;
        };
        __updateParentFolder(projectDraft,signalId,folderDesId);
        __updateSignalOrder(projectDraft);
        __updateActiveSignalOrder(projectDraft);
    });
};

const renameSignal = ({signalId,signalName}:{signalId: string, signalName: string}) => {
    return produce((projectDraft : ProjectState) => {
        projectDraft.org.signalNames[signalId] = signalName;
    });
}

const renameFolder = ({folderId,folderName}:{folderId: string, folderName: string}) => {
    return produce((projectDraft : ProjectState) => {
        projectDraft.org.folderNames[folderId] = folderName;
    });
}


const setSignalActive = ({signalId,active}:{signalId: string, active: boolean}) => {
    return produce((projectDraft : ProjectState) => {
        __setSignalActiveStatus(projectDraft,signalId,active);
        __updateActiveSignalOrder(projectDraft);
    });
};
const setOpenFolder = ({folderId} : {folderId: string | undefined}) => {
    return produce((projectDraft : ProjectState) => {
        projectDraft.org.openFolder = folderId;
    });
};


export default {
    createFolder,
    deleteFolder,
    moveFolder,
    renameFolder,
    createSignal,
    renameSignal,
    deleteSignal,
    moveSignal,
    setSignalActive,
    setOpenFolder,
    updateSignalMetadata,
    updateFolderMetadata,
    updateFolderColor,
}