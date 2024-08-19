window.onload = () => {
  const output = document.getElementById("output");
  output.value = "Initializing...\n";

  async function main() {
    let pyodide = await loadPyodide();
    output.value += "Ready!\n";
    return pyodide;
  }
  let pyodideReadyPromise = main();

  function addToOutput(inputStr, outputStr) {
    output.value += ">>> " + inputStr + "\n" + outputStr + "\n";
    output.scrollTop = output.scrollHeight;
  }

  async function evaluatePython(value) {
    let pyodide = await pyodideReadyPromise;
    try {
      let output = pyodide.runPython(value);
      addToOutput(value, output);
    } catch (err) {
      addToOutput(value, err);
    }
  }

  const code = document.getElementById("code");
  const submit = document.getElementById("submit");
  submit.addEventListener("click", () => {
    evaluatePython(code.value);
  });
};
