import {parseHeader} from "@kevits/conventional-commit";
import {addLabels, getExistingLabels, removeLabels} from "./github-api.ts";
import {convertToLabels, findLabelsToAdd, findLabelsToRemove, hasInvalidTitleParts} from "./label-utils.ts";
import github from "@actions/github";
import core from "@actions/core";

const run = async () => {
    const pullRequestTitle = github.context?.payload?.pull_request?.title;
    if (!pullRequestTitle) {
        console.warn('No pull request title found');
        return
    }

    const titleParts = parseHeader(pullRequestTitle);
    if (titleParts === null || hasInvalidTitleParts(titleParts)) {
        console.warn(`Could not parse pull request title '${pullRequestTitle}'. Does it adhere to Conventional Commits (https://www.conventionalcommits.org/en/v1.0.0/)?`);
        return;
    }

    const partsAsLabels = convertToLabels(titleParts);
    const existingLabels = await getExistingLabels();

    const labelsToRemove = findLabelsToRemove(partsAsLabels, existingLabels);
    const labelsToAdd = findLabelsToAdd(partsAsLabels, existingLabels);

    await removeLabels(labelsToRemove);
    await addLabels(labelsToAdd);
}

run().catch(err => core.setFailed(err.message));