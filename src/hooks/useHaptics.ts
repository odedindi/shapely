export function useHaptics() {
  function vibrate(pattern: number | number[]) {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }

  return {
    correct: () => vibrate(50),
    wrong: () => vibrate([30, 50, 30]),
    tap: () => vibrate(10),
  }
}
