import {CommitHeader, parseHeader} from "@kevits/conventional-commit";
import {GitHub} from "@actions/github/lib/utils";

const github = require('@actions/github');
const core = require('@actions/core');

let cachedOctokit: InstanceType<typeof GitHub>;

const run = async () => {
    const pullRequestTitle = github.context?.payload?.pull_request?.title;
    if (!pullRequestTitle) {
        console.warn('No pull request title found');
        return
    }

    const titleParts = parseHeader(pullRequestTitle);
    if (titleParts === null || invalidTitleParts(titleParts)) {
        console.warn('Could not parse pull request title');
        return;
    }

    const existingLabels = await getExistingLabels();

    const labelsToRemove = findLabelsToRemove(titleParts, existingLabels);
    const labelsToAdd = findLabelsToAdd(titleParts, existingLabels);

    await removeLabels(labelsToRemove);
    await addLabels(labelsToAdd);

}

const invalidTitleParts = (titleParts: CommitHeader): boolean => {
    return true; // TODO
}

const findLabelsToRemove = (titleParts: CommitHeader, existingLabels: string[]): string[] => {
    return []; // TODO
}

const findLabelsToAdd = (titleParts: CommitHeader, existingLabels: string[]): string[] => {
    return []; // TODO
}

const getOctokit = async (): Promise<InstanceType<typeof GitHub>> => {
    if (cachedOctokit) {
        return cachedOctokit;
    }
    const token = core.getInput('token');
    cachedOctokit = github.getOctokit(token)
    return cachedOctokit;
}

const getExistingLabels = async (): Promise<string[]> => {
    const octokit = await getOctokit();
    const response = await octokit.rest.issues.listLabelsOnIssue({
        owner: github.context.payload.repository.owner.login,
        repo: github.context.payload.repository.name,
        issue_number: github.context.payload.pull_request.number,
    });

    return response.data.map(label => label.name);
}

const removeLabels = async (labels: string[]): Promise<void> => {
    if (labels.length === 0) {
        console.log('No labels to remove');
        return;
    }
    const octokit = await getOctokit();

    const promises = labels.map(async name => {
        return octokit.rest.issues.removeLabel({
            owner: github.context.payload.repository.owner.login,
            repo: github.context.payload.repository.name,
            issue_number: github.context.payload.pull_request.number,
            name
        }).catch(err => {
            if (err.status === 404) {
                return;
            }
            throw err;
        });
    });

    await Promise.all(promises);
}

const addLabels = async (labels: string[]): Promise<void> => {
    if (labels.length === 0) {
        console.log('No labels to add');
        return;
    }
    const octokit = await getOctokit();
    await octokit.rest.issues.addLabels({
        owner: github.context.payload.repository.owner.login,
        repo: github.context.payload.repository.name,
        issue_number: github.context.payload.pull_request.number,
        labels
    })
}

run().catch(err => core.setFailed(err.message));