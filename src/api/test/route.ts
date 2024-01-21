import { NextResponse } from 'next/server';

/* eslint-disable */
export async function GET(request: Request) {
    return NextResponse.json({ data: 'Hello world' }, { status: 200 });
}
