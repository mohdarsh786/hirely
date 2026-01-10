import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const destinationUrl = new URL('/google-callback', request.url);
  
  searchParams.forEach((value, key) => {
    destinationUrl.searchParams.set(key, value);
  });

  return NextResponse.redirect(destinationUrl);
}
