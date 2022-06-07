import {
  createClient,
  createDocumentEventClientAdapter,
  createInspectedWindowEvalServerAdapter,
  startServer,
} from '@lib/rpc';
import {
  Instrumentation,
  InstrumentationChannel,
} from '@app/protocols/instrumentation-status';
import { Statistics, StatisticsChannel } from '@app/protocols/statistics';
import {
  getGlobalEnv,
  ObservableLike,
  SubscriberLike,
} from '@rxjs-insights/core';
import {
  deref,
  Event,
  Observable,
  Subscriber,
  Task,
} from '@rxjs-insights/recorder';
import { Target, Targets, TargetsChannel } from '@app/protocols/targets';
import {
  TargetsNotifications,
  TargetsNotificationsChannel,
} from '@app/protocols/targets-notifications';
import {
  Insights,
  InsightsChannel,
  ObservableState,
  RelatedHierarchyNode,
  RelatedHierarchyTree,
  Relations,
  SubscriberState,
} from '@app/protocols/insights';
import {
  Trace,
  TraceFrame,
  Traces,
  TracesChannel,
} from '@app/protocols/traces';
import { RefsService } from './refs-service';
import { Refs, RefsChannel } from '@app/protocols/refs';
import {
  getDestinationEvents,
  getObservable,
  getSourceEvents,
  getSubscriber,
  isObservableTarget,
  isSubscriberTarget,
} from '@rxjs-insights/recorder-utils';

const RXJS_INSIGHTS_ENABLED_KEY = 'RXJS_INSIGHTS_ENABLED';

function getTrace(event: Event | undefined): Trace {
  if (event === undefined) {
    return [];
  } else {
    const frame: TraceFrame = {
      task: {
        id: event.task.id,
        name: event.task.name,
      },
      event: {
        id: event.time,
        type: event.declaration.name as any,
        name: event.declaration.name,
      },
      target: {
        id: event.target.id,
        type: event.target.type,
        name: event.target.declaration.name,
        locations: event.target.declaration.locations,
      },
    };
    return [frame, ...getTrace(event.precedingEvent)];
  }
}

startServer<Traces>(createInspectedWindowEvalServerAdapter(TracesChannel), {
  getTrace() {
    const env = getGlobalEnv();
    if (env) {
      const event = deref(env.tracer.getTrace()?.eventRef);
      return getTrace(event);
    } else {
      return undefined;
    }
  },
});

startServer<Statistics>(
  createInspectedWindowEvalServerAdapter(StatisticsChannel),
  {
    getStats() {
      return getGlobalEnv().recorder.getStats();
    },
  }
);

startServer<Instrumentation>(
  createInspectedWindowEvalServerAdapter(InstrumentationChannel),
  {
    getStatus() {
      switch ((window as any).RXJS_INSIGHTS_INSTALLED) {
        case true:
          return 'installed';
        case false:
          return 'not-installed';
        default:
          return 'not-available';
      }
    },

    install() {
      sessionStorage.setItem(RXJS_INSIGHTS_ENABLED_KEY, 'true');
      location.reload();
    },
  }
);

const targets: {
  observables: Record<number, Observable>;
  subscribers: Record<number, Subscriber>;
} = {
  observables: {},
  subscribers: {},
};

startServer<Targets>(createInspectedWindowEvalServerAdapter(TargetsChannel), {
  releaseTarget(target: Target) {
    switch (target.type) {
      case 'subscriber':
        delete targets.subscribers[target.id];
        return;
      case 'observable':
        delete targets.observables[target.id];
        return;
    }
  },
  getTargets(): Target[] {
    return [
      ...Object.values(targets.observables).map(
        ({ id, declaration: { name } }): Target => ({
          type: 'observable',
          id,
          name,
        })
      ),
      ...Object.values(targets.subscribers).map(
        ({ id, declaration: { name } }): Target => ({
          type: 'subscriber',
          id,
          name,
        })
      ),
    ];
  },
});

const targetsNotificationsClient = createClient<TargetsNotifications>(
  createDocumentEventClientAdapter(TargetsNotificationsChannel)
);

const refs = new RefsService();

(window as any).REFS = refs;

startServer<Refs>(createInspectedWindowEvalServerAdapter(RefsChannel), refs);

function getTargets(relations: Relations, type: 'subscriber' | 'observable') {
  switch (type) {
    case 'subscriber':
      return relations.subscribers;
    case 'observable':
      return relations.observables;
  }
}

function getStartTime(events: Event[]) {
  if (events.length === 0) {
    return Infinity;
  } else {
    return events[0].time;
  }
}

