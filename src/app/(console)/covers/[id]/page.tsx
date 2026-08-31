import { CoverDocket } from "./cover-docket";

export default async function CoverDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CoverDocket id={id} />;
}
