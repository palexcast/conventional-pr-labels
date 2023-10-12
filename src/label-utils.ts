import {CommitHeader} from "@kevits/conventional-commit";
import core from "@actions/core";

export const hasInvalidTitleParts = (titleParts: CommitHeader): boolean => {
    return false; // TODO not entirely sure what to check here
}
export const convertToLabels = (titleParts: CommitHeader): string[] => {
    const labelMap = JSON.parse(core.getInput('type_labels'))
    const ignoredTypes = JSON.parse(core.getInput('ignored_types'))
    const ignoreLabel = core.getInput('ignore_label')

    const titlePartsArray = [titleParts.type, titleParts.scope, titleParts.description, titleParts.breaking ? 'breaking' : '']
        .filter(Boolean)

    // Convert each part to a label
    const partsAsLabels = titlePartsArray.map(part => {
        if (ignoredTypes.includes(part)) {
            return ignoreLabel
        }
        return labelMap[part] ?? ''
    }).filter(Boolean);

    // Return unique labels only
    return [...new Set(partsAsLabels)];
}

export const findLabelsToRemove = (labelsOnCommit: string[], existingLabels: string[]): string[] => {
    return existingLabels.filter(label => !labelsOnCommit.includes(label));
}

export const findLabelsToAdd = (labelsOnCommit: string[], existingLabels: string[]): string[] => {
    return labelsOnCommit.filter(label => !existingLabels.includes(label));
}
