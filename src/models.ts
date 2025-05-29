import z from "zod/v4";

export const Who = z.string().meta({ id: "Who" });
export type Who = z.infer<typeof Who>;

export const MySpecialPayload = z
  .object({
    who: Who,
  })
  .meta({
    id: "MySpecialParam",
  });
export type MySpecialPayload = z.infer<typeof MySpecialPayload>;

export const MySpecialResponse = z
  .object({
    who: Who,
    message: z.string(),
  })
  .meta({
    id: "MySpecialResponse",
  });
export type MySpecialResponse = z.infer<typeof MySpecialResponse>;
