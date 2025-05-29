import z from "zod/v4";
import { makeRoute } from "./router.js";
import { generateOpenAPIDocument } from "./openapi.js";
import { MySpecialPayload, MySpecialResponse } from "./models.js";

export const MyRoute = makeRoute({
  path: "/my-route",
  method: "GET",
  payload: MySpecialPayload,
  response: MySpecialResponse,
  handler: async ({ payload: { who } }) => {
    return { message: `Hello, ${who}!`, who };
  },
});

export const MyRouteWithPathParams = makeRoute({
  path: "/my-route/:who",
  method: "GET",
  pathParams: MySpecialPayload,
  response: MySpecialResponse,
  handler: async ({ pathParams: { who } }) => {
    return { message: `Hello, ${who}!`, who };
  },
});

export const OpenAPIRoute = makeRoute({
  method: "GET",
  path: "/openapi.yml",
  meta: {
    hideFromOpenAPI: true,
  },
  response: z.string(),
  rawResponseType: "application/x-yaml",
  handler: async () => {
    try {
      return generateOpenAPIDocument({
        info: {
          title: "akahu-apply",
          version: "1.0.0",
        },
        servers: [
          {
            url: "https://web.apply.akahu.nz/v1",
            description: "Akahu Apply web API",
          },
        ],
      });
    } catch (error) {
      console.error("generateOpenAPIDocument", error);
      throw error;
    }
  },
});
