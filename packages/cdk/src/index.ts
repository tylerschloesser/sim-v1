import { App } from 'aws-cdk-lib'
import { CdnStack } from './cdn-stack.js'
import { CertificateStack } from './certificate-stack.js'
import { DnsStack } from './dns-stack.js'
import { Domain, Region } from './types.js'

const app = new App()

const ACCOUNT_ID: string = '063257577013'

const DOMAIN: Domain = {
  root: 'slg.dev',
  demo: 'sim-v1.slg.dev',
}

const STACK_ID_PREFIX = 'SimV1'

function stackId(...parts: string[]): string {
  return [STACK_ID_PREFIX, ...parts].join('-')
}

function stackProps<R extends Region, T>(region: R, extra: T) {
  return {
    env: {
      account: ACCOUNT_ID,
      region,
    },
    crossRegionReferences: true,
    domain: DOMAIN,
    ...extra,
  }
}

const dnsStack = new DnsStack(
  app,
  stackId('DNS'),
  stackProps(Region.US_WEST_2, {}),
)

const certificateStack = new CertificateStack(
  app,
  stackId('Certificate'),
  stackProps(Region.US_EAST_1, {
    demoHostedZone: dnsStack.demoHostedZone,
  }),
)

new CdnStack(
  app,
  stackId('CDN'),
  stackProps(Region.US_WEST_2, {
    certificate: certificateStack.certificate,
    demoHostedZone: dnsStack.demoHostedZone,
  }),
)
