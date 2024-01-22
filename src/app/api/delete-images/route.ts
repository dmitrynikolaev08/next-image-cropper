import fs from 'fs';
import { promisify } from 'util';

const unlink = promisify(fs.unlink);

export async function DELETE(req: Request) {
    const body = await req.json();
    const files = body.images;

    await Promise.all(
        files.map(async (file: string) => {
            await unlink(`${file}_original.png`);
            await unlink(`${file}_cropped.png`);
        })
    );

    return new Response(
        JSON.stringify({ message: 'Images deleted successfully' })
    );
}
