import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as cosign from './cosign';

async function run(): Promise<void> {
  try {
    const TOKEN = core.getInput('token'); 
    core.setSecret(TOKEN);
    const repoInput: string = core.getInput('repository');
    const repoDetails: string[] = repoInput.split("/");
    const repositoryOwner: string = repoDetails[0];
    const repositoryName: string = repoDetails[1];
    const packageName: string = core.getInput('package-name') === repoInput ? repositoryName : core.getInput('package-name');
    const semver: string = core.getInput('semver');
    
    if (!(await cosign.isAvailable())) {
      core.setFailed(`Cosign is required to create signature.`);
      return;
    }
    
    await cosignGenerateKeypair(TOKEN);
    await signPackage(repoDetails, semver, packageName);
  } 
  catch (error) {
    if (error instanceof Error) core.setFailed("Something failed");
  }
}

async function cosignGenerateKeypair(token: string): Promise<void> {
  try {
    process.env.COSIGN_PASSWORD = token;
    const cmd : string = `cosign generate-key-pair`;
    await exec.exec(cmd)
    console.log("Private public keypair generated successfully!")
  } catch (error) {
    if (error instanceof Error) core.setFailed(`Oops! Generating Cosign keypair failed!`)
  }
}

async function signPackage(repositoryOwner: string[], semver: string, packageName: string): Promise<void> {
  try {
    const cmd : string = `cosign sign --key cosign.key ghcr.io/${repositoryOwner}/${packageName}:${semver}`;
    await exec.exec(cmd)
    console.log("Signature pushed successfully to registry!")
  } catch (error) {
    if (error instanceof Error) core.setFailed(`Oops! Signature failed!`)
  }
}

run()
