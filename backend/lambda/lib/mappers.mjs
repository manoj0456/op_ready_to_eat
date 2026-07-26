export function toUser(item) {
  return {
    id: item.PK.replace('USER#', ''),
    email: item.email,
    name: item.name,
    role: item.role,
    phone: item.phone,
    avatarUrl: item.avatarUrl,
    createdAt: item.createdAt,
  }
}

export function toRestaurant(item) {
  return {
    id: item.PK.replace('RESTAURANT#', ''),
    ownerId: item.ownerId,
    name: item.name,
    description: item.description,
    cuisine: item.cuisine || [],
    address: item.address || {},
    coverImageUrl: item.coverImageUrl,
    logoUrl: item.logoUrl,
    rating: item.rating || 0,
    reviewCount: item.reviewCount || 0,
    priceRange: item.priceRange || 1,
    isOpen: Boolean(item.isOpen),
    deliveryFee: item.deliveryFee || 0,
    minOrderAmount: item.minOrderAmount || 0,
    estimatedDeliveryMinutes: item.estimatedDeliveryMinutes || 0,
    createdAt: item.createdAt,
  }
}

export function toRestaurantSettings(item) {
  return {
    restaurantId: item.PK.replace('RESTAURANT#', ''),
    acceptingOrders: Boolean(item.acceptingOrders),
    openingHours: item.openingHours || [],
    taxRate: item.taxRate || 0,
    paymentMethods: item.paymentMethods || [],
  }
}

export function toMenuCategory(item) {
  const [, categoryId] = item.SK.split('#')
  return {
    id: categoryId,
    restaurantId: item.PK.replace('RESTAURANT#', ''),
    name: item.name,
    displayOrder: item.displayOrder || 0,
  }
}

export function toMenuItem(item) {
  const [, categoryId, itemId] = item.SK.split('#')
  return {
    id: itemId,
    restaurantId: item.PK.replace('RESTAURANT#', ''),
    categoryId,
    name: item.name,
    description: item.description || '',
    price: item.price || 0,
    imageUrl: item.imageUrl,
    isAvailable: item.isAvailable !== false,
    isVegetarian: Boolean(item.isVegetarian),
    tags: item.tags || [],
  }
}

export function toOrder(metadataItem, itemItems) {
  return {
    id: metadataItem.PK.replace('ORDER#', ''),
    customerId: metadataItem.customerId,
    restaurantId: metadataItem.restaurantId,
    restaurantName: metadataItem.restaurantName,
    items: itemItems.map(toOrderItem),
    status: metadataItem.status,
    subtotal: metadataItem.subtotal,
    deliveryFee: metadataItem.deliveryFee,
    tax: metadataItem.tax,
    total: metadataItem.total,
    deliveryAddress: metadataItem.deliveryAddress || {},
    expectedArrivalTime: metadataItem.expectedArrivalTime,
    guestCount: metadataItem.guestCount,
    specialInstructions: metadataItem.specialInstructions,
    createdAt: metadataItem.createdAt,
    updatedAt: metadataItem.updatedAt,
  }
}

export function toOrderItem(item) {
  return {
    id: item.SK.replace('ITEM#', ''),
    menuItemId: item.menuItemId,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    notes: item.notes,
  }
}

export function toFavorite(item) {
  return {
    customerId: item.PK.replace('CUSTOMER#', ''),
    restaurantId: item.SK.replace('FAVORITE#', ''),
    createdAt: item.createdAt,
  }
}
