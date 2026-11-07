import { NextResponse } from "next/server";
import { GET as dashboardGET } from "../route";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return dashboardGET(request);
}

