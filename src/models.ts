import z from "zod/v4";

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
