import http from "node:http";
import { URL } from "node:url";

export interface CustomRequest extends http.IncomingMessage {
  [key: string]: any;
}

export type CustomResponse = http.ServerResponse;

type NextMiddlewareExecutor = (error?: Error) => void;

export type RequestProcessor = (
  request: CustomRequest,
  response: CustomResponse,
  next: NextMiddlewareExecutor
) => void;

type URLPath = string;
type AllowedHTTPMethods = "GET" | "POST" | "PATCH" | "DELETE";

type RequestProcessorPathMap = Record<URLPath, RequestProcessor[]>;

export class HTTPServer {
  private port: number;
  private server: ReturnType<typeof http.createServer>;

  private processorsMap: Record<AllowedHTTPMethods, RequestProcessorPathMap> = {
    GET: {},
    POST: {},
    PATCH: {},
    DELETE: {},
  };
  private globalProcessors: RequestProcessor[] = [];

  constructor(port: number) {
    this.port = port;

    this.server = http.createServer(
      (request: http.IncomingMessage, response: http.ServerResponse) => {
        if (this.isValidMethod(request.method)) {
          this.handleRequest(
            request as CustomRequest,
            response as CustomResponse
          );
        } else {
          response
            .writeHead(405, { "Content-Type": "text/plain" })
            .end(`Method ${request.method} not allowed`);
        }
      }
    );

    this.server.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  }

  private isValidMethod(method?: string): method is AllowedHTTPMethods {
    return ["GET", "POST", "PATCH", "DELETE"].includes(method ?? "");
  }

  private handleRequest(request: CustomRequest, response: CustomResponse) {
    if (request.method) {
      const method = request.method as AllowedHTTPMethods;
      const baseUrl = `http://${request.headers.host}`;
      const url = new URL(request.url ?? "", baseUrl);
      const path = url.pathname;

      const globalMiddlewares = this.globalProcessors;
      const pathMiddlewares = this.processorsMap[method][path] || [];

      // Execute global processors and path-specific processors
      this.executeMiddleware(request, response, [
        ...globalMiddlewares,
        ...pathMiddlewares,
      ]);
    }
  }

  private nextFunctionCreator(
    request: CustomRequest,
    response: CustomResponse,
    middlewares: RequestProcessor[],
    nextIndex: number
  ): NextMiddlewareExecutor {
    return (error?: Error) => {
      if (error) {
        response.writeHead(500, { "Content-Type": "application/json" });
        response.end(
          JSON.stringify({ error: `Internal server error: ${error.message}` })
        );
      } else {
        if (nextIndex < middlewares.length) {
          this.executeMiddleware(request, response, middlewares, nextIndex);
        } else {
          if (!response.headersSent) {
            response.writeHead(404, { "Content-Type": "text/plain" });
            response.end("Not Found");
          }
        }
      }
    };
  }

  private executeMiddleware(
    request: CustomRequest,
    response: CustomResponse,
    middlewares: RequestProcessor[],
    nextIndex: number = 0
  ) {
    const currentMiddleware = middlewares[nextIndex];
    if (currentMiddleware) {
      try {
        currentMiddleware(
          request,
          response,
          this.nextFunctionCreator(
            request,
            response,
            middlewares,
            nextIndex + 1
          )
        );
      } catch (error) {
        response.writeHead(500, { "Content-Type": "application/json" });
        response.end(
          JSON.stringify({
            error: `Internal server error: ${(error as Error).message}`,
          })
        );
      }
    }
  }

  // Methods to help register processors for respective methods and paths
  public get(path: string, ...processors: RequestProcessor[]) {
    this.registerProcessors("GET", path, processors);
  }

  public post(path: string, ...processors: RequestProcessor[]) {
    this.registerProcessors("POST", path, processors);
  }

  public patch(path: string, ...processors: RequestProcessor[]) {
    this.registerProcessors("PATCH", path, processors);
  }

  public delete(path: string, ...processors: RequestProcessor[]) {
    this.registerProcessors("DELETE", path, processors);
  }

  private registerProcessors(
    method: AllowedHTTPMethods,
    path: string,
    processors: RequestProcessor[]
  ) {
    if (!this.processorsMap[method][path]) {
      this.processorsMap[method][path] = [];
    }
    this.processorsMap[method][path].push(...processors);
  }

  public use(processor: RequestProcessor) {
    this.globalProcessors.push(processor);
  }
}
