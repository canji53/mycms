/* eslint-disable @typescript-eslint/no-var-requires */

/**
 * graphql schema を apollo studio に publish するヘルパースクリプト
 * 環境変数を package.json の scripts にハードコードするのを避けるために js におこしている
 */

const { execSync } = require('child_process')

const { CMS_LISTENING_PORT, APOLLO_GRAPH_REF, APOLLO_KEY } = process.env

if (!CMS_LISTENING_PORT) {
  throw new Error('INVALID CONFIG: CMS_LISTENING_PORT is not provided.')
}
if (!APOLLO_GRAPH_REF) {
  throw new Error('INVALID CONFIG: APOLLO_GRAPH_REF is not provided.')
}
if (!APOLLO_KEY) {
  throw new Error('INVALID CONFIG: APOLLO_KEY is not provided.')
}

const main = () => {
  try {
    execSync(
      `rover graph introspect http://localhost:${CMS_LISTENING_PORT}/graphql | APOLLO_KEY=${APOLLO_KEY} rover graph publish ${APOLLO_GRAPH_REF} --schema -`
    )
  } catch (e) {
    throw e
  }
}

main()
