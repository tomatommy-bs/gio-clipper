import { getTemplateGroups } from "@/lib/geo/template-groups";

export async function GET() {
  try {
    const groups = await getTemplateGroups();
    return Response.json(groups);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(message, { status: 500 });
  }
}
