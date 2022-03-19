// common
export const SERVICE_NAME = 'mycms' as const

if (!process.env.NODE_ENV) {
  throw new Error('INVALID CONFIG: NODE_ENV is not provided.')
}
export const NODE_ENV = process.env.NODE_ENV

// express
export const LISTENING_PORT = process.env.CMS_LISTENING_PORT || 3000

// graphql schema
export const GRAPHQL_SCHEMA_PACKAGE = `@${SERVICE_NAME}/schema`
