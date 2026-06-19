export function getProductActiveOffer(product: { id: string; categoryId: string }, activeOffers: any[]) {
  // activeOffers is sorted by priority descending.
  // Find the first offer that includes either the product directly or the product's category.
  const matchingOffer = activeOffers.find((offer) => {
    const matchesProduct = offer.products?.some((p: any) => p.productId === product.id);
    const matchesCategory = offer.categories?.some((c: any) => c.categoryId === product.categoryId);
    return matchesProduct || matchesCategory;
  });
  return matchingOffer;
}

export function calculateDiscountedPrice(basePrice: number, offer: { discountType: string; discountValue: any } | null | undefined) {
  if (!offer) return basePrice;
  const val = Number(offer.discountValue);
  if (offer.discountType === "PERCENTAGE") {
    return Math.max(0, basePrice - (basePrice * val) / 100);
  } else if (offer.discountType === "FIXED_AMOUNT") {
    return Math.max(0, basePrice - val);
  }
  return basePrice;
}

export function applyOffersToProduct(product: any, activeOffers: any[]) {
  if (!product) return product;

  // Convert prisma Decimal properties if they are objects
  const rawPrice = product.price?.toNumber ? product.price.toNumber() : Number(product.price);
  
  const offer = getProductActiveOffer(product, activeOffers);
  if (offer) {
    product.basePrice = rawPrice;
    product.price = calculateDiscountedPrice(rawPrice, offer);
    product.appliedOffer = {
      id: offer.id,
      name: offer.name,
      discountType: offer.discountType,
      discountValue: Number(offer.discountValue),
    };
  } else {
    product.basePrice = rawPrice;
    product.price = rawPrice;
    product.appliedOffer = null;
  }

  // Apply to variants if they exist
  if (product.variants && product.variants.length > 0) {
    product.variants = product.variants.map((variant: any) => {
      const rawVarPrice = variant.price
        ? (variant.price?.toNumber ? variant.price.toNumber() : Number(variant.price))
        : null;
      
      const baseVariantPrice = rawVarPrice !== null ? rawVarPrice : product.basePrice;
      const variantOffer = getProductActiveOffer(product, activeOffers);
      
      if (variantOffer) {
        variant.basePrice = baseVariantPrice;
        variant.price = calculateDiscountedPrice(baseVariantPrice, variantOffer);
        variant.appliedOffer = {
          id: variantOffer.id,
          name: variantOffer.name,
          discountType: variantOffer.discountType,
          discountValue: Number(variantOffer.discountValue),
        };
      } else {
        variant.basePrice = baseVariantPrice;
        if (variant.price !== null && variant.price !== undefined) {
          variant.price = baseVariantPrice;
        }
        variant.appliedOffer = null;
      }
      return variant;
    });
  }

  return product;
}
