let pyodideReadyPromise = loadPyodide();

async function importApp(outputElement) {
  const pyodide = await pyodideReadyPromise;
  await pyodide.loadPackage("micropip");

  const micropip = pyodide.pyimport("micropip");

  outputElement.value += "installing ssl...\n";
  await micropip.install("ssl");

  outputElement.value += "installing pyarrow...\n";
  await micropip.install(
    "./pyarrow-17.0.0-cp312-cp312-pyodide_2024_0_wasm32.whl"
  );

  outputElement.value += "importing unix-timezones...\n";
  await micropip.install("pyodide-unix-timezones");

  outputElement.value += "installing mojap-metadata...\n";
  await micropip.install("mojap-metadata");

  outputElement.value += "fetching app code...\n";
  await pyodide.runPythonAsync(`
  from pyodide.http import pyfetch
  response = await pyfetch("./app.py")
  with open("infer_schema.py", "wb") as f:
      f.write(await response.bytes())
`);
  const app = pyodide.pyimport("infer_schema");

  return app;
}

function initApp() {
  const inputElement = document.getElementById("input_textarea");
  const outputElement = document.getElementById("output_textarea");
  const buttonElement = document.getElementById("summarise");
  outputElement.value = "Loading...\n";

  return new UI(inputElement, outputElement, buttonElement);
}

class UI {
  constructor(inputElement, outputElement, buttonElement) {
    this.inputElement = inputElement;
    this.outputElement = outputElement;
    this.buttonElement = buttonElement;
    this.appPromise = importApp(outputElement);
    this.appPromise.then(() => (outputElement.value = "Waiting for CSV..."));

    buttonElement.addEventListener("click", () => {
      this.execute(this.inputElement.value);
    });
  }

  async execute(input) {
    let app = await this.appPromise;
    let output = app.run(input);
    this.outputElement.value = output.toString();
  }
}
