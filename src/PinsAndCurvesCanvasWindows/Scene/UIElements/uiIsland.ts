

function uiIsland(children: Element[]): Element {
    const island = document.createElement('div');
    island.style.position = 'absolute';
    island.style.top = '0';
    island.style.left = '0';
    island.style.display = 'flex';
    island.style.flexDirection = 'row';
    island.style.justifyContent = 'center';
    island.style.alignItems = 'center';
    island.style.backgroundColor = '#282E34';
    island.style.border = '1px solid #4D5762';
    island.style.padding = '10px';
    island.style.gap = '10px';
    island.style.position = 'absolute';
    island.style.marginLeft = '10px';
    island.style.marginTop = '10px';
    island.style.borderRadius = '5px';

    const style = document.createElement('style');
    style.innerHTML = `
        button {
            background-color: #4D5762;
            color: white;
            border: none;
            padding: 5px;
            border-radius: 5px;
            cursor: pointer;
        }
    `;
    island.appendChild(style);

    for (const child of children) {
        island.appendChild(child);
    }
    return island;
}

export default uiIsland;