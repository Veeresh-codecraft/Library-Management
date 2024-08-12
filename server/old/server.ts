import http from "node:http";
import { URL } from "node:url";

export type RequestProcessor = (
  request: http.IncomingMessage,
  response: http.ServerResponse
) => void;

type URLPath = string;
type RequestProcessorPathMap =
  | Record<URLPath, RequestProcessor>
  | Array<RequestProcessor>;

export class HTTPServer {
  private port: number;
  private server: ReturnType<typeof http.createServer>;
  private processorsMap: Record<
    "GET" | "POST" | "GLOBALS" | "PATCH",
    RequestProcessorPathMap
  > = { GET: {}, POST: {}, GLOBALS: [], PATCH: {} };

  constructor(port: number) {
    this.port = port;

    this.server = http.createServer(
      (request: http.IncomingMessage, response: http.ServerResponse) => {
        if (
          request.method !== "GET" &&
          request.method !== "POST" &&
          request.method !== "PATCH"
        ) {
          response
            .writeHead(500)
            .end(`Sorry, currently not handling ${request.method}`);
          return;
        }
        this.handleRequest(request, response);
      }
    );

    this.server.listen(port, () => {
      console.log("listening at port: ", port);
    });
  }

  private handleRequest(
    request: http.IncomingMessage,
    response: http.ServerResponse
  ) {
    // Run all the processors attached to the given request type and path.
    if (request.method !== undefined) {
      const method = request.method as "GET" | "POST" | "PATCH";
      // First we need to run all global processors on the received request.
      const globalProcessors = this.processorsMap[
        "GLOBALS"
      ] as Array<RequestProcessor>;
      globalProcessors.forEach((processor) => {
        processor(request, response);
      });

      const pathMap = this.processorsMap[method];
      if (pathMap && typeof pathMap === "object") {
        // Type assertion that pathMap is a Record
        const url = new URL(
          request.url ?? "",
          `http://${request.headers.host}`
        );
        const path = url.pathname;
        (pathMap as Record<URLPath, RequestProcessor>)[path]?.(
          request,
          response
        );
      }
    }
  }

  // Methods to help register processors for respective methods and paths
  public get(path: string, processor: RequestProcessor) {
    (this.processorsMap["GET"] as Record<URLPath, RequestProcessor>)[path] =
      processor;
  }

  public post(path: string, processor: RequestProcessor) {
    (this.processorsMap["POST"] as Record<URLPath, RequestProcessor>)[path] =
      processor;
  }

  public put(path: string, processor: RequestProcessor) {
    // Implement PUT method processor registration if needed
  }

  public patch(path: string, processor: RequestProcessor) {
    (this.processorsMap["PATCH"] as Record<URLPath, RequestProcessor>)[path] =
      processor;
  }

  public use(processor: RequestProcessor) {
    const globalProcessors = this.processorsMap[
      "GLOBALS"
    ] as Array<RequestProcessor>;
    globalProcessors.push(processor);
  }
}
