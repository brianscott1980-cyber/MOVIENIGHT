import { redirect } from 'next/navigation';

export default function LegacyLiveRedirect() {
  redirect('/s/session-main/live');
}
