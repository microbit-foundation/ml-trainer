/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import ReactDOM from "react-dom/client";
import App from "./App";
import { mlWorker } from "./ml-worker-client";
import "./styled-system.css";

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);

mlWorker.warmUp();
