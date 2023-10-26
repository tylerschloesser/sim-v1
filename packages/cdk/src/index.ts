import { App, Environment, Stack } from 'aws-cdk-lib'
import {
  Certificate,
  CertificateValidation,
} from 'aws-cdk-lib/aws-certificatemanager'
import { HostedZone } from 'aws-cdk-lib/aws-route53'
import { Construct } from 'constructs'
import { CdnStack } from './cdn-stack.js'
import { DnsStack } from './dns-stack.js'
import { CommonStackProps, Domain, Region } from './types.js'

const app = new App()

interface CertificateStackProps extends CommonStackProps {
  demoHostedZone: HostedZone
  env: Omit<Required<Environment>, 'region'> & { region: Region.US_EAST_1 }
}

class CertificateStack extends Stack {
  public readonly certificate: Certificate
  constructor(
    scope: Construct,
    id: string,
    { domain, demoHostedZone, ...props }: CertificateStackProps,
  ) {
    super(scope, id, props)

    this.certificate = new Certificate(this, 'Certificate', {
      domainName: domain.demo,
      validation: CertificateValidation.fromDns(demoHostedZone),
    })
  }
}

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
