import { App, Stack, StackProps, CfnOutput, Fn, Environment } from 'aws-cdk-lib'
import {
  Certificate,
  CertificateValidation,
} from 'aws-cdk-lib/aws-certificatemanager'
import {
  PublicHostedZone,
  RecordSet,
  RecordTarget,
  RecordType,
} from 'aws-cdk-lib/aws-route53'
import { Bucket } from 'aws-cdk-lib/aws-s3'
import { Construct } from 'constructs'
import invariant from 'tiny-invariant'

const app = new App()

interface Domain {
  root: string
  demo: string
}

interface SharedConstructProps {
  domain: Domain
}

interface SharedStackProps extends StackProps {
  domain: Domain
}

class DnsConstruct extends Construct {
  constructor(scope: Construct, id: string, { domain }: SharedConstructProps) {
    super(scope, id)

    const root = PublicHostedZone.fromLookup(this, 'Zone-Root', {
      domainName: domain.root,
    })

    const demo = new PublicHostedZone(this, 'Zone-Demo', {
      zoneName: domain.demo,
    })
    new CfnOutput(this, 'Output-DemoHostedZoneId', {
      exportName: 'demoHostedZoneId',
      value: demo.hostedZoneId,
    })

    invariant(demo.hostedZoneNameServers)
    new RecordSet(this, 'DnsRecord-NS-Demo', {
      recordType: RecordType.NS,
      recordName: demo.zoneName,
      target: RecordTarget.fromValues(...demo.hostedZoneNameServers),
      zone: root,
    })
  }
}

class CdnConstruct extends Construct {
  constructor(scope: Construct, id: string, { domain }: SharedConstructProps) {
    super(scope, id)

    // new Bucket(this, 'Bucket', {
    //   bucketName: domain.demo,
    // })
  }
}

class RootStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    { domain, ...props }: SharedStackProps,
  ) {
    super(scope, id, props)
    new DnsConstruct(this, 'DnsConstruct', { domain })
    new CdnConstruct(this, 'CdnConstruct', { domain })
  }
}

class CertificateStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    { domain, ...props }: SharedStackProps,
  ) {
    super(scope, id, props)

    const demoHostedZoneId = Fn.importValue('demoHostedZoneId')

    const root = PublicHostedZone.fromPublicHostedZoneId(
      this,
      'Zone-Root',
      demoHostedZoneId,
    )
    new Certificate(this, 'Certificate', {
      domainName: domain.demo,
      validation: CertificateValidation.fromDns(root),
    })
  }
}

const domain: Domain = {
  root: 'slg.dev',
  demo: 'sim-v1.slg.dev',
}

const ACCOUNT_ID: string = '063257577013'

new RootStack(app, 'SimV1-Root', {
  env: {
    account: ACCOUNT_ID,
    region: 'us-west-2',
  },
  crossRegionReferences: true,
  domain,
})

new CertificateStack(app, 'SimV1-Certificate', {
  env: {
    account: ACCOUNT_ID,
    region: 'us-east-1',
  },
  crossRegionReferences: true,
  domain,
})
