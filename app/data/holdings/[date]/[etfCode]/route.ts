import { readFile } from "node:fs/promises";

import {
  getHoldingCsvResponseHeaders,
  resolveHoldingCsvPath,
} from "../../../../../src/holdings/readHoldingCsv";

interface RouteContext {
  params: Promise<{
    date: string;
    etfCode: string;
  }>;
}

export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  const { date, etfCode } = await context.params;

  try {
    const filePath = await resolveHoldingCsvPath({ date, etfCodeParam: etfCode });
    const csv = await readFile(filePath, "utf8");

    return new Response(csv, {
      headers: getHoldingCsvResponseHeaders(etfCode),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Holdings file not found.";
    return Response.json({ error: message }, { status: 404 });
  }
}