function getEndTime(events: Event[]) {
  if (events.length === 0) {
    return -Infinity;
  } else {
    const lastEvent = events.at(-1)!;
    switch (lastEvent.type) {
      case 'error':
      case 'complete':
      case 'unsubscribe':
        return lastEvent.time;
      default:
        return Infinity;
    }
  }
}

function addRelatedTarget(
  relations: Relations,
  target: Subscriber | Observable
) {
  const targets = getTargets(relations, target.type);
  if (targets[target.id] === undefined) {
    targets[target.id] = {
      id: target.id,
      name: target.declaration.name,
      type: target.type,
      tags: target.tags,
      startTime: getStartTime(target.events),
      endTime: getEndTime(target.events),
    };
  }
}

function addRelatedTask(relations: Relations, task: Task) {
  const tasks = relations.tasks;
  if (tasks[task.id] === undefined) {
    tasks[task.id] = {
      id: task.id,
      name: task.name,
    };
  }
}

function addRelatedEvent(relations: Relations, event: Event) {
  const events = relations.events;
  if (events[event.time] === undefined) {
    events[event.time] = {
      type: 'event',
      time: event.time,
      eventType: event.type,
      name: event.declaration.name,
      target: {
        type: event.target.type,
        id: event.target.id,
      },
      data:
        event.type === 'next' || event.type === 'error'
          ? refs.create(event.declaration.args?.[0], 0, false)
          : undefined,
      task: event.task.id,
      precedingEvent: event.precedingEvent?.time,
      succeedingEvents: event.succeedingEvents.map(({ time }) => time),
    };
    if (event.precedingEvent) {
      addRelatedEvent(relations, event.precedingEvent);
    }
    for (const succeedingEvent of event.succeedingEvents) {
      addRelatedEvent(relations, succeedingEvent);
    }
    addRelatedTask(relations, event.task);
  }
}

function collectRelatedTargets(
  relations: Relations,
  target: Subscriber | Observable,
  getRelatedEvents: (event: Event) => Event[]
): RelatedHierarchyNode {
  addRelatedTarget(relations, target);
  for (const event of target.events) {
    addRelatedEvent(relations, event);
  }
  const relatedEvents = target.events.flatMap(getRelatedEvents);
  const relatedTargets = new Set(relatedEvents.map(({ target }) => target));
  relatedTargets.delete(target);
  return {
    target: {
      type: target.type,
      id: target.id,
    },
    children: Array.from(relatedTargets).map((relatedTarget) =>
      collectRelatedTargets(relations, relatedTarget, getRelatedEvents)
    ),
  };
}
function getTargetState(target: Subscriber): SubscriberState;
function getTargetState(target: Observable): ObservableState;
function getTargetState(target: Subscriber | Observable) {
  const ref = refs.create(target);
  const relations: Relations = {
    observables: {},
    subscribers: {},
    events: {},
    tasks: {},
  };
  const hierarchy: RelatedHierarchyTree = {
    sources: collectRelatedTargets(relations, target, getSourceEvents),
    destinations: collectRelatedTargets(
      relations,
      target,
      getDestinationEvents
    ),
  };

  return { ref, relations, hierarchy };
}

startServer<Insights>(createInspectedWindowEvalServerAdapter(InsightsChannel), {
  getObservableState(observableId: number): ObservableState | undefined {
    const observable = targets.observables[observableId];
    if (!observable) {
      return undefined;
    } else {
      return getTargetState(observable);
    }
  },
  getSubscriberState(subscriberId: number): SubscriberState | undefined {
    const subscriber = targets.subscribers[subscriberId];
    if (!subscriber) {
      return undefined;
    } else {
      return getTargetState(subscriber);
    }
  },
});

function inspect(target: ObservableLike | SubscriberLike) {
  if (isSubscriberTarget(target)) {
    const subscriber = getSubscriber(target);
    targets.subscribers[subscriber.id] = subscriber;
    targetsNotificationsClient.notifyTarget({
      type: 'subscriber',
      id: subscriber.id,
      name: subscriber.declaration.name,
    });
  }
  if (isObservableTarget(target)) {
    const observable = getObservable(target);
    targets.observables[observable.id] = observable;
    targetsNotificationsClient.notifyTarget({
      type: 'observable',
      id: observable.id,
      name: observable.declaration.name,
    });
  }
}

(window as any).RXJS_ISNIGHTS_DEVTOOLS_INSPECT = inspect;

(window as any)['RXJS_INSIGHTS_INSTALL'] =
  sessionStorage.getItem(RXJS_INSIGHTS_ENABLED_KEY) === 'true';
