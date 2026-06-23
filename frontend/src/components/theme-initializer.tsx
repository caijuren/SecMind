"use client"

import { useEffect } from "react"

/**
 * 在客户端初始化主题设置。
 * 替代 layout.tsx 中的 <script> 标签（React 不执行组件内的 script）。
 */
export function ThemeInitializer() {
  useEffect(() => {
    try {
      const theme = localStorage.getItem("secmind-theme")
      if (theme === "dark") {
        document.documentElement.classList.add("dark")
      } else if (theme === "light") {
        document.documentElement.classList.remove("dark")
      } else if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
    } catch {
      // ignore
    }
  }, [])

  return null
}
