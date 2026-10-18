import "server-only";

import AnthropicBedrock from "@anthropic-ai/bedrock-sdk";
import { awsCredentialsProvider } from "@vercel/oidc-aws-credentials-provider";

// Same setup as lib/blog/generate.ts: on Vercel, AWS_ROLE_ARN is exchanged via
// the Vercel OIDC token; locally credentials come from AWS_PROFILE.
export const BEDROCK_MODEL = process.env.BEDROCK_MODEL_ID || "us.anthropic.claude-sonnet-4-6";

export function bedrock() {
  const roleArn = process.env.AWS_ROLE_ARN;

  return new AnthropicBedrock({
    awsRegion: process.env.AWS_REGION || "us-east-1",
    ...(roleArn && {
      providerChainResolver: async () => awsCredentialsProvider({ roleArn }),
    }),
  });
}
