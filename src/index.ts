import "./init.js";
import { createRouteMap } from "./router.js";
import * as routes from "./routes.js";

const routeMap = createRouteMap(routes);

const result = await routeMap.OpenAPIRoute.handler({
  routeKey: "GET /openapi.yml",
  path: "/openapi.yml",
  method: "GET",
  pathParams: {},
  queryParams: {},
  payload: {},
});

console.log(result);
