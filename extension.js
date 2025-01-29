const { default: ollama } = require("ollama"); // CJS
const vscode = require("vscode");

function activate(context) {
  console.log('Congratulations, your extension "deepseek" is now active!');

  const disposable = vscode.commands.registerCommand(
    "deepseek.start",
    function () {
      const panel = vscode.window.createWebviewPanel(
        "deepChat",
        "Deep seek chat",
        vscode.ViewColumn.One,
        { enableScripts: true }
      );
      panel.webview.html = getWebviewContent();
      panel.webview.onDidReceiveMessage(async (message) => {
        if (message.command === "chat") {
          const userPrompt = message.text;
          let responseText = "";
          try {
            // Ensure ollama.chat is a function
            if (typeof ollama.chat !== "function") {
              throw new Error("ollama.chat is not a function");
            }

            // Perform chat operation with streaming
            const streamResponse = await ollama.chat({
              model: "deepseek-r1:8b", // Correct the model name if necessary
              messages: [{ role: "user", content: userPrompt }],
              stream: true,
            });

            for await (const part of streamResponse) {
              responseText += part.message.content;
              panel.webview.postMessage({
                command: "chatResponse",
                text: responseText,
              });
            }
          } catch (err) {
            panel.webview.postMessage({
              command: "chatResponse",
              text: `Error Occurred: ${err.message}`,
            });
          }
        }
      });
    }
  );

  context.subscriptions.push(disposable);
}

function deactivate() {}

function getWebviewContent() {
  return /*html*/ `
  <!DOCTYPE html>
  <html lang="en">
  <head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Deep seek chat</title>
	<link rel="stylesheet" href="styles.css">
  </head>
  <body>
	<div class="container">
	  <h1>Deep Seek Chat</h1>
	  <div class="chat-box">
		<input type="text" id="user-input" placeholder="Enter your prompt here">
		<button onclick="sendMessage()">Send</button>
		<button id="copy">Copy</button>
	  </div>
	  <p id="response-text"></p>
	</div>
	<script>
	  const vscode = acquireVsCodeApi();
	  function sendMessage() {
		const text = document.querySelector("#user-input").value;
		vscode.postMessage({ command: 'chat', text });
	  }
	  window.addEventListener('message', event => {
		const { command, text } = event.data;
		if (command === 'chatResponse') {
		  document.querySelector("#response-text").innerText = text;
		}
	  });
	  document.querySelector("#copy").addEventListener("click",	async ()=>{
		await navigator.clipboard.writeText(document.querySelector("#response-text").innerText);
	  })
	</script>
  </body>
  </html>
  `;
}

module.exports = {
  activate,
  deactivate,
};
