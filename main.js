document.addEventListener('DOMContentLoaded', function () {
    const fileInput = document.getElementById('fileInput');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const pixelSizeInput = document.getElementById('pixelSize');
    const processButton = document.getElementById('processButton');
    const pixelateButton = document.getElementById('pixelateButton');
    const replaceWithNumbersButton = document.getElementById('replaceWithNumbersButton');
    const downloadButton = document.getElementById('downloadButton');
    let originalImageData;
    let reducedImageData;
    let pixelatedImageData;
    let img = new Image();

    // Paleta de colores ampliada
    const colorPalette = [
        { r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 },
        { r: 255, g: 0, b: 0 }, { r: 255, g: 127, b: 0 }, { r: 255, g: 255, b: 0 },
        { r: 0, g: 255, b: 0 }, { r: 0, g: 255, b: 127 }, { r: 0, g: 255, b: 255 },
        { r: 0, g: 127, b: 255 }, { r: 0, g: 0, b: 255 }, { r: 127, g: 0, b: 255 },
        { r: 255, g: 0, b: 255 }, { r: 255, g: 0, b: 127 }, { r: 192, g: 192, b: 192 },
        { r: 128, g: 128, b: 128 }, { r: 128, g: 0, b: 0 }, { r: 128, g: 128, b: 0 },
        { r: 0, g: 128, b: 0 }, { r: 128, g: 0, b: 128 }, { r: 0, g: 128, b: 128 },
        { r: 0, g: 0, b: 128 }, { r: 255, g: 69, b: 0 }, { r: 255, g: 165, b: 0 },
        { r: 255, g: 215, b: 0 }, { r: 173, g: 255, b: 47 }, { r: 0, g: 255, b: 127 },
        { r: 0, g: 206, b: 209 }, { r: 0, g: 191, b: 255 }, { r: 70, g: 130, b: 180 },
        { r: 147, g: 112, b: 219 }, { r: 199, g: 21, b: 133 },
        // Additional colors for better color representation
        { r: 255, g: 182, b: 193 }, { r: 255, g: 228, b: 225 }, { r: 255, g: 240, b: 245 },
        { r: 240, g: 248, b: 255 }, { r: 230, g: 230, b: 250 }, { r: 245, g: 245, b: 220 },
        { r: 255, g: 228, b: 181 }, { r: 255, g: 222, b: 173 }, { r: 255, g: 218, b: 185 },
        { r: 255, g: 228, b: 196 }, { r: 255, g: 235, b: 205 }, { r: 245, g: 222, b: 179 },
        { r: 255, g: 250, b: 205 }, { r: 250, g: 250, b: 210 }, { r: 255, g: 255, b: 224 },
        { r: 255, g: 250, b: 240 }, { r: 255, g: 245, b: 238 }, { r: 245, g: 255, b: 250 },
        { r: 240, g: 255, b: 240 }, { r: 240, g: 255, b: 255 }, { r: 230, g: 255, b: 255 },
        { r: 240, g: 248, b: 255 }, { r: 230, g: 230, b: 250 }
    ];

    fileInput.addEventListener('change', function (event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            img.onload = function () {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                processButton.removeAttribute('disabled');
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });

    processButton.addEventListener('click', function () {
        if (!originalImageData) return;

        reducedImageData = reduceColors(originalImageData, colorPalette);
        ctx.putImageData(reducedImageData, 0, 0);
        pixelateButton.removeAttribute('disabled');
    });

    pixelateButton.addEventListener('click', function () {
        if (!reducedImageData) return;

        const pixelSize = parseInt(pixelSizeInput.value);
        pixelatedImageData = pixelateImage(ctx, canvas, reducedImageData, pixelSize);
        ctx.putImageData(pixelatedImageData, 0, 0);
        replaceWithNumbersButton.removeAttribute('disabled');
    });

    replaceWithNumbersButton.addEventListener('click', function () {
        if (!pixelatedImageData) return;

        const pixelSize = parseInt(pixelSizeInput.value);
        const cols = Math.floor(canvas.width / pixelSize);
        const rows = Math.floor(canvas.height / pixelSize);
        divideImage(cols, rows, pixelatedImageData, pixelSize);
    });

    downloadButton.addEventListener('click', downloadImage);

    function reduceColors(imageData, palette) {
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const nearestColor = findNearestColor(r, g, b, palette);
            data[i] = nearestColor.r;
            data[i + 1] = nearestColor.g;
            data[i + 2] = nearestColor.b;
        }

        return imageData;
    }

    function findNearestColor(r, g, b, palette) {
        let minDistance = Infinity;
        let nearestColor = palette[0];

        for (const color of palette) {
            const distance = colorDistance(r, g, b, color.r, color.g, color.b);
            if (distance < minDistance) {
                minDistance = distance;
                nearestColor = color;
            }
        }

        return nearestColor;
    }

    function colorDistance(r1, g1, b1, r2, g2, b2) {
        return Math.sqrt(
            Math.pow(r2 - r1, 2) +
            Math.pow(g2 - g1, 2) +
            Math.pow(b2 - b1, 2)
        );
    }

    function pixelateImage(ctx, canvas, imageData, pixelSize) {
        const data = imageData.data;
        const width = canvas.width;
        const height = canvas.height;
        const pixelatedData = new Uint8ClampedArray(data);

        for (let y = 0; y < height; y += pixelSize) {
            for (let x = 0; x < width; x += pixelSize) {
                const red = [];
                const green = [];
                const blue = [];

                for (let j = 0; j < pixelSize; j++) {
                    for (let i = 0; i < pixelSize; i++) {
                        const pixelIndex = ((y + j) * width + (x + i)) * 4;
                        if (pixelIndex < data.length) {
                            red.push(data[pixelIndex]);
                            green.push(data[pixelIndex + 1]);
                            blue.push(data[pixelIndex + 2]);
                        }
                    }
                }

                const avgRed = red.reduce((a, b) => a + b) / red.length;
                const avgGreen = green.reduce((a, b) => a + b) / green.length;
                const avgBlue = blue.reduce((a, b) => a + b) / blue.length;

                const pixelIndex = (y * width + x) * 4;
                for (let j = 0; j < pixelSize; j++) {
                    for (let i = 0; i < pixelSize; i++) {
                        const index = ((y + j) * width + (x + i)) * 4;
                        if (index < data.length) {
                            pixelatedData[index] = avgRed;
                            pixelatedData[index + 1] = avgGreen;
                            pixelatedData[index + 2] = avgBlue;
                            pixelatedData[index + 3] = data[pixelIndex + 3];
                        }
                    }
                }
            }
        }

        return new ImageData(pixelatedData, width, height);
    }

    function divideImage(cols, rows, imageData, pixelSize) {
        const width = pixelSize;
        const height = pixelSize;
        ctx.putImageData(imageData, 0, 0);

        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;

        for (let i = 0; i <= cols; i++) {
            ctx.beginPath();
            ctx.moveTo(i * width, 0);
            ctx.lineTo(i * width, canvas.height);
            ctx.stroke();
        }

        for (let j = 0; j <= rows; j++) {
            ctx.beginPath();
            ctx.moveTo(0, j * height);
            ctx.lineTo(canvas.width, j * height);
            ctx.stroke();
        }

        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                const x = i * width;
                const y = j * height;
                const cellData = ctx.getImageData(x, y, width, height);
                const color = getAverageColor(cellData.data);
                const colorNumber = getColorNumber(color);

                const fontSize = Math.min(width, height) * 0.4;
                ctx.font = `${fontSize}px Arial`;
                ctx.fillText(colorNumber, x + width / 2, y + height / 2);
            }
        }
    }

    function getAverageColor(data) {
        let r = 0, g = 0, b = 0;
        const length = data.length / 4;
        for (let i = 0; i < data.length; i += 4) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
        }
        return { r: r / length, g: g / length, b: b / length };
    }

    function getColorNumber(color) {
        const paletteColors = colorPalette.map((c, index) => ({ ...c, index }));
        const nearestColor = findNearestColor(color.r, color.g, color.b, paletteColors);
        return nearestColor.index;
    }

    function downloadImage() {
        const link = document.createElement('a');
        link.download = 'image_with_grid.png';
        link.href = canvas.toDataURL();
        link.click();
    }
});

