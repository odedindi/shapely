import confetti from 'canvas-confetti'

export function triggerConfetti() {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e'],
  })
}
