import z from "zod/v4";
import { makeRoute } from "./router.js";
import { generateOpenAPIDocument } from "./openapi.js";
import {
  APIIssue,
  APIIssueWorking,
  MySpecialPayload,
  MySpecialResponse,
  SpecificAPIIssue,
  SpecificAPIIssueWorking,
} from "./models.js";

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
  path: "/my-route/{who}",
  method: "GET",
  pathParams: MySpecialPayload,
  response: MySpecialResponse,
  handler: async ({ pathParams: { who } }) => {
    return { message: `Hello, ${who}!`, who };
  },
});

export const ErrorRoute = makeRoute({
  method: "GET",
  path: "/error",
  response: z.object({
    issue: APIIssue,
    issueWorking: APIIssueWorking,
    specificIssue: SpecificAPIIssue,
    specificIssueWorking: SpecificAPIIssueWorking,
  }),
  handler: async () => {
    throw new Error("This is a simulated error");
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
          title: "demo-zod4-openapi",
          version: "1.0.0",
        },
      });
    } catch (error) {
      console.error("generateOpenAPIDocument", error);
      throw error;
    }
  },
});
