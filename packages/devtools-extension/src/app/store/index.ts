import { createStore, createStoreHooks } from '@lib/store';
import {
  routerReaction,
  routerReducer,
  routerTransitionsReaction,
} from '@app/store/router';
import { statusReactions, statusReducer } from '@app/store/status';
import { inspectedWindowReaction } from '@app/store/inspected-window';
import { targetReaction } from '@app/store/targets/reaction';
import { targetsReducer } from '@app/store/targets/slice';
import { insightsReaction, insightsReducer } from '@app/store/insights';
import { refsReducer } from '@app/store/refs';
import { refsReaction } from '@app/store/refs/reaction';
import { refreshRefsReaction } from '@app/store/refresh-refs/reaction';
import { hoverTargetsReaction } from '@app/store/hover-targets/reaction';

export const store = createStore()
  .addReducer(statusReducer)
  .addReaction(statusReactions)
  .addReducer(routerReducer)
  .addReaction(routerReaction)
  .addReaction(routerTransitionsReaction)
  .addReaction(inspectedWindowReaction)
  .addReducer(targetsReducer)
  .addReaction(targetReaction)
  .addReducer(insightsReducer)
  .addReaction(insightsReaction)
  .addReducer(refsReducer)
  .addReaction(refsReaction)
  .addReaction(refreshRefsReaction)
  .addReaction(hoverTargetsReaction);
export const { useStore, useDispatch, useSelector, useSelectorFunction } =
  createStoreHooks<typeof store>();
