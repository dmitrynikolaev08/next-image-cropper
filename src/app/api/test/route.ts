export async function GET() {
    return new Response(JSON.stringify({ message: 'Hello world' }));
}
export async function POST(req: Request) {
    const body = await req.json();
    console.log('body', body);

    return new Response(JSON.stringify({ message: 'Hello world' }));
}
