import { NextResponse } from "next/server";
import { STUDIONET_RPC } from "@/lib/contract";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.text();
  try {
    const upstream = await fetch(STUDIONET_RPC, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    });
    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Studio RPC proxy failed";
    return NextResponse.json({ jsonrpc: "2.0", error: { message } }, { status: 502 });
  }
}
