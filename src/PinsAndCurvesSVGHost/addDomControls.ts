function addDomControls() {

    const island = document.createElement("div");
    island.id = "island";
    island.style.position = "absolute";
    island.style.top = "15px";
    island.style.left = "15px";
    island.style.display = "flex";
    island.style.flexDirection = "column";
    island.style.gap = "10px";
    island.style.zIndex = "1000";
    island.style.backgroundColor = "rgba(255,255,255,0.8)";
    island.style.padding = "10px";
    island.style.border = "1px solid black";

    document.body.appendChild(island);


}

export default addDomControls;