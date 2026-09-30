import { redirect } from 'next/navigation';

export default async function LegacyMovieRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/s/session-main/movie/${id}`);
}
