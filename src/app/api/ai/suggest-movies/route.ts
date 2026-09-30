import { NextResponse } from 'next/server';
import { searchTmdbMovies, getTmdbMovie } from '@/lib/tmdb';
import { addMovieToCatalogueIfMissing, computeSessionResponse, updateSessionConfig } from '@/lib/storage';
import { broadcaster } from '@/lib/broadcaster';
import { CustomMovieInput, Movie } from '@/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface AiMovieSuggestion {
  title: string;
  year?: number;
  reason?: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, description, count = 8 } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required.' }, { status: 400 });
    }

    if (!description || typeof description !== 'string' || !description.trim()) {
      return NextResponse.json({ error: 'Movie description is required.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key is not configured. Please set GEMINI_API_KEY in your environment.' }, { status: 500 });
    }

    const targetCount = Math.min(Math.max(Number(count) || 8, 4), 36);
    const promptText = `You are a film curator. Suggest exactly ${targetCount} real, acclaimed or popular feature movies that strongly match this theme or description:
"${description.trim()}"

Return ONLY a JSON array of objects with these exact keys:
- "title" (string, official English movie title)
- "year" (number, 4-digit release year)
- "reason" (string, 1 short sentence why this movie is a great match)`;

    // Try gemini-3.5-flash-lite, fallback to gemini-3.8-flash if needed
    const modelsToTry = ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
    let suggestions: AiMovieSuggestion[] = [];
    let lastError = '';

    for (const model of modelsToTry) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: promptText }] }],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.7,
              },
            }),
            signal: AbortSignal.timeout(15000),
          }
        );

        if (!geminiRes.ok) {
          const errData = await geminiRes.text();
          lastError = `Model ${model} returned ${geminiRes.status}: ${errData}`;
          continue;
        }

        const data = await geminiRes.json();
        const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawContent) {
          lastError = 'No text in Gemini response';
          continue;
        }

        const cleaned = rawContent.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed) && parsed.length > 0) {
          suggestions = parsed;
          break;
        }
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
      }
    }

    if (suggestions.length === 0) {
      return NextResponse.json(
        { error: `Could not generate movie suggestions from AI: ${lastError}` },
        { status: 502 }
      );
    }

    // Now process each movie recommendation via TMDB in parallel
    const processedMovies: Movie[] = [];
    const createdMovieIds: string[] = [];

    await Promise.allSettled(
      suggestions.map(async (item) => {
        try {
          if (!item.title) return;

          // 1. Search TMDB
          const tmdbResults = await searchTmdbMovies(item.title);
          let chosenMatch = tmdbResults[0] || null;

          // If item has a year, try to find a result matching the year
          if (item.year && tmdbResults.length > 1) {
            const exactYearMatch = tmdbResults.find(
              (r) => r.year && Math.abs(r.year - item.year!) <= 1
            );
            if (exactYearMatch) {
              chosenMatch = exactYearMatch;
            }
          }

          let moviePayload: CustomMovieInput;

          if (chosenMatch?.tmdbId) {
            // 2. Fetch full details from TMDB
            const detailed = await getTmdbMovie(chosenMatch.tmdbId);
            moviePayload = {
              ...detailed,
              synopsis: detailed.synopsis || item.reason || 'Curated by AI based on your prompt.',
            };
          } else {
            // Fallback manual entry if TMDB has no match
            moviePayload = {
              title: item.title,
              year: item.year || new Date().getFullYear(),
              synopsis: item.reason || `Suggested for theme: ${description.slice(0, 100)}`,
              genre: 'drama-coming-of-age',
            };
          }

          // 3. Add to remote Supabase DB catalogue if not present (expanding catalogue for non-AI users) and link to session
          const created = await addMovieToCatalogueIfMissing(moviePayload, sessionId);
          processedMovies.push(created);
          createdMovieIds.push(created.id);
        } catch (tmdbErr) {
          console.error(`Failed to process movie "${item.title}" via TMDB:`, tmdbErr);
        }
      })
    );

    // Mark session as AI curated with the prompt and generated movie IDs
    await updateSessionConfig(sessionId, {
      isAiCurated: true,
      aiPrompt: description.trim(),
      aiMovieIds: createdMovieIds,
      activeMovieIds: createdMovieIds,
    });

    // Refresh and broadcast the session state with newly added active movies
    const updatedSession = await computeSessionResponse(sessionId);
    broadcaster.broadcast(sessionId, updatedSession);

    return NextResponse.json({
      success: true,
      count: processedMovies.length,
      movies: processedMovies,
      movieIds: createdMovieIds,
      session: updatedSession,
    });
  } catch (error) {
    console.error('Failed to execute AI movie suggestion route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI movie generation failed' },
      { status: 500 }
    );
  }
}
