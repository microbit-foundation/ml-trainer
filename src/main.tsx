/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import App from "./App";
import ReactDOM from "react-dom/client";
import { mlWorker } from "./ml-worker-client";

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);

mlWorker.warmUp();
