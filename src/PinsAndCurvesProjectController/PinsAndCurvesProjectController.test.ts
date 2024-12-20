// // Importing dependencies
// import PACProjectController from "./PinsAndCurvesProjectController";
// import { ProjectNodeEventDispatcher, Project, Instruction } from "./types";
// import { ProjectDataStructure } from '..'
// import testProject from './testProject';


// // Mock dependencies
// const mockDispatcher: ProjectNodeEventDispatcher = jest.fn();
// const mockOnConnected = jest.fn();

// // Test Suite for HostPACProjectNode and ClientPACProjectNode
// describe("HostPACProjectNode", () => {
//   let hostProjectNode : PACProjectController;
//   let clientHostProjectNode;
//   let project;


//   beforeEach(() => {
//     project = testProject   ;
//     hostProjectNode = PACProjectController.Host(mockDispatcher, project);
//   });

//     // Test Suite for HostPACProjectNode
//   //   test("HostPACProjectNode should be defined", () => {
//   //       const projectTools = hostProjectNode.projectTools;
//   //       const subscriber = () => {
//   //         //console.log(hostProjectNode.prettyPrintProject())
//   //       }
//   //       hostProjectNode.subscribeToProjectUpdates(subscriber);
//   //       projectTools.createSignal('signal3', 'continuous', 'Signal 3', [0, 1]);
//   //       //console.log(hostProjectNode.prettyPrintProject())
//   //       expect(hostProjectNode.getProject().signalData['signal3']).toBeDefined();

//   //   });

//   //   test("Non-committed changes get overwritten", () => {
//   //     const projectTools = hostProjectNode.projectTools;
//   //     projectTools.updatePinContinuous('pin1', 50, undefined, undefined, false);
//   //     expect(hostProjectNode.getProject().signalData['signal1']?.pinTimes['pin1']).toBe(50);
//   //     projectTools.updatePinContinuous('pin2', 50, undefined, undefined, false);
//   //     //console.log(JSON.stringify(hostProjectNode.projectNode.worm, null, 2))
//   //     expect(hostProjectNode.getProject().signalData['signal1']?.pinTimes['pin1']).toBe(0);
//   // });

//   // test("Bugfix Control", () => {
//   //   const projectTools = hostProjectNode.projectTools;
//   //   projectTools.updatePinContinuous('pin1', 50, undefined, undefined, false);
//   //   projectTools.updatePinContinuous('pin2', 50, undefined, undefined, false);
//   //   //console.log(JSON.stringify(hostProjectNode.projectNode.worm, null, 2))
//   //   expect(hostProjectNode.getProject().signalData['signal1']?.pinTimes['pin1']).toBe(0);
//   // });

//   test("Bugfix Treatment", () => {
//     const projectTools = hostProjectNode.projectTools;

//     // hostProjectNode.subscribeToProjectUpdates(() => {
//     //   hostProjectNode.prettyPrintProject()
//     // })
//     projectTools.updatePins([
//       { pinId: 'pin1', pinType: 'continuous', pinTime: 50, pinValue: undefined, functionString: undefined },
//     ],false)
//     //hostProjectNode.prettyPrintProject()
//     projectTools.updatePins([
//       { pinId: 'pin1', pinType: 'continuous', pinTime: 50, pinValue: undefined, functionString: undefined },
//     ],false)
//     projectTools.updatePins([
//       { pinId: 'pin2', pinType: 'continuous', pinTime: 50, pinValue: undefined, functionString: undefined },
//     ],false)
//     //console.log(JSON.stringify(hostProjectNode.projectNode.worm, null, 2))
//     expect(hostProjectNode.getProject().signalData['signal1']?.pinTimes['pin1']).toBe(0);
//   });

// });

