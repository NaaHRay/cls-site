import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import Layout from "@/Layout";
import Home from "@/pages/Home";
import "@/styles/base.css";
import { startSmoothScroll } from "@/lib/smooth";

startSmoothScroll();

const stub = (title?: string) => ({
  Component: async () => {
    const { default: Stub } = await import("@/pages/Stub");
    return () => <Stub title={title} />;
  },
});

const router = createBrowserRouter([
  {
    Component: Layout,
    HydrateFallback: () => null,
    children: [
      { path: "/", Component: Home },
      { path: "/sub-clubs", lazy: stub("Sub-clubs") },
      { path: "/sub-clubs/:slug", lazy: stub() },
      { path: "/editorial-board", lazy: { Component: async () => (await import("@/pages/EditorialBoard")).default } },
      // Dev-only component review page.
      ...(import.meta.env.DEV
        ? [{ path: "/kit", lazy: { Component: async () => (await import("@/pages/Kit")).default } }]
        : []),
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
