import { App, Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'

const app = new App()

class TestStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)
  }
}

new TestStack(app, 'TestStack')
