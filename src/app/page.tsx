import { getTemplateGroups } from "@/lib/geo/template-groups";
import HomeContent from "./_components/HomeContent";

export default async function HomePage() {
  const groups = await getTemplateGroups();
  return <HomeContent groups={groups} />;
}
