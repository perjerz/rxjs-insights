import {
  getMeta,
  HasMeta,
  SubscriberMeta,
} from '@rxjs-insights/instrumentation';
import { deref, Subscriber } from '@rxjs-insights/recorder';

export function getSubscriber(target: HasMeta<SubscriberMeta>): Subscriber {
  return deref(getMeta(target).subscriberRef);
}
