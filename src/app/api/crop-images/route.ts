import sharp from 'sharp';

export async function POST(req: Request) {
    const body = await req.formData();
    const files = body.getAll('image');

    const croppedImages = await Promise.all(
        files.map(async (file: FormDataEntryValue) => {
            const buffer = await (file as File).arrayBuffer();
            const resizedBuffer = await sharp(Buffer.from(buffer))
                .resize(200, 200, { fit: 'fill' })
                .toBuffer();
            return {
                name: (file as File).name,
                buffer: resizedBuffer,
            };
        })
    );

    return new Response(JSON.stringify({ croppedImages }));
}
