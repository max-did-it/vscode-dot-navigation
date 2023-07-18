const vscode = require("vscode");

async function NavigateToDotsFile() {
  const editor = vscode.window.activeTextEditor;
  const selectedText = editor
    ? editor.document.getText(editor.selection)
    : await vscode.window.showInputBox({
        placeHolder: "Search query",
        value: "",
      });
  const pathTo = selectedText
    .split(".")
    .map((e) => e.replace('"', ""))
    .join("/");
  vscode.commands.executeCommand("workbench.action.quickOpen", pathTo);
}

class DotLinkProvider {
  async provideDocumentLinks(document, token) {
    const links = [];
    const text = document.getText();
    const regex = /(\"|\')\b([\w]+)\.([\w.]+)\b(\"|\')/g;
		
    let match;
    while ((match = regex.exec(text))) {
      const originalText = match[0];
      const transformedText = originalText
        .replace(/\"/g, "")
        .replace(/\./g, "/");

      const fileUri = await vscode.workspace.findFiles(
        "*/**/" + transformedText + ".rb"
      );
      if (fileUri) {
        links.push({
          range: new vscode.Range(
            document.positionAt(match.index),
            document.positionAt(match.index + originalText.length)
          ),
          target: fileUri[0],
        });
      }
    }

    return links;
  }

  async searchFileInDirectory(directoryUri, filename, fileExtension) {
    const entries = await vscode.workspace.fs.readDirectory(directoryUri);

    for (const [entryName, entryType] of entries) {
      const entryPath = vscode.Uri.joinPath(directoryUri, entryName).path;

      if (entryType === vscode.FileType.Directory) {
        const fileUri = await this.searchFileInDirectory(
          vscode.Uri.parse(entryPath),
          filename,
          fileExtension
        );
        if (fileUri) {
          return fileUri;
        }
      } else if (
        entryType === vscode.FileType.File &&
        entryPath.toLocaleString().includes(`${filename}.${fileExtension}`)
      ) {
        return vscode.Uri.parse(entryPath);
      }
    }

    return null;
  }

  resolveDocumentLink(link, token) {
    return link;
  }
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  let disposable1 = vscode.commands.registerCommand(
    "dot-navigation.navigate-to-dots",
    function () {
      NavigateToDotsFile();
    }
  );
  const linkProvider = new DotLinkProvider();
  context.subscriptions.push(
    vscode.languages.registerDocumentLinkProvider("ruby", linkProvider)
  );

  context.subscriptions.push(disposable1);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
