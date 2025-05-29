import {
  OpenAPIRegistry,
  ResponseConfig,
  ZodContentObject,
} from "@asteasolutions/zod-to-openapi";
import type { SecuritySchemeObject } from "openapi3-ts/oas31";
import { z } from "zod/v4";
import { DefaultRegistry } from "./openapi.js";

export const HttpMethod = z.enum(["GET", "POST", "PUT", "DELETE"]);
export type HttpMethod = z.infer<typeof HttpMethod>;

export type RouteMetadata = {
  hideFromOpenAPI?: boolean;
  registries?: OpenAPIRegistry[];
  tags?: string[];
  summary?: string;
  description?: string;
  deprecated?: boolean;
};

function requestOf<
  TPath extends string,
  TMethod extends HttpMethod,
  TQueryParams extends z.ZodObject<any>,
  TPathParams extends z.ZodObject<any>,
  TPayload extends z.ZodTypeAny
>({
  path,
  method,
  pathParams,
  queryParams,
  payload,
}: {
  path: TPath;
  method: TMethod;
  pathParams: TPathParams;
  queryParams: TQueryParams;
  payload: TPayload;
}) {
  return z.object({
    routeKey: z.literal(`${method} ${path}` as const),
    path: z.literal(path),
    method: z.literal(method),
    pathParams,
    queryParams,
    payload,
  });
}

export function makeRoute<
  TPath extends string,
  TMethod extends HttpMethod,
  TResponse extends z.ZodTypeAny,
  TQueryParams extends z.ZodObject<any> = z.ZodObject<Record<string, never>>,
  TPathParams extends z.ZodObject<any> = z.ZodObject<Record<string, never>>,
  TPayload extends z.ZodTypeAny = z.ZodTypeAny,
  TRouteMetadata extends RouteMetadata = RouteMetadata
>({
  path,
  method,
  response,
  pathParams = z.object({}) as TPathParams,
  queryParams = z.object({}) as TQueryParams,
  payload = z.any() as unknown as TPayload,
  errors = {},
  rawResponseType,
  meta = {} as TRouteMetadata,
  handler,
}: {
  path: TPath;
  method: TMethod;
  pathParams?: TPathParams;
  queryParams?: TQueryParams;
  payload?: TPayload;
  response: TResponse;
  errors?: Record<number, ResponseConfig>;
  rawResponseType?: string | undefined;
  meta?: TRouteMetadata;
  handler: (
    route: z.output<
      ReturnType<
        typeof requestOf<TPath, TMethod, TQueryParams, TPathParams, TPayload>
      >
    >
  ) => Promise<z.input<TResponse>>;
}) {
  const routeKey = `${method} ${path}` as const;

  const Request = requestOf({
    path,
    method,
    pathParams,
    queryParams,
    payload,
  });

  return {
    // Request/response schemas
    Request,
    Response: response,
    // Route attributes
    routeKey,
    path,
    method,
    errors,
    rawResponseType,
    meta: {
      hideFromOpenAPI: meta.hideFromOpenAPI ?? false,
      deprecated: meta.deprecated ?? false,
      ...meta,
    },
    handler,
  };
}

export type APIResult = {
  code: number;
  headers?: HttpHeaders;
  body?: string | Buffer;
};

/** Merge two response content fields, returning a union */
function mergeResponseContents(
  content1?: ZodContentObject,
  content2?: ZodContentObject
) {
  if (!content1) {
    return content2;
  }
  if (!content2) {
    return content1;
  }

  const newContent = { ...content2 };
  for (const [contentType, content] of Object.entries(content1)) {
    if (contentType in newContent) {
      const schema1 = content!.schema;
      const schema2 = newContent[contentType]!.schema;
      if (schema1 instanceof z.ZodObject && schema2 instanceof z.ZodObject) {
        // Merge the schema types
        newContent[contentType]!.schema = schema1.merge(schema2);
      }
    }
  }

  return newContent;
}

/**
 * Merge two response schemas, returning a union of the contents.
 *
 * Where definitions overlap in unmergeable ways, the second argument takes
 * preference.
 */
function mergeResponseConfigs(
  config1: ResponseConfig | undefined,
  config2: ResponseConfig
): ResponseConfig {
  if (!config1) {
    return config2;
  }
  const mergedSchema: ResponseConfig = {
    description: config2.description ?? config1.description,
    headers: config2.headers ?? config1.headers,
    links: config2.links ?? config1.links,
    content: mergeResponseContents(config1.content, config2.content),
  };
  return mergedSchema;
}

export type Route = ReturnType<typeof makeRoute>;
export type Request = Route["Request"];
export type RouteKey = Route["routeKey"];
export type AnyRoute = Omit<Route, "handler"> & {
  handler: (request: any, ctx: any) => Promise<any>;
};
export type RouteMap = Record<string, AnyRoute>;

/**
 * Creates a route map, with options to attach to openapi.
 * @param map Route map data.
 * @returns Route map.
 */
export function createRouteMap<TRouteMap extends RouteMap>(
  map: TRouteMap,
  options: {
    errors?: Record<number, ResponseConfig>;
  } = {}
) {
  for (const [routeId, route] of Object.entries(map)) {
    if (route.meta.hideFromOpenAPI) {
      continue;
    }
    const responses: Record<number, ResponseConfig> = {};
    if (
      route.Response instanceof z.ZodVoid ||
      route.Response instanceof z.ZodUndefined
    ) {
      responses[204] = {
        description: "Accepted",
      };
    } else if (route.rawResponseType) {
      responses[200] = {
        description: "Success",
        content: {
          [route.rawResponseType]: {
            schema: z.string(),
          },
        },
      };
    } else {
      responses[200] = {
        description: "Success",
        content: {
          "application/json": {
            schema: route.Response,
          },
        },
      };
    }
    if (options.errors) {
      Object.assign(responses, options.errors);
    }
    if (route.errors) {
      // Merge in specific errors returned by this endpoint
      for (const [code, schema] of Object.entries(route.errors)) {
        const numericCode = Number(code); // TS is a bit off here...

        if (numericCode in responses) {
          // Merge the schema content with the existing definition
          responses[numericCode] = mergeResponseConfigs(
            responses[numericCode],
            schema
          );
        } else {
          // New response schema, just pop it in
          responses[numericCode] = schema;
        }
      }
    }

    // If specified, register this route against a different OpenAPI registry.
    const registries = route.meta.registries ?? [DefaultRegistry];

    for (const registry of registries) {
      registry.registerPath({
        operationId: routeId,
        method: route.method.toLowerCase() as Lowercase<
          (typeof route)["method"]
        >,
        path: route.path,
        request: {
          params: route.Request.shape.pathParams,
          query: route.Request.shape.queryParams,
          body:
            route.Request.shape.payload instanceof z.ZodAny
              ? undefined
              : {
                  required: true,
                  content: {
                    "application/json": {
                      schema: route.Request.shape.payload,
                    },
                  },
                },
        },
        responses,

        // Metadata
        tags: route.meta.tags,
        summary: route.meta.summary,
        description: route.meta.description,
        deprecated: route.meta.deprecated,
      });
    }
  }
  return map;
}
