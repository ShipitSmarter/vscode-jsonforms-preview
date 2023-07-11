export enum MessageType {
    Error = "err",
    Warning = "war",
    Information = "info",
  }

export const showMessage = async (
    editorInstance: any,
    message: string,
    type?: string
  ) => {
    let result = null;
    switch (type) {
      case MessageType.Error:
        result = editorInstance.window.showErrorMessage(message);
        break;
      case MessageType.Warning:
        result = editorInstance.window.showWarningMessage(message);
        break;
      default:
        result = editorInstance.window.showInformationMessage(message);
        break;
    }
    return result;
  };
  