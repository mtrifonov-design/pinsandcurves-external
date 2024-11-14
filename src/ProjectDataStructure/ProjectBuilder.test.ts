import ProjectBuilder from './ProjectBuilder';

describe('ProjectBuilder', () => {

    let pb: ProjectBuilder;
    beforeEach(() => {
        pb = new ProjectBuilder();

    });
    it('new projects should be empty', () => {
        const project = pb.getProject();
        expect(project.orgData.signalIds).toEqual([]);
    });
});