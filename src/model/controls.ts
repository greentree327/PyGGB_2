import { Action, Helpers, thunk, Thunk } from "easy-peasy";
import { runPythonProgram } from "../shared/skulpt-interaction";
import { PyGgbModel } from ".";
import { ModuleFilename, ModuleContents } from "../shared/skulpt-interaction";
import { propSetterAction } from "../shared/utils";
import {
  RunControlClient,
  PauseResolutionActions,
  SleepInterruptionActions,
} from "../wrap-ggb/interruptible-sleep";

type ExecutionState =
  | { state: "idle" }
  | { state: "running" }
  | ({ state: "paused" } & PauseResolutionActions)
  | ({ state: "sleeping" } & SleepInterruptionActions);

export type Controls = {
  executionStatus: ExecutionState;
  setExecutionStatus: Action<Controls, ExecutionState>;
  runProgram: Thunk<Controls, void, {}, PyGgbModel>;
  pauseProgram: Thunk<Controls, void, {}, PyGgbModel>;
  stopProgram: Thunk<Controls, void, {}, PyGgbModel>;
  exportFile: Thunk<Controls, void, {}, PyGgbModel>;

  handleStartRun: Thunk<Controls, void>;
  handleEnterSleep: Thunk<Controls, SleepInterruptionActions>;
  handleResumeSleepingRun: Thunk<Controls, void>;
  handleEnterPause: Thunk<Controls, PauseResolutionActions>;
  handleResumePausedRun: Thunk<Controls, void>;
  handleFinishRun: Thunk<Controls, void>;
};

const logBadStateError = (
  callerName: string,
  expStates: Array<string>,
  gotState: string
) => {
  const expStateString = expStates.map((s) => `"${s}"`).join("/");
  console.error(
    `${callerName}(): expected state ${expStateString} but got "${gotState}"`
  );
};

const stateIsValid = (
  helpers: Helpers<Controls, any, {}>,
  expectedState: ExecutionState["state"],
  callerName: string
): boolean => {
  const gotState = helpers.getState().executionStatus.state;
  const isValid = gotState === expectedState;
  if (!isValid) {
    logBadStateError(callerName, [expectedState], gotState);
  }
  return isValid;
};

