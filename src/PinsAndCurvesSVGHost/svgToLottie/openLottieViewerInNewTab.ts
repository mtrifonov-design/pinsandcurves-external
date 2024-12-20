
const lottieViewerTemplate = `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
    <title>Lottie Viewer</title>
</head>

<body style="
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 50px;
  ">
    <canvas id="canvas" width="512" height="512" style="
        border: 1px solid grey;
    "></canvas>
    <div style="
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
    ">
        <button id="downloadButton" style="margin-top: 20px;">Download JSON</button>
        <button id="playButton" style="margin-top: 20px;">Play</button>
        <button id="pauseButton" style="margin-top: 20px;">Pause</button>
    </div>

    <script type="module">
        import { DotLottie } from "https://cdn.jsdelivr.net/npm/@lottiefiles/dotlottie-web/+esm";

        // Initialize the Lottie animation
        const lottie = new DotLottie({
            autoplay: true,
            loop: true,
            canvas: document.getElementById("canvas"),
            src: "__LOTTIE_JSON_URL__", // Load the Blob URL
        });
        lottie.setLayout({
            ...lottie.layout,
            align: [0.5, 0.5],
            fit: "contain",
        });

        // Add functionality to the download button
        const downloadButton = document.getElementById("downloadButton");
        downloadButton.addEventListener("click", () => {
            const downloadUrl = "__LOTTIE_JSON_URL__";
            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = "animation.json";
            a.click();
        });
        const playButton = document.getElementById("playButton");
        playButton.addEventListener("click", () => {
            lottie.play();
        });
        const pauseButton = document.getElementById("pauseButton");
        pauseButton.addEventListener("click", () => {
            console.log("pause");
            lottie.pause();
        });
    </script>
</body>

</html>
`;

export default function openLottieViewerInNewTab(animationJson : any) {
    // Create a Blob from the JSON object
    const blob = new Blob([JSON.stringify(animationJson)], { type: 'application/json' });
  
    // Create a Blob URL for the animation JSON
    const url = URL.createObjectURL(blob);
  
    // Replace placeholder with the Blob URL
    const htmlContent = lottieViewerTemplate.replace(/__LOTTIE_JSON_URL__/g, url);
  
    // Open a new tab and write the HTML content
    const newTab = window.open();
    if (newTab) {
      newTab.document.open();
      newTab.document.write(htmlContent);
      newTab.document.close();
    } else {
      console.error('Failed to open a new tab. Please check your browser settings.');
    }
  }