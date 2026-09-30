import { redirect } from 'next/navigation';

export default function LegacyAdminRedirect() {
  redirect('/s/session-main/admin');
}
