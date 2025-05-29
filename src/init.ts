import { z } from "zod/v4";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

// @ts-expect-error (Zod version mismatch)
extendZodWithOpenApi(z);
