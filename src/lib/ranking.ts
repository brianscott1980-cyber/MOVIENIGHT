/** Competition ranks: equal positive totals share a place (1, 2, 2, 4). */
export function rankByVotes<T extends { votes: number }>(items: T[]): Array<T & { rankPosition?: number; isJointPosition: boolean }> {
  const totals = items.map((item) => item.votes).filter((votes) => votes > 0).sort((a, b) => b - a);
  return items.map((item) => ({
    ...item,
    rankPosition: item.votes > 0 ? totals.indexOf(item.votes) + 1 : undefined,
    isJointPosition: item.votes > 0 && totals.filter((votes) => votes === item.votes).length > 1,
  }));
}

export function positionLabel(rank?: number, joint = false): string {
  if (!rank) return 'Unranked';
  const lastTwo = rank % 100;
  const suffix = lastTwo >= 11 && lastTwo <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[rank % 10] || 'th');
  return `${joint ? 'Joint ' : ''}${rank}${suffix}`;
}
