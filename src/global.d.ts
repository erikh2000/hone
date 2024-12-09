// I could not find a combination of dependencies in package.json that would declare everything with no duplicates. 
// Maybe this is the cleanest way forward? Or maybe I'm missing some knowledge.

interface Client {
  id: string;
  type: "window" | "worker" | "sharedworker" | "all";
  url: string;
  frameType?: "auxiliary" | "nested" | "none" | "top-level";
  postMessage(message: any, transfer?: Transferable[]): void;
}

declare class ExtendableMessageEvent extends Event {
  data: any;
  ports: MessagePort[];
  source: Client | ServiceWorker | MessagePort | null;
}