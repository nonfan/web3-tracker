// 浏览器通知工具

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false
  }
  
  if (Notification.permission === 'granted') {
    return true
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }
  
  return false
}

export function sendNotification(title: string, body: string, onClick?: () => void) {
  if (Notification.permission !== 'granted') return
  
  const notification = new Notification(title, {
    body,
    icon: '/logo.svg',
    badge: '/logo.svg',
  })
  
  if (onClick) {
    notification.onclick = () => {
      window.focus()
      onClick()
    }
  }
}

// 检查即将到期的项目
export function checkDeadlines(projects: { name: string; deadline?: number }[]): { name: string; daysLeft: number }[] {
  const now = Date.now()
  const upcoming: { name: string; daysLeft: number }[] = []
  
  for (const project of projects) {
    if (!project.deadline) continue
    
    const diff = project.deadline - now
    const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24))
    
    // 提醒 3 天内到期的
    if (daysLeft >= 0 && daysLeft <= 3) {
      upcoming.push({ name: project.name, daysLeft })
    }
  }
  
  return upcoming.sort((a, b) => a.daysLeft - b.daysLeft)
}

// 获取上次提醒时间
const LAST_NOTIFY_KEY = 'web3tracker-last-notify'

export function shouldNotifyToday(): boolean {
  const last = localStorage.getItem(LAST_NOTIFY_KEY)
  if (!last) return true
  
  const lastDate = new Date(parseInt(last)).toDateString()
  const today = new Date().toDateString()
  
  return lastDate !== today
}

export function markNotified() {
  localStorage.setItem(LAST_NOTIFY_KEY, Date.now().toString())
}
