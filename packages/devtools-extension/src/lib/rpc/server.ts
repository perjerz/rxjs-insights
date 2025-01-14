import {
  ClientAdapter,
  RequestHandlerSync,
  ServerAdapter,
  ServerAdapterAsync,
} from './message';

export interface Server {
  stop(): void;
}

function start(adapter: ServerAdapter, requestHandler: RequestHandlerSync) {
  if ('startSync' in adapter) {
    return adapter.startSync(requestHandler);
  } else {
    return adapter.startAsync(requestHandler);
  }
}

// let nextId = 0;

export function startServer<T>(
  adapter: ServerAdapter,
  implementation: T
): Server {
  return start(adapter, (message) => {
    // const id = nextId++;
    try {
      // console.time(`${adapter.name}{${id}}`);
      return {
        success: (implementation as any)[message.func].apply(
          implementation,
          message.args
        ),
      };
    } catch (e) {
      console.error(e);
      return {
        failure: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
      };
    } finally {
      // console.timeEnd(`${adapter.name}{${id}}`);
    }
  });
}

export function startProxyServer(
  serverAdapter: ServerAdapterAsync,
  clientAdapter: ClientAdapter
): Server {
  return serverAdapter.startAsync((message) => clientAdapter.send(message));
}
