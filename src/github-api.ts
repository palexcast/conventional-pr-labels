import github from "@actions/github";
import {GitHub} from "@actions/github/lib/utils";
import core from "@actions/core";

let cachedOctokit: InstanceType<typeof GitHub>;
const getOctokit = async (): Promise<InstanceType<typeof GitHub>> => {
    if (cachedOctokit) {
        return cachedOctokit;
    }
    const token = core.getInput('token');
    cachedOctokit = github.getOctokit(token)
    return cachedOctokit;
}

const getGitHubContext = (): { owner: string, repo: string, issue_number: number } => {
    const owner = github.context.payload.repository?.owner.login;
    const repo = github.context.payload.repository?.name;
    const issue_number = github.context.payload.pull_request?.number;
    if (!owner || !repo || !issue_number) {
        throw new Error('Could not get owner, repo or issue_number from github context');
    }
    return {owner, repo, issue_number};
}

export const getExistingLabels = async (): Promise<string[]> => {
    const octokit = await getOctokit();
    const {owner, repo, issue_number} = getGitHubContext();
    const response = await octokit.rest.issues.listLabelsOnIssue({owner, repo, issue_number});

    return response.data.map(label => label.name);
}

export const removeLabels = async (labels: string[]): Promise<void> => {
    if (labels.length === 0) {
        console.log('No labels to remove');
        return;
    }
    const octokit = await getOctokit();
    const {owner, repo, issue_number} = getGitHubContext();

    const promises = labels.map(async name => {
        return octokit.rest.issues.removeLabel({owner, repo, issue_number, name}).catch(err => {
            if (err.status === 404) {
                return;
            }
            throw err;
        });
    });

    await Promise.all(promises);
}

export const addLabels = async (labels: string[]): Promise<void> => {
    if (labels.length === 0) {
        console.log('No labels to add');
        return;
    }
    const octokit = await getOctokit();
    const {owner, repo, issue_number} = getGitHubContext();
    await octokit.rest.issues.addLabels({owner, repo, issue_number, labels})
}