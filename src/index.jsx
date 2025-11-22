// src/index.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js"; // optional if you need modals/dropdowns

createRoot(document.getElementById("root")).render(<App />);
