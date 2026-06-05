import z from "zod";

export const AddToCartSchema = z.object({
  variantId: z.string().min(1, { message: "Variant id is required" }),
  quantity: z.union([
    z.number().int().min(1, { message: "Quantity must be at least 1" }),
    z.string().transform((val) => {
      const num = Number(val);
      if (isNaN(num)) return undefined;
      return num;
    }).pipe(z.number().int().min(1, { message: "Quantity must be at least 1" }))
  ])
});

