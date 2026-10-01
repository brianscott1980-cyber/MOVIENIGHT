import { SessionConfig, SessionResponse, CreatorMetadata, Voter } from '@/types';
import {
  computeSessionResponseFromDB,
  toggleVoteInDB,
  setVoterVotesInDB,
  resetSessionVotesInDB,
  updateSessionConfigInDB,
  listSessionsInDB,
  createSessionInDB,
  addVoterToSessionInDB,
  launchSessionInDB,
  addCustomMovieToDB,
  addMovieToCatalogueIfMissingInDB,
  getHostPastVotersInDB,
  pauseSessionInDB,
  resumeSessionInDB,
  deleteSessionInDB,
  recordSessionViewInDB,
} from './db';
import { CustomMovieInput, Movie } from '@/types';

export async function readSession(sessionId: string = 'session-main'): Promise<SessionConfig> {
  const data = await computeSessionResponseFromDB(sessionId);
  return data.session;
}

export async function writeSession(sessionId: string = 'session-main', session: SessionConfig): Promise<void> {
  await updateSessionConfigInDB(sessionId, session);
}

export async function computeSessionResponse(sessionId: string = 'session-main'): Promise<SessionResponse> {
  return computeSessionResponseFromDB(sessionId);
}

export async function toggleVote(sessionId: string = 'session-main', voterId: string, movieId: string): Promise<SessionResponse> {
  return toggleVoteInDB(sessionId, voterId, movieId);
}

export async function setVoterVotes(sessionId: string = 'session-main', voterId: string, movieIds: string[]): Promise<SessionResponse> {
  return setVoterVotesInDB(sessionId, voterId, movieIds);
}

export async function resetSessionVotes(sessionId: string = 'session-main'): Promise<SessionResponse> {
  return resetSessionVotesInDB(sessionId);
}

export async function updateSessionConfig(sessionId: string = 'session-main', updates: Partial<SessionConfig>): Promise<SessionResponse> {
  return updateSessionConfigInDB(sessionId, updates);
}

export async function listSessions() {
  return listSessionsInDB();
}

export async function createSession(
  title?: string,
  sessionId?: string,
  creator?: CreatorMetadata,
  initialMovieIds?: string[]
): Promise<SessionResponse> {
  return createSessionInDB(title, sessionId, creator, initialMovieIds);
}

export async function addVoterToSession(
  sessionId: string,
  name: string,
  avatar: string,
  color?: string,
  userId?: string | null,
  email?: string | null
): Promise<{ voter: Voter; sessionResponse: SessionResponse }> {
  return addVoterToSessionInDB(sessionId, name, avatar, color, userId, email);
}

export async function launchSession(sessionId: string): Promise<SessionResponse> {
  return launchSessionInDB(sessionId);
}

export async function pauseSession(sessionId: string): Promise<SessionResponse> {
  return pauseSessionInDB(sessionId);
}

export async function resumeSession(sessionId: string): Promise<SessionResponse> {
  return resumeSessionInDB(sessionId);
}

export async function deleteSession(sessionId: string): Promise<void> {
  return deleteSessionInDB(sessionId);
}

export async function addCustomMovie(sessionId: string, input: CustomMovieInput): Promise<Movie> {
  return addCustomMovieToDB(sessionId, input);
}

export async function addMovieToCatalogueIfMissing(input: CustomMovieInput, sessionId?: string): Promise<Movie> {
  return addMovieToCatalogueIfMissingInDB(input, sessionId);
}

export async function getHostPastVoters(
  creatorUserId?: string | null,
  creatorEmail?: string | null
): Promise<Voter[]> {
  return getHostPastVotersInDB(creatorUserId, creatorEmail);
}

export async function recordSessionView(
  sessionId: string,
  voterInfo?: { voterId?: string; voterName?: string; avatar?: string }
): Promise<void> {
  return recordSessionViewInDB(sessionId, voterInfo);
}

