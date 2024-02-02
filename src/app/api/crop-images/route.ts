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
    backgroundColor: [number, number, number] = [255, 255, 255]
) {
    // Determine the bounds of the non-transparent area
    const { data, info } = await sharp(imagePath)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    let top = info.height;
    let left = info.width;
    let right = 0;
    let bottom = 0;

    for (let y = 0; y < info.height; y += 1) {
        for (let x = 0; x < info.width; x += 1) {
            const alphaIndex = (info.width * y + x) * 4 + 3;
            if (data[alphaIndex] > 0) {
                // Pixel is not transparent
                top = Math.min(top, y);
                left = Math.min(left, x);
                right = Math.max(right, x);
                bottom = Math.max(bottom, y);
            }
        }
    }

    // Calculate dimensions and aspect ratio of cropped area
    const croppedWidth = right - left + 1;
    const croppedHeight = bottom - top + 1;
    const aspectRatio = croppedWidth / croppedHeight;

    let resizedWidth;
    let resizedHeight;

    // Resize logic based on aspect ratio, with a max size of 1450 to allow for padding
    if (aspectRatio >= 1) {
        // Wider or equal
        resizedWidth = 1450;
        resizedHeight = Math.round(1450 / aspectRatio);
    } else {
        // Taller
        resizedHeight = 1450;
        resizedWidth = Math.round(1450 * aspectRatio);
    }

    // Calculate padding based on the resized image's aspect ratio
    const paddingX =
        aspectRatio >= 1 ? 25 : Math.max(0, (1500 - resizedWidth) / 2);
    const paddingY =
        aspectRatio < 1 ? 25 : Math.max(0, (1500 - resizedHeight) / 2);

    // Create a blank canvas with background color
    const canvas = sharp({
        create: {
            width: 1500,
            height: 1500,
            channels: 4,
            background: {
                r: backgroundColor[0],
                g: backgroundColor[1],
                b: backgroundColor[2],
                alpha: 1,
            },
        },
    });

    // Resize the cropped image and place it on the canvas
    const croppedAndResizedImage = await sharp(imagePath)
        .extract({ left, top, width: croppedWidth, height: croppedHeight })
        .resize(resizedWidth, resizedHeight)
        .toBuffer();

    await canvas
        .composite([
            {
                input: croppedAndResizedImage,
                top: Math.round(paddingY),
                left: Math.round(paddingX),
            },
        ])
        .toFile(outputPath);
}
