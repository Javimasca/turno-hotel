import { NextResponse } from "next/server";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return NextResponse.json({
      hasDatabaseUrl: false,
    });
  }

  try {
    const parsed = new URL(databaseUrl);

    return NextResponse.json({
      hasDatabaseUrl: true,
      protocol: parsed.protocol,
      username: parsed.username,
      host: parsed.hostname,
      port: parsed.port,
      database: parsed.pathname.replace(/^\//, ""),
      search: parsed.search,
    });
  } catch {
    return NextResponse.json({
      hasDatabaseUrl: true,
      parseError: true,
      startsWith: databaseUrl.slice(0, 24),
    });
  }
}
