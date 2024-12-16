import { ProjectDataStructure } from '..';

type Project = ProjectDataStructure.PinsAndCurvesProject;

type Templates = {
    [key: string]: Function;
}

const cachedFunctions: {
    [key: string]: {
        functionString: string,
        cachedFunction: Function
    } | undefined
} = {};

function getTemplates(project: Project): Templates {

    const templates: Templates = {};
    Object.entries(project.templateData).forEach(([curveId, curve]) => {
        const exists = cachedFunctions[curveId] !== undefined;
        if (exists) {
            const hasChanged = cachedFunctions[curveId]!.functionString !== curve;
            if (hasChanged) {}
            else {
                const template = cachedFunctions[curveId]!.cachedFunction;
                templates[curveId] = template;
                return;
            }
        } else {
            const template = (new Function(`return ${curve};`))();
            templates[curveId] = template;
            cachedFunctions[curveId] = {
                functionString: curve,
                cachedFunction: template
            };
        }
    })
    return templates;
}

export default getTemplates;