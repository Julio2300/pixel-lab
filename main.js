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
    let currentImageData;
    let img = new Image();

    const colorPalette = [
        { r: 0, g: 0, b: 0 },      // Negro
        { r: 255, g: 255, b: 255 }, // Blanco
        { r: 255, g: 0, b: 0 },     // Rojo
        { r: 255, g: 127, b: 0 },   // Naranja
        { r: 255, g: 255, b: 0 },   // Amarillo
        { r: 0, g: 255, b: 0 },     // Verde
        { r: 0, g: 255, b: 255 },   // Cian
        { r: 0, g: 0, b: 255 },     // Azul
        { r: 70, g: 130, b: 180 },  // Azul acero
        { r: 135, g: 206, b: 235 }, // Azul cielo
        { r: 0, g: 0, b: 139 },     // Azul oscuro
        { r: 123, g: 104, b: 238 }, // Lila medio
        { r: 75, g: 0, b: 130 },    // Índigo
        { r: 138, g: 43, b: 226 },  // Violeta
        { r: 148, g: 0, b: 211 },   // Violeta oscuro
        { r: 255, g: 0, b: 255 },   // Magenta
        { r: 199, g: 21, b: 133 },  // Rojo púrpura
        { r: 255, g: 182, b: 193 }, // Rosa claro
        { r: 128, g: 0, b: 0 },     // Marrón oscuro
        { r: 139, g: 69, b: 19 },   // Marrón
        { r: 255, g: 228, b: 181 }, // Mocasín
        { r: 128, g: 128, g: 128 }, // Gris
        { r: 211, g: 211, b: 211 }, // Gris claro
        { r: 230, g: 230, b: 250 }, // Lavanda
        { r: 128, g: 128, b: 0 }    // Oliva
    ];

    const basicColorPalette = [
        { r: 0, g: 0, b: 0 },      // Negro
        { r: 255, g: 255, b: 255 }, // Blanco
        { r: 255, g: 0, b: 0 },     // Rojo
        { r: 255, g: 255, b: 0 },   // Amarillo
        { r: 0, g: 255, b: 0 },     // Verde
        { r: 0, g: 255, b: 255 },   // Cian
        { r: 0, g: 0, b: 255 },     // Azul
        { r: 255, g: 0, b: 255 },   // Magenta
        { r: 128, g: 0, b: 0 },     // Marrón
        { r: 128, g: 128, b: 0 },   // Oliva
        { r: 128, g: 128, b: 128 }, // Gris
        { r: 192, g: 192, b: 192 }, // Gris claro
        { r: 0, g: 128, b: 128 },   // Teal
        { r: 128, g: 0, b: 128 },   // Púrpura
        { r: 255, g: 165, b: 0 },   // Naranja
        { r: 255, g: 192, b: 203 }  // Rosa
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
                currentImageData = new ImageData(new Uint8ClampedArray(originalImageData.data), originalImageData.width, originalImageData.height);
                processButton.removeAttribute('disabled');
                pixelateButton.removeAttribute('disabled');
                replaceWithNumbersButton.removeAttribute('disabled');
                downloadButton.removeAttribute('disabled'); // Habilitar el botón de descarga
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });

    processButton.addEventListener('click', function () {
        if (!currentImageData) return;
        currentImageData = reduceColors(currentImageData, colorPalette); // reduce a 25 colores
        ctx.putImageData(currentImageData, 0, 0);
    });

    pixelateButton.addEventListener('click', function () {
        if (!currentImageData) return;
        const pixelSize = parseInt(pixelSizeInput.value);
        currentImageData = pixelateImage(ctx, canvas, currentImageData, pixelSize);
        ctx.putImageData(currentImageData, 0, 0);
    });

    replaceWithNumbersButton.addEventListener('click', function () {
        if (!currentImageData) return;
        const pixelSize = parseInt(pixelSizeInput.value);
        const cols = Math.floor(canvas.width / pixelSize);
        const rows = Math.floor(canvas.height / pixelSize);
        divideImage(cols, rows, currentImageData, pixelSize);
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

        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                const x = i * width;
                const y = j * height;
                const cellData = ctx.getImageData(x, y, width, height);
                const color = getAverageColor(cellData.data);
                const colorNumber = getColorNumber(color);

                const fontSize = Math.min(width, height) * 0.4;
                ctx.font = `${fontSize}px Arial`;
                ctx.fillStyle = colorNumber === 0 ? 'white' : 'black'; // Texto blanco para el color negro
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
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
        const nearestColor = findNearestColor(color.r, color.g, color.b, basicColorPalette);
        return basicColorPalette.indexOf(nearestColor);
    }

    function downloadImage() {
        const link = document.createElement('a');
        link.download = 'image_with_grid.png';
        link.href = canvas.toDataURL();
        link.click();
    }
});