export const controls: Controls = {
  executionStatus: { state: "idle" },
  setExecutionStatus: propSetterAction("executionStatus"),

  runProgram: thunk(async (a, _voidPayload, helpers) => {
    const execStatus = helpers.getState().executionStatus;

    if (execStatus.state === "paused") {
      execStatus.resume();
      return;
    }

    if (execStatus.state !== "idle") {
      logBadStateError("runProgram", ["idle", "paused"], execStatus.state);
      return;
    }

    const storeState = helpers.getStoreState();
    const actions = helpers.getStoreActions();
    const codeText = storeState.editor.codeText;
    const { ggbApi, ggbPythonModuleText } = storeState.dependencies;

    if (ggbApi === null) {
      console.error("runProgram() called without ggbApi");
      return;
    }
    if (ggbPythonModuleText === "") {
      console.error("runProgram() called without ggbPythonModuleText");
      return;
    }

    // The import machinery tries a few filenames.  We may as well
    // provide the content under the first one.
    const localModules = new Map<ModuleFilename, ModuleContents>([
      ["src/builtin/ggb.js", ggbPythonModuleText],
    ]);

    const stdoutActions = {
      clear: actions.pyStdout.clearContent,
      append: actions.pyStdout.appendContent,
    };

    const errorActions = {
      clear: actions.pyErrors.clearErrors,
      append: actions.pyErrors.appendError,
    };

    const hidApi = {
      clearRegistration: actions.webHid.clearClientRegistration,
      register: actions.webHid.registerClient,
    };

    // This seems to have the side-effect that the "load/save" spinner
    // is visible while the program is running, or until the first
    // suspension point.  This is useful but it would be good to do it
    // more deliberately.
    await actions.editor.saveCodeText();

    const runControlClient: RunControlClient = {
      handleStartRun: () => a.handleStartRun(),
      handleEnterSleep: (actions) => a.handleEnterSleep(actions),
      handleResumeSleepingRun: () => a.handleResumeSleepingRun(),
      handleEnterPause: (actions) => a.handleEnterPause(actions),
      handleResumePausedRun: () => a.handleResumePausedRun(),
      handleFinishRun: () => a.handleFinishRun(),
    };

    runControlClient.handleStartRun();
    await runPythonProgram(
      codeText,
      localModules,
      stdoutActions,
      errorActions,
      hidApi,
      runControlClient,
      ggbApi
    );
    runControlClient.handleFinishRun();
  }),

  handleStartRun: thunk((a, _voidPayload, helpers) => {
    if (stateIsValid(helpers, "idle", "handleStartRun")) {
      a.setExecutionStatus({ state: "running" });
    }
  }),
  handleEnterSleep: thunk((a, interruptionActions, helpers) => {
    if (stateIsValid(helpers, "running", "handleEnterSleep")) {
      a.setExecutionStatus({ state: "sleeping", ...interruptionActions });
    }
  }),
  handleResumeSleepingRun: thunk((a, _voidPayload, helpers) => {
    if (stateIsValid(helpers, "sleeping", "handleResumeSleepingRun")) {
      a.setExecutionStatus({ state: "running" });
    }
  }),
  handleEnterPause: thunk((a, pauseResolutionActions, helpers) => {
    if (stateIsValid(helpers, "sleeping", "handleEnterPause")) {
      a.setExecutionStatus({ state: "paused", ...pauseResolutionActions });
    }
  }),
  handleResumePausedRun: thunk((a, _voidPayload, helpers) => {
    if (stateIsValid(helpers, "paused", "handleResumePausedRun")) {
      a.setExecutionStatus({ state: "running" });
    }
  }),
  handleFinishRun: thunk((a, _voidPayload, helpers) => {
    if (stateIsValid(helpers, "running", "handleFinishRun")) {
      a.setExecutionStatus({ state: "idle" });
    }
  }),

  pauseProgram: thunk(async (a, _voidPayload, helpers) => {
    const execStatus = helpers.getState().executionStatus;
    switch (execStatus.state) {
      case "sleeping":
        execStatus.pause();
        break;
      default:
        logBadStateError("pauseProgram", ["sleeping"], execStatus.state);
        break;
    }
  }),
  stopProgram: thunk(async (a, _voidPayload, helpers) => {
    const execStatus = helpers.getState().executionStatus;
    switch (execStatus.state) {
      case "sleeping":
      case "paused":
        // The "stop()" is slightly different in these two cases, but I think
        // it's OK to merge the cases.
        execStatus.stop();
        break;
      default:
        logBadStateError(
          "stopProgram",
          ["sleeping", "paused"],
          execStatus.state
        );
        break;
    }
  }),
  exportFile: thunk(async (a, _voidPayload, helpers) => {

    // Function to download data to a file
    function download(data: any, filename: string = "file.ggb") {
      var file = new Blob([data], {type: "application/vnd.geogebra.file"});
          var a = document.createElement("a"),
                  url = URL.createObjectURL(file);
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          setTimeout(function() {
              document.body.removeChild(a);
              window.URL.revokeObjectURL(url);  
          }, 0); 
    }

    function base64ToBinary(base64: string){
      const binaryString = window.atob(base64);
      const length = binaryString.length;
      const bytes = new Uint8Array(length);
      for (let i = 0; i < length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes.buffer;
    }

    const storeState = helpers.getStoreState();
    const { ggbApi } = storeState.dependencies;

    if (ggbApi === null) {
      console.error("exportFile() called without ggbApi");
      return;
    }

    const raw = base64ToBinary(ggbApi.getBase64());

    download(raw);
  }),
};
