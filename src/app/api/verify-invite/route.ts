import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code } = body;

    const expectedCode = process.env.INVITATION_CODE || "COLOMBIA2026";

    if (!code) {
      return NextResponse.json({ valid: false, error: "Código requerido" }, { status: 400 });
    }

    if (code.trim() === expectedCode) {
      return NextResponse.json({ valid: true });
    } else {
      return NextResponse.json({ valid: false });
    }
  } catch (error) {
    console.error("Error verifying invite code on server:", error);
    return NextResponse.json({ valid: false, error: "Error en el servidor" }, { status: 500 });
  }
}
