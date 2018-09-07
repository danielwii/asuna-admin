import { Observable, Subject } from 'rxjs';
import { AppContext } from '@asuna-admin/core';

/**
 * the accept type for event-bus
 */
enum EventType {
  MODEL_INSERT = 'MODEL_INSERT',
  MODEL_UPDATE = 'MODEL_UPDATE',
  MODEL_DELETE = 'MODEL_DELETE',
}

/**
 * the data body for event-bus
 */
interface ActionEvent {
  type: EventType;
  payload: any;
  extras?: any;
}

class EventBus {
  private static subject: Subject<any>;

  public static init() {
    if (!EventBus.subject) {
      EventBus.subject = new Subject<any>();
    }
  }

  public static sendEvent(type: EventType.MODEL_INSERT, payload: { modelName: string }): void;
  public static sendEvent(
    type: EventType.MODEL_UPDATE,
    payload: { modelName: string; id: number | string },
  ): void;
  public static sendEvent(
    type: EventType.MODEL_DELETE,
    payload: { modelName: string; id: number | string },
  ): void;
  public static sendEvent(type: EventType, payload: object, extras?: object): void {
    if (!AppContext.serverRuntimeConfig.isServer) {
      EventBus.subject.next({ type, payload, extras });
    }
  }

  public static get observable(): Observable<{
    type: EventType;
    payload: object;
    extras?: object;
  }> {
    return EventBus.subject;
  }
}

EventBus.init();

// core event bus, the events will received both from client side and server side.
// const bus = new Subject();

export { EventBus, EventType, ActionEvent };
