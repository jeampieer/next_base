import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
export const router = { replace: vi.fn(), refresh: vi.fn(), push: vi.fn() };
export const jar = new Map<string, { value: string }>();
export const cookieStore = {
    get: (name: string) => jar.get(name),
    set: vi.fn((name: string, value: string) => {
        jar.set(name, { value });
    }),
    delete: vi.fn((name: string) => {
        jar.delete(name);
    }),
};
vi.mock("next/navigation", () => ({
    useRouter: () => router,
    usePathname: () => "/labels",
    redirect: (path: string) => {
        throw new Error(`REDIRECT:${path}`);
    },
}));
vi.mock("next/headers", () => ({ cookies: async () => cookieStore }));
Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});
class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverStub);
const computedStyle = window.getComputedStyle;
window.getComputedStyle = (element) => computedStyle(element);
Element.prototype.scrollTo = vi.fn();
afterEach(() => {
    cleanup();
    jar.clear();
    vi.unstubAllEnvs();
});
