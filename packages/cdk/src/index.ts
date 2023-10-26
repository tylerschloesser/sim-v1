import { App } from 'aws-cdk-lib'
import { CdnStack } from './cdn-stack.js'
import { CertificateStack } from './certificate-stack.js'
import { DnsStack } from './dns-stack.js'
import { Domain, Region } from './types.js'

const app = new App()

const ACCOUNT_ID: string = '063257577013'

const domain: Domain = {
  root: 'slg.dev',
  demo: 'sim-v1.slg.dev',
}

const dnsStack = new DnsStack(app, 'SimV1-DNS', {
  env: {
    account: ACCOUNT_ID,
    region: Region.US_WEST_2,
  },
  crossRegionReferences: true,
  domain,
})

const certificateStack = new CertificateStack(app, 'SimV1-Certificate', {
  env: {
    account: ACCOUNT_ID,
    region: Region.US_EAST_1,
  },
  crossRegionReferences: true,
  domain,
  demoHostedZone: dnsStack.demoHostedZone,
})

new CdnStack(app, 'SimV1-CDN', {
  env: {
    account: ACCOUNT_ID,
    region: Region.US_WEST_2,
  },
  crossRegionReferences: true,
  domain,
  certificate: certificateStack.certificate,
  demoHostedZone: dnsStack.demoHostedZone,
})
