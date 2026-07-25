export const ROLES = {
  CUSTOMER: 'CUSTOMER',
  RESTAURANT: 'RESTAURANT',
  ADMIN: 'ADMIN',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const ALL_ROLES: Role[] = [ROLES.CUSTOMER, ROLES.RESTAURANT, ROLES.ADMIN]
