// Conserva compatibilidad con enlaces antiguos; Neon Auth usa /api/auth.
export function GET(request: Request) {
  return Response.redirect(new URL('/cuenta', request.url));
}
