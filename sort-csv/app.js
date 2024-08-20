let pyodideReadyPromise = loadPyodide();

function initApp() {
  const inputElement = document.getElementById("input_textarea");
  const outputElement = document.getElementById("output_textarea");
  outputElement.value = "Loading...";
  pyodideReadyPromise.then(() => (outputElement.value = "Waiting for CSV..."));

  return new UI(inputElement, outputElement);
}

class UI {
  constructor(inputElement, outputElement) {
    this.inputElement = inputElement;
    this.outputElement = outputElement;

    let timer;
    inputElement.addEventListener("change", () => {
      this.sortCsv(this.inputElement.value);
    });

    inputElement.addEventListener("keyup", () => {
      clearTimeout(timer);
      timer = setTimeout(() => this.sortCsv(this.inputElement.value), 1000);
    });
  }

  appendOutput(text) {
    this.outputElement.value += text;
  }

  async sortCsv(input) {
    let pyodide = await pyodideReadyPromise;

    await pyodide.runPythonAsync(`
      from pyodide.http import pyfetch
      response = await pyfetch("./app.py")
      with open("app.py", "wb") as f:
          f.write(await response.bytes())
    `);
    let app = pyodide.pyimport("app");
    let output = app.run(input);
    this.outputElement.value = output.toString();
  }
}
