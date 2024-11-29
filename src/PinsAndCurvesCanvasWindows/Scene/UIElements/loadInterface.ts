function loadInterface() {
    const interfaceElement = document.createElement('div');

    const loadInput = document.createElement('input');
    loadInput.id = 'load-input';
    loadInput.type = 'file';
    loadInput.style.display = 'none';
    interfaceElement.appendChild(loadInput);

    const button = document.createElement('button');
    button.innerHTML = 'Load';
    button.id = 'load';
    button.onclick = () => {
        loadInput.click()
    };
    loadInput.addEventListener('change', () => {
        const file = loadInput.files![0];
        const reader = new FileReader();
        reader.onload = () => {
            const worm = reader.result as string;
            localStorage.setItem('pinsandcurvescontroller', worm);

            window.location.reload();

        };
        reader.readAsText(file);
    });
    interfaceElement.appendChild(button);
    return button;
}

export default loadInterface;