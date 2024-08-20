let pyodideReadyPromise = loadPyodide();

async function importApp() {
  const pyodide = await pyodideReadyPromise;
  await pyodide.loadPackage("micropip");

  const micropip = pyodide.pyimport("micropip");
  await micropip.install("pandas");

  await pyodide.runPythonAsync(`
  from pyodide.http import pyfetch
  response = await pyfetch("./app.py")
  with open("summarise_app.py", "wb") as f:
      f.write(await response.bytes())
`);
  const app = pyodide.pyimport("summarise_app");

  return app;
}

function initApp() {
  const inputElement = document.getElementById("input_textarea");
  const outputElement = document.getElementById("output_textarea");
  const buttonElement = document.getElementById("summarise");
  outputElement.value = "Loading...";
  pyodideReadyPromise.then(() => (outputElement.value = "Waiting for CSV..."));

  return new UI(inputElement, outputElement, buttonElement);
}

class UI {
  constructor(inputElement, outputElement, buttonElement) {
    this.inputElement = inputElement;
    this.outputElement = outputElement;
    this.buttonElement = buttonElement;
    this.appPromise = importApp();

    buttonElement.addEventListener("click", () => {
      this.summarise(this.inputElement.value);
    });
  }

  async summarise(input) {
    let app = await this.appPromise;
    let output = app.run(input);
    this.outputElement.value = output.toString();
  }
}
