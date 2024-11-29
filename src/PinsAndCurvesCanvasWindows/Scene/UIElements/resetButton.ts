function reset() {
    localStorage.removeItem('pinsandcurvescontroller');
        
    window.location.reload();
}

function resetButton() {
    const button = document.createElement('button');
    button.innerHTML = 'Reset';
    button.addEventListener('click', reset);
    return button;
}

export default resetButton;

