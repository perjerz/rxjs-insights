import { Locations } from './locator';
import { InstrumentationContext } from './env';

declare const ref: unique symbol;
export type DeclarationRef = { readonly [ref]: 'ObservableDeclarationRef' };
export type ObservableRef = { readonly [ref]: 'ObservableRef' };
export type SubscriberRef = { readonly [ref]: 'SubscriberRef' };
export type SubscriberEventRef = { readonly [ref]: 'SubscriberEventRef' };
export type ObservableEventRef = { readonly [ref]: 'ObservableEventRef' };
export type EventRef = SubscriberEventRef | ObservableEventRef;

export interface Recorder {
  init?(context: InstrumentationContext): void;

  declarationRef(
    name: string,
    func?: Function,
    args?: any[],
    locations?: Promise<Locations>
  ): DeclarationRef;

  observableRef(
    observableDeclarationRef: DeclarationRef,
    sourceObservableRef?: ObservableRef
  ): ObservableRef;

  subscriberRef(
    observableRef: ObservableRef,
    destinationObservableRef: ObservableRef | undefined
  ): SubscriberRef;

  observableEventRef(
    eventDeclarationRef: DeclarationRef,
    observableRef: ObservableRef,
    sourceEventRef: EventRef | undefined
  ): ObservableEventRef;

  subscriberEventRef(
    eventDeclarationRef: DeclarationRef,
    subscriberRef: SubscriberRef,
    sourceEventRef: EventRef | undefined
  ): SubscriberEventRef;

  startTask(name: string): void;

  endTask(): void;
}
