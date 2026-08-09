import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('doctorooms_session', '', { maxAge: 0, path: '/' });
  response.cookies.set('doctorooms_role', '', { maxAge: 0, path: '/' });
  response.cookies.set('next-auth.session-token', '', { maxAge: 0, path: '/' });
  return response;
}
