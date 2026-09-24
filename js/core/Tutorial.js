// Tutorial.js — the Academy tutorial's state machine. Pure functions over
// (state, content, balance). No DOM.
//
// state.tutorial = { status: 'new' | 'active' | 'done', lesson, completed, rewarded }
//   new     never started: the game offers it before the Survival Test
//   active  in progress; `lesson` is the next lesson to play
//   done    finished or skipped (the reward is paid either way, once)
// A replay (from the Wiki or Settings) plays the lessons again without touching
// `status`; winning the last lesson of a replay still sets `completed`.
import { BALANCE } from '../config/balance.js';
import { grantTutorialReward } from './SaveManager.js';

export function tutorialLessons(C) { return C.tutorial?.nodes || []; }

/** True while the tutorial should run before the story (new or in progress). */
export function tutorialPending(state) { return state.tutorial?.status !== 'done'; }

/** The lesson a (non-replay) run should play next. */
export function nextLessonIndex(state) { return state.tutorial?.status === 'active' ? state.tutorial.lesson : 0; }

export function startTutorial(state) {
  if (state.tutorial.status === 'new') { state.tutorial.status = 'active'; state.tutorial.lesson = 0; }
}

/**
 * Record a won lesson. Returns { finished, reward } — `reward` is the one-time
 * tutorial reward when this win finishes the tutorial (null otherwise, or on a replay
 * after the reward was already paid).
 */
export function completeLesson(state, index, C, B = BALANCE, { replay = false } = {}) {
  const last = index >= tutorialLessons(C).length - 1;
  const T = state.tutorial;
  if (!replay && T.status !== 'done') {
    T.status = last ? 'done' : 'active';
    T.lesson = last ? 0 : Math.max(T.lesson, index + 1);
  }
  let reward = null;
  if (last) {
    T.completed = true;
    reward = grantTutorialReward(state, B);
  }
  return { finished: last, reward };
}

/** Skip the rest of the tutorial: same reward as finishing it (paid once). */
export function skipTutorial(state, B = BALANCE) {
  const T = state.tutorial;
  if (T.status !== 'done') { T.status = 'done'; T.lesson = 0; }
  return grantTutorialReward(state, B);
}
