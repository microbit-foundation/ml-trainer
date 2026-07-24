/**
 * (c) 2024, Micro:bit Educational Foundation and contributors
 *
 * SPDX-License-Identifier: MIT
 */
import ReactDOM from "react-dom/client";
import App from "./App";
import { mlWorker } from "./ml-worker-client";
// @pandacss/dev/postcss (postcss.config.cjs) generates Panda's CSS into this
// file's cascade-layer declaration at build time — no separate styled-system.css.
import "./layers.css";

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);

mlWorker.warmUp();
