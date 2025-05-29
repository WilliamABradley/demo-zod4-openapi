import {
  OpenApiGeneratorV31,
  OpenAPIRegistry,
} from "@asteasolutions/zod-to-openapi";
import type { OpenAPIObjectConfigV31 } from "@asteasolutions/zod-to-openapi/dist/v3.1/openapi-generator.js";
import YAML from "yaml";

export const DefaultRegistry = new OpenAPIRegistry();

export function generateOpenAPIDocument(
  config: Omit<OpenAPIObjectConfigV31, "openapi">,
  registry = DefaultRegistry
): string {
  const generator = new OpenApiGeneratorV31(registry.definitions);
  const generated = generator.generateDocument({
    ...config,
    openapi: "3.1.0",
  });
  return YAML.stringify(generated, {
    aliasDuplicateObjects: false,
  });
}
