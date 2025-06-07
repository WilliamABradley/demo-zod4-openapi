import z from "zod/v4";

export const APIIssue = z
  .object({
    code: z.string(),
    message: z.string(),
    path: z.array(
      z
        .union([z.string(), z.number()])
        .meta({ id: "APIIssuePathPart" })
        .openapi({
          anyOf: [],
          oneOf: [{ type: "string" }, { type: "integer" }],
        })
    ),
  })
  .meta({ id: "APIIssue" });
export type APIIssue = z.infer<typeof APIIssue>;

export const APIIssueWorking = z
  .object({
    code: z.string(),
    message: z.string(),
    path: z.array(
      z.union([z.string(), z.number()]).openapi({
        anyOf: [],
        oneOf: [{ type: "string" }, { type: "integer" }],
      })
    ),
  })
  .meta({ id: "APIIssueWorking" });
export type APIIssueWorking = z.infer<typeof APIIssueWorking>;

export const SpecificAPIIssue = APIIssue.extend({
  code: z.literal("specific_error_code"),
});

export const SpecificAPIIssueWorking = APIIssueWorking.extend({
  code: z.literal("specific_error_code"),
});

export const TestId = z.string().meta({
  id: "TestId",
  type: "prefixid",
  examples: ["test_12345"],
}) as z.ZodType<`test_${string}`>;
export type TestId = z.infer<typeof TestId>;

export const Who = z
  .string()
  .regex(/^[a-zA-Z]+$/, "Who must be a string with only letters")
  .meta({ id: "Who", examples: ["World"] });
export type Who = z.infer<typeof Who>;

export const MySpecialPayload = z
  .object({
    _id: TestId.optional(),
    who: Who,
  })
  .meta({
    id: "MySpecialParam",
  });
export type MySpecialPayload = z.infer<typeof MySpecialPayload>;

export const MySpecialResponse = z
  .object({
    _id: TestId.optional(),
    who: Who,
    message: z.string(),
  })
  .meta({
    id: "MySpecialResponse",
  });
export type MySpecialResponse = z.infer<typeof MySpecialResponse>;
