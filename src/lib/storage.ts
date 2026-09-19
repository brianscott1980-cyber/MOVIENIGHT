import { SessionConfig, SessionResponse } from '@/types';
import {
  computeSessionResponseFromDB,
  toggleVoteInDB,
  setVoterVotesInDB,
  resetSessionVotesInDB,
  updateSessionConfigInDB,
} from './db';

export function readSession(): SessionConfig {
  return computeSessionResponseFromDB().session;
}

export function writeSession(session: SessionConfig): void {
  updateSessionConfigInDB(session);
}

export function computeSessionResponse(): SessionResponse {
  return computeSessionResponseFromDB();
}

export function toggleVote(voterId: string, movieId: string): SessionResponse {
  return toggleVoteInDB(voterId, movieId);
}

export function setVoterVotes(voterId: string, movieIds: string[]): SessionResponse {
  return setVoterVotesInDB(voterId, movieIds);
}

export function resetSessionVotes(): SessionResponse {
  return resetSessionVotesInDB();
}

export function updateSessionConfig(updates: Partial<SessionConfig>): SessionResponse {
  return updateSessionConfigInDB(updates);
}
