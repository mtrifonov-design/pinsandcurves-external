function saveInterface() {
    const saveInterface = document.createElement('div');

    const saveName = document.createElement('input');
    saveName.id = 'save-name';
    saveName.type = 'text';
    saveName.placeholder = 'Name';
    saveName.style.marginRight = '10px';
    saveName.style.padding = '5px';
    saveName.style.border = '1px solid #4D5762';
    saveName.style.backgroundColor = '#282E34';
    saveName.style.color = 'white';
    saveName.style.borderRadius = '5px';

    const saveButton = document.createElement('button');
    saveButton.innerHTML = 'Save';
    saveButton.id = 'save';
    saveButton.onclick = () => {
        const worm = localStorage.getItem('pinsandcurvescontroller');
        if (!worm) {
            console.error('No worm to save');
            return;
        }
        const name = saveName.value;
        const blob = new Blob([worm], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${name}_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    saveInterface.appendChild(saveName);
    saveInterface.appendChild(saveButton);
    return saveInterface;
}

export default saveInterface;