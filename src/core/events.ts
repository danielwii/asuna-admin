import getConfig from 'next/config';
import { Subject } from 'rxjs';

const { serverRuntimeConfig = {} } = getConfig() || {};

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

// core event bus, the events will received both from client side and server side.
const bus = new Subject();

function sendEvent(type: EventType.MODEL_INSERT, payload: { modelName: string }): void;
function sendEvent(
  type: EventType.MODEL_UPDATE,
  payload: { modelName: string; id: number | string },
): void;
function sendEvent(
  type: EventType.MODEL_DELETE,
  payload: { modelName: string; id: number | string },
): void;
function sendEvent(type: EventType, payload: object, extras?: object): void {
  if (!serverRuntimeConfig.isServer) {
    bus.next({ type, payload, extras });
  }
}

export { bus, sendEvent, EventType, ActionEvent };
