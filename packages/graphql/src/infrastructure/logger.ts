import debug from 'debug'
import { SERVICE_NAME } from '../settings'

const createLogger = (suffix = '') => {
  return debug(`${SERVICE_NAME}:graphql:${suffix ? `${suffix}` : ''}`)
}

export const infoLogger = createLogger('info')

export const launchLogger = createLogger('launch')

export const requestLogger = createLogger('verbose:request')

export const responseLogger = createLogger('verbose:response')

export const applicationLogger = createLogger('application')
