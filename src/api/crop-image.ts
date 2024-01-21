import type { NextApiRequest, NextApiResponse } from 'next';
import formidable, { Files } from 'formidable';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === 'POST') {
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files: Files) => {
            if (err) {
                res.status(500).json({ error: 'Error parsing the files' });
                return;
            }
            console.log('files', files);

            try {
                const { images } = files;
                console.log('images', images);

                // Check if images is defined
                if (!images) {
                    res.status(400).json({ error: 'No images uploaded' });
                    return;
                }

                const processedImagesPromises = [];

                // Check if 'images' is an array and process each file
                if (Array.isArray(images)) {
                    images.forEach((file) => {
                        processedImagesPromises.push(
                            processImage(file.filepath)
                        );
                    });
                } else {
                    // If 'images' is a single file, process it
                    // @ts-ignore
                    processedImagesPromises.push(processImage(images.filepath));
                }

                // Process all images
                const processedImages = await Promise.all(
                    processedImagesPromises
                );

                res.status(200).json({ images: processedImages });
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: 'Error processing the images' });
            }
        });
    } else {
        res.status(405).end();
    }
}

async function processImage(filePath: string): Promise<string> {
    // Implement your image processing logic here
    const buffer = await sharp(filePath)
        .extract({ width: 100, height: 100, left: 50, top: 50 })
        .toBuffer();

    // Save the processed image to a temporary file and return the path
    const tempPath = path.join('/tmp', path.basename(filePath));
    fs.writeFileSync(tempPath, buffer);
    return tempPath; // Or convert to a URL or Base64 string as needed
}
