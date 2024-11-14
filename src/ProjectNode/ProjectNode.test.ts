import { ProjectNode  } from "..";
import { ProjectNodeEvent } from "./types";
import { StateTimeWorm } from "..";
import { jest } from '@jest/globals';

const HostProjectNode = ProjectNode.HostProjectNode;
const ClientProjectNode = ProjectNode.ClientProjectNode;

type Instruction = { type: 'increment' | 'decrement', value: number };
type Counter = { count: number };

describe("HostProjectNode and ClientProjectNode", () => {
  let project : Counter;
  let projectTransformer : (project: Counter, instruction: Instruction) => Counter;
  let dispatch : (e: ProjectNodeEvent<Counter,Instruction>) => void;
  let mockDispatch: jest.Mock;

  beforeEach(() => {
    mockDispatch = jest.fn();
    project = { count: 0 };
    projectTransformer = (project, instruction) => {
        return { count: project.count + 1 };
    }
    dispatch = (e) => {};

  });

  describe("HostProjectNode", () => {

    it("should call pushProject when receiving requestProject event", () => {
      const hostNode = new HostProjectNode({ project, projectTransformer, dispatch: mockDispatch });
      const requestProjectEvent : ProjectNodeEvent<Counter,Instruction> = { authorId: 'foreign', type: "requestProject", authorIsHost: false };
      const serializedWorm = hostNode.worm.serialize();
      hostNode.receive(requestProjectEvent);
      expect(mockDispatch).toHaveBeenCalledWith({
        authorId: hostNode.authorId,
        authorIsHost: true,
        type: "pushProject",
        serializedWorm: serializedWorm,
        initialProjectStateId: hostNode.projectStateId,
      });
    });


    it("should handle pushUpdate event with matching projectStateId", () => {
      const hostNode = new HostProjectNode({ project, projectTransformer, dispatch: mockDispatch });
      const update : StateTimeWorm.WormCommand<Instruction>[] = [
        { type: 'addNextState', forward: [{ type: 'increment', value: 1 }], backward: [{ type: 'decrement', value: 1 }] }
      ];
      hostNode.receive({ authorId: 'foreign',
        type: "pushUpdate", authorIsHost: false, instructions: update, 
        lastAgreedProjectStateId: hostNode.projectStateId,
        newProjectStateId: "ps123" });
      expect(hostNode.worm.content.count).toBe(1);
    });

  });

  describe("ClientProjectNode", () => {

    it("should initialize worm on pushProject event", () => {
      const clientNode = new ClientProjectNode({ projectTransformer, dispatch: mockDispatch });
      const worm = new StateTimeWorm.StateTimeWorm(project, projectTransformer);
      const serializedWorm = worm.serialize();
      clientNode.receive({ authorId: 'foreign', authorIsHost: true, type: "pushProject", serializedWorm: serializedWorm, initialProjectStateId: "ps123" });
      expect(clientNode.projectStateId).toBe("ps123");
      expect(clientNode.initialized).toBe(true);
    });

    it("should request project if projectStateId does not match in pushUpdate", () => {
      const clientNode = new ClientProjectNode({ projectTransformer, dispatch: mockDispatch });
      clientNode.worm = new StateTimeWorm.StateTimeWorm(project, projectTransformer);
      clientNode.projectStateId = "ps123";
      clientNode.receive({ authorId:'foreign', 
      authorIsHost: true, type: "pushUpdate", 
      instructions: [], 
      lastAgreedProjectStateId: "incorrectStateId",
      newProjectStateId: "ps123" });
      expect(mockDispatch).toHaveBeenCalledWith({ authorIsHost: false, type: "requestProject", authorId: clientNode.authorId });
    });

    it("should execute commands on pushUpdate if projectStateId matches", () => {
      const clientNode = new ClientProjectNode({ projectTransformer, dispatch: mockDispatch });
      clientNode.worm = new StateTimeWorm.StateTimeWorm(project, projectTransformer);
      clientNode.projectStateId = "ps123";
      const update : StateTimeWorm.WormCommand<Instruction>[] = [{ type: "addNextState", forward: [{ type: "increment", value: 1 }], backward: [{ type: "decrement", value: 1 }] }];
      clientNode.receive({ authorId: 'foreign', 
      authorIsHost: true, 
      type: "pushUpdate", 
      instructions: update, 
      lastAgreedProjectStateId: "ps123",
      newProjectStateId: "ps124" });
      expect(clientNode.worm.content.count).toBe(1);
    });
  });
});
