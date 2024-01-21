import sharp from 'sharp';
import fs from 'fs';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);

export async function POST(req: Request) {
    const body = await req.formData();
    const files = body.getAll('image');

    const croppedImages = await Promise.all(
        files.map(async (file: FormDataEntryValue) => {
            const buffer = await (file as File).arrayBuffer();
            const imagePath = `${(file as File).name}_original.png`;
            await writeFile(imagePath, Buffer.from(buffer));

            const outputPath = `${(file as File).name}_cropped.png`;

            await cropObject(imagePath, outputPath);

            const resizedBuffer = await sharp(outputPath).toBuffer();

            return {
                name: (file as File).name,
                buffer: resizedBuffer,
            };
        })
    );

    return new Response(JSON.stringify({ croppedImages }));
}
async function cropObject(
    imagePath: string,
    outputPath: string,
    padding = 25,
    backgroundColor: [number, number, number] = [255, 255, 255]
) {
    // Read the image and extract raw pixel data
    const inputBuffer = await sharp(imagePath)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    let top = inputBuffer.info.height;
    let left = inputBuffer.info.width;
    let right = 0;
    let bottom = 0;

    // Iterate over each pixel to find the bounds of the non-transparent area
    for (let y = 0; y < inputBuffer.info.height; y += 1) {
        for (let x = 0; x < inputBuffer.info.width; x += 1) {
            const alphaIndex = (inputBuffer.info.width * y + x) * 4 + 3;
            if (inputBuffer.data[alphaIndex] > 0) {
                top = Math.min(top, y);
                bottom = Math.max(bottom, y);
                left = Math.min(left, x);
                right = Math.max(right, x);
            }
        }
    }

    // Calculate the dimensions of the cropped area
    const croppedWidth = right - left;
    const croppedHeight = bottom - top;

    // Calculate the dimensions of the new canvas with uniform padding
    const canvasWidth = croppedWidth + 2 * padding;
    const canvasHeight = croppedHeight + 2 * padding;

    // Create a new image with the background color and new dimensions
    const bgImage = sharp({
        create: {
            width: canvasWidth,
            height: canvasHeight,
            channels: 4,
            background: {
                r: backgroundColor[0],
                g: backgroundColor[1],
                b: backgroundColor[2],
                alpha: 1,
            },
        },
    });

    // Composite the original image onto the new canvas
    const xPosition = padding;
    const yPosition = padding;

    const originalImage = await sharp(imagePath)
        .extract({ left, top, width: croppedWidth, height: croppedHeight })
        .toBuffer();

    await bgImage
        .composite([{ input: originalImage, top: yPosition, left: xPosition }])
        .toFile(outputPath);
}
