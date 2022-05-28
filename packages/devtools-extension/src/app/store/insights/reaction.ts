import { combineReactions, createReaction, filterActions } from '@lib/store';
import { filterRoutes } from '@lib/store-router';
import { observableRouteToken, router } from '@app/router';
import { EMPTY, from, map, switchMap } from 'rxjs';
import { insightsClient } from '@app/clients/insights';
import { insightsActions } from '@app/actions/insights-actions';

export const insightsReaction = combineReactions().add(
  createReaction((action$) =>
    action$.pipe(
      filterActions(router.actions.NavigationComplete),
      filterRoutes(router, observableRouteToken),
      switchMap((route) => {
        const observableId = route.params?.observableId;
        return observableId !== undefined
          ? from(insightsClient.getObservableInfo(parseInt(observableId, 10)))
          : EMPTY;
      }),
      map((info) => insightsActions.ObservableInfoLoaded({ info }))
    )
  )
);