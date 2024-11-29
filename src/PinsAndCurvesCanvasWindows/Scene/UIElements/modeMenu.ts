
type Mode = 'edit' | 'view' | 'record';

class ModeManager {
    private mode: Mode;

    constructor() {
        this.mode = 'edit';
    }

    public setMode(mode: Mode) {
        this.mode = mode;
        this.subscribers.forEach(subscriber => subscriber(mode));
    }

    private subscribers: ((mode: Mode) => void)[] = [];
    subscribeToModeUpdates(callback: (mode: Mode) => void) {
        this.subscribers.push(callback);
        callback(this.mode);
        return () => {
            this.subscribers = this.subscribers.filter(subscriber => subscriber !== callback);
        }
    }

    public getMode() {
        return this.mode;
    }
}

function modeMenu() {
    const modeManager = new ModeManager();
    const modeMenu = document.createElement('div');
    modeMenu.id = 'mode-menu';
    modeMenu.style.display = 'flex';
    modeMenu.style.flexDirection = 'row';
    modeMenu.style.justifyContent = 'space-between';




    const modeView = document.createElement('button');
    modeView.innerHTML = 'View';
    modeView.onclick = () => {
        modeManager.setMode('view');
    };
    modeView.style.borderTopRightRadius = '0px';
    modeView.style.borderBottomRightRadius = '0px';

    const modeEdit = document.createElement('button');
    modeEdit.innerHTML = 'Edit';
    modeEdit.onclick = () => {
        modeManager.setMode('edit');
    };
    modeEdit.style.borderRadius = '0px';

    const modeRecord = document.createElement('button');
    modeRecord.innerHTML = 'Record';
    modeRecord.onclick = () => {
        modeManager.setMode('record');
    };
    modeRecord.style.borderTopLeftRadius = '0px';
    modeRecord.style.borderBottomLeftRadius = '0px';

    modeMenu.appendChild(modeView);
    modeMenu.appendChild(modeEdit);
    modeMenu.appendChild(modeRecord);

    modeManager.subscribeToModeUpdates((mode) => {
        switch (mode) {
            case 'edit':
                modeEdit.style.backgroundColor = 'lightblue';
                modeEdit.style.color = 'black';
                modeView.style.backgroundColor = '#4D5762';
                modeView.style.color = 'white';
                modeRecord.style.backgroundColor = '#4D5762';
                modeRecord.style.color = 'white';
                break;
            case 'view':
                modeEdit.style.backgroundColor = '#4D5762';
                modeEdit.style.color = 'white';
                modeView.style.backgroundColor = 'lightblue';
                modeView.style.color = 'black';
                modeRecord.style.backgroundColor = '#4D5762';
                modeRecord.style.color = 'white';
                break;
            case 'record':
                modeEdit.style.backgroundColor = '#4D5762';
                modeEdit.style.color = 'white';
                modeView.style.backgroundColor = '#4D5762';
                modeView.style.color = 'white';
                modeRecord.style.backgroundColor = 'pink';
                modeRecord.style.color = 'black';
                break;
        }
        
    })

    return { modeMenu, modeManager };
}

export type { Mode };
export { ModeManager };
export default modeMenu;